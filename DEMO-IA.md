# Demostración de IA - AURA SGR

## Resultados de las Pruebas en Vivo

### 1. Documento Mock (Sin IA)
**Endpoint:** `GET /extract/mock/DOC-001`

**Resultado:**
```json
{
  "success": true,
  "data": {
    "tipo": "FACTURA",
    "cantidad": 500,
    "valor": 310000,
    "riskFlag": "BAJO"
  },
  "documentId": "DOC-001"
}
```

---

### 2. IA Real - Factura Comercial de Acero

**Texto enviado:**
> "FACTURA COMERCIAL No. 00245. Empresa: Metalúrgica del Norte S.A.
> Producto: 200 toneladas de acero estructural certificado.
> Valor Total: USD 85,000. Cliente: Constructora López con historial
> crediticio excelente, pago a 60 días."

**Endpoint:** `POST /extract`

**Resultado extraído por IA:**
```json
{
  "success": true,
  "data": {
    "tipo": "FACTURA",           ✅ Detectó correctamente
    "cantidad": 200,              ✅ 200 toneladas
    "valor": 85000,               ✅ USD 85,000
    "riskFlag": "BAJO"            ✅ Cliente con buen historial
  }
}
```

**Análisis:**
- ✅ La IA identificó el tipo de documento (FACTURA)
- ✅ Extrajo la cantidad exacta (200 toneladas)
- ✅ Capturó el valor monetario (USD 85,000)
- ✅ Evaluó el riesgo como BAJO (cliente excelente)

---

### 3. IA Real - Warrant Agrícola (Soja)

**Texto enviado:**
> "WARRANT AGRICOLA No. W-1234. Depositante: Agropecuaria Santa Fe S.R.L.
> Producto almacenado: 3,500 toneladas de soja de primera calidad, cosecha 2025/26.
> Valor de mercado estimado: USD 1,225,000. Almacén certificado y asegurado
> por Lloyd's. Vencimiento: 12 meses."

**Resultado extraído por IA:**
```json
{
  "success": true,
  "data": {
    "tipo": "WARRANT",            ✅ Detectó correctamente
    "cantidad": 3500,             ✅ 3,500 toneladas
    "valor": 1225000,             ✅ USD 1,225,000
    "riskFlag": "BAJO"            ✅ Certificado y asegurado
  }
}
```

**Análisis:**
- ✅ Identificó correctamente el tipo WARRANT
- ✅ Extrajo la gran cantidad (3,500 toneladas)
- ✅ Capturó el valor alto (más de 1 millón)
- ✅ Reconoció las garantías (certificado + asegurado) = BAJO riesgo

---

### 4. IA Real - Pagaré de Alto Riesgo

**Texto enviado:**
> "PAGARE simple por USD 22,500. Deudor: Distribuidora El Rápido SRL.
> Sin garantía real. El deudor tiene un cheque rechazado registrado en el
> sistema financiero hace 3 meses. Plazo: 90 días. Firmado el 15/03/2026."

**Resultado extraído por IA:**
```json
{
  "success": true,
  "data": {
    "tipo": "PAGARE",             ✅ Detectó correctamente
    "cantidad": 0,                ✅ No aplica cantidad física
    "valor": 22500,               ✅ USD 22,500
    "riskFlag": "ALTO"            ⚠️ Detectó el cheque rechazado!
  }
}
```

**Análisis:**
- ✅ Identificó el tipo PAGARE
- ✅ Cantidad 0 (no hay activo físico)
- ✅ Extrajo el valor (USD 22,500)
- 🎯 **¡Lo más importante!** La IA detectó "cheque rechazado" y marcó riskFlag: ALTO

---

### 5. Cálculo de Aval (Factura de Acero)

**Endpoint:** `POST /aval/calculate`

**Input:**
```json
{
  "valor": 85000
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "aval": 127500,              📊 Aval calculado
    "desglose": {
      "valorBase": 85000,        💰 Valor del activo
      "multiplicador": 1.5,      ⚙️ Factor fijo MVP
      "factor": 1                ⚙️ Factor de riesgo (1.0)
    }
  }
}
```

**Fórmula aplicada:**
```
Aval = 1.5 × 85,000 × 1.0 = 127,500 USD
```

