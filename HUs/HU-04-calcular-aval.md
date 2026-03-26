# HU-04 - Calcular aval

## Seguimiento
- Estado: To Do
- Responsable operativo: Backend

## Epica
Epica B - Calculo y Validacion

## HU
Como Operador SGR, quiero calcular el aval con formula definida para tomar decision rapida.

Prioridad: P0
Estimacion: 1.5h
Owner: Backend
Dependencias: HU-03

Criterios de aceptacion:
1. Se aplica formula Aval = 1.5 x Valor x Factor.
2. Para MVP, Factor se inicializa en 1.0.
3. El resultado se devuelve con desglose de variables.
4. Si valor <= 0, se devuelve error de validacion.

Tareas:
- Backend: servicio de colateralizacion.
- QA: casos positivos y borde (valor cero/negativo).

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

