#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

/// Storage keys for the oracle contract
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    /// Price data keyed by asset contract address
    Price(Address),
}

/// Price data returned by the oracle
/// Compatible with the BLEND Protocol oracle interface
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct PriceData {
    pub price: i128,     // Price in base units (14 decimals for USD parity)
    pub timestamp: u64,  // Unix timestamp of the price update
}

#[contract]
pub struct CommodityOracleContract;

#[contractimpl]
impl CommodityOracleContract {
    /// Initialize the oracle with an admin address
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Set the price for an asset (admin only)
    ///
    /// # Arguments
    /// * `asset` - The contract address of the asset
    /// * `price` - Price in base units (e.g., 10_000_000 = $1 with 7 decimals)
    /// * `timestamp` - Unix timestamp of the price observation
    pub fn set_price(env: Env, asset: Address, price: i128, timestamp: u64) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        if price <= 0 {
            panic!("Price must be positive");
        }

        let price_data = PriceData { price, timestamp };
        env.storage()
            .persistent()
            .set(&DataKey::Price(asset), &price_data);
    }

    /// Get the last price for an asset
    /// This is the function BLEND Protocol calls: `lastprice(asset) -> Option<PriceData>`
    ///
    /// # Returns
    /// `Some(PriceData)` if a price exists, `None` otherwise
    pub fn lastprice(env: Env, asset: Address) -> Option<PriceData> {
        env.storage()
            .persistent()
            .get(&DataKey::Price(asset))
    }

    /// Get the admin address
    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    /// Update admin (current admin only)
    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }

    /// Get the number of decimals used for prices (informational)
    pub fn decimals(_env: Env) -> u32 {
        7
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    fn setup(env: &Env) -> (CommodityOracleContractClient, Address) {
        let contract_id = env.register_contract(None, CommodityOracleContract);
        let client = CommodityOracleContractClient::new(env, &contract_id);

        let admin = Address::generate(env);
        client.initialize(&admin);

        (client, admin)
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        assert_eq!(client.admin(), admin);
        assert_eq!(client.decimals(), 7);
    }

    #[test]
    fn test_set_and_get_price() {
        let env = Env::default();
        env.mock_all_auths();

        let (client, _admin) = setup(&env);
        let asset = Address::generate(&env);

        // Set AURA price to ~$1 USD (10_000_000 with 7 decimals)
        client.set_price(&asset, &10_000_000i128, &1700000000u64);

        let price = client.lastprice(&asset);
        assert!(price.is_some());

        let price_data = price.unwrap();
        assert_eq!(price_data.price, 10_000_000i128);
        assert_eq!(price_data.timestamp, 1700000000u64);
    }

    #[test]
    fn test_no_price_returns_none() {
        let env = Env::default();
        let (client, _admin) = setup(&env);
        let unknown_asset = Address::generate(&env);

        let price = client.lastprice(&unknown_asset);
        assert!(price.is_none());
    }

    #[test]
    fn test_update_price() {
        let env = Env::default();
        env.mock_all_auths();

        let (client, _admin) = setup(&env);
        let asset = Address::generate(&env);

        // Set initial price
        client.set_price(&asset, &10_000_000i128, &1700000000u64);

        // Update price
        client.set_price(&asset, &12_000_000i128, &1700003600u64);

        let price_data = client.lastprice(&asset).unwrap();
        assert_eq!(price_data.price, 12_000_000i128);
        assert_eq!(price_data.timestamp, 1700003600u64);
    }

    #[test]
    fn test_multiple_assets() {
        let env = Env::default();
        env.mock_all_auths();

        let (client, _admin) = setup(&env);
        let aura = Address::generate(&env);
        let xlm = Address::generate(&env);

        // AURA: $1 USD
        client.set_price(&aura, &10_000_000i128, &1700000000u64);
        // XLM: $0.10 USD
        client.set_price(&xlm, &1_000_000i128, &1700000000u64);

        let aura_price = client.lastprice(&aura).unwrap();
        let xlm_price = client.lastprice(&xlm).unwrap();

        assert_eq!(aura_price.price, 10_000_000i128);
        assert_eq!(xlm_price.price, 1_000_000i128);
    }
}
