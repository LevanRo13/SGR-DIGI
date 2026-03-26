# Plan de Contratos Soroban — SGR-DIGI Hackathon

## Contexto

**Objetivo**: Tokenizar avales de exportación y commodities para PyMEs argentinas usando Soroban (Stellar smart contracts).

**Restricción**: Hackathon requiere uso obligatorio de Soroban (no transacciones clásicas).

**Timeline**: 20 horas de desarrollo efectivo con spec programming + agentes IA.

---

## Problema a Resolver

Las SGR (Sociedades de Garantía Recíproca) emiten avales para que PyMEs exporten commodities (soja, trigo, maíz). Estos avales:
- Son ilíquidos (no se pueden vender antes del cobro)
- Requieren capital inmovilizado por meses
- No permiten inversión fraccionada
- Dificultan el acceso a crédito

**Solución DeFi**: Tokenizar avales → crear mercado secundario → liquidez inmediata.

---

## Casos de Uso

### 1. **Tokenización de Aval**
- PyME necesita exportar 100 tons de soja ($310,000 USD)
- SGR emite aval → contrato Soroban emite 310,000 tokens AVAL-001
- 1 token = 1 USD de garantía respaldada
- PyME recibe liquidez inmediata vendiendo tokens

### 2. **Mercado Secundario**
- Inversor A compra 50,000 tokens AVAL-001 al 100%
- Necesita cash → vende en marketplace al 95% (descuento por liquidez)
- Inversor B compra con descuento
- Trading P2P sin intermediarios bancarios

### 3. **Propiedad Fraccionada**
- Warrant de 1000 tons de trigo ($300,000)
- 300,000 tokens → cualquiera puede invertir desde $10
- Democratización del acceso a commodities

### 4. **Colateral DeFi** (Mock UI)
- Holder con 100,000 tokens WARRANT-002
- Los usa como colateral para pedir prestado 70,000 USDC
- Sin vender sus tokens, obtiene liquidez

---

## Arquitectura Técnica

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│  - Dashboard de garantías                                │
│  - Marketplace de tokens                                 │
│  - Mocks visuales (Lending, Staking, Oracle)            │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────────┐
│              BACKEND (NestJS + TypeScript)               │
│  - API REST para frontend                                │
│  - Integración con Stellar RPC                           │
│  - Invoke Soroban contracts                              │
│  - Persistencia local (operations.json)                  │
└───────────────────────┬─────────────────────────────────┘
                        │ Stellar RPC
┌───────────────────────▼─────────────────────────────────┐
│           SOROBAN SMART CONTRACTS (Rust)                 │
│  1. GuaranteeToken — Token ERC-20 respaldado            │
│  2. Marketplace — Trading P2P on-chain                   │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              STELLAR TESTNET BLOCKCHAIN                  │
│  - Soroban runtime (WASM)                                │
│  - Storage on-chain                                      │
│  - Event logs                                            │
└─────────────────────────────────────────────────────────┘
```

---

## Contratos Soroban a Implementar

### 1. GuaranteeToken Contract

**Archivo**: `contracts/guarantee-token/src/lib.rs`

**Responsabilidades**:
- Emitir tokens ERC-20 respaldados por avales/warrants
- Almacenar metadata on-chain (tipo, cantidad, commodity, peso)
- Permitir transferencias estándar
- Quemar tokens al redimir garantía

**Funciones públicas**:

```rust
#![no_std]
use soroban_sdk::*;

#[contract]
pub struct GuaranteeToken;

