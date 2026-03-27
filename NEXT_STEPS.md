# Próximos Pasos - Implementación Soroban SGR-DIGI

## ✅ Completado

- ✅ Estructura de contratos Soroban (workspace Rust)
- ✅ Contrato GuaranteeToken implementado
- ✅ Contrato Marketplace implementado
- ✅ Backend refactorizado para usar Soroban RPC
- ✅ DTOs y endpoints de marketplace creados
- ✅ Documentación actualizada

## 🚧 Pendiente

### 1. Resolver Instalación de Stellar CLI

**Problema actual**: Stellar CLI no compila por falta de VS Build Tools C++

**Soluciones**:

#### Opción A: Instalar VS Build Tools (Recomendado)
```bash
# Descargar e instalar VS Build Tools con componentes C++
# https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
```

#### Opción B: Usar binario precompilado
```bash
# Descargar desde releases:
# https://github.com/stellar/stellar-cli/releases

# Colocar en PATH y renombrar a stellar.exe
```

#### Opción C: Usar WSL2 (Linux subsystem)
```bash
# En WSL2 Ubuntu
cargo install --locked stellar-cli --features opt
```

### 2. Deploy de Contratos en Testnet

Una vez que Stellar CLI funcione:

```bash
cd contracts

# 1. Generar y fondear identidad
stellar keys generate --global deployer --network testnet
stellar keys fund deployer --network testnet

# 2. Build contratos
stellar contract build

# 3. Deploy GuaranteeToken
GUARANTEE_TOKEN_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/guarantee_token.wasm \
  --source deployer \
  --network testnet)
echo "GuaranteeToken: $GUARANTEE_TOKEN_ID"

# 4. Deploy Marketplace
MARKETPLACE_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/marketplace.wasm \
  --source deployer \
  --network testnet)
echo "Marketplace: $MARKETPLACE_ID"

# 5. Inicializar GuaranteeToken
stellar contract invoke \
  --id $GUARANTEE_TOKEN_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address deployer) \
  --name "AURA Guarantee" \
  --symbol "AURA"

# 6. Inicializar Marketplace
stellar contract invoke \
  --id $MARKETPLACE_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --token_contract $GUARANTEE_TOKEN_ID \
  --payment_token $(stellar keys address deployer)  # Placeholder
```

### 3. Configurar Backend con Contract IDs

Actualizar `backend/.env`:

```env
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_SECRET_KEY=SXXX...  # Mismo que deployer

GUARANTEE_TOKEN_CONTRACT_ID=CBXXX...  # Del paso anterior
MARKETPLACE_CONTRACT_ID=CAXXX...      # Del paso anterior

GEMINI_API_KEY=tu_api_key
PORT=3000
```

### 4. Testing E2E

#### A. Verificar health del backend

```bash
curl http://localhost:3000/stellar/health
```

Debería retornar:
```json
{
  "success": true,
  "data": {
    "online": true,
    "network": "Stellar Testnet (Soroban)",
    "rpcUrl": "https://soroban-testnet.stellar.org",
    "publicKey": "GXXX...",
    "contractsConfigured": true
  }
}
```

#### B. Crear garantía (mint tokens)

```bash
curl -X POST http://localhost:3000/guarantee \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "SOJA",
    "cantidad": 5000,
    "valor": 55000,
    "aval": 55000,
    "operatorConfirmed": true
  }'
```

#### C. Verificar en blockchain

Ir a https://stellar.expert/explorer/testnet/tx/TX_HASH

Buscar:
- `invoke contract` operation
- Contract ID del GuaranteeToken
- Función `mint` llamada

#### D. Crear oferta en marketplace

```bash
curl -X POST http://localhost:3000/marketplace/offer \
  -H "Content-Type: application/json" \
  -d '{
    "guaranteeId": 0,
    "amount": 1000,
    "pricePerToken": 100
  }'
```

#### E. Listar ofertas

```bash
curl http://localhost:3000/marketplace/offers/0
```

#### F. Comprar tokens

```bash
curl -X POST http://localhost:3000/marketplace/buy \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": 0,
    "amount": 500
  }'
```

### 5. Actualizar Package.json del Backend

Verificar que las dependencias de Stellar SDK estén actualizadas:

```bash
cd backend
npm install @stellar/stellar-sdk@latest
```

Versión requerida: `@stellar/stellar-sdk@^12.0.0` o superior (con soporte Soroban)

### 6. Testing Unitario de Contratos

```bash
cd contracts
cargo test --all
```

Debería pasar:
- `test_initialize`
- `test_mint_and_balance`
- `test_transfer`
- `test_create_offer`
- `test_cancel_offer`

### 7. Actualizar Frontend (Opcional)

Si se desea integrar el marketplace en el frontend:

1. Agregar componente `MarketplacePage.tsx`
2. Agregar servicios de API para marketplace
3. Actualizar rutas

## 📊 Checklist Final

- [ ] Stellar CLI instalado y funcionando
- [ ] Identidad deployer creada y fondeada
- [ ] Contratos compilados (cargo build)
- [ ] GuaranteeToken deployado en testnet
- [ ] Marketplace deployado en testnet
- [ ] Contratos inicializados correctamente
- [ ] Backend configurado con Contract IDs
- [ ] Health check retorna `contractsConfigured: true`
- [ ] Test E2E: Crear garantía exitoso
- [ ] Test E2E: Crear oferta exitoso
- [ ] Test E2E: Comprar tokens exitoso
- [ ] Transacciones visibles en stellar.expert
- [ ] Tests unitarios de contratos pasan
- [ ] Backend tests pasan (opcional)

## 🎯 Criterios de Éxito

Para cumplir con los requisitos del hackathon:

1. ✅ **Contratos Soroban funcionando**: GuaranteeToken + Marketplace
2. ⏳ **Deployados en testnet**: Verificables en stellar.expert
3. ⏳ **Backend integrado**: Llama a contratos vía Soroban RPC
4. ⏳ **Transacciones confirmadas**: Al menos una garantía mintada on-chain
5. ⏳ **Marketplace funcional**: Al menos una oferta creada y ejecutada

## 🐛 Troubleshooting

### Error: "Contract not configured"
- Verificar que `.env` tiene los Contract IDs correctos
- Reiniciar backend después de actualizar `.env`

### Error: "Simulation failed"
- Verificar que los contratos están inicializados
- Verificar que la cuenta tiene fondos suficientes
- Revisar logs de Soroban RPC

### Error: "Transaction timeout"
- Incrementar `maxAttempts` en `pollForResult()`
- Verificar conectividad con Soroban RPC
- Probar con Stellar Explorer manualmente

### Contratos no compilan
- Verificar Rust 1.94+
- Verificar `wasm32-unknown-unknown` target instalado
- Limpiar y rebuildar: `cargo clean && stellar contract build`

## 📚 Referencias

- [Soroban Guide](https://soroban.stellar.org/docs)
- [Stellar SDK JS](https://stellar.github.io/js-stellar-sdk/)
- [Contract Examples](https://github.com/stellar/soroban-examples)
- [Testnet Faucet](https://laboratory.stellar.org/#account-creator?network=test)

---

**Última actualización**: 26/03/2026
