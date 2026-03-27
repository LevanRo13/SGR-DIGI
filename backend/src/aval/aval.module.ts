import { Module } from '@nestjs/common';
import { AvalController } from './aval.controller';
import { AvalService } from './aval.service';
import { ValidationService } from './validation.service';

@Module({
  controllers: [AvalController],
  providers: [AvalService, ValidationService],
  exports: [AvalService, ValidationService],
})
export class AvalModule {}
