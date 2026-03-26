# HU-09 - Generar certificado digital de demo

## Seguimiento
- Estado: To Do
- Responsable operativo: Frontend

## Epica
Epica D - Certificado y Verificacion

## HU
Como PyME, quiero obtener un certificado digital para presentar el aval emitido.

Prioridad: P0
Estimacion: 2h
Owner: Frontend
Dependencias: HU-07

Criterios de aceptacion:
1. El certificado muestra tipo, cantidad, valor, aval, fecha y hash.
2. El certificado se puede visualizar en pantalla de resultado.
3. El contenido coincide con datos finales emitidos.
4. Se incluye leyenda de alcance demo tecnica.

Tareas:
- Frontend: componente certificado.
- QA: chequeo de consistencia de campos.

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

