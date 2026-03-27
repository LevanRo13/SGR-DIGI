# Fase 4: Integración BLEND Protocol — Préstamos DeFi colateralizados con Avales

## Contexto y Objetivo
SGR-DIGI ya tiene operativo un flujo end-to-end donde se emiten avales tokenizados, se listan en el Marketplace y se compran/venden en la Stellar Testnet. 

La Fase 4 cierra el círculo DeFi permitiendo que los poseedores de tokens de aval los usen como **colateral para pedir préstamos** a través del protocolo BLEND V2.

BLEND es un protocolo de lending descentralizado sobre Soroban. El flujo será: 
 depositar tokens AURA como colateral → pedir prestado XLM (o USDC) → repagar deuda + intereses → recuperar colateral.

### Decisión de Arquitectura: Opción A (Elegida)
**Adaptar `GuaranteeToken` al estándar SEP-41.**
Para que BLEND acepte nuestros avales como colateral, el token debe exponer las funciones estándar de Soroban Token (`balance`, `transfer`, `approve`, `decimals`, etc.). En lugar de crear un wrapper, modificaremos `GuaranteeToken` para que su saldo contable total por usuario cumpla con la interfaz SEP-41, haciendo a los AURA tokens compatibles nativamente con todo el ecosistema Stellar DeFi.

---

## Componente 1: Adaptación SEP-41 (`contracts/guarantee-token/src/lib.rs`)
Se deben agregar o alinear los siguientes métodos para cumplir la interfaz `token::Client` que espera BLEND:

- `decimals(env) -> u32`: Retornar `7` (estándar).
- `transfer(env, from: Address, to: Address, amount: i128)`: Transferencia estándar que opere sobre el `DataKey::Balance(address)` sin requerir discriminar por `guarantee_id` (para interoperabilidad DeFi, los fondos respaldados por N garantías distintas se sumarán en el balance fungible a ojos del protocolo de lending).
- `burn(env, from: Address, amount: i128)`
- Ajustar los tipos u64 a i128 si la interfaz SEP-41 estricta lo requiere.

---

## Componente 2: Oracle de Commodities (`contracts/commodity-oracle/src/lib.rs`)
BLEND necesita un contrato Oracle que implemente la función `lastprice(asset)` para cada activo del pool.

- **Crear un nuevo workspace member:** `contracts/commodity-oracle`
- **Interfaz requerida por BLEND:**
  - `set_price(asset: Address, price: i128, timestamp: u64)` — solo callable por admin.
  - `lastprice(asset: Address) -> Option<PriceData>` — devuelve precio y timestamp.
- **Precios hardcodeados (MVP):**
  - AURA token: ~$1 USD equivalente por fracción.
  - XLM: precio fijo de testnet (~$0.10).
- Desplegar e inicializar en Testnet.

---

## Componente 3: Deploy del Pool BLEND en Testnet
Secuencia de comandos CLI para crear el pool usando la Pool Factory oficial de BLEND:

1. **Deploy pool** vía `pool_factory.deploy()` usando el address del Oracle creado.
2. **Agregar reserves (activos):**
   - Reserve 0: Token AURA (colateral) con `c_factor: 0.70`, `l_factor: 0`.
   - Reserve 1: XLM (borrowable) con `c_factor: 0`, `l_factor: 0.75`.
3. **Fondear Backstop:** Depositando LP tokens (ej. BLND:USDC) para alcanzar el `Product Constant` mínimo, o simulando su estado/mockeando el threshold.
4. **Activar pool** con status a "admin active".

---

## Componente 4: Backend — `LendingService` (`backend/src/lending/`)
Módulo NestJS que usa `@blend-capital/blend-sdk` de npm.

### Servicio Lógico (`lending.service.ts`)
```typescript
class LendingService {
  // Depositar tokens AURA como colateral en el pool BLEND
  async supplyCollateral(amount: number): Promise<{txHash}>

  // Pedir préstamo en XLM contra el colateral depositado
  async borrow(amount: number): Promise<{txHash}>

  // Repagar deuda + intereses
  async repay(amount: number): Promise<{txHash}>

  // Consultar posición del usuario (colateral depositado, deuda, health factor)
  async getPosition(): Promise<PositionInfo>
}
```

### Endpoints REST (`lending.controller.ts`)
| Endpoint | Method | Descripción |
|----------|--------|-------------|
| `/lending/supply` | POST | Depositar AURA |
| `/lending/borrow` | POST | Pedir préstamo |
| `/lending/repay` | POST | Repagar deuda |
| `/lending/position` | GET | Ver posición |

*(Incluir DTOs correspondientes y validaciones)*

---

## Componente 5: Frontend — `LendingPage` (`frontend/src/pages/LendingPage.tsx`)

Página de usuario conectada al backend, con 3 secciones visuales clave:
1. **Supply Collateral:** Muestra el saldo AURA libre. Input para definir cantidad + botón "Deposit".
2. **Borrow:** Input para definir monto de XLM deseado basado en el colateral (Health Factor simulado) + botón "Borrow".
3. **Position Overview:** Panel de control (Dashboard) indicando:
   - Total Colateral (AURA depositado)
   - Deuda total (XLM prestado)
   - Botón de repago total / parcial.

*Requiere enrutamiento en `App.tsx` y acceso mediante el `Sidebar.tsx`.*

---

## Componente 6: Configuración Entorno (`backend/.env`)
Habrá que persistir las direcciones tras desplegar lo on-chain:
```env
# --- BLEND Protocol ---
BLEND_POOL_ID=C...
BLEND_ORACLE_ID=C...
BLEND_BACKSTOP_ID=C...
```

---

## Resumen de Orden de Ejecución

1. Adaptación del código `GuaranteeToken` al estándar SEP-41 y testing.
2. Contrato `commodity-oracle` en Rust, testing.
3. Compilación y re-deploy de Contratos Modificados en Testnet.
4. CLI: Configuración e inicialización del Pool Blend, Reserves, Oracle y Backstop.
5. Backend NestJS: Generar el módulo de `lending` con el Blend JS SDK instalado.
6. Frontend React: Crear la UX en la nueva `LendingPage`.
7. Tests E2E desde UI hasta Protocolo.
