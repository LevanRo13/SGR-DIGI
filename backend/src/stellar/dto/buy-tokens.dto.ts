import { IsNumber, IsPositive } from 'class-validator';

export class BuyTokensDto {
  @IsNumber()
  @IsPositive()
  offerId: number;

  @IsNumber()
  @IsPositive()
  amount: number;
}
