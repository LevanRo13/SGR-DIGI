import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExtractionModule } from './extraction/extraction.module';
import { StellarModule } from './stellar/stellar.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ExtractionModule,
    StellarModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
