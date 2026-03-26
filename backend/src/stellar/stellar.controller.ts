import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { StellarService } from './stellar.service';
import { CreateGuaranteeDto } from './dto/create-guarantee.dto';

@Controller()
export class StellarController {
  constructor(private readonly stellarService: StellarService) {}

  @Get('stellar/health')
  async checkHealth() {
    const healthData = await this.stellarService.checkHealth();
    return {
      success: healthData.online,
      data: healthData,
    };
  }

  @Post('guarantee')
  @HttpCode(HttpStatus.CREATED)
  async createGuarantee(@Body() dto: CreateGuaranteeDto) {
    if (dto.operatorConfirmed !== true) {
      throw new BadRequestException({
        success: false,
        error:
          'La confirmación del operador es requerida (operatorConfirmed: true)',
      });
    }

    try {
      const operation = await this.stellarService.createGuarantee(dto);
      return {
        success: true,
        data: {
          id: operation.id,
          tipo: operation.tipo,
          cantidad: operation.cantidad,
          valor: operation.valor,
          aval: operation.aval,
          fecha: operation.timestamp,
          estado: operation.estado,
          txHash: operation.txHash,
          explorerUrl: operation.explorerUrl,
          network: operation.network,
          memoText: operation.memoText,
        },
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  @Get('guarantee')
  findAll() {
    const operations = this.stellarService.findAll();
    return {
      success: true,
      data: operations.map((op) => ({
        id: op.id,
        tipo: op.tipo,
        estado: op.estado,
        txHash: op.txHash,
        timestamp: op.timestamp,
      })),
    };
  }

  @Get('guarantee/:id')
  findOne(@Param('id') id: string) {
    const operation = this.stellarService.findById(id);

    if (!operation) {
      throw new BadRequestException({
        success: false,
        error: `Operación ${id} no encontrada`,
      });
    }

    return {
      success: true,
      data: {
        id: operation.id,
        tipo: operation.tipo,
        cantidad: operation.cantidad,
        valor: operation.valor,
        aval: operation.aval,
        fecha: operation.timestamp,
        estado: operation.estado,
        txHash: operation.txHash,
        explorerUrl: operation.explorerUrl,
        network: operation.network,
        memoText: operation.memoText,
        error: operation.error,
      },
    };
  }

  @Post('guarantee/:id/retry')
  @HttpCode(HttpStatus.OK)
  async retryGuarantee(@Param('id') id: string) {
    try {
      const operation = await this.stellarService.retryGuarantee(id);
      return {
        success: true,
        data: {
          id: operation.id,
          tipo: operation.tipo,
          cantidad: operation.cantidad,
          valor: operation.valor,
          aval: operation.aval,
          fecha: operation.timestamp,
          estado: operation.estado,
          txHash: operation.txHash,
          explorerUrl: operation.explorerUrl,
          network: operation.network,
          memoText: operation.memoText,
        },
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        error: (error as Error).message,
      });
    }
  }
}
