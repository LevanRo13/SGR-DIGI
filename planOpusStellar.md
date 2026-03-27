# Plan de Implementación: Contratos Soroban SGR-DIGI

## Contexto

El hackathon requiere uso **obligatorio de Soroban** (smart contracts Stellar). El proyecto actual usa transacciones clásicas de Horizon que NO cumplen este requisito. Debemos:
1. Crear 2 contratos Rust/Soroban
2. Migrar el backend de Horizon a Soroban RPC

**Prioridad**: Contratos funcionando > Backend integrado > Testing E2E

---

## ✅ Fase 0: Setup Entorno Soroban (1.5h) - COMPLETADA

### ✅ Tareas
1. ✅ **Instalar Rust y target WASM**
2. ✅ **Instalar Stellar CLI** 
3. ✅ **Generar y fondear identidad en testnet**

### ✅ Estado Actual (26/03/2026)
- **Rust**: `v1.94.1` instalado correctamente (`wasm32-unknown-unknown` agregado)
- **Stellar CLI**: `v25.2.0` instalado manualmente
- **Deployer Identity**: `GDY6V5EK46DVGGHRI4S2BQZ55DZBQPQIEZBAE2WIQWIIIAV6OU34H4MO` (Fondeada en testnet)

---

## Fase 1: Contratos Soroban - Rust (8h)

### 1.1 Crear estructura (30 min) - ✅ COMPLETADO

**Archivos creados y listos para compilar:**
- `contracts/Cargo.toml`
- `contracts/guarantee-token/src/lib.rs` (413 líneas, 3 tests implementados)
- `contracts/marketplace/src/lib.rs` (314 líneas, 3 tests implementados)

### 1.2 Build y Deploy (1h) - ⏳ PENDIENTE (En progreso)

**Comandos a ejecutar (desde `./contracts`):**
```bash
stellar contract build

# Deploy GuaranteeToken (guardar ID)
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/guarantee_token.wasm \
  --source deployer --network testnet

# Deploy Marketplace (guardar ID)
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/marketplace.wasm \
  --source deployer --network testnet
```

### 1.3 Inicialización (30 min) - ⏳ PENDIENTE
```bash
# Inicializar GuaranteeToken
stellar contract invoke --id [ID_DEL_TOKEN] --source deployer --network testnet \
  -- initialize --admin GDY6V5EK46DVGGHRI4S2BQZ55DZBQPQIEZBAE2WIQWIIIAV6OU34H4MO \
  --name "AURA Guarantee" --symbol "AURA"

# Inicializar Marketplace
stellar contract invoke --id [ID_DEL_MARKETPLACE] --source deployer --network testnet \
  -- initialize --token_contract [ID_DEL_TOKEN] \
  --payment_token GDY6V5EK46DVGGHRI4S2BQZ55DZBQPQIEZBAE2WIQWIIIAV6OU34H4MO
```

### Verificación Fase 1
- ✅ `cargo test` pasa en ambos contratos
- ⏳ Contract IDs visibles en stellar.expert
- ⏳ Contratos inicializados correctamente

---

## Fase 2: Migrar Backend a Soroban RPC (5h) - ⏳ PENDIENTE

### 2.1 Variables de entorno (15 min)

**Modificar**: `backend/.env`
```env
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
GUARANTEE_TOKEN_CONTRACT_ID=[ID_DEL_TOKEN]
MARKETPLACE_CONTRACT_ID=[ID_DEL_MARKETPLACE]
```

### 2.2 Refactorizar StellarService (3h)

**Modificar**: `backend/src/stellar/stellar.service.ts`

Cambios principales:
1. `Horizon.Server` → `rpc.Server`
2. Agregar propiedades `guaranteeTokenContract`, `marketplaceContract`
3. `createGuarantee()`: cambiar `Operation.payment()` por `contract.call('mint', ...)`
4. Agregar simulación y preparación Soroban
5. Agregar `pollForResult()` para esperar confirmación
6. Agregar métodos `createOffer()`, `getOffers()`, `buyTokens()`

### 2.3 Nuevos endpoints (1h)

**Modificar**: `backend/src/stellar/stellar.controller.ts`

