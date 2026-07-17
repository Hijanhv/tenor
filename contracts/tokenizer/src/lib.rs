#![no_std]
//! Tenor, yield tokenization for Stellar (the interest-rate primitive Soroban is missing).
//!
//! A `market` wraps ONE yield-bearing underlying ("SY", standardized yield token, e.g. a
//! Blend pool token, a DeFindex vault share, or a tokenized T-bill like USDY) with a fixed
//! `maturity`. Depositing SY mints two tokens, both denominated in the underlying *asset*:
//!
//!   * PT (Principal Token), redeemable 1:1 for asset value at maturity. Bought at a
//!     discount before maturity => a locked-in FIXED RATE.
//!   * YT (Yield Token), streams all yield the SY earns until maturity. Long/short YIELD.
//!
//! Invariant:  PT(x) + YT(x)  ==  x asset units of SY  (they can always be recombined).
//!
//! The SY -> asset exchange rate ("index", 1e7-scaled) is pushed by a keeper via `sync`
//! (in production this reads the SY's on-chain exchange rate / a Reflector feed). Yield is
//! distributed to YT holders with the standard accumulator ("MasterChef") pattern.

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, Env};

const SCALE: i128 = 10_000_000; // 1e7, fixed-point for the SY->asset index
const ACC: i128 = 1_000_000_000_000; // 1e12, precision for acc-yield-per-YT

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotMatured = 3,
    InsufficientPt = 4,
    InsufficientYt = 5,
    BadAmount = 6,
    IndexWentDown = 7,
    NoLiquidity = 8,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Underlying,
    Quote,    // stable quote token (e.g. USDC) the PT AMM prices against
    Maturity,
    IndexLast, // current SY->asset rate, 1e7-scaled
    TotalPt,
    TotalYt,
    TotalSy,  // raw SY units held by this market
    AccYield, // accumulated asset-yield per YT unit, ACC-scaled
    ReserveQuote, // quote-token reserve in the PT/quote pool
    LpTotal,      // total LP shares
    Pt(Address),
    Yt(Address),
    Debt(Address), // YT reward debt, ACC-scaled
    Owed(Address), // harvested-but-unclaimed asset-yield
    Lp(Address),   // LP shares of the PT/quote pool
}

const FEE_BPS: i128 = 30; // 0.30% swap fee

#[contracttype]
#[derive(Clone)]
pub struct MarketInfo {
    pub underlying: Address,
    pub quote: Address,
    pub maturity: u64,
    pub index: i128,
    pub total_pt: i128,
    pub total_yt: i128,
    pub total_sy: i128,
    pub reserve_pt: i128,
    pub reserve_quote: i128,
    pub matured: bool,
}

#[contract]
pub struct Tenor;

#[contractimpl]
impl Tenor {
    /// Create the market. `index_init` is the starting SY->asset rate (1e7 = 1:1).
    /// `quote` is the stable token (e.g. USDC) the built-in PT AMM prices against.
    pub fn initialize(
        env: Env,
        admin: Address,
        underlying: Address,
        quote: Address,
        maturity: u64,
        index_init: i128,
    ) {
        let s = env.storage().instance();
        if s.has(&DataKey::Admin) {
            panic_err(&env, Error::AlreadyInitialized);
        }
        if index_init <= 0 {
            panic_err(&env, Error::BadAmount);
        }
        admin.require_auth();
        s.set(&DataKey::Admin, &admin);
        s.set(&DataKey::Underlying, &underlying);
        s.set(&DataKey::Quote, &quote);
        s.set(&DataKey::Maturity, &maturity);
        s.set(&DataKey::IndexLast, &index_init);
        s.set(&DataKey::TotalPt, &0i128);
        s.set(&DataKey::TotalYt, &0i128);
        s.set(&DataKey::TotalSy, &0i128);
        s.set(&DataKey::AccYield, &0i128);
        s.set(&DataKey::ReserveQuote, &0i128);
        s.set(&DataKey::LpTotal, &0i128);
    }

    /// Keeper pushes the latest SY->asset rate and accrues yield to YT holders.
    pub fn sync(env: Env, new_index: i128) {
        admin(&env).require_auth();
        accrue(&env, new_index);
    }

    /// Deposit `sy_amt` of the underlying SY; mint equal PT and YT (asset-denominated).
    pub fn deposit(env: Env, user: Address, sy_amt: i128) -> i128 {
        user.require_auth();
        if sy_amt <= 0 {
            panic_err(&env, Error::BadAmount);
        }
        let idx = index(&env);
        token::TokenClient::new(&env, &underlying(&env)).transfer(
            &user,
            &env.current_contract_address(),
            &sy_amt,
        );
        let notional = sy_amt * idx / SCALE; // asset value of the SY deposited

        harvest(&env, &user);
        set_i128(&env, &DataKey::TotalSy, get_i128(&env, &DataKey::TotalSy) + sy_amt);
        credit_pt(&env, &user, notional);
        credit_yt(&env, &user, notional);
        settle_debt(&env, &user);
        notional
    }

