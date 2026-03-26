# HU-11 - Estados de carga, exito y error

## Seguimiento
- Estado: To Do
- Responsable operativo: Frontend

## Epica
Epica E - UX de flujo y Persistencia

## HU
Como usuario, quiero feedback visual del estado para entender en que paso esta mi operacion.

Prioridad: P0
Estimacion: 2h
Owner: Frontend
Dependencias: HU-01, HU-02, HU-07

Criterios de aceptacion:
1. La UI muestra loading durante extraccion IA y envio a Stellar.
2. La UI muestra estado exito con resumen final.
3. La UI muestra estado error con accion recomendada.
4. No hay pantallas en blanco durante transiciones.

Tareas:
- Frontend: estados globales del flujo.
- QA: pruebas de rutas felices y errores forzados.

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

