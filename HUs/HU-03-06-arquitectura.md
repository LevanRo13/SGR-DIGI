# HU-04 y HU-05 - Arquitectura Backend

## Endpoints

| Metodo | Ruta | HU | Descripcion |
|--------|------|-----|-------------|
| POST | /aval/calculate | HU-04 | Calcula aval |
| POST | /aval/validate | HU-05 | Valida datos minimos |

---

## POST /aval/calculate

**Request:**
```json
{
  "valor": 50000
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "aval": 75000,
    "desglose": {
      "valorBase": 50000,
      "multiplicador": 1.5,
      "factor": 1.0
    }
  }
}
```

**Response (400) - valor <= 0:**
```json
{
  "success": false,
  "error": "El valor debe ser mayor a 0"
}
```

---

## POST /aval/validate

**Request:**
```json
{
  "tipo": "FACTURA",
  "cantidad": 100,
  "valor": 50000,
  "aval": 75000,
  "riskFlag": "BAJO"
}
```

**Response (200) - valido:**
```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "warnings": []
}
```

**Response (200) - con errores:**
```json
{
  "success": true,
  "valid": false,
  "errors": [
    { "field": "valor", "message": "El valor debe ser mayor a 0" }
  ],
  "warnings": [
    { "field": "riskFlag", "message": "Documento con riesgo alto" }
  ]
}
```

---

## Reglas de Validacion

**Errores (bloquean):**
- tipo vacio
- cantidad <= 0
- valor <= 0
- aval no calculado

**Warnings (no bloquean):**
- riskFlag = ALTO
- tipo = OTRO

---

## Flujo Frontend

```
1. /extract/upload    --> obtener { tipo, cantidad, valor, riskFlag }
2. Usuario edita      --> HU-03 (frontend)
3. /aval/calculate    --> obtener { aval }
4. /aval/validate     --> verificar { valid, errors, warnings }
5. Si valid=true      --> HU-06 pantalla confirmacion (frontend)
```
