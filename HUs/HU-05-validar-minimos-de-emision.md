# HU-05 - Validar minimos de emision

## Seguimiento
- Estado: To Do
- Responsable operativo: Backend

## Epica
Epica B - Calculo y Validacion

## HU
Como Operador SGR, quiero que el sistema valide datos minimos antes de emitir para evitar operaciones invalidas.

Prioridad: P0
Estimacion: 1h
Owner: Backend
Dependencias: HU-04

Criterios de aceptacion:
1. El sistema exige tipo, cantidad, valor y aval calculado.
2. Si falta un dato, bloquea la emision.
3. Se informa al usuario que dato falta.
4. La validacion corre antes del paso de confirmacion.

Tareas:
- Backend: guardas de validacion.
- Frontend: render de mensaje de bloqueo.

## Epica C - Emision y Blockchain

## Contexto MVP
- Objetivo: demostrar viabilidad comercial para PyMEs con flujo end-to-end rapido y entendible.
- Enfoque tecnico: Stellar-first en Testnet via Horizon API; registro de hash y metadatos minimos.
- Alcance legal: demo tecnica sin validez legal plena en MVP.
- IA y datos: extraccion LLM editable por operador, con dataset minimo para asegurar consistencia.
- Formula financiera base: Aval = 1.5 x Valor x Factor, con Factor inicial = 1.0 en MVP.
- Arquitectura relevante: Backend NestJS, Frontend React, persistencia local en JSON, QR hacia explorer.
- Restricciones clave: sin OCR real, sin Soroban completo, sin scoring dinamico de IA en esta etapa.
## Checklist QA
- [ ] Prueba manual ejecutada (UI o Postman).
- [ ] Criterios de aceptacion validados uno por uno.
- [ ] Caso de error relevante probado y documentado.
- [ ] Integracion en flujo end-to-end verificada.

