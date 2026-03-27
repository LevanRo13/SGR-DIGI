require('ts-node/register');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./backend/src/app.module');
const { StellarService } = require('./backend/src/stellar/stellar.service');

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const stellarService = app.get(StellarService);
  try {
    const res = await stellarService.createOffer(2, 100, 10);
    console.log("Success:", res);
  } catch (e) {
    console.error("CRASH TRACE:", e);
  }
  await app.close();
}

test();
