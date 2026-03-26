# HU-04 y HU-05 - Plan de Implementacion

## Archivos a Crear

```
backend/src/aval/
├── aval.module.ts
├── aval.controller.ts
├── aval.service.ts
└── validation.service.ts
```

---

## Tareas

| # | Tarea | Tiempo |
|---|-------|--------|
| 1 | Crear AvalService (formula calculo) | 10 min |
| 2 | Crear ValidationService (reglas) | 15 min |
| 3 | Crear AvalController (2 endpoints) | 10 min |
| 4 | Crear AvalModule + importar en AppModule | 5 min |
| 5 | Tests e2e | 15 min |

**Total: ~1h**

---

## Probar con curl

```bash
# Calcular aval
curl -X POST http://localhost:3000/aval/calculate \
  -H "Content-Type: application/json" \
  -d '{"valor": 50000}'

# Validar emision
curl -X POST http://localhost:3000/aval/validate \
  -H "Content-Type: application/json" \
  -d '{"tipo": "FACTURA", "cantidad": 100, "valor": 50000, "aval": 75000}'
```

---

## Checklist

### HU-04
- [ ] POST /aval/calculate funciona
- [ ] Formula: aval = 1.5 x valor x 1.0
- [ ] Error si valor <= 0

### HU-05
- [ ] POST /aval/validate funciona
- [ ] Retorna valid=false si campos criticos faltan
- [ ] Retorna warnings sin bloquear
