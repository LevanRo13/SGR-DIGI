#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, String, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Name,
    Symbol,
    GuaranteeCount,
    Guarantee(u64),          // guarantee_id -> GuaranteeInfo
    Balance(Address),         // address -> total balance
    GuaranteeBalance(Address, u64), // (address, guarantee_id) -> balance
    Allowance(Address, Address),    // (owner, spender) -> allowance
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct GuaranteeInfo {
    pub id: u64,
    pub commodity_type: String,
    pub weight_kg: u64,
    pub value_usd: u64,
    pub minted_amount: u64,
    pub redeemed_amount: u64,
    pub active: bool,
}

#[contract]
pub struct GuaranteeTokenContract;

#[contractimpl]
impl GuaranteeTokenContract {
    /// Initialize the contract with admin, name, and symbol
    pub fn initialize(env: Env, admin: Address, name: String, symbol: String) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
        env.storage().instance().set(&DataKey::GuaranteeCount, &0u64);
    }

    /// Mint new tokens for a guarantee
    pub fn mint(
        env: Env,
        to: Address,
        guarantee_id: u64,
        amount: u64,
        commodity_type: String,
        weight_kg: u64,
        value_usd: u64,
    ) -> u64 {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let guarantee_key = DataKey::Guarantee(guarantee_id);

        // Check if guarantee already exists
        if env.storage().persistent().has(&guarantee_key) {
            panic!("Guarantee ID already exists");
        }

        // Create new guarantee
        let guarantee = GuaranteeInfo {
            id: guarantee_id,
            commodity_type,
            weight_kg,
            value_usd,
            minted_amount: amount,
            redeemed_amount: 0,
            active: true,
        };

        env.storage().persistent().set(&guarantee_key, &guarantee);

        // Update balances
        let balance_key = DataKey::Balance(to.clone());
        let current_balance: u64 = env.storage().persistent().get(&balance_key).unwrap_or(0);
        env.storage().persistent().set(&balance_key, &(current_balance + amount));

        let guarantee_balance_key = DataKey::GuaranteeBalance(to.clone(), guarantee_id);
        env.storage().persistent().set(&guarantee_balance_key, &amount);

        // Increment guarantee count
        let count: u64 = env.storage().instance().get(&DataKey::GuaranteeCount).unwrap();
        env.storage().instance().set(&DataKey::GuaranteeCount, &(count + 1));

        // Emit event
        env.events().publish(
            (String::from_str(&env, "mint"), to.clone()),
            (guarantee_id, amount),
        );

        guarantee_id
    }

    /// Transfer tokens
    pub fn transfer(env: Env, from: Address, to: Address, guarantee_id: u64, amount: u64) {
        from.require_auth();

        if amount == 0 {
            panic!("Amount must be greater than 0");
        }

        // Check guarantee exists and is active
        let guarantee: GuaranteeInfo = env
            .storage()
            .persistent()
            .get(&DataKey::Guarantee(guarantee_id))
            .unwrap();

        if !guarantee.active {
            panic!("Guarantee is not active");
        }

        // Update from balance
        let from_balance_key = DataKey::GuaranteeBalance(from.clone(), guarantee_id);
        let from_balance: u64 = env.storage().persistent().get(&from_balance_key).unwrap_or(0);

        if from_balance < amount {
            panic!("Insufficient balance");
        }

        env.storage().persistent().set(&from_balance_key, &(from_balance - amount));

        // Update from total balance
        let from_total_key = DataKey::Balance(from.clone());
        let from_total: u64 = env.storage().persistent().get(&from_total_key).unwrap_or(0);
        env.storage().persistent().set(&from_total_key, &(from_total - amount));

        // Update to balance
        let to_balance_key = DataKey::GuaranteeBalance(to.clone(), guarantee_id);
        let to_balance: u64 = env.storage().persistent().get(&to_balance_key).unwrap_or(0);
        env.storage().persistent().set(&to_balance_key, &(to_balance + amount));

        // Update to total balance
        let to_total_key = DataKey::Balance(to.clone());
        let to_total: u64 = env.storage().persistent().get(&to_total_key).unwrap_or(0);
        env.storage().persistent().set(&to_total_key, &(to_total + amount));

        // Emit event
        env.events().publish(
            (String::from_str(&env, "transfer"), from, to),
            (guarantee_id, amount),
        );
    }

    /// Get balance of an address for a specific guarantee
    pub fn balance_of(env: Env, address: Address, guarantee_id: u64) -> u64 {
        let key = DataKey::GuaranteeBalance(address, guarantee_id);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    /// Get total balance of an address
    pub fn balance(env: Env, address: Address) -> u64 {
        let key = DataKey::Balance(address);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    /// Approve spender to spend tokens
    pub fn approve(env: Env, owner: Address, spender: Address, amount: u64) {
        owner.require_auth();

        let key = DataKey::Allowance(owner.clone(), spender.clone());
        env.storage().persistent().set(&key, &amount);

        env.events().publish(
            (String::from_str(&env, "approve"), owner, spender),
            amount,
        );
    }

    /// Get allowance
    pub fn allowance(env: Env, owner: Address, spender: Address) -> u64 {
        let key = DataKey::Allowance(owner, spender);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    /// Transfer from (using allowance)
    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        guarantee_id: u64,
        amount: u64,
    ) {
        spender.require_auth();

        // Check allowance
        let allowance_key = DataKey::Allowance(from.clone(), spender.clone());
        let current_allowance: u64 = env.storage().persistent().get(&allowance_key).unwrap_or(0);

        if current_allowance < amount {
            panic!("Insufficient allowance");
        }

        // Update allowance
        env.storage()
            .persistent()
            .set(&allowance_key, &(current_allowance - amount));

        // Perform transfer (similar to transfer function)
        let guarantee: GuaranteeInfo = env
            .storage()
            .persistent()
            .get(&DataKey::Guarantee(guarantee_id))
            .unwrap();

        if !guarantee.active {
            panic!("Guarantee is not active");
        }

        let from_balance_key = DataKey::GuaranteeBalance(from.clone(), guarantee_id);
        let from_balance: u64 = env.storage().persistent().get(&from_balance_key).unwrap_or(0);

        if from_balance < amount {
            panic!("Insufficient balance");
        }

        env.storage()
            .persistent()
            .set(&from_balance_key, &(from_balance - amount));

        let from_total_key = DataKey::Balance(from.clone());
        let from_total: u64 = env.storage().persistent().get(&from_total_key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&from_total_key, &(from_total - amount));

        let to_balance_key = DataKey::GuaranteeBalance(to.clone(), guarantee_id);
        let to_balance: u64 = env.storage().persistent().get(&to_balance_key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&to_balance_key, &(to_balance + amount));

        let to_total_key = DataKey::Balance(to.clone());
        let to_total: u64 = env.storage().persistent().get(&to_total_key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&to_total_key, &(to_total + amount));

        env.events().publish(
            (String::from_str(&env, "transfer_from"), spender, from, to),
            (guarantee_id, amount),
        );
    }

    /// Redeem tokens
    pub fn redeem(env: Env, holder: Address, guarantee_id: u64, amount: u64) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let guarantee_key = DataKey::Guarantee(guarantee_id);
        let mut guarantee: GuaranteeInfo = env.storage().persistent().get(&guarantee_key).unwrap();

        if !guarantee.active {
            panic!("Guarantee is not active");
        }

        let balance_key = DataKey::GuaranteeBalance(holder.clone(), guarantee_id);
        let balance: u64 = env.storage().persistent().get(&balance_key).unwrap_or(0);

        if balance < amount {
            panic!("Insufficient balance to redeem");
        }

        // Update holder's balance
        env.storage().persistent().set(&balance_key, &(balance - amount));

        let total_key = DataKey::Balance(holder.clone());
        let total_balance: u64 = env.storage().persistent().get(&total_key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&total_key, &(total_balance - amount));

        // Update guarantee
        guarantee.redeemed_amount += amount;
        env.storage().persistent().set(&guarantee_key, &guarantee);

        env.events().publish(
            (String::from_str(&env, "redeem"), holder),
            (guarantee_id, amount),
        );
    }

    /// Get guarantee info
    pub fn get_guarantee_info(env: Env, guarantee_id: u64) -> GuaranteeInfo {
        let key = DataKey::Guarantee(guarantee_id);
        env.storage().persistent().get(&key).unwrap()
    }

    /// Get all guarantees
    pub fn get_all_guarantees(env: Env) -> Vec<GuaranteeInfo> {
        let count: u64 = env.storage().instance().get(&DataKey::GuaranteeCount).unwrap_or(0);
        let mut guarantees = Vec::new(&env);

        for i in 0..count {
            let key = DataKey::Guarantee(i);
            if let Some(guarantee) = env.storage().persistent().get::<DataKey, GuaranteeInfo>(&key) {
                guarantees.push_back(guarantee);
            }
        }

        guarantees
    }

    /// Get contract name
    pub fn name(env: Env) -> String {
        env.storage().instance().get(&DataKey::Name).unwrap()
    }

    /// Get contract symbol
    pub fn symbol(env: Env) -> String {
        env.storage().instance().get(&DataKey::Symbol).unwrap()
    }

    /// Get admin
    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env, String};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, GuaranteeTokenContract);
        let client = GuaranteeTokenContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let name = String::from_str(&env, "AURA Guarantee");
        let symbol = String::from_str(&env, "AURA");

        client.initialize(&admin, &name, &symbol);

        assert_eq!(client.name(), name);
        assert_eq!(client.symbol(), symbol);
        assert_eq!(client.admin(), admin);
    }

    #[test]
    fn test_mint_and_balance() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, GuaranteeTokenContract);
        let client = GuaranteeTokenContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        client.initialize(
            &admin,
            &String::from_str(&env, "AURA"),
            &String::from_str(&env, "AURA"),
        );

        let guarantee_id = client.mint(
            &user,
            &0,
            &1000,
            &String::from_str(&env, "SOJA"),
            &5000,
            &55000,
        );

        assert_eq!(guarantee_id, 0);
        assert_eq!(client.balance_of(&user, &0), 1000);
        assert_eq!(client.balance(&user), 1000);
    }

    #[test]
    fn test_transfer() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, GuaranteeTokenContract);
        let client = GuaranteeTokenContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);

        client.initialize(
            &admin,
            &String::from_str(&env, "AURA"),
            &String::from_str(&env, "AURA"),
        );

        client.mint(
            &user1,
            &0,
            &1000,
            &String::from_str(&env, "SOJA"),
            &5000,
            &55000,
        );

        client.transfer(&user1, &user2, &0, &300);

        assert_eq!(client.balance_of(&user1, &0), 700);
        assert_eq!(client.balance_of(&user2, &0), 300);
    }
}
