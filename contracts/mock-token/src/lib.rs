#![no_std]
//! Minimal SEP-41 token for Tenor demos: mintable by anyone (faucet-style) so a fresh
//! wallet can grab test USDC / test SY with no trustlines. Testnet only — not for prod.

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Decimal,
    Name,
    Symbol,
    Balance(Address),
    Allowance(Address, Address), // (from, spender) -> (amount, expiration_ledger)
}

fn read_balance(env: &Env, id: &Address) -> i128 {
    env.storage().persistent().get(&DataKey::Balance(id.clone())).unwrap_or(0)
}
fn write_balance(env: &Env, id: &Address, amount: i128) {
    env.storage().persistent().set(&DataKey::Balance(id.clone()), &amount);
}

#[contract]
pub struct MockToken;

#[contractimpl]
impl MockToken {
    pub fn initialize(env: Env, decimal: u32, name: String, symbol: String) {
        let s = env.storage().instance();
        s.set(&DataKey::Decimal, &decimal);
        s.set(&DataKey::Name, &name);
        s.set(&DataKey::Symbol, &symbol);
    }

    /// Faucet mint — open by design for testnet demos.
    pub fn mint(env: Env, to: Address, amount: i128) {
        write_balance(&env, &to, read_balance(&env, &to) + amount);
    }

    // ---- SEP-41 TokenInterface ----
    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        let key = DataKey::Allowance(from, spender);
        match env.storage().temporary().get::<_, (i128, u32)>(&key) {
            Some((amount, exp)) if exp >= env.ledger().sequence() => amount,
            _ => 0,
        }
    }

    pub fn approve(env: Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32) {
        from.require_auth();
        env.storage()
            .temporary()
            .set(&DataKey::Allowance(from, spender), &(amount, expiration_ledger));
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        read_balance(&env, &id)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        let fb = read_balance(&env, &from);
        if fb < amount {
            panic!("insufficient balance");
        }
        write_balance(&env, &from, fb - amount);
        write_balance(&env, &to, read_balance(&env, &to) + amount);
    }

    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();
        let allow = Self::allowance(env.clone(), from.clone(), spender.clone());
        if allow < amount {
            panic!("insufficient allowance");
        }
        let key = DataKey::Allowance(from.clone(), spender.clone());
        if let Some((_, exp)) = env.storage().temporary().get::<_, (i128, u32)>(&key) {
            env.storage().temporary().set(&key, &(allow - amount, exp));
        }
        let fb = read_balance(&env, &from);
        if fb < amount {
            panic!("insufficient balance");
        }
        write_balance(&env, &from, fb - amount);
        write_balance(&env, &to, read_balance(&env, &to) + amount);
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();
        write_balance(&env, &from, read_balance(&env, &from) - amount);
    }

    pub fn burn_from(env: Env, spender: Address, from: Address, amount: i128) {
        spender.require_auth();
        write_balance(&env, &from, read_balance(&env, &from) - amount);
    }

    pub fn decimals(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Decimal).unwrap_or(7)
    }
    pub fn name(env: Env) -> String {
        env.storage().instance().get(&DataKey::Name).unwrap_or(String::from_str(&env, "Token"))
    }
    pub fn symbol(env: Env) -> String {
        env.storage().instance().get(&DataKey::Symbol).unwrap_or(String::from_str(&env, "TKN"))
    }
}

mod test;
