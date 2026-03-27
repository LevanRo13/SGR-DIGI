import { Module } from '@nestjs/common';
import { StellarController } from './stellar.controller';
import { StellarService } from './stellar.service';
import { OperationsRepository } from './operations.repository';

@Module({
  controllers: [StellarController],
  providers: [StellarService, OperationsRepository],
  exports: [StellarService],
})
export class StellarModule {}