#[contractimpl]
impl GuaranteeToken {
    /// Constructor - inicializa el contrato
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
    );

    /// Emitir tokens para una nueva garantía
    /// @param to: dirección del beneficiario
    /// @param guarantee_id: ID único de la garantía (ej: "AVAL-20260326-001")
    /// @param amount: cantidad de tokens a emitir (1 token = 1 USD)
    /// @param commodity_type: tipo de commodity ("SOJA", "TRIGO", "MAIZ", "WARRANT")
    /// @param weight_kg: peso en kilogramos del commodity
    /// @param value_usd: valor total en USD
    pub fn mint(
        env: Env,
        to: Address,
        guarantee_id: String,
        amount: i128,
        commodity_type: String,
        weight_kg: i128,
        value_usd: i128,
    ) -> Result<(), Error>;

    /// Transferir tokens entre cuentas
    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        amount: i128
    ) -> Result<(), Error>;

    /// Consultar balance de una cuenta
    pub fn balance(env: Env, address: Address) -> i128;

    /// Aprobar a un spender para gastar tokens
    pub fn approve(
        env: Env,
        owner: Address,
        spender: Address,
        amount: i128
    ) -> Result<(), Error>;

    /// Consultar allowance
    pub fn allowance(env: Env, owner: Address, spender: Address) -> i128;

    /// Quemar tokens al redimir la garantía
    /// @param holder: quien quema los tokens
    /// @param guarantee_id: ID de la garantía
    /// @param amount: cantidad a quemar
    /// @return: valor en USD redimido
    pub fn redeem(
        env: Env,
        holder: Address,
        guarantee_id: String,
        amount: i128,
    ) -> Result<i128, Error>;

    /// Obtener información detallada de una garantía
    pub fn get_guarantee_info(
        env: Env,
        guarantee_id: String
    ) -> GuaranteeInfo;

    /// Listar todas las garantías activas
    pub fn get_all_guarantees(env: Env) -> Vec<String>;
}

/// Metadata de una garantía
#[contracttype]
pub struct GuaranteeInfo {
    pub id: String,
    pub commodity_type: String,
    pub weight_kg: i128,
    pub value_usd: i128,
    pub total_supply: i128,
    pub redeemed: i128,
    pub creator: Address,
    pub timestamp: u64,
}

/// Errores del contrato
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotAuthorized = 1,
    InsufficientBalance = 2,
    GuaranteeNotFound = 3,
    GuaranteeAlreadyExists = 4,
    InvalidAmount = 5,
    AlreadyRedeemed = 6,
}
```

**Storage keys**:
- `Balance:{address}` → saldo de tokens
- `Allowance:{owner}:{spender}` → permisos de gasto
- `Guarantee:{guarantee_id}` → metadata de garantía
- `GuaranteeList` → array de IDs de garantías
- `Admin` → dirección del administrador

---

### 2. Marketplace Contract

**Archivo**: `contracts/marketplace/src/lib.rs`

**Responsabilidades**:
- Crear ofertas de venta de tokens (sell orders)
- Ejecutar compras (match buyers con sellers)
- Escrow automático de tokens y pagos
- Cancelar ofertas

**Funciones públicas**:

```rust
#![no_std]
use soroban_sdk::*;

#[contract]
pub struct Marketplace;

#[contractimpl]
impl Marketplace {
    /// Constructor
    pub fn initialize(
        env: Env,
        token_contract: Address,
        payment_token: Address,  // USDC o XLM
    );

    /// Crear oferta de venta
    /// @param seller: quien vende los tokens
    /// @param guarantee_id: ID de la garantía tokenizada
    /// @param amount: cantidad de tokens a vender
    /// @param price_per_token: precio unitario en payment_token (ej: USDC)
    /// @return: offer_id único
    pub fn create_sell_offer(
        env: Env,
        seller: Address,
        guarantee_id: String,
        amount: i128,
        price_per_token: i128,
    ) -> Result<u64, Error>;

    /// Comprar tokens de una oferta existente
    /// @param buyer: quien compra
    /// @param offer_id: ID de la oferta
    /// @param amount: cantidad de tokens a comprar (puede ser parcial)
    pub fn buy(
        env: Env,
        buyer: Address,
        offer_id: u64,
        amount: i128,
    ) -> Result<(), Error>;

    /// Cancelar una oferta de venta
    pub fn cancel_offer(
        env: Env,
        seller: Address,
        offer_id: u64,
    ) -> Result<(), Error>;