    /// Recombine `amt` PT + `amt` YT back into SY at any time (PT + YT == SY).
    pub fn combine(env: Env, user: Address, amt: i128) -> i128 {
        user.require_auth();
        if amt <= 0 {
            panic_err(&env, Error::BadAmount);
        }
        harvest(&env, &user);
        debit_pt(&env, &user, amt);
        debit_yt(&env, &user, amt);
        settle_debt(&env, &user);
        let sy_out = amt * SCALE / index(&env);
        payout_sy(&env, &user, sy_out);
        sy_out
    }

    /// After maturity, redeem `amt` PT for its asset value in SY (the fixed-rate settles).
    pub fn redeem_pt(env: Env, user: Address, amt: i128) -> i128 {
        user.require_auth();
        if amt <= 0 {
            panic_err(&env, Error::BadAmount);
        }
        if env.ledger().timestamp() < maturity(&env) {
            panic_err(&env, Error::NotMatured);
        }
        debit_pt(&env, &user, amt);
        let sy_out = amt * SCALE / index(&env);
        payout_sy(&env, &user, sy_out);
        sy_out
    }

    /// Claim accrued yield (paid in SY worth the owed asset value).
    pub fn claim_yield(env: Env, user: Address) -> i128 {
        user.require_auth();
        harvest(&env, &user);
        let owed = get_i128(&env, &DataKey::Owed(user.clone()));
        if owed <= 0 {
            return 0;
        }
        set_i128(&env, &DataKey::Owed(user.clone()), 0);
        let sy_out = owed * SCALE / index(&env);
        payout_sy(&env, &user, sy_out);
        sy_out
    }

    // --- transfers so PT/YT can trade on a DEX ---
    pub fn transfer_pt(env: Env, from: Address, to: Address, amt: i128) {
        from.require_auth();
        debit_pt(&env, &from, amt);
        credit_pt(&env, &to, amt);
    }

    pub fn transfer_yt(env: Env, from: Address, to: Address, amt: i128) {
        from.require_auth();
        harvest(&env, &from);
        harvest(&env, &to);
        debit_yt(&env, &from, amt);
        credit_yt(&env, &to, amt);
        settle_debt(&env, &from);
        settle_debt(&env, &to);
    }

    // --- views ---
    pub fn pt_balance(env: Env, user: Address) -> i128 {
        get_i128(&env, &DataKey::Pt(user))
    }
    pub fn yt_balance(env: Env, user: Address) -> i128 {
        get_i128(&env, &DataKey::Yt(user))
    }

    /// Live claimable yield (asset units) without mutating state.
    pub fn pending_yield(env: Env, user: Address) -> i128 {
        let bal = get_i128(&env, &DataKey::Yt(user.clone()));
        let acc = get_i128(&env, &DataKey::AccYield);
        let accrued = bal * acc / ACC - get_i128(&env, &DataKey::Debt(user.clone()));
        get_i128(&env, &DataKey::Owed(user)) + if accrued > 0 { accrued } else { 0 }
    }

    /// Annualized fixed rate (1e7-scaled) implied by a PT quoted at `pt_price` (asset per PT,
    /// 1e7-scaled) with `secs_to_maturity` left. rate = (1/price - 1) * year/tenor.
    pub fn implied_fixed_rate(env: Env, pt_price: i128, secs_to_maturity: u64) -> i128 {
        if pt_price <= 0 || secs_to_maturity == 0 {
            panic_err(&env, Error::BadAmount);
        }
        let year: i128 = 31_536_000;
        let discount = SCALE * SCALE / pt_price - SCALE; // (1/price - 1), 1e7-scaled
        discount * year / (secs_to_maturity as i128)
    }

    // ===================== Rate AMM (PT <-> quote) =====================
    // A constant-product pool prices PT in the stable `quote` token. PT trading
    // below par (< 1.0) is a positive fixed rate; the pool discovers that rate.
    // The pool's PT reserve is simply the contract's own internal PT balance.

