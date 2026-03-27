import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { LendingService, PositionInfo } from './lending.service';
import { SupplyCollateralDto, BorrowDto, RepayDto } from './dto';

@Controller('lending')
export class LendingController {
  private readonly logger = new Logger(LendingController.name);

  constructor(private readonly lendingService: LendingService) {}

  /**
   * POST /lending/supply
   * Deposit AURA tokens as collateral into the BLEND pool
   */
  @Post('supply')
  @HttpCode(HttpStatus.OK)
  async supplyCollateral(
    @Body() dto: SupplyCollateralDto,
  ): Promise<{ success: boolean; data: { txHash: string } }> {
    this.logger.log(`Supply collateral request: ${dto.amount} AURA`);

    const result = await this.lendingService.supplyCollateral(dto.amount);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * POST /lending/borrow
   * Borrow XLM against deposited AURA collateral
   */
  @Post('borrow')
  @HttpCode(HttpStatus.OK)
  async borrow(
    @Body() dto: BorrowDto,
  ): Promise<{ success: boolean; data: { txHash: string } }> {
    this.logger.log(`Borrow request: ${dto.amount} XLM`);

    const result = await this.lendingService.borrow(dto.amount);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * POST /lending/repay
   * Repay borrowed XLM + interest
   */
  @Post('repay')
  @HttpCode(HttpStatus.OK)
  async repay(
    @Body() dto: RepayDto,
  ): Promise<{ success: boolean; data: { txHash: string } }> {
    this.logger.log(`Repay request: ${dto.amount} XLM`);

    const result = await this.lendingService.repay(dto.amount);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /lending/position
   * Get the current lending position (collateral, debt, health factor)
   */
  @Get('position')
  async getPosition(): Promise<{
    success: boolean;
    data: PositionInfo;
  }> {
    this.logger.log('Get position request');

    const position = await this.lendingService.getPosition();

    return {
      success: true,
      data: position,
    };
  }

  /**
   * GET /lending/status
   * Check lending service configuration status
   */
  @Get('status')
  getStatus(): {
    success: boolean;
    data: {
      configured: boolean;
      poolId: string;
      oracleId: string;
      backstopId: string;
    };
  } {
    return {
      success: true,
      data: this.lendingService.getStatus(),
    };
  }
}
