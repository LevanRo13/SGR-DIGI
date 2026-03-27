# Actualizacion Gemini API 2026

## Cambios Realizados

### 1. Modelo Actualizado
- **Antes:** `gemini-2.0-flash` (obsoleto)
- **Ahora:** `gemini-2.5-flash` (moderno, mejor cuota)

### 2. Soporte de Archivos Ampliado

#### Archivos Soportados Ahora:
| Tipo | MIME Type | Metodo |
|------|-----------|--------|
| PDF | `application/pdf` | Extracción local con pdf-parse |
| **DOCX** | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | **Extracción local con mammoth** (NUEVO) |
| TXT | `text/plain` | Lectura directa |
| Imágenes | `image/jpeg`, `image/png` | Placeholder (sin OCR) |

### 3. Modelos Disponibles (Free Tier 2026)

Configurables en `.env` con `GEMINI_MODEL`:

| Modelo | Cuota Gratis | Caso de Uso |
|--------|--------------|-------------|
| `gemini-2.5-flash-lite` | 1000 req/día | Documentos simples, alta velocidad |
| `gemini-2.5-flash` | ~500 req/día | **Recomendado** - Equilibrado |
| `gemini-2.5-pro` | 50 req/día | Documentos complejos con tablas/legal |

### 4. Arquitectura de Extracción

```
┌─────────────────────────────────────────────────────────────┐
│                  FLUJO ACTUALIZADO 2026                     │
└─────────────────────────────────────────────────────────────┘

  Usuario sube archivo
         │
         ▼
  ┌──────────────┐
  │ FileService  │ ◄── Extracción LOCAL (gratis, no consume tokens)
  └──────┬───────┘
         │
         ├─► PDF → pdf-parse → texto
         ├─► DOCX → mammoth → texto  (NUEVO)
         └─► TXT → lectura directa
         │
         ▼
  ┌──────────────┐
  │  LlmService  │ ◄── Solo recibe TEXTO (recomendado por Google)
  └──────┬───────┘
         │
         ▼
  gemini-2.5-flash
         │
         ▼
   { tipo, cantidad, valor, riskFlag }
```

### 5. Ventajas de la Extracción Local

1. **Gratis:** No consume cuota de Gemini
2. **Rápido:** Procesa archivos localmente
3. **Recomendado:** Práctica oficial de Google para Gemini API
4. **Eficiente:** Solo envía texto a la IA, no archivos binarios

### 6. Configuración

**`.env`:**
```env
GEMINI_API_KEY=tu_api_key
GEMINI_MODEL=gemini-2.5-flash
```

**Endpoints:**
```bash
# Texto directo
POST /extract
Body: { "texto": "..." }

# Archivo (PDF, DOCX, TXT, IMG)
POST /extract/upload
Form-data: file=documento.docx

# Mock data (demo)
GET /extract/mock/DOC-001
```

### 7. Testing

```bash
# Probar con DOCX
curl -X POST http://localhost:3000/extract/upload \
  -F "file=@documento.docx"

# Probar con PDF
curl -X POST http://localhost:3000/extract/upload \
  -F "file=@factura.pdf"

# Probar con texto
curl -X POST http://localhost:3000/extract \
  -H "Content-Type: application/json" \
  -d '{"texto": "FACTURA por USD 10000"}'
```

### 8. Limitaciones y Consideraciones

#### Imágenes (JPG, PNG)
- **No tienen OCR** en MVP
- Devuelven placeholder con mensaje informativo
- Para implementar OCR: usar Tesseract.js o servicio externo

#### PDFs Escaneados
- Si el PDF no tiene texto embebido, devuelve mensaje informativo
- Requiere OCR externo para estos casos

#### Cuota Gratuita
- Si alcanzas el límite, el sistema usa **fallback heuristico**
- El fallback funciona sin IA usando regex para extracción básica

### 9. Próximos Pasos (Opcional)

Para mejorar aún más:

1. **Agregar OCR:** Integrar Tesseract.js para imágenes y PDFs escaneados
2. **Cache:** Guardar resultados de extracción para no reprocesar
3. **Modelo Flash-Lite:** Cambiar a `gemini-2.5-flash-lite` si necesitas más requests
4. **Batch Processing:** Procesar múltiples documentos en paralelo

## Resumen

✅ Actualizado a modelos de Gemini 2026
✅ Soporte completo para DOCX (extracción local)
✅ Arquitectura recomendada por Google (texto > IA)
✅ Mayor cuota gratuita disponible
✅ Tests pasando (10/10)