    /// Seed / add liquidity to the PT-quote pool. Returns LP shares minted.
    pub fn add_liquidity(env: Env, provider: Address, pt_in: i128, quote_in: i128) -> i128 {
        provider.require_auth();
        if pt_in <= 0 || quote_in <= 0 {
            panic_err(&env, Error::BadAmount);
        }
        let rp = reserve_pt(&env);
        let rq = reserve_quote(&env);
        let lp_total = get_i128(&env, &DataKey::LpTotal);

        // move PT from provider into the pool (contract's own PT balance)
        debit_pt(&env, &provider, pt_in);
        credit_pt(&env, &env.current_contract_address(), pt_in);
        // pull quote token
        token::TokenClient::new(&env, &quote(&env)).transfer(
            &provider,
            &env.current_contract_address(),
            &quote_in,
        );
        set_i128(&env, &DataKey::ReserveQuote, rq + quote_in);

        let minted = if lp_total == 0 || rp == 0 || rq == 0 {
            pt_in // seed
        } else {
            let a = pt_in * lp_total / rp;
            let b = quote_in * lp_total / rq;
            if a < b { a } else { b }
        };
        set_i128(&env, &DataKey::Lp(provider.clone()), get_i128(&env, &DataKey::Lp(provider)) + minted);
        set_i128(&env, &DataKey::LpTotal, lp_total + minted);
        minted
    }

    /// Buy PT with `quote_in` of the stable token, this LOCKS A FIXED RATE.
    pub fn buy_pt(env: Env, buyer: Address, quote_in: i128) -> i128 {
        buyer.require_auth();
        if quote_in <= 0 {
            panic_err(&env, Error::BadAmount);
        }
        let rp = reserve_pt(&env);
        let rq = reserve_quote(&env);
        if rp <= 0 || rq <= 0 {
            panic_err(&env, Error::NoLiquidity);
        }
        let dx = quote_in * (10_000 - FEE_BPS) / 10_000;
        let pt_out = rp * dx / (rq + dx);
        token::TokenClient::new(&env, &quote(&env)).transfer(
            &buyer,
            &env.current_contract_address(),
            &quote_in,
        );
        set_i128(&env, &DataKey::ReserveQuote, rq + quote_in);
        debit_pt(&env, &env.current_contract_address(), pt_out);
        credit_pt(&env, &buyer, pt_out);
        pt_out
    }

    /// Sell `pt_in` PT back to the pool for the stable token.
    pub fn sell_pt(env: Env, seller: Address, pt_in: i128) -> i128 {
        seller.require_auth();
        if pt_in <= 0 {
            panic_err(&env, Error::BadAmount);
        }
        let rp = reserve_pt(&env);
        let rq = reserve_quote(&env);
        if rp <= 0 || rq <= 0 {
            panic_err(&env, Error::NoLiquidity);
        }
        let dx = pt_in * (10_000 - FEE_BPS) / 10_000;
        let quote_out = rq * dx / (rp + dx);
        debit_pt(&env, &seller, pt_in);
        credit_pt(&env, &env.current_contract_address(), pt_in);
        set_i128(&env, &DataKey::ReserveQuote, rq - quote_out);
        token::TokenClient::new(&env, &quote(&env)).transfer(
            &env.current_contract_address(),
            &seller,
            &quote_out,
        );
        quote_out
    }

    /// PT spot price in quote units (1e7-scaled). 1.0 == par.
    pub fn pt_price(env: Env) -> i128 {
        let rp = reserve_pt(&env);
        if rp <= 0 {
            return 0;
        }
        reserve_quote(&env) * SCALE / rp
    }

    /// Implied annualized fixed rate (1e7-scaled) from the pool's current PT price.
    pub fn fixed_rate(env: Env) -> i128 {
        let price = Self::pt_price(env.clone());
        let now = env.ledger().timestamp();
        let mat = maturity(&env);
        if price <= 0 || mat <= now {
            return 0;
        }
        Self::implied_fixed_rate(env.clone(), price, mat - now)
    }

    /// View: how much PT `quote_in` would buy right now (no state change).
    pub fn quote_buy_pt(env: Env, quote_in: i128) -> i128 {
        let rp = reserve_pt(&env);
        let rq = reserve_quote(&env);
        if rp <= 0 || rq <= 0 || quote_in <= 0 {
            return 0;
        }
        let dx = quote_in * (10_000 - FEE_BPS) / 10_000;
        rp * dx / (rq + dx)
    }

    pub fn market_info(env: Env) -> MarketInfo {
        MarketInfo {
            underlying: underlying(&env),
            quote: quote(&env),
            maturity: maturity(&env),
            index: index(&env),
            total_pt: get_i128(&env, &DataKey::TotalPt),
            total_yt: get_i128(&env, &DataKey::TotalYt),
            total_sy: get_i128(&env, &DataKey::TotalSy),
            reserve_pt: reserve_pt(&env),
            reserve_quote: reserve_quote(&env),
            matured: env.ledger().timestamp() >= maturity(&env),
        }
    }
}

// ------- internals -------

