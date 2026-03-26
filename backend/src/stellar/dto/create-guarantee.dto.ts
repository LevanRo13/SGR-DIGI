import {
  IsString,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
  Min,
  IsIn,
} from 'class-validator';

export class CreateGuaranteeDto {
  @IsString()
  @IsNotEmpty({ message: 'El tipo de garantía es requerido' })
  @IsIn(['FACTURA', 'WARRANT', 'PAGARE', 'CHEQUE', 'OTRO'], {
    message: 'Tipo debe ser: FACTURA, WARRANT, PAGARE, CHEQUE u OTRO',
  })
  tipo: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(0, { message: 'La cantidad debe ser mayor o igual a 0' })
  cantidad: number;

  @IsNumber({}, { message: 'El valor debe ser un número' })
  @Min(0, { message: 'El valor debe ser mayor o igual a 0' })
  valor: number;

  @IsNumber({}, { message: 'El aval debe ser un número' })
  @Min(0, { message: 'El aval debe ser mayor o igual a 0' })
  aval: number;

  @IsBoolean({ message: 'operatorConfirmed debe ser un booleano' })
  @IsNotEmpty({ message: 'La confirmación del operador es requerida' })
  operatorConfirmed: boolean;
}
