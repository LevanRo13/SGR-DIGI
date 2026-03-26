# HU-12 - Persistir operaciones en JSON local

## Seguimiento
- Estado: To Do
- Responsable operativo: Backend

## Epica
Epica E - UX de flujo y Persistencia

## HU
Como equipo demo, quiero guardar operaciones en JSON local para reutilizar evidencia y mostrar historial basico.

Prioridad: P0
Estimacion: 1.5h
Owner: Backend
Dependencias: HU-07

Criterios de aceptacion:
1. Cada operacion se guarda con id, estado, timestamp, datos clave y hash.
2. Se puede consultar listado de operaciones recientes.
3. Si falla escritura, se informa sin romper el flujo completo.
4. El formato del archivo es consistente y legible.

Tareas:
- Backend: repositorio JSON local.
- QA: validar persistencia y lectura.

## Backlog P1 (si hay tiempo)

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

