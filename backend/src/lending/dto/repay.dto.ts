import { IsNumber, Min, IsNotEmpty } from 'class-validator';

export class RepayDto {
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(1, { message: 'El monto debe ser mayor a 0' })
  @IsNotEmpty({ message: 'El monto es requerido' })
  amount: number;
}
