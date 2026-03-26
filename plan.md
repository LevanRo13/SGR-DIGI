# Plan: AURA SGR MVP — 40 Horas, Stellar-First, Pragmático

## TL;DR
Transformar el plan actual (*30h, Ethereum*) a un MVP realista de **40 horas centrado en Stellar**. Priorizar Backend (API + Stellar Testnet) + Frontend UI atractiva sobre completitud técnica. IA real pero con dataset mínimo. Horizon API (no Soroban) para MVP. Equipo flexible: Backend/Frontend concentran 60-65% del tiempo; Trainees y Vendedor en roles de soporte táctico.

## Documento de Ejecucion de HUs

La implementacion del sprint queda operacionalizada en `HUs_MVP.md`, con:
- Historias de usuario P0 y P1
- Criterios de aceptacion por HU
- Estimacion por HU
- Orden de implementacion y ownership por rol

---

## Plan de Implementación

### **FASE 1: Fundación (Horas 1-12)**
Configurar stack base, Stellar, IA placeholder, dataset mínimo.

#### Backend (8h)
1. **Setup NestJS + Stellar Testnet** (3h)
   - Crear proyecto NestJS con estructura modular
   - Integrar `js-stellar-sdk` y configurar cliente Horizon API para Stellar Testnet
   - Crear endpoints base: POST `/upload-asset`, GET `/get-scoring`, POST `/issue-guarantee`
   - Referencia: usar patrones de módulos NestJS (Auth, Assets, Blockchain)

2. **Integración LLM mínima** (3h)
   - Conectar Gemini/OpenAI con prompt minimalista (extraer: tipo, cantidad, valor, risk-flag)
   - Hacer **2-3 ejemplos hardcodeados** (Warrant, Certificado, Factura) para demostraciones rápidas
   - Respuesta esperada: JSON estructurado (no hay OCR real, solo LLM-based extraction)

3. **Lógica de colateralización + Validación** (2h)
   - Implementar fórmula: `Aval = 1.5 × Valor × Factor` (Factor = 1.0 por ahora, sin IA dinámica)
   - Crear servicio de validación simple (activo > 0, factor en rango [0.8-1.0])

#### Frontend (2h)
1. **Setup React + Tailwind/Shadcn + Estructura Dashboard** (2h)
   - Template Pro Dashboard con rutas base: `/dashboard`, `/upload`, `/guarantee`
   - Chat widget placeholder (solo UI, sin lógica)
   - Preparar navegación y layout para Fase 2

#### Trainees (2h)
1. **Trainee 1 (Data)**: Crear dataset mínimo 3-5 ejemplos de prueba (JSON) + prompt inicial
2. **Trainee 2 (QA)**: Setup Postman, documentar endpoints, crear primera batería de pruebas

---

### **FASE 2: Integración Frontend-Backend + Stellar Live (Horas 13-24)**
Conectar UI ↔ API, demostración Stellar funcional, flujo end-to-end visible.

#### Frontend (8h)
1. **Flujo de Upload de Activos** (4h)
   - Drag-and-drop para imagen/PDF (mock de OCR con vista previa)
   - Animaciones de "pensamiento IA" (skeleton loaders + progress bars) → simulan extracción real
   - Mostrar JSON de respuesta del Backend en tiempo real

2. **Certificado Digital + QR** (3h)
   - Mostrar "Certificado de Garantía" con:
     - Datos extraídos (tipo, cantidad, valor, aval otorgado)
     - Hash/TX de Stellar (copiar al portapapeles)
     - QR que linkee a Stellar Testnet Explorer

3. **Polish UI** (1h)
   - Responsive mobile, colores AURA brand, iconografía

#### Backend (4h)
1. **Integración Stellar Transacciones** (3h)
   - Crear cuenta Stellar en Testnet (si no existe)
   - Implementar endpoint POST `/create-guarantee` que:
     - Genera transacción XDR (describe activo + hash de certificado)
     - Firma y envía a Stellar Testnet vía Horizon API
     - Devuelve TX hash + link a explorador
   - Referencia: `js-stellar-sdk` - métodos `TransactionBuilder`, `Server.submitTransaction()`

2. **Validación de Respuestas Stellar** (1h)
   - Confirmar recepción de TX, almacenar localmente (JSON), devolver dados al Frontend

