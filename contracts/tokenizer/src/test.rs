#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{token, Address, Env};

fn setup_sy(env: &Env, admin: &Address) -> (Address, token::StellarAssetClient<'static>, token::TokenClient<'static>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let addr = sac.address();
    (
        addr.clone(),
        token::StellarAssetClient::new(env, &addr),
        token::TokenClient::new(env, &addr),
    )
}

#[test]
fn split_accrue_claim_redeem() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);

    let admin = Address::generate(&env);
    let alice = Address::generate(&env);

    // SY = a yield-bearing underlying (e.g. a Blend pool token). Value tracked by the index.
    let (sy, sy_admin, sy_token) = setup_sy(&env, &admin);
    sy_admin.mint(&alice, &1_000);

    // Market: index starts at 1.0 (1e7), matures at t=2000.
    let market = env.register(Tenor, ());
    let c = TenorClient::new(&env, &market);
    c.initialize(&admin, &sy, &2_000u64, &SCALE);

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

    // Alice holds ~999 SY back (90 yield + 909 principal) from 1000 in — plus 10% growth,
    // the yield having been split out to the YT leg. Principal was preserved in asset terms.
    assert_eq!(sy_token.balance(&alice), 90 + 909);
}

#[test]
fn combine_is_inverse_of_split() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let bob = Address::generate(&env);
    let (sy, sy_admin, sy_token) = setup_sy(&env, &admin);
    sy_admin.mint(&bob, &500);

    let market = env.register(Tenor, ());
    let c = TenorClient::new(&env, &market);
    c.initialize(&admin, &sy, &9_999u64, &SCALE);

    c.deposit(&bob, &500);
    assert_eq!(c.pt_balance(&bob), 500);
    assert_eq!(c.yt_balance(&bob), 500);

    // PT + YT recombine back into the original SY at any time.
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
    let (sy, sy_admin, _) = setup_sy(&env, &admin);
    sy_admin.mint(&a, &1_000);
    sy_admin.mint(&b, &1_000);

    let market = env.register(Tenor, ());
    let c = TenorClient::new(&env, &market);
    c.initialize(&admin, &sy, &99_999u64, &SCALE);

    c.deposit(&a, &1_000); // A: 1000 YT (index 1.0)
    c.sync(&(SCALE * 105 / 100)); // +5%: 50 yield, A is sole YT holder => all 50 to A
    c.deposit(&b, &1_000); // B enters at index 1.05 => 1050 notional => 1050 YT
    c.sync(&(SCALE * 110 / 100)); // +5% on 2000 SY = 100 yield, split 1000:1050

    // A = 50 (first tranche alone) + 1000/2050 * 100 = 98 ; B = 1050/2050 * 100 = 51
    assert_eq!(c.pending_yield(&a), 98);
    assert_eq!(c.pending_yield(&b), 51);
    // 149 of the 150 total distributed; 1 unit lost to integer rounding (dust stays in vault).
    assert_eq!(c.pending_yield(&a) + c.pending_yield(&b), 149);
}

#[test]
fn implied_fixed_rate_matches_hand_math() {
    let env = Env::default();
    let market = env.register(Tenor, ());
    let c = TenorClient::new(&env, &market);
    // PT priced at 0.95 with ~half a year left => ~ (1/0.95 - 1) * 2 ≈ 10.5% APR.
    let half_year: u64 = 15_768_000;
    let rate = c.implied_fixed_rate(&(SCALE * 95 / 100), &half_year);
    // (1/0.95 - 1) = 0.05263 ; *2 = 0.10526 -> 1_052_631 (1e7-scaled)
    assert!(rate > 1_040_000 && rate < 1_060_000, "rate was {}", rate);
}