    /// Obtener detalles de una oferta
    pub fn get_offer(env: Env, offer_id: u64) -> Option<Offer>;

    /// Listar todas las ofertas activas para una garantía
    pub fn get_offers_by_guarantee(
        env: Env,
        guarantee_id: String
    ) -> Vec<Offer>;

    /// Listar todas las ofertas activas
    pub fn get_all_offers(env: Env) -> Vec<Offer>;

    /// Historial de trades ejecutados
    pub fn get_trade_history(
        env: Env,
        guarantee_id: String
    ) -> Vec<Trade>;
}

#[contracttype]
pub struct Offer {
    pub offer_id: u64,
    pub seller: Address,
    pub guarantee_id: String,
    pub amount: i128,
    pub price_per_token: i128,
    pub created_at: u64,
    pub is_active: bool,
}

#[contracttype]
pub struct Trade {
    pub trade_id: u64,
    pub offer_id: u64,
    pub seller: Address,
    pub buyer: Address,
    pub guarantee_id: String,
    pub amount: i128,
    pub price_per_token: i128,
    pub total_value: i128,
    pub timestamp: u64,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotAuthorized = 1,
    OfferNotFound = 2,
    InsufficientTokens = 3,
    InsufficientPayment = 4,
    OfferAlreadyCanceled = 5,
    InvalidAmount = 6,
}
```

**Storage keys**:
- `Offer:{offer_id}` → datos de la oferta
- `OffersByGuarantee:{guarantee_id}` → array de offer_ids
- `AllOffers` → array de todos los offer_ids activos
- `TradeHistory:{guarantee_id}` → array de trades
- `NextOfferId` → contador incremental

---

## Integración Backend (NestJS)

### Actualizar StellarService para Soroban

**Archivo**: `backend/src/stellar/stellar.service.ts`

```typescript
import * as StellarSdk from '@stellar/stellar-sdk';

@Injectable()
export class StellarService implements OnModuleInit {
  private rpc: StellarSdk.rpc.Server;
  private keypair: StellarSdk.Keypair;
  private guaranteeTokenContract: StellarSdk.Contract;
  private marketplaceContract: StellarSdk.Contract;

  async onModuleInit() {
    // Cambiar de Horizon a RPC
    this.rpc = new StellarSdk.rpc.Server(
      'https://soroban-testnet.stellar.org'
    );

    // Cargar o generar keypair (mismo flujo que antes)
    await this.loadOrCreateKeypair();

    // Inicializar contratos
    const guaranteeTokenId = this.configService.get('GUARANTEE_TOKEN_CONTRACT_ID');
    const marketplaceId = this.configService.get('MARKETPLACE_CONTRACT_ID');

    this.guaranteeTokenContract = new StellarSdk.Contract(guaranteeTokenId);
    this.marketplaceContract = new StellarSdk.Contract(marketplaceId);
  }

  /**
   * Crear garantía Y emitir tokens on-chain
   */
  async createGuarantee(dto: CreateGuaranteeDto): Promise<Operation> {
    const operationId = this.operationsRepository.generateId();
    const shortId = uuidv4().slice(0, 8).toUpperCase();
    const guaranteeId = `AURA-${shortId}`;

    // 1. Guardar metadata local
    const operation: Operation = {
      id: operationId,
      tipo: dto.tipo,
      cantidad: dto.cantidad,
      valor: dto.valor,
      aval: dto.aval,
      estado: 'pending',
      timestamp: new Date().toISOString(),
      memoText: guaranteeId,
      network: 'Stellar Testnet (Soroban)',
    };
    this.operationsRepository.save(operation);

    try {
      this.operationsRepository.updateStatus(operationId, 'submitted');

      // 2. Cargar account para sequence number
      const account = await this.rpc.getAccount(this.keypair.publicKey());
      const sourceAccount = new StellarSdk.Account(
        account.accountId(),
        account.sequenceNumber()
      );

      // 3. Construir invocación al contrato
      const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          this.guaranteeTokenContract.call(
            'mint',
            StellarSdk.nativeToScVal(this.keypair.publicKey(), {type: 'address'}),
            StellarSdk.nativeToScVal(guaranteeId, {type: 'string'}),
            StellarSdk.nativeToScVal(dto.aval, {type: 'i128'}),
            StellarSdk.nativeToScVal(dto.tipo, {type: 'string'}),
            StellarSdk.nativeToScVal(dto.cantidad, {type: 'i128'}),
            StellarSdk.nativeToScVal(dto.valor, {type: 'i128'}),
          )
        )
        .setTimeout(30)
        .build();

      // 4. Simular transacción
      const simulated = await this.rpc.simulateTransaction(tx);

      if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
        throw new Error(`Simulation failed: ${simulated.error}`);
      }

