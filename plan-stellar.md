# Plan de Integración Stellar — SGR-DIGI MVP

## Resumen

Integrar Stellar Testnet al backend NestJS para registrar garantías como transacciones on-chain con trazabilidad verificable, manejo de errores con reintento, persistencia local en JSON y datos completos para certificado digital + QR.

**Owner**: Blockchain / Smart Contracts dev  
**HUs cubiertas**: HU-07, HU-08, HU-12 (+ guardas de HU-05 en DTOs)  
**HUs NO cubiertas** (otro dev): HU-04/HU-05 (cálculo de aval)

---

## Decisiones Técnicas

| Decisión | Valor |
|---|---|
| Red | Stellar Testnet via Horizon API |
| SDK | `@stellar/stellar-sdk` (última estable) |
| Tipo de memo | `MEMO_TEXT` — ID legible ej: `AURA-OP001` |
| Cuenta Stellar | Creada manualmente + Friendbot fallback en código |
| Secret key | En `.env` (aceptable para MVP) |
| Persistencia | `data/operations.json` (archivo local) |
| Smart contracts (Soroban) | Excluido del MVP |
| Respuesta de `/guarantee` | Devuelve toda la data para certificado + QR |

---

## Fase 1 — Setup y Dependencias

### 1.1 Instalar paquetes

```bash
cd backend
npm install @stellar/stellar-sdk class-validator class-transformer uuid
npm install -D @types/uuid
```

### 1.2 Configurar `.env`

```env
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_SECRET_KEY=<tu_secret_key>
```

---

## Fase 2 — Módulo Stellar (HU-07)

### 2.1 Estructura de archivos

```
backend/src/stellar/
├── stellar.module.ts
├── stellar.service.ts
├── stellar.controller.ts
├── operations.repository.ts
└── dto/
    └── create-guarantee.dto.ts
```

### 2.2 `StellarService`

Responsabilidades:
- Inicializar cliente Horizon Testnet desde env vars
- Cargar keypair desde `STELLAR_SECRET_KEY`
- **`createGuarantee(data)`**: construir TX con `MEMO_TEXT("AURA-{shortId}")`, firmar con keypair, enviar via Horizon, retornar hash + explorer URL
- **`getTransactionStatus(hash)`**: consultar TX en Horizon
- **`checkHealth()`**: ping a Horizon para verificar conectividad

### 2.3 `StellarController`

| Endpoint | Método | HU | Descripción |
|---|---|---|---|
| `/guarantee` | POST | HU-07 | Crear garantía + registrar en Stellar |
| `/guarantee` | GET | HU-12 | Listar operaciones |
| `/guarantee/:id` | GET | HU-12 | Detalle de operación |
| `/guarantee/:id/retry` | POST | HU-08 | Reintentar TX fallida |
| `/stellar/health` | GET | — | Estado de conexión a Horizon |

### 2.4 DTO `CreateGuaranteeDto`

```typescript
{
  tipo: string;           // FACTURA, WARRANT, PAGARE, etc.
  cantidad: number;       // toneladas, unidades, etc.
  valor: number;          // USD
  aval: number;           // monto aval calculado
  operatorConfirmed: boolean; // debe ser true para emitir
}
```

Validación: si falta campo requerido o `operatorConfirmed !== true` → error 400.

### 2.5 Respuesta de `POST /guarantee`

Devuelve toda la data necesaria para certificado (HU-09) y QR (HU-10):

```json
{
  "success": true,
  "data": {
    "id": "OP-20260326-001",
    "tipo": "FACTURA",
    "cantidad": 500,
    "valor": 310000,
    "aval": 465000,
    "fecha": "2026-03-26T19:00:00Z",
    "estado": "confirmed",
    "txHash": "abc123def456...",
    "explorerUrl": "https://stellar.expert/explorer/testnet/tx/abc123def456...",
    "network": "Stellar Testnet",
    "memoText": "AURA-OP001"
  }
}
```

---

## Fase 3 — Manejo de Errores y Reintento (HU-08)

### Flujo de error

1. Si Stellar falla → guardar operación con `estado: "failed"` y `error: "motivo legible"`
2. Frontend muestra botón de reintento
3. `POST /guarantee/:id/retry` busca la operación, verifica que NO esté ya confirmada en Horizon (idempotencia), y re-envía

### Idempotencia

Antes de retry:
- Consultar Horizon por el hash previo (si existe)
- Si TX ya confirmada → retornar éxito sin re-enviar
- Si TX no existe → re-construir y enviar

### Mensajes de error legibles

| Error Stellar | Mensaje al usuario |
|---|---|
| Account not found | "La cuenta Stellar no está configurada. Contactar al administrador." |
| Insufficient balance | "Saldo insuficiente en la cuenta Stellar para cubrir fees." |
| Timeout / Network | "La red Stellar no respondió. Intente nuevamente en unos segundos." |
| TX rejected | "La transacción fue rechazada por la red. Verifique los datos e intente de nuevo." |

---

## Fase 4 — Persistencia Local (HU-12)

### `OperationsRepository`

