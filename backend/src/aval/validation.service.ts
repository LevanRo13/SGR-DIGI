import { Injectable } from '@nestjs/common';

export interface ValidationItem {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationItem[];
  warnings: ValidationItem[];
}

@Injectable()
export class ValidationService {
  validate(data: {
    tipo: string;
    cantidad: number;
    valor: number;
    aval: number;
    riskFlag?: string;
  }): ValidationResult {
    const errors: ValidationItem[] = [];
    const warnings: ValidationItem[] = [];

    // Errores criticos
    if (!data.tipo || data.tipo.trim() === '') {
      errors.push({
        field: 'tipo',
        message: 'El tipo de documento es requerido',
      });
    }

    if (!data.cantidad || data.cantidad <= 0) {
      errors.push({
        field: 'cantidad',
        message: 'La cantidad debe ser mayor a 0',
      });
    }

    if (!data.valor || data.valor <= 0) {
      errors.push({
        field: 'valor',
        message: 'El valor debe ser mayor a 0',
      });
    }

    if (!data.aval || data.aval <= 0) {
      errors.push({
        field: 'aval',
        message: 'El aval debe estar calculado',
      });
    }

    // Warnings
    if (data.riskFlag?.toUpperCase() === 'ALTO') {
      warnings.push({
        field: 'riskFlag',
        message: 'Documento con riesgo alto',
      });
    }

    if (data.tipo?.toUpperCase() === 'OTRO') {
      warnings.push({
        field: 'tipo',
        message: 'El tipo de documento no fue identificado claramente',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
