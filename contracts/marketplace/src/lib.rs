#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, IntoVal, String, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    TokenContract,
    PaymentToken,
    OfferCount,
    Offer(u64),                    // offer_id -> OfferInfo
    GuaranteeOffers(u64),         // guarantee_id -> Vec<offer_id>
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct OfferInfo {
    pub id: u64,
    pub seller: Address,
    pub guarantee_id: u64,
    pub amount: u64,
    pub price_per_token: u64,  // Price in payment token (e.g., USDC)
    pub remaining_amount: u64,
    pub active: bool,
}

#[contract]
pub struct MarketplaceContract;

#[contractimpl]
impl MarketplaceContract {
    /// Initialize the marketplace contract
    pub fn initialize(env: Env, token_contract: Address, payment_token: Address) {
        if env.storage().instance().has(&DataKey::TokenContract) {
            panic!("Already initialized");
        }

        env.storage().instance().set(&DataKey::TokenContract, &token_contract);
        env.storage().instance().set(&DataKey::PaymentToken, &payment_token);
        env.storage().instance().set(&DataKey::OfferCount, &0u64);
    }

    /// Create a sell offer
    pub fn create_sell_offer(
        env: Env,
        seller: Address,
        guarantee_id: u64,
        amount: u64,
        price_per_token: u64,
    ) -> u64 {
        seller.require_auth();

        if amount == 0 {
            panic!("Amount must be greater than 0");
        }

        if price_per_token == 0 {
            panic!("Price must be greater than 0");
        }

        // Get current offer count
        let offer_count: u64 = env.storage().instance().get(&DataKey::OfferCount).unwrap_or(0);
        let offer_id = offer_count;

        // Create new offer
        let offer = OfferInfo {
            id: offer_id,
            seller: seller.clone(),
            guarantee_id,
            amount,
            price_per_token,
            remaining_amount: amount,
            active: true,
        };

        // Store offer
        let offer_key = DataKey::Offer(offer_id);
        env.storage().persistent().set(&offer_key, &offer);

        // Update offer count
        env.storage().instance().set(&DataKey::OfferCount, &(offer_count + 1));

        // Add to guarantee offers list
        let guarantee_offers_key = DataKey::GuaranteeOffers(guarantee_id);
        let mut offers: Vec<u64> = env
            .storage()
            .persistent()
            .get(&guarantee_offers_key)
            .unwrap_or(Vec::new(&env));
        offers.push_back(offer_id);
        env.storage().persistent().set(&guarantee_offers_key, &offers);

        // Emit event
        env.events().publish(
            (String::from_str(&env, "create_offer"), seller),
            (offer_id, guarantee_id, amount, price_per_token),
        );

        offer_id
    }

    /// Buy tokens from an offer
    pub fn buy(env: Env, buyer: Address, offer_id: u64, amount: u64) {
        buyer.require_auth();

        if amount == 0 {
            panic!("Amount must be greater than 0");
        }

        // Get offer
        let offer_key = DataKey::Offer(offer_id);
        let mut offer: OfferInfo = env.storage().persistent().get(&offer_key).unwrap();

        if !offer.active {
            panic!("Offer is not active");
        }

        if offer.remaining_amount < amount {
            panic!("Insufficient offer amount");
        }

        // Calculate total price
        let total_price = amount * offer.price_per_token;

        // Get token contract
        let token_contract: Address = env.storage().instance().get(&DataKey::TokenContract).unwrap();

        // Get payment token (for future implementation with actual payment tokens)
        // let payment_token: Address = env.storage().instance().get(&DataKey::PaymentToken).unwrap();

        // Transfer guarantee tokens from seller to buyer
        // Note: In a real implementation, the tokens should be escrowed in the contract
        // For now, we assume the seller has approved the marketplace contract
        env.invoke_contract::<()>(
            &token_contract,
            &soroban_sdk::Symbol::new(&env, "transfer"),
            soroban_sdk::vec![
                &env,
                offer.seller.clone().into_val(&env),
                buyer.clone().into_val(&env),
                offer.guarantee_id.into_val(&env),
                amount.into_val(&env),
            ],
        );

        // In a complete implementation, transfer payment tokens from buyer to seller
        // env.invoke_contract::<()>(
        //     &payment_token,
        //     &soroban_sdk::Symbol::new(&env, "transfer"),
        //     soroban_sdk::vec![&env, buyer.clone(), offer.seller.clone(), total_price],
        // );

        // Update offer
        offer.remaining_amount -= amount;
        if offer.remaining_amount == 0 {
            offer.active = false;
        }
        env.storage().persistent().set(&offer_key, &offer);

        // Emit event
        env.events().publish(
            (String::from_str(&env, "buy"), buyer, offer.seller.clone()),
            (offer_id, amount, total_price),
        );
    }

