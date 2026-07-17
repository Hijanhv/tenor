#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{token, Address, Env};

fn new_token(
    env: &Env,
    admin: &Address,
) -> (Address, token::StellarAssetClient<'static>, token::TokenClient<'static>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let addr = sac.address();
    (
        addr.clone(),
        token::StellarAssetClient::new(env, &addr),
        token::TokenClient::new(env, &addr),
    )
}

const YEAR: u64 = 31_536_000;

#[test]
fn split_accrue_claim_redeem() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);

    let admin = Address::generate(&env);
    let alice = Address::generate(&env);

    // SY = a yield-bearing underlying (e.g. a Blend pool token). Value tracked by the index.
    let (sy, sy_admin, sy_token) = new_token(&env, &admin);
    sy_admin.mint(&alice, &1_000);

    // Market: index starts at 1.0 (1e7), matures at t=2000. Quote token unused here.
    let market = env.register(Tenor, ());
    let c = TenorClient::new(&env, &market);
    c.initialize(&admin, &sy, &sy, &2_000u64, &SCALE);

    // Alice splits 1000 SY -> 1000 PT + 1000 YT (asset units, index = 1.0).
    let notional = c.deposit(&alice, &1_000);
    assert_eq!(notional, 1_000);
    assert_eq!(c.pt_balance(&alice), 1_000);
    assert_eq!(c.yt_balance(&alice), 1_000);
    assert_eq!(sy_token.balance(&alice), 0);

    // The SY earns 10%: keeper pushes index 1.0 -> 1.1. That 100 of yield belongs to YT.
    c.sync(&(SCALE * 11 / 10));
    assert_eq!(c.pending_yield(&alice), 100);

    // Alice claims her yield, paid in SY worth 100 asset @ index 1.1 => ~90 SY.
    let claimed_sy = c.claim_yield(&alice);
    assert_eq!(claimed_sy, 100 * SCALE / (SCALE * 11 / 10)); // 90
    assert_eq!(sy_token.balance(&alice), 90);
    assert_eq!(c.pending_yield(&alice), 0);

    // After maturity, PT redeems for its full asset value (fixed principal settles).
    env.ledger().set_timestamp(2_500);
    let redeemed_sy = c.redeem_pt(&alice, &1_000);
    assert_eq!(redeemed_sy, 1_000 * SCALE / (SCALE * 11 / 10)); // 909
    assert_eq!(c.pt_balance(&alice), 0);
    assert_eq!(sy_token.balance(&alice), 90 + 909);
}

#[test]
fn combine_is_inverse_of_split() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let bob = Address::generate(&env);
    let (sy, sy_admin, sy_token) = new_token(&env, &admin);
    sy_admin.mint(&bob, &500);

    let market = env.register(Tenor, ());
    let c = TenorClient::new(&env, &market);
    c.initialize(&admin, &sy, &sy, &9_999u64, &SCALE);

    c.deposit(&bob, &500);
    let out = c.combine(&bob, &500);
    assert_eq!(out, 500);
    assert_eq!(c.pt_balance(&bob), 0);
    assert_eq!(c.yt_balance(&bob), 0);
    assert_eq!(sy_token.balance(&bob), 500);
}

#[test]
fn yield_splits_between_two_yt_holders() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let a = Address::generate(&env);
    let b = Address::generate(&env);
    let (sy, sy_admin, _) = new_token(&env, &admin);
    sy_admin.mint(&a, &1_000);
    sy_admin.mint(&b, &1_000);

    let market = env.register(Tenor, ());
    let c = TenorClient::new(&env, &market);
    c.initialize(&admin, &sy, &sy, &99_999u64, &SCALE);

    c.deposit(&a, &1_000); // A: 1000 YT (index 1.0)
    c.sync(&(SCALE * 105 / 100)); // +5%: 50 yield, A is sole YT holder => all 50 to A
    c.deposit(&b, &1_000); // B enters at index 1.05 => 1050 notional => 1050 YT
    c.sync(&(SCALE * 110 / 100)); // +5% on 2000 SY = 100 yield, split 1000:1050

    // A = 50 (first tranche alone) + 1000/2050 * 100 = 98 ; B = 1050/2050 * 100 = 51
    assert_eq!(c.pending_yield(&a), 98);
    assert_eq!(c.pending_yield(&b), 51);
    assert_eq!(c.pending_yield(&a) + c.pending_yield(&b), 149);
}

