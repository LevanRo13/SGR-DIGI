import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AvalService } from './aval.service';
import { ValidationService } from './validation.service';

interface CalculateDto {
  valor: number;
}

interface ValidateDto {
  tipo: string;
  cantidad: number;
  valor: number;
  aval: number;
  riskFlag?: string;
}

@Controller('aval')
export class AvalController {
  constructor(
    private readonly avalService: AvalService,
    private readonly validationService: ValidationService,
  ) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  calculate(@Body() dto: CalculateDto) {
    if (!dto.valor || dto.valor <= 0) {
      throw new BadRequestException({
        success: false,
        error: 'El valor debe ser mayor a 0',
      });
    }

    const result = this.avalService.calculate(dto.valor);

    return {
      success: true,
      data: result,
    };
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validate(@Body() dto: ValidateDto) {
    const validation = this.validationService.validate(dto);

    return {
      success: true,
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }
}
