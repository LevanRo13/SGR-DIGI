import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');

describe('AvalController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /aval/calculate', () => {
    it('calcula aval correctamente', async () => {
      const response = await request(app.getHttpServer())
        .post('/aval/calculate')
        .send({ valor: 50000 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.aval).toBe(75000);
      expect(response.body.data.desglose.valorBase).toBe(50000);
      expect(response.body.data.desglose.multiplicador).toBe(1.5);
      expect(response.body.data.desglose.factor).toBe(1.0);
    });

    it('retorna error si valor <= 0', async () => {
      const response = await request(app.getHttpServer())
        .post('/aval/calculate')
        .send({ valor: 0 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('retorna error si valor negativo', async () => {
      const response = await request(app.getHttpServer())
        .post('/aval/calculate')
        .send({ valor: -100 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /aval/validate', () => {
    it('valida datos completos correctamente', async () => {
      const response = await request(app.getHttpServer())
        .post('/aval/validate')
        .send({
          tipo: 'FACTURA',
          cantidad: 100,
          valor: 50000,
          aval: 75000,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(true);
      expect(response.body.errors).toHaveLength(0);
    });

    it('retorna error si tipo vacio', async () => {
      const response = await request(app.getHttpServer())
        .post('/aval/validate')
        .send({
          tipo: '',
          cantidad: 100,
          valor: 50000,
          aval: 75000,
        })
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({ field: 'tipo' }),
      );
    });

    it('retorna error si cantidad <= 0', async () => {
      const response = await request(app.getHttpServer())
        .post('/aval/validate')
        .send({
          tipo: 'FACTURA',
          cantidad: 0,
          valor: 50000,
          aval: 75000,
        })
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({ field: 'cantidad' }),
      );
    });

    it('retorna warning si riskFlag ALTO', async () => {
      const response = await request(app.getHttpServer())
        .post('/aval/validate')
        .send({
          tipo: 'PAGARE',
          cantidad: 1,
          valor: 38000,
          aval: 57000,
          riskFlag: 'ALTO',
        })
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.warnings).toContainEqual(
        expect.objectContaining({ field: 'riskFlag' }),
      );
    });

    it('retorna multiples errores si faltan varios campos', async () => {
      const response = await request(app.getHttpServer())
        .post('/aval/validate')
        .send({
          tipo: '',
          cantidad: 0,
          valor: 0,
          aval: 0,
        })
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.errors.length).toBeGreaterThanOrEqual(4);
    });
  });
});
