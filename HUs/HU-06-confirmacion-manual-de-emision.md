# HU-06 - Confirmacion manual de emision

## Seguimiento
- Estado: To Do
- Responsable operativo: Frontend

## Epica
Epica C - Emision y Blockchain

## HU
Como Operador SGR, quiero confirmar manualmente la emision para controlar lo que se envia a Stellar.

Prioridad: P0
Estimacion: 1h
Owner: Frontend
Dependencias: HU-05

Criterios de aceptacion:
1. Existe pantalla de resumen previo a emision.
2. El usuario debe confirmar explicitamente.
3. Sin confirmacion no se ejecuta el envio a blockchain.
4. El resumen muestra datos clave y aval final.

Tareas:
- Frontend: paso de confirmacion en flujo.
- QA: prueba de bloqueo sin confirmacion.

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

