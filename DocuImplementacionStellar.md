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
