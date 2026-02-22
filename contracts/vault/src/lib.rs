#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    Balance(Address),
    Timelock(Address),
    TotalDeposited,
    DepositCount,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct VaultInfo {
    pub admin: Address,
    pub token: Address,
    pub total_deposited: i128,
    pub deposit_count: u32,
}

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    /// Initialize the vault with an admin and accepted token.
    pub fn initialize(env: Env, admin: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }

        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::TotalDeposited, &0i128);
        env.storage().instance().set(&DataKey::DepositCount, &0u32);

        env.events()
            .publish((symbol_short!("init"),), (admin.clone(), token.clone()));
    }

    /// Deposit tokens into the caller's personal vault.
    pub fn deposit(env: Env, user: Address, amount: i128) {
        user.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let contract_addr = env.current_contract_address();

        // Transfer tokens from user to vault contract
        token::Client::new(&env, &token_addr).transfer(&user, &contract_addr, &amount);

        // Update user balance
        let prev: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance(user.clone()))
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::Balance(user.clone()), &(prev + amount));

        // Update totals
        let mut total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalDeposited)
            .unwrap();
        total += amount;
        env.storage()
            .instance()
            .set(&DataKey::TotalDeposited, &total);

        // Increment depositor count if first deposit
        if prev == 0 {
            let mut count: u32 = env
                .storage()
                .instance()
                .get(&DataKey::DepositCount)
                .unwrap();
            count += 1;
            env.storage()
                .instance()
                .set(&DataKey::DepositCount, &count);
        }

        env.events()
            .publish((symbol_short!("deposit"),), (user, amount, total));
    }

    /// Withdraw tokens from the caller's vault.
    /// Respects any active timelock.
    pub fn withdraw(env: Env, user: Address, amount: i128) {
        user.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        // Enforce timelock
        let timelock: u64 = env
            .storage()
            .instance()
            .get(&DataKey::Timelock(user.clone()))
            .unwrap_or(0);
        if timelock > 0 && env.ledger().timestamp() < timelock {
            panic!("funds are timelocked");
        }

        let balance: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance(user.clone()))
            .unwrap_or(0);
        if balance < amount {
            panic!("insufficient vault balance");
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token_addr).transfer(
            &env.current_contract_address(),
            &user,
            &amount,
        );

        let new_balance = balance - amount;
        env.storage()
            .instance()
            .set(&DataKey::Balance(user.clone()), &new_balance);

        let mut total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalDeposited)
            .unwrap();
        total -= amount;
        env.storage()
            .instance()
            .set(&DataKey::TotalDeposited, &total);

        // Decrement depositor count if fully withdrawn
        if new_balance == 0 {
            let mut count: u32 = env
                .storage()
                .instance()
                .get(&DataKey::DepositCount)
                .unwrap();
            if count > 0 {
                count -= 1;
            }
            env.storage()
                .instance()
                .set(&DataKey::DepositCount, &count);
        }

        env.events()
            .publish((symbol_short!("withdraw"),), (user, amount, total));
    }

    /// Lock the caller's vault until a given UNIX timestamp.
    pub fn set_timelock(env: Env, user: Address, unlock_time: u64) {
        user.require_auth();

        let current = env.ledger().timestamp();
        if unlock_time <= current {
            panic!("unlock time must be in the future");
        }

        env.storage()
            .instance()
            .set(&DataKey::Timelock(user.clone()), &unlock_time);

        env.events()
            .publish((symbol_short!("lock"),), (user, unlock_time));
    }

    /// Read the vault balance for a given user.
    pub fn get_balance(env: Env, user: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Balance(user))
            .unwrap_or(0)
    }

    /// Read the timelock timestamp for a given user.
    pub fn get_timelock(env: Env, user: Address) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::Timelock(user))
            .unwrap_or(0)
    }

    /// Read overall vault statistics.
    pub fn get_vault_info(env: Env) -> VaultInfo {
        VaultInfo {
            admin: env.storage().instance().get(&DataKey::Admin).unwrap(),
            token: env.storage().instance().get(&DataKey::Token).unwrap(),
            total_deposited: env
                .storage()
                .instance()
                .get(&DataKey::TotalDeposited)
                .unwrap(),
            deposit_count: env
                .storage()
                .instance()
                .get(&DataKey::DepositCount)
                .unwrap(),
        }
    }
}

#[cfg(test)]
mod test;
