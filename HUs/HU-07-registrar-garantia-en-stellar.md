# HU-07 - Registrar garantia en Stellar

## Seguimiento
- Estado: To Do
- Responsable operativo: Backend

## Epica
Epica C - Emision y Blockchain

## HU
Como Operador SGR, quiero registrar una transaccion en Stellar Testnet con hash y metadatos minimos para trazabilidad.

Prioridad: P0
Estimacion: 3h
Owner: Backend
Dependencias: HU-06

Criterios de aceptacion:
1. El backend crea transaccion XDR con metadatos minimos y hash.
2. La transaccion se envia a Stellar Testnet via Horizon.
3. El endpoint responde hash de transaccion y link de explorador.
4. Si Stellar responde OK, estado queda emitido.

Tareas:
- Backend: stellar service + endpoint create-guarantee.
- QA: verificacion manual en explorer.

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

