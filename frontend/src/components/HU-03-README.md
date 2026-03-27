# HU-03: Corregir datos extraídos del MVP

## Descripción
Implementación del formulario para que el usuario pueda revisar y corregir los datos que el backend extrae automáticamente del documento upload.

## Componentes creados

### 1. `DataCorrectionForm.tsx`
Componente reutilizable que muestra un formulario con los datos extraídos del documento.

**Características:**
- ✅ Agrupa campos por secciones (Personales, Aval, Financieros, Otros)
- ✅ Secciones colapsables para mejor UX
- ✅ Validación de campos requeridos
- ✅ Detección automática de tipo de campo (date, email, tel, number)
- ✅ Soporte para diferentes tipos de datos (text, checkbox)
- ✅ Estados de carga
- ✅ Manejo de errores

### 2. Integración en `UploadPage.tsx`
El flujo ahora es:

```
1. Usuario sube archivo
   ↓
2. Backend procesa y retorna JSON con datos extraídos
   ↓
3. Se oculta la zona de carga
   ↓
4. Se muestra DataCorrectionForm con los datos
   ↓
5. Usuario revisa/corrige y confirma
   ↓
6. Datos se envían al backend para procesamiento
```

## Estados del componente

### Paso 1: Carga de archivo
- Muestra el dropzone anterior
- Usuario selecciona archivo

### Paso 2: Corrección de datos
- Se oculta dropzone
- Se muestra formulario con datos extraídos
- Usuario puede editar cada campo
- Valida campos requeridos antes de enviar

## API esperada del backend

### POST `/api/extract`
```json
{
  "file": File
}
```

**Respuesta esperada:**
```json
{
  "extracted_data": {
    "company_name": "Empresa S.A.",
    "guarantee_amount": 50000,
    "date": "2024-03-26",
    "document_type": "invoice",
    ...
  }
}
```

### POST `/api/process-guarantee`
```json
{
  "file_name": "documento.pdf",
  "extracted_data": {
    ...corrected data...
  }
}
```

## Personalización

Para agregar más secciones automáticas, edita la función `groupDataBySections()` en `DataCorrectionForm.tsx`:

```typescript
const personalKeywords = ['name', 'nombre', '...'];  // Agrega keywords
const guaranteeKeywords = ['guarantee', 'aval', '...'];
const financialKeywords = ['amount', 'monto', '...'];
```

## TODO

- [ ] Conectar con API real del backend
- [ ] Agregar preview del documento en paralelo al formulario
- [ ] Implementar historial de cambios (qué fue editado)
- [ ] Agregar cache de datos según documento
- [ ] Integrar con siguiente paso del flujo
