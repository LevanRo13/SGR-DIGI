import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');

describe('ExtractionController (e2e)', () => {
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

  describe('Schema de Respuesta - Criterios de Aceptacion HU-02', () => {
    /**
     * Criterio 1: El endpoint devuelve JSON con tipo, cantidad, valor y riskFlag
     */
    it('POST /extract debe devolver schema correcto con tipo, cantidad, valor, riskFlag', async () => {
      const response = await request(app.getHttpServer())
        .post('/extract')
        .send({ texto: 'FACTURA por 100 toneladas de soja, USD 50000' })
        .expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');

      if (response.body.success) {
        expect(response.body.data).toHaveProperty('tipo');
        expect(response.body.data).toHaveProperty('cantidad');
        expect(response.body.data).toHaveProperty('valor');
        expect(response.body.data).toHaveProperty('riskFlag');

        // Validar tipos
        expect(typeof response.body.data.tipo).toBe('string');
        expect(typeof response.body.data.cantidad).toBe('number');
        expect(typeof response.body.data.valor).toBe('number');
        expect(['BAJO', 'MEDIO', 'ALTO']).toContain(response.body.data.riskFlag);
      }
    });

    /**
     * Criterio 2: Si la IA falla, el sistema devuelve error controlado
     */
    it('POST /extract con texto vacio debe devolver error controlado', async () => {
      const response = await request(app.getHttpServer())
        .post('/extract')
        .send({ texto: '' })
        .expect(201);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('data', null);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    /**
     * Criterio 3: Schema consistente en todos los casos validos
     */
    it('GET /extract/mock/:id debe devolver schema consistente', async () => {
      const docIds = ['DOC-001', 'DOC-002', 'DOC-003'];

      for (const docId of docIds) {
        const response = await request(app.getHttpServer())
          .get(`/extract/mock/${docId}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('documentId', docId);

        // Validar schema de data
        expect(response.body.data).toHaveProperty('tipo');
        expect(response.body.data).toHaveProperty('cantidad');
        expect(response.body.data).toHaveProperty('valor');
        expect(response.body.data).toHaveProperty('riskFlag');
      }
    });

    it('GET /extract/mock/:id con ID invalido debe devolver error controlado', async () => {
      const response = await request(app.getHttpServer())
        .get('/extract/mock/DOC-INVALID')
        .expect(200);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('data', null);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Endpoint /extract/mock', () => {
    it('GET /extract/mock debe listar documentos disponibles', async () => {
      const response = await request(app.getHttpServer())
        .get('/extract/mock')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('documents');
      expect(Array.isArray(response.body.documents)).toBe(true);
      expect(response.body.documents.length).toBeGreaterThanOrEqual(3);

      // Validar estructura de cada documento
      response.body.documents.forEach((doc: any) => {
        expect(doc).toHaveProperty('id');
        expect(doc).toHaveProperty('nombre');
      });
    });
  });

  describe('Validacion de tipos de documento', () => {
    it('debe detectar FACTURA correctamente', async () => {
      const response = await request(app.getHttpServer())
        .post('/extract')
        .send({ texto: 'FACTURA COMERCIAL por USD 10000' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tipo).toBe('FACTURA');
    });

    it('debe detectar WARRANT correctamente', async () => {
      const response = await request(app.getHttpServer())
        .post('/extract')
        .send({ texto: 'WARRANT de deposito de granos por USD 20000' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tipo).toBe('WARRANT');
    });

    it('debe detectar PAGARE correctamente', async () => {
      const response = await request(app.getHttpServer())
        .post('/extract')
        .send({ texto: 'PAGARE por USD 5000' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tipo).toBe('PAGARE');
    });
  });

  describe('Validacion de riskFlag', () => {
    it('debe marcar ALTO para documentos con cheques rechazados', async () => {
      const response = await request(app.getHttpServer())
        .post('/extract')
        .send({ texto: 'Pagare USD 1000 - empresa con cheque rechazado' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.riskFlag).toBe('ALTO');
    });

    it('debe marcar BAJO para documentos certificados', async () => {
      const response = await request(app.getHttpServer())
        .post('/extract')
        .send({ texto: 'Factura USD 1000 con certificado de calidad' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.riskFlag).toBe('BAJO');
    });
  });
});