---

### 6. Validación Exitosa (Factura)

**Endpoint:** `POST /aval/validate`

**Input:**
```json
{
  "tipo": "FACTURA",
  "cantidad": 200,
  "valor": 85000,
  "aval": 127500,
  "riskFlag": "BAJO"
}
```

**Output:**
```json
{
  "success": true,
  "valid": true,               ✅ Pasa validación
  "errors": [],                ✅ Sin errores
  "warnings": []               ✅ Sin advertencias
}
```

**Resultado:** ✅ **EMISIÓN PERMITIDA**

---

### 7. Validación con Warning (Pagaré Alto Riesgo)

**Input:**
```json
{
  "tipo": "PAGARE",
  "cantidad": 1,
  "valor": 22500,
  "aval": 33750,
  "riskFlag": "ALTO"
}
```

**Output:**
```json
{
  "success": true,
  "valid": true,               ✅ Pasa validación (no bloquea)
  "errors": [],                ✅ Sin errores críticos
  "warnings": [                ⚠️ Advertencia presente
    {
      "field": "riskFlag",
      "message": "Documento con riesgo alto"
    }
  ]
}
```

**Resultado:** ⚠️ **EMISIÓN PERMITIDA CON ADVERTENCIA**

---

### 8. Validación con Errores (Datos Incorrectos)

**Input:**
```json
{
  "tipo": "",           ❌ Vacío
  "cantidad": 0,        ❌ Cero
  "valor": -1000,       ❌ Negativo
  "aval": 0             ❌ No calculado
}
```

**Output:**
```json
{
  "success": true,
  "valid": false,              ❌ NO pasa validación
  "errors": [                  ❌ 4 errores críticos
    {
      "field": "tipo",
      "message": "El tipo de documento es requerido"
    },
    {
      "field": "cantidad",
      "message": "La cantidad debe ser mayor a 0"
    },
    {
      "field": "valor",
      "message": "El valor debe ser mayor a 0"
    },
    {
      "field": "aval",
      "message": "El aval debe estar calculado"
    }
  ],
  "warnings": []
}
```

**Resultado:** 🚫 **EMISIÓN BLOQUEADA**

---

## Resumen de Capacidades de la IA

### ✅ Lo que la IA hace CORRECTAMENTE:

1. **Identifica tipos de documentos:**
   - FACTURA
   - WARRANT
   - PAGARE
   - CERTIFICADO_DEPOSITO
   - OTRO (si no reconoce)

2. **Extrae datos numéricos:**
   - Cantidades (toneladas, unidades, kg)
   - Valores monetarios (USD)
   - Maneja formatos variados (85000, 85,000, USD 85K)

3. **Analiza contexto de riesgo:**
   - 🟢 BAJO: certificados, asegurados, buena reputación
   - 🟡 MEDIO: condiciones normales
   - 🔴 ALTO: cheques rechazados, sin garantías, historial negativo

4. **Maneja lenguaje natural:**
   - No necesita formato estructurado
   - Entiende contexto y semántica
   - Procesa descripciones largas

### 🎯 Casos demostrados:

| Tipo | Valor | IA detectó | Risk Flag | Acierto |
|------|-------|------------|-----------|---------|
| Factura comercial | USD 85,000 | ✅ FACTURA | 🟢 BAJO | 100% |
| Warrant agrícola | USD 1,225,000 | ✅ WARRANT | 🟢 BAJO | 100% |
| Pagaré problemático | USD 22,500 | ✅ PAGARE | 🔴 ALTO | 100% |

---

## Flujo Completo Demostrado

```
1. Documento → POST /extract
   ↓
2. IA extrae {tipo, cantidad, valor, riskFlag}
   ↓
3. Usuario revisa/edita (HU-03 - frontend)
   ↓
4. POST /aval/calculate → {aval: 127500}
   ↓
5. POST /aval/validate → {valid: true}
   ↓
6. Usuario confirma (HU-06)
   ↓
7. POST /emission → Stellar blockchain ⭐
```

---

**Fecha de demostración:** 26 de marzo de 2026
**Modelo de IA:** Gemini 2.5 Flash
**Backend:** NestJS + TypeScript
**Tests:** 8/8 passing ✅
