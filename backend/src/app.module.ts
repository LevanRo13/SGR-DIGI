import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExtractionModule } from './extraction/extraction.module';
import { AvalModule } from './aval/aval.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ExtractionModule,
    AvalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
