import { Controller, Post, Body, Get, Param, Logger } from '@nestjs/common';
import { LlmService, ExtractionResult } from './llm.service';
import * as dataset from '../mock/dataset.json';

interface ExtractDto {
  texto: string;
}

interface ExtractionResponse {
  success: boolean;
  data: ExtractionResult | null;
  documentId?: string;
  error?: string;
}

@Controller('extract')
export class ExtractionController {
  private readonly logger = new Logger(ExtractionController.name);

  constructor(private readonly llmService: LlmService) {}

  /**
   * POST /extract
   * Recibe texto libre de un documento y devuelve datos estructurados.
   */
  @Post()
  async extractFromText(@Body() body: ExtractDto): Promise<ExtractionResponse> {
    if (!body.texto || body.texto.trim().length === 0) {
      return {
        success: false,
        data: null,
        error: 'El campo "texto" es requerido y no puede estar vacío.',
      };
    }

    try {
      this.logger.log(
        `Procesando extracción de texto (${body.texto.length} caracteres)`,
      );
      const result = await this.llmService.extractFromText(body.texto);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Error en extracción: ${error.message}`);
      return {
        success: false,
        data: null,
        error: 'Error interno al procesar el documento.',
      };
    }
  }

  /**
   * GET /extract/mock/:id
   * Usa uno de los 3 documentos del dataset de prueba para la extracción.
   * IDs válidos: DOC-001, DOC-002, DOC-003
   */
  @Get('mock/:id')
  async extractFromMock(@Param('id') id: string): Promise<ExtractionResponse> {
    const doc = (dataset as any[]).find((d) => d.id === id);

    if (!doc) {
      return {
        success: false,
        data: null,
        error: `Documento mock "${id}" no encontrado. IDs válidos: DOC-001, DOC-002, DOC-003.`,
      };
    }

    try {
      this.logger.log(`Procesando mock document: ${doc.nombre}`);
      const result = await this.llmService.extractFromText(doc.textoSimulado);
      return {
        success: true,
        data: result,
        documentId: doc.id,
      };
    } catch (error) {
      this.logger.error(`Error en extracción mock: ${error.message}`);
      return {
        success: false,
        data: null,
        documentId: id,
        error: 'Error interno al procesar el documento mock.',
      };
    }
  }

  /**
   * GET /extract/mock
   * Lista todos los documentos mock disponibles.
   */
  @Get('mock')
  listMockDocuments() {
    return {
      success: true,
      documents: (dataset as any[]).map((d) => ({
        id: d.id,
        nombre: d.nombre,
      })),
    };
  }
}
