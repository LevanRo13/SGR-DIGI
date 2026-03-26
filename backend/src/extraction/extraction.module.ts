import { Module } from '@nestjs/common';
import { ExtractionController } from './extraction.controller';
import { LlmService } from './llm.service';

@Module({
  controllers: [ExtractionController],
  providers: [LlmService],
  exports: [LlmService],
})
export class ExtractionModule {}
