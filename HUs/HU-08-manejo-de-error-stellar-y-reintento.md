# HU-08 - Manejo de error Stellar y reintento

## Seguimiento
- Estado: To Do
- Responsable operativo: Backend

## Epica
Epica C - Emision y Blockchain

## HU
Como Operador SGR, quiero reintentar cuando falle Stellar para no perder la operacion.

Prioridad: P0
Estimacion: 1.5h
Owner: Backend
Dependencias: HU-07

Criterios de aceptacion:
1. Si Stellar falla, se guarda estado failed con motivo.
2. Se habilita accion de reintento desde UI.
3. El reintento no duplica registros exitosos.
4. El usuario ve mensaje entendible de fallo.

Tareas:
- Backend: manejo de excepciones y idempotencia basica.
- Frontend: boton de reintento + feedback.

## Epica D - Certificado y Verificacion

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

