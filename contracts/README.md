# Contratos Soroban - SGR-DIGI

Este directorio contiene los smart contracts Soroban (Stellar) para el sistema de tokenización de garantías.

## Contratos

### 1. GuaranteeToken
Contrato de token personalizado que representa garantías de commodities tokenizadas.

**Funcionalidades:**
- `initialize`: Inicializar el contrato con admin, nombre y símbolo
- `mint`: Crear nuevos tokens vinculados a una garantía específica
- `transfer`: Transferir tokens entre cuentas
- `balance_of`: Consultar balance de una dirección para una garantía específica
- `balance`: Consultar balance total de una dirección
- `approve/allowance`: Aprobar gastos delegados
- `transfer_from`: Transferir usando allowance
- `redeem`: Redimir tokens (solo admin)
- `get_guarantee_info`: Obtener información de una garantía
- `get_all_guarantees`: Listar todas las garantías

### 2. Marketplace
Contrato de marketplace para compraventa de tokens de garantía.

**Funcionalidades:**
- `initialize`: Inicializar con dirección del contrato de tokens
- `create_sell_offer`: Crear una oferta de venta
- `buy`: Comprar tokens de una oferta
- `cancel_offer`: Cancelar una oferta
- `get_offer`: Obtener información de una oferta
- `get_offers_by_guarantee`: Listar ofertas de una garantía
- `get_all_offers`: Listar todas las ofertas activas

## Requisitos Previos

1. **Rust**: v1.94.1 o superior
   ```bash
   rustup --version
   ```

2. **Target WASM**:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

3. **Stellar CLI**: v22.x o superior
   ```bash
   # Instalar desde binario precompilado o compilar desde source
   cargo install --locked stellar-cli --features opt

   # O descargar binario desde:
   # https://github.com/stellar/stellar-cli/releases
   ```

## Setup de Identidad en Testnet

Generar y fondear una identidad para deploy:

```bash
# Generar identidad
stellar keys generate --global deployer --network testnet

# Fondear cuenta
stellar keys fund deployer --network testnet

# Verificar dirección
stellar keys address deployer
```

## Build

Para compilar los contratos:

```bash
cd contracts
stellar contract build
```

Esto generará los archivos WASM optimizados en:
- `target/wasm32-unknown-unknown/release/guarantee_token.wasm`
- `target/wasm32-unknown-unknown/release/marketplace.wasm`

## Deploy en Testnet

### 1. Deploy GuaranteeToken

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/guarantee_token.wasm \
  --source deployer \
  --network testnet
```

Guardar el Contract ID retornado (ej: `CBXXX...`)

### 2. Deploy Marketplace

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/marketplace.wasm \
  --source deployer \
  --network testnet
```

Guardar el Contract ID retornado (ej: `CAXXX...`)

### 3. Inicializar Contratos

Inicializar GuaranteeToken:

```bash
stellar contract invoke \
  --id <GUARANTEE_TOKEN_CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address deployer) \
  --name "AURA Guarantee" \
  --symbol "AURA"
```

Inicializar Marketplace:

```bash
stellar contract invoke \
  --id <MARKETPLACE_CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- initialize \
  --token_contract <GUARANTEE_TOKEN_CONTRACT_ID> \
  --payment_token <USDC_OR_XLM_ADDRESS>
```

## Testing

Ejecutar tests unitarios:

```bash
cd contracts
cargo test
```

## Verificación en Explorer

Ver los contratos deployados en:
- Testnet: https://stellar.expert/explorer/testnet/contract/YOUR_CONTRACT_ID

## Estructura del Proyecto

```
contracts/
├── Cargo.toml                    # Workspace configuration
├── guarantee-token/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs               # GuaranteeToken contract
└── marketplace/
    ├── Cargo.toml
    └── src/
        └── lib.rs               # Marketplace contract
```

## Notas Importantes

- Los contratos usan `soroban-sdk` versión 22.0.0
- Los contratos están optimizados para tamaño (`opt-level = "z"`)
- Todas las funciones críticas requieren autenticación
- Los eventos son emitidos para todas las operaciones importantes

## Próximos Pasos

1. Completar el deploy en testnet
2. Actualizar el backend con los Contract IDs
3. Integrar el SDK de Soroban en el backend
4. Realizar pruebas end-to-end