#### Trainees (2h)
1. **Trainee 1**: Ajustar prompts LLM con los 3-5 ejemplos reales, validar NO halucina
2. **Trainee 2**: Testing end-to-end con Postman + Frontend, cargar PyMEs ficticias para demo

---

### **FASE 3: Pulido MVP + Documentación (Horas 25-32)**
Asegurar demo fluida, dataset listo, Stellar sin errores.

#### Backend (2h)
1. Manejo de errores Stellar (sin saldo, TX rechazada)
2. Cachear precios de referencia (archivo JSON simple)
3. Logs estructurados

#### Frontend (3h)
1. UX final: iconos, animaciones suaves, tooltips
2. Error boundaries, manejo de estados vacíos
3. Responsive testing en móvil (Tailwind breakpoints)

#### Trainees (2h)
1. **Trainee 1**: Crear 5-10 ejemplos más refinados; validar dataset final
2. **Trainee 2**: Testing exhaustivo (Postman, navegador, mobile), cargar datos demo en dashboard

#### Vendedor (1h)
1. Investigación inicial: cómo funcionan SGRs hoy, qué problemas tienen
2. Identificar 2-3 PyMEs que podrían beneficiarse de AURA (contactos, testimonios)
3. Preparar narrativa del problema (tiempo, costo, fricción) para la demo

---

### **FASE 4: Demo Listos + Cierre (Horas 33-40)**

#### Backend + Frontend (2h)
1. Última ronda de bugs criticos
2. Ensayo demo end-to-end para jurado

#### Trainees (1.5h)
1. Cargar último dataset en dashboard
2. QA final

#### Vendedor (4.5h)
1. **Investigación Profunda de Mercado Real** (2h)
   - ¿Cuánto tarda hoy un aval bancario/SGR? (20-30 días, ~5% de rechazo, ¿costos?)
   - ¿Qué problemas puntales tienen las PyMEs? (falta de garantías aceptadas, costo, tiempo, trabas)
   - Benchmarks: ¿cómo funciona Agrotoken, Centrifuge en blockchain? (casos reales, no ficción)
   - Entrevistas cortas (LinkedIn, calls): al menos 2-3 PyMEs/SGRs actuales sobre pain points

2. **Construcción de la Narrativa del Problema** (1.5h)
   - Documento corto (1 página): "Problema: La fricción en avales cuesta dinero + tiempo"
   - Datos: tiempo actual vs AURA (20 días → 20 segundos), costo estimado (¿ahorros?)
   - Cierre: "Por eso existe AURA"

3. **Guion de Demo + Q&A** (1h)
   - Qué dice durante los 5-8 minutos de demo: no técnico, enfocado en "Un PyME sube certificado y en 20 segundos obtiene garantía"
   - Respuestas a objeciones: "¿y si la IA erra?" / "¿es legal esto?" 
   - Cierre de pitch: TIEMPO = dinero, motivo por el que otros ya lo hacen en blockchain

---

**Rol Resume**: El Vendedor es un **detective de mercado** que da credibilidad a AURA mostrando qué problemas reales solucionaría. No es técnico, es **comunicador de impacto**.

---

## Rol del Vendedor (Clarificación)

**Perfil**: Investigador de mercado + comunicador. **NO técnico, NO abogado.**

**Tareas Concretas**:
1. **Research** (Fases 1-3, 2h distribuidas):
   - Estudiar cómo funcionan SGRs hoy (tiempo, costo, procesos)
   - Identificar PyMEs reales con problemas que AURA soluciona
   - Entrevistar 2-3 PyMEs/SGRs para validar pain points

2. **Narrativa** (Fase 3, 1.5h):
   - Documento: "El Problema" (fricción en avales = costo + tiempo)
   - Benchmark: por qué otros ya lo hacen en blockchain

3. **Demo Script** (Fase 4, 1h):
   - Guion oral de 5-8 min (no técnico): qué es AURA, qué problema solvería
   - Responder objeciones
   - Cierre: TIEMPO = dinero

**Output final**: Presentación oral + demostración en vivo de Backend + Frontend + Stellar TX

**Éxito**: Jurado entiende que:
- Hoy los avales son lentos y caros
- AURA soluciona eso
- Esto ya ocurre en blockchain afuera (Agrotoken, Centrifuge)

