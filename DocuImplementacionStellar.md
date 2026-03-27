# Documentación de Implementación Stellar Soroban (Fase 1)

**Fecha de actualización:** 26 de Marzo de 2026
**Red:** Stellar Testnet

Este documento describe de forma teórica y técnica los pasos realizados durante la **Fase 1** del plan de migración hacia smart contracts de Soroban, detallando la resolución de obstáculos, el despliegue on-chain y la vinculación de los contratos.

---

## 1. Configuración del Entorno de Compilación (Rust & WebAssembly)

Soroban requiere que los contratos inteligentes escritos en Rust sean compilados a WebAssembly (WASM). Durante esta etapa, el compilador reportó un fallo al no encontrar la librería `core`. 

**Resolución:** 
Las versiones recientes de `stellar-cli` (v25+) y el SDK de Soroban han evolucionado el target de compilación. Se corrigió añadiendo el target específico `wasm32v1-none` mediante `rustup`. Adicionalmente, se corrigieron las dependencias de los traits en el código fuente del `Marketplace` (importando `IntoVal` del `soroban_sdk`) para garantizar la correcta conversión de tipos primitivos (como `u64`) dentro del entorno de la blockchain.

## 2. Creación y Fondeo de la Identidad Administradora

Se gestionó una identidad local denominada `deployer` a través del CLI de Stellar. Esta identidad opera como una cuenta criptográfica en la red Testnet y actúa como la dueña/administradora de ambos contratos.
- **Llave pública:** `GDY6V5EK46DVGGHRI4S2BQZ55DZBQPQIEZBAE2WIQWIIIAV6OU34H4MO`
- **Llave secreta:** Extraída y resguardada para posibilitar al backend la firma de transacciones autorizadas (minteo de tokens, confirmación de operaciones).

## 3. Despliegue On-Chain (Deployment)

Una vez compilados y optimizados los archivos `.wasm`, se procedió a instanciarlos en la red de pruebas (Stellar Testnet). El despliegue de un contrato en Soroban sube el código binario a la red y le asigna una dirección única de 56 caracteres que comienza con la letra `C`.

1. **GuaranteeToken:** Desplegado exitosamente bajo el ID `CCQ2VJCWFGJTFWYG6W3LTYMWNPPEOMFXBT7HVKRVKVMDZALTKTTOM27V`. Este contrato rige la lógica ERC-20/Token de los avales (emisión, transferencias, balances).
2. **Marketplace:** Desplegado exitosamente bajo el ID `CCX37O22MXY3CMZIU3KYCCQQFO6NIJYYT4HVIOUZ2H22J4QHPAAIK7BN`. Este contrato contiene la lógica de negocio para la creación de ofertas (sell offers) y la compra de las mismas.

## 4. Inicialización y Vinculación de Contratos

En Soroban, los contratos se despliegan sin estado. Es obligatorio llamar a un método de inicialización (`initialize`) para definir sus variables fundamentales antes de ser usados.

- **GuaranteeToken:** Fue inicializado pasándole la dirección del `deployer` como administrador, el nombre `"AURA_Guarantee"` y el símbolo `"AURA"`. 
  > *Nota técnica:* Durante este proceso se mitigó un bug del CLI de Windows al parsear argumentos con espacios en blanco, reemplazando el espacio por un guion bajo para evitar que el nodo RPC colgara la simulación de la transacción.
  
- **Marketplace:** Se inicializó inyectándole por parámetro el ID del contrato *GuaranteeToken* (`CCQ2VJCWFGJTFWYG...`). Esto es un patrón arquitectónico clave: el Marketplace ahora "sabe" con qué contrato de tokens debe interactuar para validar balances y ejecutar transferencias a la hora de comprar/vender avales.

## 5. Preparación de la Infraestructura Backend (Integración RPC)

Con la infraestructura on-chain completamente operativa, se generó la configuración fundamental para la Fase 2 instalando y adaptando las variables de entorno (`.env`) del servidor NestJS (backend). 