- Archivo: `backend/data/operations.json`
- Cada operación almacena: `id`, `estado`, `timestamp`, `tipo`, `cantidad`, `valor`, `aval`, `txHash`, `explorerUrl`, `memoText`, `error?`
- Estados posibles: `pending` → `submitted` → `confirmed` | `failed`
- Métodos: `save()`, `findById()`, `findAll()`, `updateStatus()`
- Si falla escritura → log warning, no rompe flujo principal

---

## Fase 5 — Testing con Postman

### 5.1 Configuración

Crear collection **"SGR-DIGI Stellar"** con variables de entorno:

| Variable | Valor |
|---|---|
| `base_url` | `http://localhost:3000` |
| `guarantee_id` | *(se setea dinámicamente)* |

### 5.2 Requests

#### Test 1: Health Check
```
GET {{base_url}}/stellar/health

Expected: 200
{
  "success": true,
  "data": { "online": true, "network": "Stellar Testnet", "horizonUrl": "..." }
}
```

#### Test 2: Crear garantía (flujo feliz)
```
POST {{base_url}}/guarantee
Content-Type: application/json

{
  "tipo": "FACTURA",
  "cantidad": 500,
  "valor": 310000,
  "aval": 465000,
  "operatorConfirmed": true
}

Expected: 201
- success: true
- data.txHash: string no vacío
- data.explorerUrl: URL válida de stellar.expert
- data.estado: "confirmed"
- data.memoText: empieza con "AURA-"

Post-test script:
  pm.environment.set("guarantee_id", pm.response.json().data.id);
```

#### Test 3: Verificar TX en explorer
```
Abrir manualmente: {{explorerUrl}} del test anterior
Verificar:
- [ ] TX existe en Stellar Testnet
- [ ] Memo coincide con memoText
- [ ] Cuenta origen es la configurada
```

#### Test 4: Error — sin confirmación
```
POST {{base_url}}/guarantee
{
  "tipo": "FACTURA",
  "cantidad": 500,
  "valor": 310000,
  "aval": 465000,
  "operatorConfirmed": false
}

Expected: 400
- success: false
- error: mensaje legible sobre confirmación requerida
```

#### Test 5: Error — campos faltantes
```
POST {{base_url}}/guarantee
{
  "tipo": "FACTURA"
}

Expected: 400
- success: false
- error: indica qué campos faltan
```

#### Test 6: Listar operaciones
```
GET {{base_url}}/guarantee

Expected: 200
- success: true
- data: array con al menos 1 operación del Test 2
- Cada item tiene: id, estado, tipo, txHash
```

#### Test 7: Detalle de operación
```
GET {{base_url}}/guarantee/{{guarantee_id}}

Expected: 200
- Todos los campos del certificado presentes
- txHash coincide con Test 2
```

#### Test 8: Reintento sobre operación confirmada (idempotencia)
```
POST {{base_url}}/guarantee/{{guarantee_id}}/retry

Expected: 200
- success: true
- data.txHash: mismo hash que antes (no duplicó TX)
```

#### Test 9: Reintento sobre operación fallida
```
Forzar fallo (ej: desconectar red o usar secret key inválida)
POST {{base_url}}/guarantee → guardar ID de operación fallida
POST {{base_url}}/guarantee/{{failed_id}}/retry

Expected: 201
- success: true
- data.estado: "confirmed"
- Nuevo txHash generado
```

### 5.3 Checklist de validación final

- [ ] Test 1: Health → online
- [ ] Test 2: Garantía creada → TX en Stellar
- [ ] Test 3: TX verificada en explorer
- [ ] Test 4: Error sin confirmación → 400
- [ ] Test 5: Error campos faltantes → 400
- [ ] Test 6: Listado incluye operaciones
- [ ] Test 7: Detalle con data completa de certificado
- [ ] Test 8: Retry idempotente → no duplica
- [ ] Test 9: Retry de fallo → nueva TX exitosa

---

## Flujo End-to-End (completo)

```
Frontend                    Backend API              StellarService         Horizon
   │                            │                        │                    │
   │── POST /extract ──────────▶│                        │                    │
   │◀── { tipo, valor, ... } ──│                        │                    │
   │                            │                        │                    │
   │── POST /guarantee ────────▶│                        │                    │
   │                            │── validar campos ─────▶│                    │
   │                            │── createGuarantee() ──▶│                    │
   │                            │                        │── SHA256(data) ───▶│
   │                            │                        │── build TX ───────▶│
   │                            │                        │── memo AURA-xxx ──▶│
   │                            │                        │── sign + submit ──▶│
   │                            │                        │◀── { hash } ───────│
   │                            │◀── { txHash, url } ───│                    │
   │◀── { success, full data } ─│                        │                    │
   │                            │                        │                    │
   │── render certificado ──────│                        │                    │
   │── render QR ───────────────│                        │                    │
```

---

## Archivos a Crear/Modificar

| Acción | Archivo |
|---|---|
| CREAR | `src/stellar/stellar.module.ts` |
| CREAR | `src/stellar/stellar.service.ts` |
| CREAR | `src/stellar/stellar.controller.ts` |
| CREAR | `src/stellar/dto/create-guarantee.dto.ts` |
| CREAR | `src/stellar/operations.repository.ts` |
| CREAR | `data/operations.json` (archivo inicial vacío `[]`) |
| MODIFICAR | `src/app.module.ts` (agregar StellarModule) |
| MODIFICAR | `package.json` (agregar dependencias) |
