import { Injectable } from '@nestjs/common';

const MULTIPLICADOR = 1.5;
const FACTOR_MVP = 1.0;

export interface CalculoResult {
  aval: number;
  desglose: {
    valorBase: number;
    multiplicador: number;
    factor: number;
  };
}

@Injectable()
export class AvalService {
  calculate(valor: number): CalculoResult {
    const aval = MULTIPLICADOR * valor * FACTOR_MVP;

    return {
      aval: Math.round(aval * 100) / 100,
      desglose: {
        valorBase: valor,
        multiplicador: MULTIPLICADOR,
        factor: FACTOR_MVP,
      },
    };
  }
}
