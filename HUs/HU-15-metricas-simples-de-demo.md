# HU-15 - Metricas simples de demo

## Seguimiento
- Estado: To Do
- Responsable operativo: Backend + Frontend

## Epica
Epica E - UX de flujo y Persistencia

## HU
Como vendedor, quiero mostrar tiempo por operacion para reforzar valor comercial.
Prioridad: P1
Estimacion: 1h
Owner: Backend + Frontend

Criterios de aceptacion:
1. Se registra tiempo de inicio y fin de cada operacion para calcular duracion.
2. Se muestra en UI el tiempo total por operacion finalizada.
3. Se expone una metrica simple agregada (promedio de ultimas operaciones).
4. Si falla el calculo de metricas, el flujo principal de emision no se bloquea.

Tareas:
- Backend: guardar timestamps por etapa y exponer metrica simple.
- Frontend: mostrar tiempo por operacion y promedio en vista de resultado o dashboard.
- QA: validar calculo, formato y tolerancia a fallos de metricas.

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