#[test]
fn amm_prices_pt_and_locks_fixed_rate() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);
    let admin = Address::generate(&env);
    let lp = Address::generate(&env);
    let buyer = Address::generate(&env);

    let (sy, sy_admin, _) = new_token(&env, &admin);
    let (usdc, usdc_admin, _) = new_token(&env, &admin);

    let market = env.register(Tenor, ());
    let c = TenorClient::new(&env, &market);
    c.initialize(&admin, &sy, &usdc, &(1_000 + YEAR), &SCALE);

    // LP mints PT by splitting SY, then seeds a PT/USDC pool at 0.95 (100k PT : 95k USDC).
    sy_admin.mint(&lp, &100_000);
    c.deposit(&lp, &100_000);
    usdc_admin.mint(&lp, &95_000);
    let lp_shares = c.add_liquidity(&lp, &100_000, &95_000);
    assert_eq!(lp_shares, 100_000); // seed => LP shares == pt seeded

    // PT spot price is 0.95 => the pool implies a ~5.26% fixed rate for a 1-year tenor.
    assert_eq!(c.pt_price(), 9_500_000);
    let rate = c.fixed_rate();
    assert!(rate > 500_000 && rate < 560_000, "fixed rate was {}", rate);

    // A saver locks the fixed rate: 500 USDC buys > 500 PT (each PT redeems for 1.0 at maturity).
    usdc_admin.mint(&buyer, &500);
    let pt_out = c.buy_pt(&buyer, &500);
    assert!(pt_out > 515 && pt_out < 530, "pt_out was {}", pt_out);
    assert_eq!(c.pt_balance(&buyer), pt_out);
}

/// End to end: a saver locks a fixed rate and, at maturity, redeems principal worth
/// more than they paid. This is the outcome the whole protocol promises.
#[test]
fn full_lifecycle_saver_profits_at_maturity() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);
    let admin = Address::generate(&env);
    let lp = Address::generate(&env);
    let saver = Address::generate(&env);

    let (sy, sy_admin, sy_token) = new_token(&env, &admin);
    let (usdc, usdc_admin, _) = new_token(&env, &admin);

    let market = env.register(Tenor, ());
    let c = TenorClient::new(&env, &market);
    c.initialize(&admin, &sy, &usdc, &(1_000 + YEAR), &SCALE);

    // LP seeds the market: split 100k SY, pool 100k PT : 95k USDC (price 0.95).
    sy_admin.mint(&lp, &100_000);
    c.deposit(&lp, &100_000);
    usdc_admin.mint(&lp, &95_000);
    c.add_liquidity(&lp, &100_000, &95_000);

    // Saver locks the fixed rate with 950 USDC.
    usdc_admin.mint(&saver, &950);
    let pt = c.buy_pt(&saver, &950);
    assert!(pt > 950, "should receive more PT than USDC paid; got {}", pt);

    // The SY earns yield over the tenor (index 1.0 -> 1.05); that accrues to YT (the LP).
    c.sync(&(SCALE * 105 / 100));
    assert!(c.pending_yield(&lp) > 0);

    // At maturity the saver redeems PT. Principal value redeemed = pt asset units,
    // which is worth more than the 950 USDC paid: the fixed rate realized.
    env.ledger().set_timestamp(1_000 + YEAR + 1);
    let sy_out = c.redeem_pt(&saver, &pt);
    let asset_value = sy_out * (SCALE * 105 / 100) / SCALE; // SY -> asset at final index
    assert!(asset_value >= pt - 1, "redeemed value {} < principal {}", asset_value, pt);
    assert!(asset_value > 950, "saver did not profit: {} <= 950", asset_value);
    assert_eq!(sy_token.balance(&saver), sy_out);
}

