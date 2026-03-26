# HU-10 - Mostrar QR de verificacion

## Seguimiento
- Estado: To Do
- Responsable operativo: Frontend

## Epica
Epica D - Certificado y Verificacion

## HU
Como PyME, quiero escanear un QR para abrir la evidencia on-chain rapidamente.

Prioridad: P0
Estimacion: 1h
Owner: Frontend
Dependencias: HU-09

Criterios de aceptacion:
1. Se genera QR con link al explorer de Stellar Testnet.
2. El QR redirige a la transaccion correcta.
3. El hash es visible y copiable desde UI.
4. Si no hay hash, no se renderiza QR.

Tareas:
- Frontend: generador de QR y boton copiar hash.
- QA: prueba de escaneo en movil.

## Epica E - UX de flujo y Persistencia

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

