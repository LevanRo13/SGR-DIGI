# HU-02 - Plan de Implementacion Actualizado

## Resumen de Decisiones

| Aspecto | Decision |
|---------|----------|
| Entrada de datos | Mock data para demo + opcion de texto manual |
| LLM | Gemini 2.5 Flash (con tutorial de configuracion) |
| Endpoint | Recibe archivo completo (multipart/form-data) |

---

## Arquitectura Final

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO COMPLETO                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  Frontend                         Backend                        LLM
  ────────                         ───────                        ───
     │                                │                            │
     │  POST /extract/upload          │                            │
     │  [archivo PDF/JPG/PNG]         │                            │
     │ ──────────────────────────────►│                            │
     │                                │                            │
     │                                │  1. Recibir archivo        │
     │                                │  2. Extraer texto (basico) │
     │                                │  3. Enviar a Gemini        │
     │                                │ ──────────────────────────►│
     │                                │                            │
     │                                │◄─────────────────────────── │
     │                                │  4. Parsear respuesta      │
     │                                │  5. Validar schema         │
     │◄──────────────────────────────│                            │
     │  { tipo, cantidad, valor,      │                            │
     │    riskFlag }                  │                            │
```

---

## Paso 1: Configurar Gemini API

### 1.1 Obtener API Key

1. Ir a: https://aistudio.google.com/apikey
2. Click en "Create API Key"
3. Seleccionar proyecto o crear uno nuevo
4. Copiar la API Key generada

### 1.2 Configurar en el proyecto

Crear archivo `.env` en `/backend`:

```env
# Gemini AI Configuration
GEMINI_API_KEY=tu_api_key_aqui
```

### 1.3 Instalar dependencia

```bash
cd backend
npm install @google/generative-ai
```

---

## Paso 2: Endpoints a Implementar

### 2.1 POST /extract/upload (NUEVO)
Recibe archivo y extrae datos.

```typescript
// Input: multipart/form-data con campo "file"
// Output: ExtractionResponse
```

### 2.2 POST /extract (YA EXISTE)
Recibe texto plano, util para testing.

### 2.3 GET /extract/mock/:id (YA EXISTE)
Usa documentos predefinidos.

---

## Paso 3: Estructura de Archivos

```
backend/src/
├── extraction/
│   ├── extraction.module.ts      # Modulo NestJS
│   ├── extraction.controller.ts  # Endpoints
│   ├── llm.service.ts           # Servicio Gemini
│   ├── file.service.ts          # (NUEVO) Extraccion de texto de archivos
│   └── dto/
│       └── extraction.dto.ts    # (NUEVO) DTOs tipados
├── mock/
│   └── dataset.json             # Documentos de prueba
└── main.ts
```

---

## Paso 4: Orden de Implementacion

| # | Tarea | Tiempo Est. |
|---|-------|-------------|
| 1 | Configurar Gemini API Key | 10 min |
| 2 | Crear FileService para extraccion de texto | 30 min |
| 3 | Crear endpoint POST /extract/upload | 20 min |
| 4 | Probar con Postman | 15 min |
| 5 | Crear tests de contrato | 30 min |
| 6 | Documentar en checklist QA | 15 min |

**Total estimado: 2h**

---

## Paso 5: Tests de Validacion

```bash
# 1. Probar con mock
curl http://localhost:3000/extract/mock/DOC-001

# 2. Probar con texto
curl -X POST http://localhost:3000/extract \
  -H "Content-Type: application/json" \
  -d '{"texto": "Factura por 100 toneladas de soja, USD 50000"}'

# 3. Probar con archivo (cuando este implementado)
curl -X POST http://localhost:3000/extract/upload \
  -F "file=@documento.pdf"
```

---

## Siguiente Paso

Empezar con **Paso 1: Configurar Gemini API Key**

¿Tienes cuenta de Google para obtener la API Key?
