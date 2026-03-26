import { Module } from '@nestjs/common';
import { ExtractionController } from './extraction.controller';
import { LlmService } from './llm.service';
import { FileService } from './file.service';

@Module({
  controllers: [ExtractionController],
  providers: [LlmService, FileService],
  exports: [LlmService, FileService],
})
export class ExtractionModule {}
