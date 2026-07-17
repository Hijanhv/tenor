#![cfg(test)]
use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Env, String};

#[test]
fn mint_and_transfer() {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register(MockToken, ());
    let c = MockTokenClient::new(&env, &id);
    c.initialize(&7u32, &String::from_str(&env, "Test USDC"), &String::from_str(&env, "USDC"));

    let a = Address::generate(&env);
    let b = Address::generate(&env);
    c.mint(&a, &1_000);
    assert_eq!(c.balance(&a), 1_000);
    c.transfer(&a, &b, &400);
    assert_eq!(c.balance(&a), 600);
    assert_eq!(c.balance(&b), 400);
}
