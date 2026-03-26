# HU-14 - Mensajes de error orientados a negocio

## Seguimiento
- Estado: To Do
- Responsable operativo: Frontend + Backend

## Epica
Epica E - UX de flujo y Persistencia

## HU
Como PyME, quiero errores entendibles para saber que hacer sin soporte tecnico.
Prioridad: P1
Estimacion: 1h
Owner: Frontend + Backend

Criterios de aceptacion:
1. Los errores tecnicos se transforman en mensajes entendibles para PyME.
2. Cada mensaje incluye accion recomendada para continuar o reintentar.
3. Se conserva un codigo o detalle tecnico interno para soporte y trazabilidad.
4. El estilo de mensajes es consistente en todas las pantallas del flujo.

Tareas:
- Backend: catalogo de errores con mapeo tecnico a mensaje de negocio.
- Frontend: componente unificado de error con accion sugerida.
- QA: pruebas de mensajes en errores de validacion, IA y Stellar.

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