    /// Cancel an offer
    pub fn cancel_offer(env: Env, seller: Address, offer_id: u64) {
        seller.require_auth();

        let offer_key = DataKey::Offer(offer_id);
        let mut offer: OfferInfo = env.storage().persistent().get(&offer_key).unwrap();

        if offer.seller != seller {
            panic!("Only seller can cancel offer");
        }

        if !offer.active {
            panic!("Offer is not active");
        }

        offer.active = false;
        env.storage().persistent().set(&offer_key, &offer);

        env.events().publish(
            (String::from_str(&env, "cancel_offer"), seller),
            offer_id,
        );
    }

    /// Get offer info
    pub fn get_offer(env: Env, offer_id: u64) -> OfferInfo {
        let key = DataKey::Offer(offer_id);
        env.storage().persistent().get(&key).unwrap()
    }

    /// Get offers by guarantee ID
    pub fn get_offers_by_guarantee(env: Env, guarantee_id: u64) -> Vec<OfferInfo> {
        let guarantee_offers_key = DataKey::GuaranteeOffers(guarantee_id);
        let offer_ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&guarantee_offers_key)
            .unwrap_or(Vec::new(&env));

        let mut offers = Vec::new(&env);
        for i in 0..offer_ids.len() {
            let offer_id = offer_ids.get(i).unwrap();
            let offer_key = DataKey::Offer(offer_id);
            if let Some(offer) = env.storage().persistent().get::<DataKey, OfferInfo>(&offer_key) {
                offers.push_back(offer);
            }
        }

        offers
    }

    /// Get all active offers
    pub fn get_all_offers(env: Env) -> Vec<OfferInfo> {
        let offer_count: u64 = env.storage().instance().get(&DataKey::OfferCount).unwrap_or(0);
        let mut offers = Vec::new(&env);

        for i in 0..offer_count {
            let key = DataKey::Offer(i);
            if let Some(offer) = env.storage().persistent().get::<DataKey, OfferInfo>(&key) {
                if offer.active {
                    offers.push_back(offer);
                }
            }
        }

        offers
    }

    /// Get token contract address
    pub fn token_contract(env: Env) -> Address {
        env.storage().instance().get(&DataKey::TokenContract).unwrap()
    }

    /// Get payment token address
    pub fn payment_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::PaymentToken).unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, MarketplaceContract);
        let client = MarketplaceContractClient::new(&env, &contract_id);

        let token_contract = Address::generate(&env);
        let payment_token = Address::generate(&env);

        client.initialize(&token_contract, &payment_token);

        assert_eq!(client.token_contract(), token_contract);
        assert_eq!(client.payment_token(), payment_token);
    }

    #[test]
    fn test_create_offer() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, MarketplaceContract);
        let client = MarketplaceContractClient::new(&env, &contract_id);

        let token_contract = Address::generate(&env);
        let payment_token = Address::generate(&env);
        let seller = Address::generate(&env);

        client.initialize(&token_contract, &payment_token);

        let offer_id = client.create_sell_offer(&seller, &0, &1000, &100);

        assert_eq!(offer_id, 0);

        let offer = client.get_offer(&offer_id);
        assert_eq!(offer.seller, seller);
        assert_eq!(offer.guarantee_id, 0);
        assert_eq!(offer.amount, 1000);
        assert_eq!(offer.price_per_token, 100);
        assert_eq!(offer.remaining_amount, 1000);
        assert_eq!(offer.active, true);
    }

    #[test]
    fn test_cancel_offer() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, MarketplaceContract);
        let client = MarketplaceContractClient::new(&env, &contract_id);

        let token_contract = Address::generate(&env);
        let payment_token = Address::generate(&env);
        let seller = Address::generate(&env);

        client.initialize(&token_contract, &payment_token);

        let offer_id = client.create_sell_offer(&seller, &0, &1000, &100);

        client.cancel_offer(&seller, &offer_id);

        let offer = client.get_offer(&offer_id);
        assert_eq!(offer.active, false);
    }
}
