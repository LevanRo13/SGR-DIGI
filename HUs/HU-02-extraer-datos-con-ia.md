# HU-02 - Extraer datos con IA

## Seguimiento
- Estado: Done
- Responsable operativo: Backend

## Epica
Epica A - Ingesta y Extraccion

## HU
Como Operador SGR, quiero que el sistema extraiga campos clave del documento para acelerar analisis.

Prioridad: P0
Estimacion: 3h
Owner: Backend
Dependencias: HU-01

Criterios de aceptacion:
1. El endpoint devuelve JSON con tipo, cantidad, valor y riskFlag.
2. Si la IA falla, el sistema devuelve error controlado.
3. La respuesta mantiene schema consistente en todos los casos validos.
4. El tiempo de respuesta es apto para demo (sin bloqueo indefinido).

Tareas:
- Backend: endpoint de extraccion con provider LLM.
- Trainee data: validar 3-5 ejemplos core.
- QA: test de contrato del schema de respuesta.

## Contexto MVP
- Objetivo: demostrar viabilidad comercial para PyMEs con flujo end-to-end rapido y entendible.
- Enfoque tecnico: Stellar-first en Testnet via Horizon API; registro de hash y metadatos minimos.
- Alcance legal: demo tecnica sin validez legal plena en MVP.
- IA y datos: extraccion LLM editable por operador, con dataset minimo para asegurar consistencia.
- Formula financiera base: Aval = 1.5 x Valor x Factor, con Factor inicial = 1.0 en MVP.
- Arquitectura relevante: Backend NestJS, Frontend React, persistencia local en JSON, QR hacia explorer.
- Restricciones clave: sin OCR real, sin Soroban completo, sin scoring dinamico de IA en esta etapa.
## Checklist QA
- [x] Prueba manual ejecutada (UI o Postman).
- [x] Criterios de aceptacion validados uno por uno.
- [x] Caso de error relevante probado y documentado.
- [x] Integracion en flujo end-to-end verificada.