fn accrue(env: &Env, new_index: i128) {
    let last = index(env);
    if new_index < last {
        panic_err(env, Error::IndexWentDown);
    }
    let total_sy = get_i128(env, &DataKey::TotalSy);
    let total_yt = get_i128(env, &DataKey::TotalYt);
    if total_sy > 0 && total_yt > 0 && new_index > last {
        let new_yield = total_sy * (new_index - last) / SCALE; // asset units earned
        let acc = get_i128(env, &DataKey::AccYield) + new_yield * ACC / total_yt;
        set_i128(env, &DataKey::AccYield, acc);
    }
    env.storage().instance().set(&DataKey::IndexLast, &new_index);
}

/// Move a user's YT rewards into their `Owed` bucket up to the current accumulator.
fn harvest(env: &Env, user: &Address) {
    let bal = get_i128(env, &DataKey::Yt(user.clone()));
    let acc = get_i128(env, &DataKey::AccYield);
    let accrued = bal * acc / ACC - get_i128(env, &DataKey::Debt(user.clone()));
    if accrued > 0 {
        let owed = get_i128(env, &DataKey::Owed(user.clone())) + accrued;
        set_i128(env, &DataKey::Owed(user.clone()), owed);
    }
    settle_debt(env, user);
}

fn settle_debt(env: &Env, user: &Address) {
    let bal = get_i128(env, &DataKey::Yt(user.clone()));
    let acc = get_i128(env, &DataKey::AccYield);
    set_i128(env, &DataKey::Debt(user.clone()), bal * acc / ACC);
}

fn credit_pt(env: &Env, user: &Address, amt: i128) {
    set_i128(env, &DataKey::Pt(user.clone()), get_i128(env, &DataKey::Pt(user.clone())) + amt);
    set_i128(env, &DataKey::TotalPt, get_i128(env, &DataKey::TotalPt) + amt);
}
fn debit_pt(env: &Env, user: &Address, amt: i128) {
    let bal = get_i128(env, &DataKey::Pt(user.clone()));
    if bal < amt {
        panic_err(env, Error::InsufficientPt);
    }
    set_i128(env, &DataKey::Pt(user.clone()), bal - amt);
    set_i128(env, &DataKey::TotalPt, get_i128(env, &DataKey::TotalPt) - amt);
}
fn credit_yt(env: &Env, user: &Address, amt: i128) {
    set_i128(env, &DataKey::Yt(user.clone()), get_i128(env, &DataKey::Yt(user.clone())) + amt);
    set_i128(env, &DataKey::TotalYt, get_i128(env, &DataKey::TotalYt) + amt);
}
fn debit_yt(env: &Env, user: &Address, amt: i128) {
    let bal = get_i128(env, &DataKey::Yt(user.clone()));
    if bal < amt {
        panic_err(env, Error::InsufficientYt);
    }
    set_i128(env, &DataKey::Yt(user.clone()), bal - amt);
    set_i128(env, &DataKey::TotalYt, get_i128(env, &DataKey::TotalYt) - amt);
}

fn payout_sy(env: &Env, user: &Address, sy_amt: i128) {
    if sy_amt <= 0 {
        return;
    }
    set_i128(env, &DataKey::TotalSy, get_i128(env, &DataKey::TotalSy) - sy_amt);
    token::TokenClient::new(env, &underlying(env)).transfer(
        &env.current_contract_address(),
        user,
        &sy_amt,
    );
}

fn admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap_or_else(|| panic_err(env, Error::NotInitialized))
}
fn underlying(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Underlying).unwrap_or_else(|| panic_err(env, Error::NotInitialized))
}
fn quote(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Quote).unwrap_or_else(|| panic_err(env, Error::NotInitialized))
}
fn reserve_pt(env: &Env) -> i128 {
    get_i128(env, &DataKey::Pt(env.current_contract_address()))
}
fn reserve_quote(env: &Env) -> i128 {
    get_i128(env, &DataKey::ReserveQuote)
}
fn maturity(env: &Env) -> u64 {
    env.storage().instance().get(&DataKey::Maturity).unwrap_or_else(|| panic_err(env, Error::NotInitialized))
}
fn index(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::IndexLast).unwrap_or_else(|| panic_err(env, Error::NotInitialized))
}

fn is_persistent(key: &DataKey) -> bool {
    matches!(
        key,
        DataKey::Pt(_) | DataKey::Yt(_) | DataKey::Debt(_) | DataKey::Owed(_) | DataKey::Lp(_)
    )
}
fn get_i128(env: &Env, key: &DataKey) -> i128 {
    if is_persistent(key) {
        env.storage().persistent().get(key).unwrap_or(0)
    } else {
        env.storage().instance().get(key).unwrap_or(0)
    }
}
fn set_i128(env: &Env, key: &DataKey, val: i128) {
    if is_persistent(key) {
        env.storage().persistent().set(key, &val)
    } else {
        env.storage().instance().set(key, &val)
    }
}

fn panic_err(env: &Env, e: Error) -> ! {
    soroban_sdk::panic_with_error!(env, e)
}

mod test;