/// Time decay AMM: with no trades, the PT price is pulled from its discount toward par
/// as the tenor elapses, and the implied fixed rate stays stable.
#[test]
fn time_decay_pulls_price_to_par() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);
    let admin = Address::generate(&env);
    let lp = Address::generate(&env);
    let (sy, sy_admin, _) = new_token(&env, &admin);
    let (usdc, usdc_admin, _) = new_token(&env, &admin);

    let market = env.register(Tenor, ());
    let c = TenorClient::new(&env, &market);
    c.initialize(&admin, &sy, &usdc, &(1_000 + YEAR), &SCALE);

    sy_admin.mint(&lp, &100_000);
    c.deposit(&lp, &100_000);
    usdc_admin.mint(&lp, &95_000);
    c.add_liquidity(&lp, &100_000, &95_000);

    // At issuance: 0.95.
    assert_eq!(c.pt_price(), 9_500_000);
    let r0 = c.fixed_rate();

    // Halfway: pulled to ~0.975.
    env.ledger().set_timestamp(1_000 + YEAR / 2);
    assert_eq!(c.pt_price(), 9_750_000);
    let r1 = c.fixed_rate();

    // At maturity: par.
    env.ledger().set_timestamp(1_000 + YEAR);
    assert_eq!(c.pt_price(), 10_000_000);

    // The implied fixed rate stayed stable (both near 5 percent) rather than drifting.
    assert!(r0 > 500_000 && r0 < 560_000, "r0 {}", r0);
    assert!(r1 > 480_000 && r1 < 560_000, "r1 {}", r1);
}

/// Carry vault: deposit stable, keeper invests into PT, settle at maturity, claim more back.
#[test]
fn carry_vault_locks_fixed_return() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);
    let admin = Address::generate(&env);
    let lp = Address::generate(&env);
    let saver = Address::generate(&env);
    let (sy, sy_admin, sy_token) = new_token(&env, &admin);
    let (usdc, usdc_admin, _) = new_token(&env, &admin);

    let market = env.register(Tenor, ());
    let c = TenorClient::new(&env, &market);
    c.initialize(&admin, &sy, &usdc, &(1_000 + YEAR), &SCALE);

    sy_admin.mint(&lp, &100_000);
    c.deposit(&lp, &100_000);
    usdc_admin.mint(&lp, &95_000);
    c.add_liquidity(&lp, &100_000, &95_000);

    // Saver deposits 950 USDC, keeper invests it into PT at the discount.
    usdc_admin.mint(&saver, &950);
    let shares = c.vault_deposit(&saver, &950);
    assert_eq!(shares, 950);
    let pt_bought = c.vault_invest(&950);
    assert!(pt_bought > 950, "carry should buy more PT than cash in: {}", pt_bought);

    // At maturity the vault redeems PT at par and the saver claims more than deposited.
    env.ledger().set_timestamp(1_000 + YEAR + 1);
    c.vault_settle();
    let got = c.vault_claim(&saver);
    assert!(got > 950, "saver did not profit from carry: {}", got);
    assert_eq!(sy_token.balance(&saver), got);
    assert_eq!(c.vault_shares(&saver), 0);
}

#[test]
fn implied_fixed_rate_matches_hand_math() {
    let env = Env::default();
    let market = env.register(Tenor, ());
    let c = TenorClient::new(&env, &market);
    // PT priced at 0.95 with ~half a year left => ~ (1/0.95 - 1) * 2 ≈ 10.5% APR.
    let half_year: u64 = 15_768_000;
    let rate = c.implied_fixed_rate(&(SCALE * 95 / 100), &half_year);
    assert!(rate > 1_040_000 && rate < 1_060_000, "rate was {}", rate);
}
