# HU-02 - Diagrama de Arquitectura

## Flujo General del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FLUJO END-TO-END                               │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐         ┌──────────────┐         ┌──────────────┐
  │  PyME    │ ──────► │   Frontend   │ ──────► │   Backend    │
  │ (Usuario)│  sube   │    React     │  POST   │   NestJS     │
  └──────────┘  doc    └──────────────┘ /extract└──────────────┘
                              │                        │
                              │                        ▼
                              │                 ┌──────────────┐
                              │                 │  LLM Service │
                              │                 │ (Gemini/Mock)│
                              │                 └──────────────┘
                              │                        │
                              │                        ▼
                              │                 ┌──────────────┐
                              ◄─────────────────│   Response   │
                             muestra            │ JSON Schema  │
                             datos              └──────────────┘
```

## Arquitectura del Endpoint de Extraccion

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         POST /extract                                       │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │      REQUEST        │
                    │  { texto: string }  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  ExtractionController│
                    │  - Valida input      │
                    │  - Log de operacion  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    LlmService       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
     ┌────────────┐   ┌────────────┐   ┌────────────┐
     │  Gemini AI │   │  Fallback  │   │  Mock Data │
     │  (si API   │   │ Heuristico │   │  (testing) │
     │   key)     │   │            │   │            │
     └────────────┘   └────────────┘   └────────────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      RESPONSE       │
                    │  ExtractionResult   │
                    └─────────────────────┘
```

## Schema de Respuesta

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ExtractionResponse                                  │
└─────────────────────────────────────────────────────────────────────────────┘

{
  "success": boolean,           // true si extraccion exitosa
  "data": {
    "tipo": string,             // FACTURA | WARRANT | PAGARE | CERTIFICADO_DEPOSITO | OTRO
    "cantidad": number,         // cantidad del activo (toneladas, unidades, etc)
    "valor": number,            // valor en USD
    "riskFlag": string          // BAJO | MEDIO | ALTO
  } | null,
  "documentId"?: string,        // opcional, si viene de mock
  "error"?: string              // mensaje de error si success=false
}
```

## Endpoints Disponibles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ENDPOINTS                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────┬─────────────────────────────────────────────────────────┐
│ Metodo + Ruta      │ Descripcion                                             │
├────────────────────┼─────────────────────────────────────────────────────────┤
│ POST /extract      │ Extrae datos de texto libre enviado en el body          │
│                    │ Input: { texto: string }                                │
│                    │ Output: ExtractionResponse                              │
├────────────────────┼─────────────────────────────────────────────────────────┤
│ GET /extract/mock  │ Lista documentos mock disponibles para testing          │
│                    │ Output: { success, documents: [{id, nombre}] }          │
├────────────────────┼─────────────────────────────────────────────────────────┤
│ GET /extract/mock/:id │ Extrae datos usando un documento mock predefinido    │
│                    │ IDs: DOC-001, DOC-002, DOC-003                          │
│                    │ Output: ExtractionResponse + documentId                 │
└────────────────────┴─────────────────────────────────────────────────────────┘
```

## Dataset de Prueba (Mock)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DOCUMENTOS MOCK                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┬─────────────────────────────────────┬────────────┬───────────────┐
│ ID       │ Tipo                                │ Valor USD  │ riskFlag      │
├──────────┼─────────────────────────────────────┼────────────┼───────────────┤
│ DOC-001  │ Factura Comercial - Aceros del Sur  │ 310,000    │ BAJO          │
│          │ (500 ton acero certificado)         │            │ (certificado) │
├──────────┼─────────────────────────────────────┼────────────┼───────────────┤
│ DOC-002  │ Warrant Agricola - Soja             │ 528,000    │ BAJO          │
│          │ (1200 ton, asegurada)               │            │ (asegurada)   │
├──────────┼─────────────────────────────────────┼────────────┼───────────────┤
│ DOC-003  │ Pagare - Industrias Metalurgicas    │ 38,135     │ ALTO          │
│          │ (sin garantia, cheque rechazado)    │            │ (riesgoso)    │
└──────────┴─────────────────────────────────────┴────────────┴───────────────┘
```

## Modos de Operacion del LLM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODOS LLM                                           │
└─────────────────────────────────────────────────────────────────────────────┘

1. GEMINI (Produccion)
   - Requiere: GEMINI_API_KEY en .env
   - Modelo: gemini-2.0-flash
   - Prompt estructurado para extraer datos financieros
   - Respuesta parseada a JSON

2. FALLBACK (Sin API Key)
   - Se activa automaticamente si no hay GEMINI_API_KEY
   - Usa heuristicas basadas en regex
   - Detecta: tipo por palabras clave, valor USD, cantidad, riskFlag

3. MOCK (Testing)
   - Usa documentos predefinidos en dataset.json
   - Ideal para demos y pruebas de integracion
```

## Criterios de Aceptacion Mapeados

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CRITERIOS → IMPLEMENTACION                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌───┬────────────────────────────────────────┬────────────────────────────────┐
│ # │ Criterio                               │ Como se cumple                 │
├───┼────────────────────────────────────────┼────────────────────────────────┤
│ 1 │ JSON con tipo, cantidad, valor,        │ ExtractionResult interface     │
│   │ riskFlag                               │ con campos tipados             │
├───┼────────────────────────────────────────┼────────────────────────────────┤
│ 2 │ Si IA falla, error controlado          │ try/catch + fallback           │
│   │                                        │ heuristico automatico          │
├───┼────────────────────────────────────────┼────────────────────────────────┤
│ 3 │ Schema consistente en todos los casos  │ Interface TypeScript +         │
│   │                                        │ validacion de estructura       │
├───┼────────────────────────────────────────┼────────────────────────────────┤
│ 4 │ Tiempo apto para demo                  │ Timeout configurable,          │
│   │                                        │ fallback rapido si falla       │
└───┴────────────────────────────────────────┴────────────────────────────────┘
```

## Preguntas Pendientes

1. **Conexion con HU-01**: El frontend ya tiene el componente de upload?
   - Si es asi, como pasa el texto al backend? (archivo completo vs texto extraido)

2. **Sin OCR real**: Como se obtiene el texto del documento?
   - Opcion A: El usuario pega/escribe el texto manualmente
   - Opcion B: Se usa texto simulado del dataset mock
   - Opcion C: Se extrae texto basico del PDF (sin OCR avanzado)

3. **Persistencia**: Los resultados de extraccion se guardan en JSON local?
   - Esto conecta con HU-12 (persistir operaciones)

4. **Edicion por operador**: HU-03 permite editar los datos extraidos?
   - Afecta el flujo de como se pasan los datos al siguiente paso