| Aspecto | Original | Nuevo |
|---------|----------|-------|
| **Blockchain** | Ethereum Sepolia (ethers.js) | **Stellar Testnet (Horizon API)** |
| **Smart Contracts** | Pseudo-contrato con Hash | Transacción XDR en Stellar (Soroban es roadmap) |
| **IA Scoring** | Completa, integrada LLM | **Hybrid**: LLM real pero fixture-heavy, Factor = 1.0 para MVP |
| **OCR/NLU** | Completa | **Simulada**: LLM placeholder, drag-drop mock |
| **Dataset** | 5-10 ejemplos reales | **3-5 core + 5-10 ajustados** en Fase 3 |
| **Frontend Scope** | Completo Dashboard Pro | **UI atractiva + flujo core** (sin tablas de histórico, without ABM completo) |
| **QA/Testing** | Testeo exhaustivo | **Testing pragmático** (Postman + browser, no automatizado) |
| **Enfoque Time** | Funcionalidad total | **Demo fluida + Stellar proof-of-concept** |

---

## Archivos Clave a Modificar/Crear

- **Backend**: `src/main.ts`, `src/app.module.ts`, `src/blockchain/stellar.service.ts`, `src/assets/assets.controller.ts`, `src/assets/assets.service.ts`
- **Frontend**: `src/App.tsx`, `src/pages/Dashboard.tsx`, `src/pages/Upload.tsx`, `src/pages/Guarantee.tsx`, `src/components/ChatWidget.tsx`
- **Config**: `.env` (Stellar Testnet RPC, LLM key), `dataset.json` (ejemplos de prueba)

---

## Verificación & Demo

1. **Backend**: POST a `/upload-asset` + GET `/get-scoring` devuelve JSON con scoring
2. **Stellar**: `POST /issue-guarantee` → TX en Stellar Testnet visible en explorador dentro de 5-10 seg
3. **Frontend**: Drag-drop → carga → resultado → QR funcional → refrescas explorador y ves TX
4. **IA**: LLM extrae datos de 3-5 ejemplos sin alucinar
5. **Presentación**: Pitch < 10 min, demo < 5 min de upload-a-hash, jurado entiende TIEMPO = valor

---

## Scope Explicitamente EXCLUIDO (Roadmap Post-MVP)

- ❌ OCR real (Tesseract, Vision API)
- ❌ Smart Contract Soroban completo
- ❌ Scoring dinámico basado en IA
- ❌ ABM de PyMEs, historial de transacciones, dashboards analytics
- ❌ Testing automatizado (Jest, E2E)
- ❌ Integración de Oráculos de precios (LME, BCR) en tiempo real
- ❌ Multi-wallet support, gestión de claves avanzada

---

## Decisiones & Supuestos

1. **Stellar Testnet es suficiente** para MVP (no mainnet)
2. **Factor de Confianza (AI) = 1.0** en MVP (sin lógica de scoring dinámico)
3. **Dataset mínimo** acelera turnaround, permite QA rápida
4. **Prompt LLM es el 80% de la calidad** de extracción → dedicar tiempo a ajustes
5. **Équipo flexible** permite pivotear soporte según bloqueos
6. **Demo > Documentación**: priorizar que Jurado vea Stellar live + UI bonita

---

## Preguntas Abiertas / Exploración Futura

1. ¿Cómo integrar oráculos de precios reales (LME, BCR) sin agregar complejidad? → Mockear por ahora
2. ¿Qué biblioteca Python/JS es mejor para Stellar? → js-stellar-sdk (MVP); explorar Stellar.py post-MVP
3. ¿Factor de Confianza debe ser % o score 0-100?  → Definir durante desarrollo Backend
4. ¿Qué es el alcance exacto del "Certificado Digital"? → XDR + hash en Stellar + QR.


## Estado de Consolidación

Este documento refleja **todo el plan detallado en el chat**:
- Restricción total de 40 horas de equipo
- MVP estricto con foco en integración Stellar
- IA en modo híbrido (real + dataset mínimo)
- UI atractiva + API funcional + prueba de concepto Stellar
- Rol del Vendedor redefinido como investigador de mercado + comunicador
- Exclusiones explícitas para no desbordar alcance en MVP

Se toma como supuesto que arquitectura detallada y HUs se trabajaron en iteraciones previas, y este plan actúa como capa de ejecución/priorización del sprint MVP.