El backend pasó de depender de la API Legacy (Horizon) a configurarse para **Soroban RPC**, proveyéndole:
1. La frase de red (`Test SDF Network ; September 2015`).
2. El endpoint RPC (`https://soroban-testnet.stellar.org`).
3. La llave secreta de administración y los IDs unívocos de ambos contratos para poder invocar métodos directamente desde los servicios de Node.js.

---

### Próximo Paso Lógico (Fase 2)
Con los cimientos en la blockchain asegurados, el sistema está listo para que el `StellarModule` del backend sea refactorizado usando la librería `@stellar/stellar-sdk` para orquestar llamadas (`contract.call`) en lugar de `Operation.payment`, integrando la lógica Web2 con los Smart Contracts Web3.

---

# Documentación de Implementación Stellar Soroban (Fases 2 y 3)

## 1. Migración del Backend a Soroban RPC (Fase 2)

Durante esta fase, se refactorizó completamente el archivo `stellar.service.ts` eliminando las dependencias obsoletas hacia el servidor Horizon e implementando el uso del nodo `rpc.Server` oficial para Soroban. Este cambio implica un nuevo paradigma transaccional: el flujo asíncrono. Ahora, cada invocación de método en la blockchain (emitir aval, crear oferta, compraventa) atraviesa tres estados en el Backend:
- `Simulation`: Se simula el footprint (cómputo y almacenamiento requerido) de la operación para estimar el fee en `$XLM`.
- `Assembly & Sign`: Se arma el envoltorio de la transacción y se firma con la llave administradora.
- `Submission`: Se envía la transacción al rpc y se consulta (polling) iterativamente el estado hasta obtener el estado final (`SUCCESS` o comprobante de error).

### Adaptaciones en Base de Datos (JSON Repo)
Para rastrear eficientemente las garantías minteadas, se modificó el repositorio de persistencia `operations.repository.ts` añadiendo el atributo nativo `guaranteeId` (tipo `u64`). Esto soluciona la desconexión que existía entre los metadatos de Web2 y la realidad de los balances Web3.

## 2. Integración Web3 y Marketplace en Frontend (Fase 3)

Se expandió la interfaz gráfica desarrollando el módulo descentralizado del negocio. Estas adaptaciones convierten a la aplicación React en el cliente primario para interactuar indirectamente con el smart contract del *Marketplace*.

**Conexión Frontend-Backend:**
- **UploadPage:** Se conectó dinámicamente el botón de "Continuar" para hacer un request directo al nuevo endpoint HTTP `POST /guarantee`, enviando el payload e inicializando la garantía en la network Testnet. El frontend parsea automáticamente el response y captura el `u64` del Guarantee y su hash de confirmación en la blockchain para trazabilidad.
- **MarketplacePage (Nuevo):** Se desarrolló una nueva vista que consolida las funcionalidades DeFi.
  - Ofrece a los usuarios la capacidad dual de "Listar/Vender" y "Comprar" fracciones de la garantía financiera en circulación, con llamadas end-to-end hacia los endpoints `POST /marketplace/offer` y `POST /marketplace/buy`.
  - El componente cuenta con su renderizado asíncrono para consumir los endpoints de lectura `GET /marketplace/offers/:id`, mapeando las ofertas a listados de alta fidelidad presentados mediante UI Tailwind y proveyendo un flujo operativo real a la red descentralizada Testnet de Stellar.

---

# Documentación de Implementación Stellar Soroban (Fase 4)

## 1. Integración del Protocolo BLEND (Lending DeFi)

El objetivo de esta fase fue conectar la plataforma SGR-DIGI con el protocolo de liquidez de código abierto **BLEND**, permitiendo a las Pymes utilizar sus Avales Digitales (AURA) como colateral para solicitar préstamos (`borrow`) en USDC o XLM de forma descentralizada. Para lograrlo, la arquitectura del sistema sufrió modificaciones troncales en la capa de smart contracts y el backend.

### 1.1. Adaptación del GuaranteeToken al estándar SEP-41

