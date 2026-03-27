#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Name,
    Symbol,
    Decimals,
    GuaranteeCount,
    Guarantee(u64),                 // guarantee_id -> GuaranteeInfo
    Balance(Address),               // address -> total balance (i128 for SEP-41)
    GuaranteeBalance(Address, u64), // (address, guarantee_id) -> balance
    Allowance(AllowanceKey),        // (owner, spender) -> AllowanceData
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct AllowanceKey {
    pub owner: Address,
    pub spender: Address,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct AllowanceData {
    pub amount: i128,
    pub expiration_ledger: u32,
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

// ─── SEP-41 Token Interface Implementation ───────────────────────────────────
// This implements the standard Soroban Token interface required by BLEND Protocol.
// The fungible balance aggregates all guarantee-specific balances for DeFi compatibility.

#[contractimpl]
impl GuaranteeTokenContract {
    // ═══════════════════════════════════════════════════════════════════════════
    // SEP-41 Standard Token Interface
    // ═══════════════════════════════════════════════════════════════════════════

    /// Initialize the contract with admin, name, symbol, and decimals
    pub fn initialize(env: Env, admin: Address, name: String, symbol: String) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
        env.storage().instance().set(&DataKey::Decimals, &7u32);
        env.storage().instance().set(&DataKey::GuaranteeCount, &0u64);
    }

    /// SEP-41: Get token name
    pub fn name(env: Env) -> String {
        env.storage().instance().get(&DataKey::Name).unwrap()
    }

    /// SEP-41: Get token symbol
    pub fn symbol(env: Env) -> String {
        env.storage().instance().get(&DataKey::Symbol).unwrap()
    }

    /// SEP-41: Get token decimals (7 = Stellar standard)
    pub fn decimals(_env: Env) -> u32 {
        7
    }

    /// SEP-41: Get total fungible balance of an address (aggregated across all guarantees)
    pub fn balance(env: Env, id: Address) -> i128 {
        let key = DataKey::Balance(id);
        env.storage().persistent().get(&key).unwrap_or(0i128)
    }

    /// SEP-41: Transfer tokens (fungible, no guarantee_id — for DeFi interoperability)
    /// Deducts from the sender's aggregate balance and credits the receiver.
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        if amount < 0 {
            panic!("Amount must be non-negative");
        }
        if amount == 0 {
            return;
        }

        // Deduct from sender's aggregate balance
        let from_key = DataKey::Balance(from.clone());
        let from_balance: i128 = env.storage().persistent().get(&from_key).unwrap_or(0i128);
        if from_balance < amount {
            panic!("Insufficient balance");
        }
        env.storage().persistent().set(&from_key, &(from_balance - amount));

        // Credit to receiver's aggregate balance
        let to_key = DataKey::Balance(to.clone());
        let to_balance: i128 = env.storage().persistent().get(&to_key).unwrap_or(0i128);
        env.storage().persistent().set(&to_key, &(to_balance + amount));

        // Emit standard transfer event
        env.events().publish(
            (String::from_str(&env, "transfer"), from, to),
            amount,
        );
    }

    /// SEP-41: Approve spender to spend tokens on behalf of owner
    pub fn approve(env: Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32) {
        from.require_auth();

        let key = DataKey::Allowance(AllowanceKey {
            owner: from.clone(),
            spender: spender.clone(),
        });
        let allowance = AllowanceData {
            amount,
            expiration_ledger,
        };
        env.storage().persistent().set(&key, &allowance);

        env.events().publish(
            (String::from_str(&env, "approve"), from, spender),
            (amount, expiration_ledger),
        );
    }

    /// SEP-41: Get current allowance
    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        let key = DataKey::Allowance(AllowanceKey {
            owner: from,
            spender,
        });
        let allowance: Option<AllowanceData> = env.storage().persistent().get(&key);
        match allowance {
            Some(a) => {
                if a.expiration_ledger < env.ledger().sequence() {
                    0i128
                } else {
                    a.amount
                }
            }
            None => 0i128,
        }
    }

    /// SEP-41: Transfer from (using allowance) — for DeFi protocols like BLEND
    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();

        if amount < 0 {
            panic!("Amount must be non-negative");
        }
        if amount == 0 {
            return;
        }

        // Check and update allowance
        let allowance_key = DataKey::Allowance(AllowanceKey {
            owner: from.clone(),
            spender: spender.clone(),
        });
        let allowance_data: AllowanceData = env
            .storage()
            .persistent()
            .get(&allowance_key)
            .unwrap_or(AllowanceData { amount: 0, expiration_ledger: 0 });

        if allowance_data.expiration_ledger < env.ledger().sequence() {
            panic!("Allowance expired");
        }
        if allowance_data.amount < amount {
            panic!("Insufficient allowance");
        }

        let new_allowance = AllowanceData {
            amount: allowance_data.amount - amount,
            expiration_ledger: allowance_data.expiration_ledger,
        };
        env.storage().persistent().set(&allowance_key, &new_allowance);

        // Perform transfer on aggregate balances
        let from_key = DataKey::Balance(from.clone());
        let from_balance: i128 = env.storage().persistent().get(&from_key).unwrap_or(0i128);
        if from_balance < amount {
            panic!("Insufficient balance");
        }
        env.storage().persistent().set(&from_key, &(from_balance - amount));

        let to_key = DataKey::Balance(to.clone());
        let to_balance: i128 = env.storage().persistent().get(&to_key).unwrap_or(0i128);
        env.storage().persistent().set(&to_key, &(to_balance + amount));

        env.events().publish(
            (String::from_str(&env, "transfer"), from, to),
            amount,
        );
    }

    /// SEP-41: Burn tokens from a holder's balance
    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();

        if amount < 0 {
            panic!("Amount must be non-negative");
        }
        if amount == 0 {
            return;
        }

        let key = DataKey::Balance(from.clone());
        let balance: i128 = env.storage().persistent().get(&key).unwrap_or(0i128);
        if balance < amount {
            panic!("Insufficient balance to burn");
        }
        env.storage().persistent().set(&key, &(balance - amount));

        env.events().publish(
            (String::from_str(&env, "burn"), from),
            amount,
        );
    }

    /// SEP-41: Burn from (using allowance)
    pub fn burn_from(env: Env, spender: Address, from: Address, amount: i128) {
        spender.require_auth();

        if amount < 0 {
            panic!("Amount must be non-negative");
        }
        if amount == 0 {
            return;
        }

        // Check and update allowance
        let allowance_key = DataKey::Allowance(AllowanceKey {
            owner: from.clone(),
            spender: spender.clone(),
        });
        let allowance_data: AllowanceData = env
            .storage()
            .persistent()
            .get(&allowance_key)
            .unwrap_or(AllowanceData { amount: 0, expiration_ledger: 0 });

        if allowance_data.expiration_ledger < env.ledger().sequence() {
            panic!("Allowance expired");
        }
        if allowance_data.amount < amount {
            panic!("Insufficient allowance");
        }

        let new_allowance = AllowanceData {
            amount: allowance_data.amount - amount,
            expiration_ledger: allowance_data.expiration_ledger,
        };
        env.storage().persistent().set(&allowance_key, &new_allowance);

        // Burn from balance
        let key = DataKey::Balance(from.clone());
        let balance: i128 = env.storage().persistent().get(&key).unwrap_or(0i128);
        if balance < amount {
            panic!("Insufficient balance to burn");
        }
        env.storage().persistent().set(&key, &(balance - amount));

        env.events().publish(
            (String::from_str(&env, "burn"), from),
            amount,
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Guarantee-specific functions (SGR-DIGI business logic)
    // ═══════════════════════════════════════════════════════════════════════════

    /// Mint new tokens for a guarantee (admin only)
    /// Updates both guarantee-specific and aggregate balances
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

        if env.storage().persistent().has(&guarantee_key) {
            panic!("Guarantee ID already exists");
        }

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

        // Update guarantee-specific balance
        let guarantee_balance_key = DataKey::GuaranteeBalance(to.clone(), guarantee_id);
        env.storage().persistent().set(&guarantee_balance_key, &amount);

        // Update aggregate balance (i128 for SEP-41 compatibility)
        let balance_key = DataKey::Balance(to.clone());
        let current_balance: i128 = env.storage().persistent().get(&balance_key).unwrap_or(0i128);
        env.storage().persistent().set(&balance_key, &(current_balance + amount as i128));

        // Increment guarantee count
        let count: u64 = env.storage().instance().get(&DataKey::GuaranteeCount).unwrap();
        env.storage().instance().set(&DataKey::GuaranteeCount, &(count + 1));

        env.events().publish(
            (String::from_str(&env, "mint"), to.clone()),
            (guarantee_id, amount),
        );

        guarantee_id
    }

    /// Transfer tokens for a specific guarantee (preserves per-guarantee tracking)
    pub fn transfer_guarantee(env: Env, from: Address, to: Address, guarantee_id: u64, amount: u64) {
        from.require_auth();

        if amount == 0 {
            panic!("Amount must be greater than 0");
        }

        let guarantee: GuaranteeInfo = env
            .storage()
            .persistent()
            .get(&DataKey::Guarantee(guarantee_id))
            .unwrap();

        if !guarantee.active {
            panic!("Guarantee is not active");
        }

        // Update guarantee-specific balances
        let from_guar_key = DataKey::GuaranteeBalance(from.clone(), guarantee_id);
        let from_guar_balance: u64 = env.storage().persistent().get(&from_guar_key).unwrap_or(0);
        if from_guar_balance < amount {
            panic!("Insufficient guarantee balance");
        }
        env.storage().persistent().set(&from_guar_key, &(from_guar_balance - amount));

        let to_guar_key = DataKey::GuaranteeBalance(to.clone(), guarantee_id);
        let to_guar_balance: u64 = env.storage().persistent().get(&to_guar_key).unwrap_or(0);
        env.storage().persistent().set(&to_guar_key, &(to_guar_balance + amount));

        // Update aggregate balances (i128)
        let from_key = DataKey::Balance(from.clone());
        let from_balance: i128 = env.storage().persistent().get(&from_key).unwrap_or(0i128);
        env.storage().persistent().set(&from_key, &(from_balance - amount as i128));

        let to_key = DataKey::Balance(to.clone());
        let to_balance: i128 = env.storage().persistent().get(&to_key).unwrap_or(0i128);
        env.storage().persistent().set(&to_key, &(to_balance + amount as i128));

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

    /// Redeem tokens (admin only)
    pub fn redeem(env: Env, holder: Address, guarantee_id: u64, amount: u64) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let guarantee_key = DataKey::Guarantee(guarantee_id);
        let mut guarantee: GuaranteeInfo = env.storage().persistent().get(&guarantee_key).unwrap();

        if !guarantee.active {
            panic!("Guarantee is not active");
        }

        let guar_balance_key = DataKey::GuaranteeBalance(holder.clone(), guarantee_id);
        let guar_balance: u64 = env.storage().persistent().get(&guar_balance_key).unwrap_or(0);

        if guar_balance < amount {
            panic!("Insufficient balance to redeem");
        }

        // Update guarantee-specific balance
        env.storage().persistent().set(&guar_balance_key, &(guar_balance - amount));

        // Update aggregate balance
        let total_key = DataKey::Balance(holder.clone());
        let total_balance: i128 = env.storage().persistent().get(&total_key).unwrap_or(0i128);
        env.storage().persistent().set(&total_key, &(total_balance - amount as i128));

        // Update guarantee info
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

    /// Get admin address
    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env, String};

    fn setup_contract(env: &Env) -> (GuaranteeTokenContractClient, Address, Address) {
        let contract_id = env.register_contract(None, GuaranteeTokenContract);
        let client = GuaranteeTokenContractClient::new(env, &contract_id);

        let admin = Address::generate(env);
        let user = Address::generate(env);

        client.initialize(
            &admin,
            &String::from_str(env, "AURA Guarantee"),
            &String::from_str(env, "AURA"),
        );

        (client, admin, user)
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let (client, admin, _) = setup_contract(&env);

        assert_eq!(client.name(), String::from_str(&env, "AURA Guarantee"));
        assert_eq!(client.symbol(), String::from_str(&env, "AURA"));
        assert_eq!(client.decimals(), 7);
        assert_eq!(client.admin(), admin);
    }

    #[test]
    fn test_mint_and_balance() {
        let env = Env::default();
        env.mock_all_auths();

        let (client, _, user) = setup_contract(&env);

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
        // Aggregate balance is i128
        assert_eq!(client.balance(&user), 1000i128);
    }

    #[test]
    fn test_sep41_transfer() {
        let env = Env::default();
        env.mock_all_auths();

        let (client, _, user1) = setup_contract(&env);
        let user2 = Address::generate(&env);

        // Mint tokens
        client.mint(
            &user1,
            &0,
            &1000,
            &String::from_str(&env, "SOJA"),
            &5000,
            &55000,
        );

        // SEP-41 fungible transfer (no guarantee_id)
        client.transfer(&user1, &user2, &300i128);

        assert_eq!(client.balance(&user1), 700i128);
        assert_eq!(client.balance(&user2), 300i128);
    }

    #[test]
    fn test_guarantee_transfer() {
        let env = Env::default();
        env.mock_all_auths();

        let (client, _, user1) = setup_contract(&env);
        let user2 = Address::generate(&env);

        client.mint(
            &user1,
            &0,
            &1000,
            &String::from_str(&env, "SOJA"),
            &5000,
            &55000,
        );

        // Guarantee-specific transfer
        client.transfer_guarantee(&user1, &user2, &0, &300);

        assert_eq!(client.balance_of(&user1, &0), 700);
        assert_eq!(client.balance_of(&user2, &0), 300);
        assert_eq!(client.balance(&user1), 700i128);
        assert_eq!(client.balance(&user2), 300i128);
    }

    #[test]
    fn test_burn() {
        let env = Env::default();
        env.mock_all_auths();

        let (client, _, user) = setup_contract(&env);

        client.mint(
            &user,
            &0,
            &1000,
            &String::from_str(&env, "SOJA"),
            &5000,
            &55000,
        );

        client.burn(&user, &400i128);

        assert_eq!(client.balance(&user), 600i128);
    }

    #[test]
    fn test_approve_and_transfer_from() {
        let env = Env::default();
        env.mock_all_auths();

        let (client, _, user1) = setup_contract(&env);
        let spender = Address::generate(&env);
        let user2 = Address::generate(&env);

        client.mint(
            &user1,
            &0,
            &1000,
            &String::from_str(&env, "SOJA"),
            &5000,
            &55000,
        );

        // Approve spender for 500 tokens with expiration far in the future
        client.approve(&user1, &spender, &500i128, &(env.ledger().sequence() + 1000));

        assert_eq!(client.allowance(&user1, &spender), 500i128);

        // Transfer from user1 to user2 via spender
        client.transfer_from(&spender, &user1, &user2, &300i128);

        assert_eq!(client.balance(&user1), 700i128);
        assert_eq!(client.balance(&user2), 300i128);
        assert_eq!(client.allowance(&user1, &spender), 200i128);
    }
}
