# HU-03 - Corregir datos extraidos

## Seguimiento
- Estado: To Do
- Responsable operativo: Frontend

## Epica
Epica A - Ingesta y Extraccion

## HU
Como Operador SGR, quiero editar los campos extraidos antes de emitir para reducir riesgo de error.

Prioridad: P0
Estimacion: 2h
Owner: Frontend
Dependencias: HU-02

Criterios de aceptacion:
1. Los campos extraidos se muestran en formulario editable.
2. Los cambios se reflejan en la vista de resumen.
3. No se permite continuar con campos vacios criticos.
4. El usuario puede cancelar cambios y volver al valor original.

Tareas:
- Frontend: formulario editable y validacion basica.
- QA: pruebas de edicion, cancelacion y campos requeridos.

## Epica B - Calculo y Validacion

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