BLEND, como cualquier protocolo DeFi moderno en la red Stellar, requiere que los tokens utilizados como garantía o reserva operen estandarizados bajo la normativa **SEP-41** (Stellar Asset Contract Data Structure / Soroban Token Interface). 
- Se refactorizó drásticamente la estructura de `guarantee-token/src/lib.rs`.
- Se migraron los tipos de datos principales de `u64` a `i128` (estándar dictaminado por SEP-41 para los amounts fiduciarios).
- Se incorporaron las funciones obligatorias del estándar que carecían: `decimals()`, `burn()`, `burn_from()`, y métodos de transferencia agnósticos que alteran los balances sin exigir el ID de la garantía subyacente (`transfer(from, to, amount: i128)` y `transfer_from` con expiración en tiempo de ledger).
- Se subió un nuevo binario de este contrato a la blockchain Testnet (ID: `CC4HUPWE...`).

### 1.2. Desarrollo e Inicialización del Commodity Oracle

El motor financiero de BLEND depende de oráculos de precios fidedignos para calcular la salud criptográfica (Health Factor) de los prestatarios y ejecutar liquidaciones automáticas.
- **Creación:** Se generó un nuevo paquete smart contract llamado `commodity-oracle`.
- **Implementación Rust:** Cuenta con una interfaz rígida que exporta las funciones `set_price(asset, price, timestamp)` (protegida por autenticación de Admin) y la crucial `lastprice(asset)`, que es leída on-chain y de forma atómica por los backstops de BLEND.
- **Despliegue On-chain:** El oráculo fue compilado (3.6KB) y desplegado con el ID `CA3Q57CO...`.
- **Seteo Práctico (MVP):** Mediante CLI se estamparon dos precios fundacionales en el oráculo asumiendo una escala base de 7 decimales (10_000_000 = $1.00 USD):
  - `AURA Token`: Fijado a $1.00 USD.
  - `XLM Nativo`: Fijado a $0.10 USD (identificado en la network mediante su Contract ID representativo `CDLZFC...`).

### 1.3. Orquestador de Lending en el Backend

Lejos de construir un Frontend monolítico, las directivas exigían aislar toda la lógica DeFi pesada en el servidor. Así nació el `LendingModule` en el entorno NestJS:
- **LendingService:** Es un servicio orquestador agnóstico que prepara arreglos *ScVal* multi-solicitud (request_type 2, 4, 5). Aprovecha las bases sentadas en la Fase 2 y la librería `@stellar/stellar-sdk` para inyectar transacciones complejas (`submit`) a la dirección unificada del *Pool de BLEND*.
- **Operaciones cubiertas:**
  - `Supply Collateral`: Minteo bloqueado de token AURA hacia BLEND.
  - `Borrow`: Adquisición colateralizada de XLM asumiendo tasas pasivas (Liability Factor de 0.75).
  - `Repay`: Quema de deuda + interés.
  - `Position`: Un endpoint read-only (`get_positions` vía simulation RPC) que interpreta las reservas cruzadas de un usuario en un instante `t` para calcular su *Health Factor* (fórmula: `Collateral * Collateral Factor / Deuda * Liability Factor`).
- **Variables de Entorno .env:** Se expusieron los IDs recién nacidos (`BLEND_ORACLE_ID`, `GUARANTEE_TOKEN_CONTRACT_ID`) sentando la vía final para cuando se instancie localmente el Pool general.

> \*\*Nota sobre el Frontend:\*\* En estricto cumplimiento con las restricciones estipuladas para este ciclo de desarrollo, toda iteración visual asociada (*LendingPage, Position Dashboard, React UI*) fue clasificada categóricamente como una **tarea técnica aislada de próxima iteración**, protegiendo así el core DeFi completado de dependencias visuales inacabadas.

---

# Documentación de Implementación Stellar Soroban (Fase 4b)

## Despliegue del Pool de Lending BLEND en Testnet

**Fecha de actualización:** 27 de Marzo de 2026
**Red:** Stellar Testnet (Soroban)

