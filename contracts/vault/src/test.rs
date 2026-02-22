#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger, LedgerInfo};
use soroban_sdk::{token, Address, Env};

fn setup_env() -> (Env, Address, token::Client<'static>, token::StellarAssetClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let token_contract = env.register_stellar_asset_contract(token_admin.clone());
    let token_client = token::Client::new(&env, &token_contract);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    (env, admin, token_client, token_admin_client)
}

fn deploy_vault(env: &Env) -> VaultContractClient<'static> {
    let contract_id = env.register_contract(None, VaultContract);
    VaultContractClient::new(env, &contract_id)
}

#[test]
fn test_initialize() {
    let (env, admin, token_client, _) = setup_env();
    let vault = deploy_vault(&env);

    vault.initialize(&admin, &token_client.address);

    let info = vault.get_vault_info();
    assert_eq!(info.admin, admin);
    assert_eq!(info.token, token_client.address);
    assert_eq!(info.total_deposited, 0);
    assert_eq!(info.deposit_count, 0);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_double_initialize() {
    let (env, admin, token_client, _) = setup_env();
    let vault = deploy_vault(&env);

    vault.initialize(&admin, &token_client.address);
    vault.initialize(&admin, &token_client.address);
}

#[test]
fn test_deposit() {
    let (env, admin, token_client, token_admin_client) = setup_env();
    let vault = deploy_vault(&env);
    let user = Address::generate(&env);

    vault.initialize(&admin, &token_client.address);

    // Mint tokens to user
    token_admin_client.mint(&user, &1_000_000_000);

    // Deposit
    vault.deposit(&user, &500_000_000);

    assert_eq!(vault.get_balance(&user), 500_000_000);

    let info = vault.get_vault_info();
    assert_eq!(info.total_deposited, 500_000_000);
    assert_eq!(info.deposit_count, 1);
}

#[test]
fn test_multiple_deposits() {
    let (env, admin, token_client, token_admin_client) = setup_env();
    let vault = deploy_vault(&env);
    let user = Address::generate(&env);

    vault.initialize(&admin, &token_client.address);
    token_admin_client.mint(&user, &2_000_000_000);

    vault.deposit(&user, &300_000_000);
    vault.deposit(&user, &200_000_000);

    assert_eq!(vault.get_balance(&user), 500_000_000);

    let info = vault.get_vault_info();
    assert_eq!(info.total_deposited, 500_000_000);
    // Count stays 1 because same user
    assert_eq!(info.deposit_count, 1);
}

#[test]
fn test_withdraw() {
    let (env, admin, token_client, token_admin_client) = setup_env();
    let vault = deploy_vault(&env);
    let user = Address::generate(&env);

    vault.initialize(&admin, &token_client.address);
    token_admin_client.mint(&user, &1_000_000_000);
    vault.deposit(&user, &600_000_000);

    // Withdraw part
    vault.withdraw(&user, &250_000_000);

    assert_eq!(vault.get_balance(&user), 350_000_000);

    let info = vault.get_vault_info();
    assert_eq!(info.total_deposited, 350_000_000);
}

#[test]
#[should_panic(expected = "insufficient vault balance")]
fn test_withdraw_too_much() {
    let (env, admin, token_client, token_admin_client) = setup_env();
    let vault = deploy_vault(&env);
    let user = Address::generate(&env);

    vault.initialize(&admin, &token_client.address);
    token_admin_client.mint(&user, &1_000_000_000);
    vault.deposit(&user, &100_000_000);

    vault.withdraw(&user, &999_000_000);
}

#[test]
fn test_timelock() {
    let (env, admin, token_client, token_admin_client) = setup_env();
    let vault = deploy_vault(&env);
    let user = Address::generate(&env);

    vault.initialize(&admin, &token_client.address);
    token_admin_client.mint(&user, &1_000_000_000);
    vault.deposit(&user, &500_000_000);

    // Set timelock 1 hour in the future
    let current_ts = env.ledger().timestamp();
    let unlock_time = current_ts + 3600;
    vault.set_timelock(&user, &unlock_time);

    assert_eq!(vault.get_timelock(&user), unlock_time);
}

#[test]
#[should_panic(expected = "funds are timelocked")]
fn test_withdraw_during_timelock() {
    let (env, admin, token_client, token_admin_client) = setup_env();
    let vault = deploy_vault(&env);
    let user = Address::generate(&env);

    // Set ledger timestamp
    env.ledger().set(LedgerInfo {
        timestamp: 1000,
        protocol_version: 20,
        sequence_number: 100,
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 10,
        min_persistent_entry_ttl: 10,
        max_entry_ttl: 3110400,
    });

    vault.initialize(&admin, &token_client.address);
    token_admin_client.mint(&user, &1_000_000_000);
    vault.deposit(&user, &500_000_000);

    // Lock until timestamp 5000
    vault.set_timelock(&user, &5000);

    // Try to withdraw at timestamp 1000 — should panic
    vault.withdraw(&user, &100_000_000);
}

#[test]
fn test_withdraw_after_timelock() {
    let (env, admin, token_client, token_admin_client) = setup_env();
    let vault = deploy_vault(&env);
    let user = Address::generate(&env);

    env.ledger().set(LedgerInfo {
        timestamp: 1000,
        protocol_version: 20,
        sequence_number: 100,
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 10,
        min_persistent_entry_ttl: 10,
        max_entry_ttl: 3110400,
    });

    vault.initialize(&admin, &token_client.address);
    token_admin_client.mint(&user, &1_000_000_000);
    vault.deposit(&user, &500_000_000);

    // Lock until timestamp 2000
    vault.set_timelock(&user, &2000);

    // Advance time past the lock
    env.ledger().set(LedgerInfo {
        timestamp: 3000,
        protocol_version: 20,
        sequence_number: 200,
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 10,
        min_persistent_entry_ttl: 10,
        max_entry_ttl: 3110400,
    });

    // Now withdraw should succeed
    vault.withdraw(&user, &200_000_000);
    assert_eq!(vault.get_balance(&user), 300_000_000);
}

#[test]
fn test_full_withdraw_decrements_count() {
    let (env, admin, token_client, token_admin_client) = setup_env();
    let vault = deploy_vault(&env);
    let user = Address::generate(&env);

    vault.initialize(&admin, &token_client.address);
    token_admin_client.mint(&user, &1_000_000_000);
    vault.deposit(&user, &500_000_000);

    assert_eq!(vault.get_vault_info().deposit_count, 1);

    // Withdraw everything
    vault.withdraw(&user, &500_000_000);

    assert_eq!(vault.get_balance(&user), 0);
    assert_eq!(vault.get_vault_info().deposit_count, 0);
    assert_eq!(vault.get_vault_info().total_deposited, 0);
}
