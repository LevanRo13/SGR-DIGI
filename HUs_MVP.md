# Backlog de Historias de Usuario - AURA SGR MVP

## Alcance confirmado
- Actor principal: PyME + Operador SGR.
- Emision de aval: manual (con confirmacion humana).
- Alcance legal MVP: demo tecnica (sin validez legal plena).
- Formatos de carga: PDF, JPG, PNG.
- Extraccion IA: editable por usuario antes de emitir.
- Registro en Stellar: hash de certificado + metadatos minimos.
- Persistencia local: archivo JSON.
- Precios de referencia: mock fijo.
- Objetivo principal de demo: viabilidad comercial para PyMEs.

## Definicion de Ready (DoR)
Una HU entra en desarrollo cuando tiene:
1. Actor y valor de negocio explicitos.
2. Criterios de aceptacion medibles.
3. Input y output definidos.
4. Dependencias tecnicas identificadas.
5. Responsable principal asignado.

## Definicion de Done (DoD)
Una HU se considera terminada cuando:
1. Cumple todos sus criterios de aceptacion.
2. Tiene prueba manual documentada (Postman o UI).
3. Maneja al menos un caso de error relevante.
4. Esta integrada al flujo end-to-end de demo.

## Epica A - Ingesta y Extraccion

### HU-01 - Cargar documento
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

### HU-02 - Extraer datos con IA
Como Operador SGR, quiero que el sistema extraiga campos clave del documento para acelerar analisis.

Prioridad: P0
Estimacion: 3h
Owner: Backend
Dependencias: HU-01

Criterios de aceptacion:
1. El endpoint devuelve JSON con tipo, cantidad, valor y riskFlag.
2. Si la IA falla, el sistema devuelve error controlado.
3. La respuesta mantiene schema consistente en todos los casos validos.
4. El tiempo de respuesta es apto para demo (sin bloqueo indefinido).

Tareas:
- Backend: endpoint de extraccion con provider LLM.
- Trainee data: validar 3-5 ejemplos core.
- QA: test de contrato del schema de respuesta.

### HU-03 - Corregir datos extraidos
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

### HU-04 - Calcular aval
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

### HU-05 - Validar minimos de emision
Como Operador SGR, quiero que el sistema valide datos minimos antes de emitir para evitar operaciones invalidas.

Prioridad: P0
Estimacion: 1h
Owner: Backend
Dependencias: HU-04

Criterios de aceptacion:
1. El sistema exige tipo, cantidad, valor y aval calculado.
2. Si falta un dato, bloquea la emision.
3. Se informa al usuario que dato falta.
4. La validacion corre antes del paso de confirmacion.

Tareas:
- Backend: guardas de validacion.
- Frontend: render de mensaje de bloqueo.

## Epica C - Emision y Blockchain

### HU-06 - Confirmacion manual de emision
Como Operador SGR, quiero confirmar manualmente la emision para controlar lo que se envia a Stellar.

Prioridad: P0
Estimacion: 1h
Owner: Frontend
Dependencias: HU-05

Criterios de aceptacion:
1. Existe pantalla de resumen previo a emision.
2. El usuario debe confirmar explicitamente.
3. Sin confirmacion no se ejecuta el envio a blockchain.
4. El resumen muestra datos clave y aval final.

Tareas:
- Frontend: paso de confirmacion en flujo.
- QA: prueba de bloqueo sin confirmacion.

### HU-07 - Registrar garantia en Stellar
Como Operador SGR, quiero registrar una transaccion en Stellar Testnet con hash y metadatos minimos para trazabilidad.

Prioridad: P0
Estimacion: 3h
Owner: Backend
Dependencias: HU-06

Criterios de aceptacion:
1. El backend crea transaccion XDR con metadatos minimos y hash.
2. La transaccion se envia a Stellar Testnet via Horizon.
3. El endpoint responde hash de transaccion y link de explorador.
4. Si Stellar responde OK, estado queda emitido.

Tareas:
- Backend: stellar service + endpoint create-guarantee.
- QA: verificacion manual en explorer.

### HU-08 - Manejo de error Stellar y reintento
Como Operador SGR, quiero reintentar cuando falle Stellar para no perder la operacion.

Prioridad: P0
Estimacion: 1.5h
Owner: Backend
Dependencias: HU-07

Criterios de aceptacion:
1. Si Stellar falla, se guarda estado failed con motivo.
2. Se habilita accion de reintento desde UI.
3. El reintento no duplica registros exitosos.
4. El usuario ve mensaje entendible de fallo.

Tareas:
- Backend: manejo de excepciones y idempotencia basica.
- Frontend: boton de reintento + feedback.

## Epica D - Certificado y Verificacion

### HU-09 - Generar certificado digital de demo
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

### HU-10 - Mostrar QR de verificacion
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

### HU-11 - Estados de carga, exito y error
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

### HU-12 - Persistir operaciones en JSON local
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

### HU-13 - Historico minimo en dashboard
Como operador, quiero ver ultimas 5 operaciones para seguimiento rapido.
Prioridad: P1
Estimacion: 1.5h
Owner: Frontend

### HU-14 - Mensajes de error orientados a negocio
Como PyME, quiero errores entendibles para saber que hacer sin soporte tecnico.
Prioridad: P1
Estimacion: 1h
Owner: Frontend + Backend

### HU-15 - Metricas simples de demo
Como vendedor, quiero mostrar tiempo por operacion para reforzar valor comercial.
Prioridad: P1
Estimacion: 1h
Owner: Backend + Frontend

## Secuencia de implementacion sugerida (inicio hoy)
1. HU-01, HU-02, HU-03
2. HU-04, HU-05, HU-06
3. HU-07, HU-08
4. HU-09, HU-10
5. HU-11, HU-12
6. Si hay margen: HU-13 a HU-15

## Matriz por rol
- Backend: HU-02, HU-04, HU-05, HU-07, HU-08, HU-12.
- Frontend: HU-01, HU-03, HU-06, HU-09, HU-10, HU-11.
- Trainee Data: soporte HU-02.
- Trainee QA: pruebas de aceptacion de HU-01 a HU-12.
- Vendedor: narrativa basada en HU-09, HU-10, HU-15.

## Checklist de arranque
1. Congelar schema JSON de extraccion.
2. Definir payload final para create-guarantee.
3. Crear dataset minimo de 3-5 documentos.
4. Preparar script de demo end-to-end.