      // 5. Preparar con footprint y resources
      const prepared = StellarSdk.SorobanRpc.assembleTransaction(
        tx,
        simulated
      ).build();

      prepared.sign(this.keypair);

      // 6. Enviar transacción
      const response = await this.rpc.sendTransaction(prepared);

      if (response.status === 'PENDING') {
        // 7. Poll hasta confirmación
        const result = await this.pollForResult(response.hash);

        if (result.status === 'SUCCESS') {
          const txHash = response.hash;
          const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${txHash}`;

          return this.operationsRepository.updateStatus(operationId, 'confirmed', {
            txHash,
            explorerUrl,
          })!;
        } else {
          throw new Error(`Transaction failed: ${result.status}`);
        }
      }
    } catch (error) {
      const errorMsg = this.parseError(error);
      this.operationsRepository.updateStatus(operationId, 'failed', {
        error: errorMsg,
      });
      throw new Error(errorMsg);
    }
  }

  /**
   * Poll RPC hasta que la TX se confirme
   */
  private async pollForResult(hash: string, maxAttempts = 30): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.rpc.getTransaction(hash);

      if (result.status !== 'NOT_FOUND') {
        return result;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error('Transaction timeout');
  }

  /**
   * Crear oferta de venta en marketplace
   */
  async createOffer(
    guaranteeId: string,
    amount: number,
    pricePerToken: number
  ): Promise<any> {
    const account = await this.rpc.getAccount(this.keypair.publicKey());
    const sourceAccount = new StellarSdk.Account(
      account.accountId(),
      account.sequenceNumber()
    );

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        this.marketplaceContract.call(
          'create_sell_offer',
          StellarSdk.nativeToScVal(this.keypair.publicKey(), {type: 'address'}),
          StellarSdk.nativeToScVal(guaranteeId, {type: 'string'}),
          StellarSdk.nativeToScVal(amount, {type: 'i128'}),
          StellarSdk.nativeToScVal(pricePerToken, {type: 'i128'}),
        )
      )
      .setTimeout(30)
      .build();

    const simulated = await this.rpc.simulateTransaction(tx);
    const prepared = StellarSdk.SorobanRpc.assembleTransaction(tx, simulated).build();
    prepared.sign(this.keypair);

    const response = await this.rpc.sendTransaction(prepared);
    const result = await this.pollForResult(response.hash);

    return {
      txHash: response.hash,
      offerId: result.returnValue, // El contrato retorna offer_id
    };
  }

  /**
   * Leer ofertas activas desde on-chain
   */
  async getOffers(guaranteeId: string): Promise<any[]> {
    // Leer storage del contrato
    const key = StellarSdk.xdr.LedgerKey.contractData(
      new StellarSdk.xdr.LedgerKeyContractData({
        contract: new StellarSdk.Address(
          this.marketplaceContract.contractId()
        ).toScAddress(),
        key: StellarSdk.xdr.ScVal.scvVec([
          StellarSdk.xdr.ScVal.scvSymbol('OffersByGuarantee'),
          StellarSdk.nativeToScVal(guaranteeId, {type: 'string'}),
        ]),
        durability: StellarSdk.xdr.ContractDataDurability.persistent(),
      })
    );

    const entries = await this.rpc.getLedgerEntries(key);

    if (entries.entries.length === 0) {
      return [];
    }

    const offerIds = StellarSdk.scValToNative(
      entries.entries[0].val.contractData().val()
    );

    // Para cada offer_id, leer su data
    // (simplificado - en producción usar batch reads)
    const offers = [];
    for (const offerId of offerIds) {
      const offerData = await this.getOfferById(offerId);
      offers.push(offerData);
    }

    return offers;
  }

  async getOfferById(offerId: number): Promise<any> {
    // Similar a getOffers pero con key "Offer:{offerId}"
    // ...
  }
}
```

### Nuevos Endpoints

**Archivo**: `backend/src/stellar/stellar.controller.ts`

```typescript
@Controller()
export class StellarController {
  constructor(private readonly stellarService: StellarService) {}

  // ... endpoints existentes ...

  /**
   * Crear oferta de venta
   */
  @Post('marketplace/offer')
  async createOffer(@Body() dto: CreateOfferDto) {
    const result = await this.stellarService.createOffer(
      dto.guaranteeId,
      dto.amount,
      dto.pricePerToken
    );
    return { success: true, data: result };
  }

  /**
   * Listar ofertas activas
   */
  @Get('marketplace/offers/:guaranteeId')
  async getOffers(@Param('guaranteeId') guaranteeId: string) {
    const offers = await this.stellarService.getOffers(guaranteeId);
    return { success: true, data: offers };
  }

  /**
   * Comprar tokens de una oferta
   */
  @Post('marketplace/buy')
  async buyTokens(@Body() dto: BuyTokensDto) {
    // Similar flow invocando marketplace.buy()
  }
}
```

---

## Componentes Mockeados (Frontend)

Para acelerar desarrollo, estos componentes se simulan visualmente sin contratos Soroban:

### 1. **Oracle de Precios**

```typescript
// lib/mock-oracle.ts
export const COMMODITY_PRICES = {
  SOJA: 550.00,   // USD/ton
  TRIGO: 280.00,
  MAIZ: 210.00,
  WARRANT: 1.00,  // valor fijo
};

export function getCommodityPrice(type: string): number {
  return COMMODITY_PRICES[type] || 1.00;
}

export function getGuaranteeValue(
  type: string,
  weightKg: number
): number {
  const pricePerTon = getCommodityPrice(type);
  return (weightKg / 1000) * pricePerTon;
}
```

### 2. **Lending Simulator**

```typescript
// components/LendingSimulator.tsx
export function LendingSimulator({ tokens, price }) {
  const collateralValue = tokens * price;
  const LTV_RATIO = 0.70; // 70% loan-to-value
  const APR = 8.5;

  const maxLoan = collateralValue * LTV_RATIO;
  const monthlyInterest = (maxLoan * APR / 100) / 12;

  return (
    <div className="lending-card">
      <h3>🏦 Préstamo con Colateral</h3>
      <div>
        <label>Tu colateral:</label>
        <span>{tokens.toLocaleString()} tokens (${collateralValue.toLocaleString()})</span>
      </div>
      <div>
        <label>Puedes pedir prestado:</label>
        <span className="highlight">${maxLoan.toLocaleString()} USDC</span>
      </div>
      <div>
        <label>Tasa de interés:</label>
        <span>{APR}% APR (${monthlyInterest.toFixed(2)}/mes)</span>
      </div>
      <button className="btn-primary" disabled>
        Solicitar Préstamo (Mock)
      </button>
      <small>* Funcionalidad simulada para la demo</small>
    </div>
  );
}
```

### 3. **Staking Calculator**

```typescript
// components/StakingCalculator.tsx
export function StakingCalculator({ tokens }) {
  const APY = 12; // 12% anual
  const dailyRate = APY / 365 / 100;

  const calculateYield = (days: number) => {
    return tokens * dailyRate * days;
  };

  return (
    <div className="staking-card">
      <h3>🔒 Staking de Tokens</h3>
      <p>Bloquea tus tokens y gana recompensas</p>

      <div className="yield-preview">
        <div>
          <span>30 días:</span>
          <strong>+{calculateYield(30).toFixed(2)} tokens</strong>
        </div>
        <div>
          <span>90 días:</span>
          <strong>+{calculateYield(90).toFixed(2)} tokens</strong>
        </div>
        <div>
          <span>180 días:</span>
          <strong>+{calculateYield(180).toFixed(2)} tokens</strong>
        </div>
      </div>

      <button className="btn-primary" disabled>
        Comenzar Staking (Mock)
      </button>
      <small>* APY simulado: {APY}%</small>
    </div>
  );
}
```

---

## Timeline de Ejecución (20 horas)

### Sprint 1: Contratos Soroban (10 hrs)

| Tiempo | Tarea | Output |
|--------|-------|--------|
| 0-3h | Setup Rust + Soroban SDK + inicializar proyecto | `guarantee-token/` y `marketplace/` creados |
| 3-6h | Implementar GuaranteeToken contract completo | `lib.rs` con mint/transfer/redeem/balance |
| 6-8h | Testing unitario GuaranteeToken con `cargo test` | Tests pasando |
| 8-10h | Implementar Marketplace contract | `lib.rs` con create_offer/buy/cancel |

**Comando para iniciar**:
```bash
stellar contract init guarantee-token
stellar contract init marketplace
```

### Sprint 2: Deploy + Backend Integration (6 hrs)

| Tiempo | Tarea | Output |
|--------|-------|--------|
| 10-11h | Build contratos + deploy a Testnet | Contract IDs guardados en `.env` |
| 11-12h | Testing manual con Stellar CLI | TXs confirmadas en explorer |
| 12-15h | Actualizar NestJS para invocar contratos | Endpoints funcionando |

**Comandos de deploy**:
```bash
stellar contract build
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/guarantee_token.wasm --network testnet
```

### Sprint 3: Frontend + Mocks (4 hrs)

| Tiempo | Tarea | Output |
|--------|-------|--------|
| 15-17h | UI para mint/marketplace | Pantallas funcionales |
| 17-18h | Mocks visuales (lending, staking, oracle) | Dashboards completos |
| 18-19h | Integración e2e | Flow completo funcionando |
| 19-20h | Testing final + video demo | Entregable listo |

---

## Entregables para Hackathon

### 1. **Contratos Desplegados**
- ✅ GuaranteeToken contract en Testnet
- ✅ Marketplace contract en Testnet
- ✅ Contract IDs públicos y verificables

### 2. **Backend Funcional**
- ✅ API REST que invoca contratos Soroban
- ✅ Endpoints documentados
- ✅ Persistencia local de operaciones

### 3. **Frontend Demo**
- ✅ Dashboard de garantías tokenizadas
- ✅ Marketplace de compra/venta
- ✅ Mocks visuales de DeFi (lending, staking, oracle)

### 4. **Evidencia On-Chain**
- ✅ TX hashes de mint verificables en explorer
- ✅ TX hashes de trades verificables
- ✅ Storage on-chain consultable

### 5. **Documentación**
- ✅ README con instrucciones de uso
- ✅ Video demo (3-5 min) del flujo E2E
- ✅ Casos de uso específicos para Argentina

---

## Testing y Validación

### Testing de Contratos (Rust)

```bash
cd contracts/guarantee-token
cargo test

cd ../marketplace
cargo test
```

### Testing de Integración (curl)

```bash
# 1. Health check
curl http://localhost:3000/stellar/health

# 2. Crear garantía (mint tokens)
curl -X POST http://localhost:3000/guarantee \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "SOJA",
    "cantidad": 100000,
    "valor": 550000,
    "aval": 550000,
    "operatorConfirmed": true
  }'

# 3. Crear oferta de venta
curl -X POST http://localhost:3000/marketplace/offer \
  -H "Content-Type: application/json" \
  -d '{
    "guaranteeId": "AURA-ABC123",
    "amount": 50000,
    "pricePerToken": 0.95
  }'

# 4. Listar ofertas
curl http://localhost:3000/marketplace/offers/AURA-ABC123
```

### Verificación en Blockchain

1. Copiar TX hash del response
2. Abrir https://stellar.expert/explorer/testnet/tx/{TX_HASH}
3. Verificar:
   - ✅ Estado: SUCCESS
   - ✅ Operación: invoke contract
   - ✅ Contract ID correcto
   - ✅ Events emitidos

---

## Variables de Entorno

**Archivo**: `backend/.env`

```env
# Network
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Contracts (actualizar después del deploy)
GUARANTEE_TOKEN_CONTRACT_ID=CBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MARKETPLACE_CONTRACT_ID=CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Wallet (auto-generada en data/stellar-keypair.json si no existe)
STELLAR_SECRET_KEY=

# Server
PORT=3000
```

---

## Casos de Uso para la Demo

### Flujo 1: PyME exportadora

1. PyME "Agro Sur" necesita exportar 500 tons de soja ($275,000)
2. SGR emite aval → backend invoca `mint()` en GuaranteeToken
3. Se emiten 275,000 tokens AVAL-001
4. PyME vende 200,000 tokens en marketplace al 97%
5. Recibe $194,000 de liquidez inmediata
6. Cuando cobra la exportación, canjea los 75,000 tokens restantes

### Flujo 2: Inversor retail

1. Inversor con $1,000 quiere invertir en commodities
2. Ve warrant de trigo tokenizado en marketplace
3. Compra 1,000 tokens al 95% del valor nominal
4. Precio del trigo sube 10% en 3 meses
5. Vende tokens con ganancia o espera redención final

### Flujo 3: Colateral para préstamo (Mock UI)

1. Holder tiene 100,000 tokens WARRANT-002 ($100k)
2. Usa simulador de lending: LTV 70% → puede pedir $70k
3. UI muestra tasa 8.5% APR, pago mensual $490
4. (Para MVP solo visual, sin contrato de lending real)

---

## Próximos Pasos (Post-Hackathon)

Si el proyecto continúa después de la hackathon:

### Fase 2: Lending Real
- Implementar contrato de lending Soroban
- Liquidaciones automáticas
- Integración con oracles reales (Switchboard, DIA)

### Fase 3: Governance
- Token AURA para votaciones
- Propuestas on-chain
- Treasury management

### Fase 4: Mainnet
- Auditoría de contratos
- Deploy a producción
- Integración con SGR real
- Framework regulatorio (CNV Argentina)

---

## Recursos

### Documentación
- [Soroban Docs](https://developers.stellar.org/docs/build/smart-contracts)
- [Stellar SDK TypeScript](https://github.com/stellar/js-stellar-sdk)
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli)

### Herramientas
- [Stellar Expert](https://stellar.expert/explorer/testnet) — Block explorer
- [Stellar Laboratory](https://laboratory.stellar.org/) — Testing playground
- [Soroban RPC Providers](https://developers.stellar.org/docs/data/apis/rpc/providers)

### Ejemplos
- [Token Example](https://github.com/stellar/soroban-examples/tree/main/token)
- [Liquidity Pool](https://github.com/stellar/soroban-examples/tree/main/liquidity_pool)

---

## Notas Finales

- **Prioridad 1**: Contratos funcionando y desplegados
- **Prioridad 2**: Backend invocando contratos correctamente
- **Prioridad 3**: UI/UX pulido y mocks visuales

**Regla de oro**: Es mejor tener mint + marketplace funcionando al 100% que tener 5 features a medio hacer.

---

*Documento generado para hackathon SGR-DIGI — Marzo 2026*
