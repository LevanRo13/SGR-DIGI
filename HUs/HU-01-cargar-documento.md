# HU-01 - Cargar documento

## Seguimiento
- Estado: To Do
- Responsable operativo: Frontend

## Epica
Epica A - Ingesta y Extraccion

## HU
Como PyME, quiero subir un documento de respaldo para iniciar la solicitud de aval.

Prioridad: P0
Estimacion: 2h
Owner: Frontend
Dependencias: ninguna

Criterios de aceptacion:
1. Se pueden cargar archivos PDF, JPG o PNG.
2. Si el formato no es valido, se muestra error claro.
3. La UI muestra confirmacion de archivo cargado y permite continuar.
4. Se bloquea el avance si no hay archivo seleccionado.

Tareas:
- Frontend: componente upload drag and drop + selector tradicional.
- QA: pruebas con formato valido e invalido.

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