Esta sección documenta en detalle el proceso manual de creación e inicialización de un Pool de Lending real sobre el protocolo BLEND V2 en la red de pruebas de Stellar. Incluye la resolución de errores, la configuración económica de las reservas, y el análisis del requisito de fondeo del Backstop.

---

### 1. Direcciones de Contratos Oficiales de BLEND (Testnet)

Los IDs de los contratos oficiales de BLEND Protocol en Testnet fueron obtenidos directamente del repositorio oficial [`blend-capital/blend-utils`](https://github.com/blend-capital/blend-utils/blob/main/testnet.contracts.json):

| Contrato | ID (Testnet) | Descripción |
|---|---|---|
| **Pool Factory V2** | `CDV6RX4CGPCOKGTBFS52V3LMWQGZN3LCQTXF5RVPOOCG4XVMHXQ4NTF6` | Fábrica permisionless que instancia nuevos pools de lending |
| **Backstop V2** | `CBDVWXT433PRVTUNM56C3JREF3HIZHRBA64NB2C3B2UNCKIS65ZYCLZA` | Contrato de seguro colectivo (absorbe deudas incobrables) |
| **Emitter** | `CC3WJVJINN4E3LPMNTWKK7LQZLYDQMZHZA7EZGXATPHHBPKNZRIO3KZ6` | Distribuye recompensas BLND a pools activos |
| **Comet (AMM)** | `CA5UTUUPHYL5K22UBRUVC37EARZUGYOSGK3IKIXG2JLCC5ZZLI4BDWDM` | Pool AMM BLND:USDC para generar LP tokens |
| **BLND Token** | `CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF` | Token de gobernanza del protocolo Blend |
| **USDC Token** | `CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU` | Stablecoin USDC en Testnet |

> **Lección aprendida:** Los IDs de los contratos de Testnet se reinician periódicamente por el equipo de Blend cuando hay actualizaciones fundamentales de protocolo. Siempre consultar `testnet.contracts.json` del repo oficial antes de interactuar.

### 2. Instanciación del Pool via Pool Factory

El Pool Factory V2 de BLEND permite a cualquier cuenta desplegar un pool de lending propio de forma permisionless. La invocación utiliza la función `deploy` con los siguientes parámetros:

```powershell
stellar contract invoke `
  --id CDV6RX4CGPCOKGTBFS52V3LMWQGZN3LCQTXF5RVPOOCG4XVMHXQ4NTF6 `
  --source deployer `
  --network testnet `
  -- deploy `
  --admin GDY6V5EK46DVGGHRI4S2BQZ55DZBQPQIEZBAE2WIQWIIIAV6OU34H4MO `
  --name "AURA Lending Pool" `
  --salt 0facbadefacbadefacbadefacbadefacbadefacbadefacbadefacbadefacbade `
  --oracle CA3Q57COKCOX3FUQGDWDBLY7RFITECDQ3RJIABSFJJLHIREWFNLJVN3U `
  --backstop_take_rate 1000000 `
  --max_positions 5 `
  --min_collateral 0
```

**Parámetros explicados:**

| Parámetro | Valor | Significado |
|---|---|---|
| `admin` | Dirección del deployer | Cuenta con permisos de administración sobre el pool |
| `name` | "AURA Lending Pool" | Nombre descriptivo del pool en la red |
| `salt` | Hash de 32 bytes | Genera una dirección determinística para el contrato |
| `oracle` | ID del Commodity Oracle | Nuestro oráculo de precios desplegado en la Fase 4a |
| `backstop_take_rate` | 1000000 (10%) | Porcentaje de intereses destinados al Backstop |
| `max_positions` | 5 | Máximo de posiciones abiertas simultáneas por usuario |
| `min_collateral` | 0 | Sin mínimo de colateral (entorno de pruebas) |

**Resultado exitoso:**
```
✅ Transaction submitted successfully!
🔗 https://stellar.expert/explorer/testnet/tx/e8214e3b72933248292c6ae29a0eae1016593c326767c2963dd5bf8a8c4a6427
Event: [{"symbol":"deploy"}] = {"address":"CBFFQS7ZAICT3Z46VYDZUBLOKBGJDM2FWCNAMILCBIPVURCNWXPCQM5H"}
```

**Pool ID generado:** `CBFFQS7ZAICT3Z46VYDZUBLOKBGJDM2FWCNAMILCBIPVURCNWXPCQM5H`

> **Nota sobre `min_collateral`:** Este parámetro fue añadido a la firma del contrato en BLEND V2 (no existía en V1). Actuaba como barrera anti-spam para evitar micro-depósitos. Se establece en `0` durante pruebas.

---

### 3. Configuración de Reservas (Assets del Pool)

Un pool recién creado no contiene definiciones de activos. Deben registrarse mediante un proceso de dos pasos de seguridad impuesto por BLEND V2:
1. **`queue_set_reserve`**: Encola la configuración (tiene un delay de seguridad)
2. **`set_reserve`**: Confirma y activa la reserva

#### 3.1. Resolución del Error `#1202` (BadRequest)

El primer intento de configurar reservas falló con `Error(Contract, #1202)`. Tras la investigación directa del código fuente oficial ([`blend-capital/blend-utils`](https://github.com/blend-capital/blend-utils/blob/main/src/v2/user-scripts/deploy-pool.ts)), se determinó que los parámetros de la curva de interés eran inválidos.

**Causa raíz:** El contrato del pool valida estrictamente que:
- `max_util` > `util` (la utilización máxima debe superar la utilización objetivo)
- `reactivity` ≤ 1000
- Los parámetros `r_base`, `r_one`, `r_two`, `r_three` no pueden ser todos cero simultáneamente
- `supply_cap` debe ser un valor `i128` válido

**Configuración incorrecta (causante del #1202):**
```json
{ "util": 0, "max_util": 0, "r_base": 0, "r_one": 0, "r_two": 0, "r_three": 0 }
```

**Configuración corregida (basada en el deploy script oficial de Blend Capital):**
```json
{ "util": 9000000, "max_util": 9800000, "r_base": 50000, "r_one": 500000, "r_two": 1000000, "r_three": 10000000, "reactivity": 1000 }
```

#### 3.2. Reserve 0 — AURA Token (Colateral)

Archivo de configuración: `aura_config.json`

```json
{
  "index": 0,
  "decimals": 7,
  "c_factor": 7000000,
  "l_factor": 0,
  "util": 9000000,
  "max_util": 9800000,
  "r_base": 50000,
  "r_one": 500000,
  "r_two": 1000000,
  "r_three": 10000000,
  "reactivity": 1000,
  "enabled": true,
  "supply_cap": "170141183460469231731687303715884105727"
}
```

**Parámetros económicos explicados:**

| Campo | Valor | Significado |
|---|---|---|
| `c_factor` | 7000000 (70%) | Factor colateral: cada $1 de AURA depositado permite pedir prestado hasta $0.70 |
| `l_factor` | 0 (0%) | Factor de liability: AURA no se puede pedir prestado (solo funciona como colateral) |
| `util` / `max_util` | 90% / 98% | Rango de utilización de la curva de interés |
| `r_base` a `r_three` | Curva progresiva | Tasas de interés que se disparan a medida que la utilización sube |
| `reactivity` | 1000 | Velocidad de ajuste de la tasa (máximo permitido por BLEND) |
| `supply_cap` | I128_MAX | Sin límite artificial de depósito en Testnet |

**Transacciones ejecutadas:**
```
queue_set_reserve: tx/1b257a7adb97fe52350d77230dae48a58d1825923603551d1b9692b63b2988ce ✅
set_reserve:       tx/d35061ef02e263ec532e993c9430bb36d1a7adea4dfacf2a338f003131840a08 ✅ (index: 0)
```

#### 3.3. Reserve 1 — XLM Nativo (Borrowable)

Archivo de configuración: `xlm_config.json`

```json
{
  "index": 0,
  "decimals": 7,
  "c_factor": 0,
  "l_factor": 7500000,
  "util": 9000000,
  "max_util": 9800000,
  "r_base": 50000,
  "r_one": 500000,
  "r_two": 1000000,
  "r_three": 10000000,
  "reactivity": 1000,
  "enabled": true,
  "supply_cap": "170141183460469231731687303715884105727"
}
```

| Campo | Valor | Significado |
|---|---|---|
| `c_factor` | 0 (0%) | XLM no sirve como colateral en este pool |
| `l_factor` | 7500000 (75%) | Factor de liability: la deuda en XLM pondera al 75% en el cálculo de salud |

> **Nota:** El campo `index` se pasa como `0` en la configuración pero el contrato asigna el índice automáticamente de forma secuencial (0 para AURA, 1 para XLM).

**Transacciones ejecutadas:**
```
queue_set_reserve: tx/0256e33f4ceee97be598a9201ac29536b55aac2d6920879615eb9e05019eb8c1 ✅
set_reserve:       tx/6957deed0ad95f98043b269ff3164b55238499fee82f2e66fb13f2d68ae87577 ✅ (index: 1)
```

---

### 4. Activación del Pool — Error `#1200` y el Requisito del Backstop

Al intentar activar el pool con `set_status --pool_status 1`, la transacción falló con `Error(Contract, #1200)`.

El log de diagnóstico reveló con precisión la causa:

```
contract:CBDVWXT433...backstopV2, topics:[fn_return, pool_data],
data: { blnd: 0, q4w_pct: 0, shares: 0, tokens: 0, usdc: 0 }
```

**Interpretación:** El Backstop consultó los datos de nuestro pool y encontró **cero fondos depositados**. BLEND impone un **Product Constant mínimo** como mecanismo de seguridad: sin un fondo de respaldo, un pool no puede aceptar depósitos ni préstamos, porque no habría cómo cubrir una liquidación fallida.

#### 4.1. Arquitectura del Backstop en BLEND V2

El Backstop es un contrato compartido entre todos los pools de la red. Actúa como la última línea de defensa contra las deudas incobrables. Su flujo de fondeo requiere:

```
┌─────────────────────────────────────────────────────────┐
│  1. Adquirir tokens BLND y USDC (Testnet)               │
│     ↓                                                    │
│  2. Depositar en el Comet AMM (BLND:USDC)                │
│     → Se reciben LP tokens (BLND:USDC)                   │
│     ↓                                                    │
│  3. Depositar LP tokens en el Backstop                   │
│     → backstop.deposit(from, pool_address, amount)       │
│     ↓                                                    │
│  4. Verificar que el Product Constant supere el umbral   │
│     → backstop.pool_data(pool) → { shares > 0 }         │
│     ↓                                                    │
│  5. Activar el Pool con set_status(1)                    │
└─────────────────────────────────────────────────────────┘
```

**Contratos involucrados en el fondeo:**
- **Comet AMM** (`CA5UTUUPHYL5K22...`): Pool de liquidez BLND:USDC donde se mintean los LP tokens.
- **Backstop V2** (`CBDVWXT433PRVTU...`): Recibe los LP tokens como depósito de seguridad asignado a un pool específico.

**Funciones clave del Backstop (referencia del SDK oficial `@blend-capital/blend-sdk`):**
```typescript
// Depositar LP tokens en el backstop para un pool específico
backstop.deposit({ from, pool_address, amount });

// Consultar datos del pool en el backstop
backstop.pool_data(pool_address);
// Retorna: { blnd, usdc, shares, tokens, q4w_pct, token_spot_price }

// Mintear LP tokens en el Comet AMM
comet.deposit_single_max_in(token_address, max_amount_in, pool_amount_out, user);
comet.joinPool(pool_amount_out, [max_blnd, max_usdc], user);
```

#### 4.2. Bloqueador: Obtención de BLND/USDC en Testnet

Los tokens BLND y USDC en la Testnet de Stellar son **Stellar Asset Contracts (SAC)** emitidos por cuentas específicas controladas por el equipo de Blend/Circle. A diferencia de XLM (que se obtiene vía Friendbot), estos tokens requieren:
- Ser obtenidos mediante el Faucet propio de Blend (si existe), o
- Utilizar los scripts de testing del repo `blend-utils` que presuponen acceso a cuentas con fondos pre-existentes, o
- Contactar al equipo de Script3/Blend Capital para solicitar tokens de prueba.

---

### 5. Estado Actual del Despliegue

| Componente | Estado | ID / Detalle |
|---|---|---|
| Commodity Oracle | ✅ Desplegado e inicializado | `CA3Q57COKCOX3FUQGDWDBLY7RFITECDQ3RJIABSFJJLHIREWFNLJVN3U` |
| Oracle Precios AURA | ✅ Seteado ($1.00 USD) | `10_000_000` (7 decimales) |
| Oracle Precios XLM | ✅ Seteado ($0.10 USD) | `1_000_000` (7 decimales) |
| BLEND Pool (Factory) | ✅ Desplegado | `CBFFQS7ZAICT3Z46VYDZUBLOKBGJDM2FWCNAMILCBIPVURCNWXPCQM5H` |
| Reserve 0 — AURA | ✅ Configurada (colateral, c=70%) | index 0 |
| Reserve 1 — XLM | ✅ Configurada (borrowable, l=75%) | index 1 |
| Backstop Funding | ⏳ Pendiente | Requiere LP tokens BLND:USDC |
| Pool Activation | ⏳ Bloqueado por Backstop | `set_status(1)` falla con #1200 |
| Backend LendingService | ✅ Implementado | `backend/src/lending/` |
| Frontend LendingPage | 📋 Tarea pendiente | Próxima iteración |

### 6. Variables de Entorno Actualizadas (`backend/.env`)

```env
# --- Stellar Soroban ---
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_SECRET_KEY=SD3NJFRO5XBUUPCR3S6M4UBOEGZN6V2MTU2M77NMWDFF3CVBFDZN47JC

# --- Contract IDs ---
GUARANTEE_TOKEN_CONTRACT_ID=CC4HUPWEQCRRME4AQKND72QFDMLVYD3TX5DUJ2MCU5KN25UUFWWZDTTH

# --- BLEND Protocol ---
BLEND_POOL_ID=CBFFQS7ZAICT3Z46VYDZUBLOKBGJDM2FWCNAMILCBIPVURCNWXPCQM5H
BLEND_ORACLE_ID=CA3Q57COKCOX3FUQGDWDBLY7RFITECDQ3RJIABSFJJLHIREWFNLJVN3U
BLEND_BACKSTOP_ID=CBDVWXT433PRVTUNM56C3JREF3HIZHRBA64NB2C3B2UNCKIS65ZYCLZA
```

### 7. Próximos Pasos para la Activación Completa

1. **Obtener tokens BLND y USDC** de la Testnet (vía faucet de Blend o contactando al equipo de Script3).
2. **Mintear LP tokens** depositando BLND:USDC en el Comet AMM (`CA5UTUU...`).
3. **Fondear el Backstop** depositando LP tokens para el pool `CBFFQS7Z...`.
4. **Activar el Pool** con `set_status --pool_status 1`.
5. **Fondear liquidez inicial** depositando XLM en la Reserve 1 para que haya activos disponibles para prestar.
6. **Testing E2E**: Supply AURA → Borrow XLM → Repay → Withdraw.
7. **Frontend**: Implementar la `LendingPage` conectada a los endpoints del `LendingModule`.

> **Conclusión:** El pool de lending SGR-DIGI existe on-chain con toda su configuración económica correcta (reservas, oráculo, parámetros de interés). El único bloqueador para su activación operativa es el fondeo del Backstop con LP tokens BLND:USDC, un requisito de seguridad inherente al diseño del protocolo BLEND que protege a los depositantes contra pérdidas por liquidaciones fallidas.