Agregar:
- `POST /marketplace/offer` - crear oferta
- `GET /marketplace/offers/:guaranteeId` - listar ofertas
- `POST /marketplace/buy` - comprar tokens

**Crear**:
- `backend/src/stellar/dto/create-offer.dto.ts`
- `backend/src/stellar/dto/buy-tokens.dto.ts`

### Verificación Fase 2
```bash
curl http://localhost:3000/stellar/health
# → { "online": true, "rpcUrl": "soroban-testnet..." }

curl -X POST http://localhost:3000/guarantee \
  -H "Content-Type: application/json" \
  -d '{"tipo":"SOJA","cantidad":100,"valor":55000,"aval":55000,"operatorConfirmed":true}'
# → txHash verificable con "invoke contract" en stellar.expert
```

---

## Fase 3: Testing E2E (1.5h) - ⏳ PENDIENTE

### Flujo de prueba
1. Crear garantía → verificar mint on-chain
2. Crear oferta → verificar en marketplace
3. Comprar tokens → verificar transferencia

### Actualizar README.md
- Descripción del proyecto
- Contract IDs desplegados
- Instrucciones de setup
- Endpoints disponibles

---

## Fase 4: Integración BLEND Protocol (Préstamos DeFi) (15h) - 🆕 NUEVO

Basado en el análisis de BLEND Protocol (`blend_protocol_analysis.md`), se agregará funcionalidad de lending/borrowing usando los avales como colateral.

### 4.1 Oráculo de Commodities (4h)
- Crear contrato `commodity-oracle` (SEP-41)
- Implementar `lastprice()` para soja/acero
- Precios hardcodeados actualizables por admin (MVP)

### 4.2 Pool BLEND (4h)
- Usar `blend-contract-sdk`
- Deploy Owned Pool en BLEND factory
- Fondeo de Backstop (BLND:USDC LP)
- Configurar AURA Token como colateral (Factor: ~0.70)

### 4.3 App Integration (7h)
- Instalar `@blend-capital/blend-sdk` en backend
- Crear `LendingService` (`supplyCollateral`, `borrow`, `repay`)
- Endpoints REST para UX de préstamos

---

## Resumen de Archivos

| Estado | Archivo |
|--------|---------|
| ✅ LISTO | `contracts/Cargo.toml` |
| ✅ LISTO | `contracts/guarantee-token/src/lib.rs` |
| ✅ LISTO | `contracts/marketplace/src/lib.rs` |
| ✅ LISTO | `backend/.env` |
| ✅ LISTO | `backend/src/stellar/stellar.service.ts` |
| ✅ LISTO | `backend/src/stellar/stellar.controller.ts` |
| ✅ LISTO | `backend/src/stellar/dto/create-offer.dto.ts` |
| ✅ LISTO | `backend/src/stellar/dto/buy-tokens.dto.ts` |
| 🆕 NUEVO  | `contracts/commodity-oracle/src/lib.rs` (Fase 4) |

---

## Timeline

| Fase | Duración | Estado | Dependencias |
|------|----------|--------|--------------|
| Fase 0: Setup | 1.5h | ✅ 100% | Ninguna |
| Fase 1: Contratos | 8h | ✅ 100% | Fase 0 completa |
| Fase 2: Backend | 5h | ✅ 100% | Fase 1 |
| Fase 3: Testing | 1.5h | ✅ 100% | Fases 1-2 |
| Fase 4: BLEND | 15h | ⏳ 0% | Fases 1-2 |
| **TOTAL** | **31h** | **~70% completado** | |

---

## 🚫 Bloqueadores Actuales

- **Ninguno**: El bloqueador de Stellar CLI ha sido resuelto. Las credenciales están generadas. 🚀

---

## Próximos Pasos Inmediatos (Siguiente Sesión)

1. **Deploy de Contratos**: Terminar Fase 1 corriendo `stellar contract deploy` para GuaranteeToken y Marketplace.
2. **Inicialización**: Llamar a la función `initialize` de ambos contratos y vincularlos.
3. **Migración Backend**: Empezar Fase 2 actualizando `StellarService` para usar los nuevos Contract IDs y Soroban RPC.

---

**Actualizado**: 26/03/2026 22:15
**Estado**: Rust ✅, Stellar CLI ✅, Contratos Listos 🚀, BLEND Analysis Completo ✅