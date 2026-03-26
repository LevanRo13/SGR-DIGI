# HU-13 - Historico minimo en dashboard

## Seguimiento
- Estado: To Do
- Responsable operativo: Frontend

## Epica
Epica E - UX de flujo y Persistencia

## HU
Como operador, quiero ver ultimas 5 operaciones para seguimiento rapido.
Prioridad: P1
Estimacion: 1.5h
Owner: Frontend

Criterios de aceptacion:
1. Se muestran exactamente las ultimas 5 operaciones en el dashboard.
2. Las operaciones se ordenan de mas reciente a mas antigua por timestamp.
3. Cada item muestra como minimo id, estado, fecha y hash (si existe).
4. Si no hay operaciones, se muestra estado vacio con mensaje claro.

Tareas:
- Frontend: componente de listado de ultimas operaciones con estado vacio.
- Backend: endpoint o adaptacion para devolver ultimas 5 operaciones desde persistencia local.
- QA: validar orden, limite de 5 y comportamiento sin datos.

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

