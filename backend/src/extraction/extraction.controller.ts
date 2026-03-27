import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Logger,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LlmService, ExtractionResult } from './llm.service';
import { FileService } from './file.service';
import * as datasetModule from '../mock/dataset.json';

// Normalize dataset access for different module systems
const dataset: Array<{ id: string; nombre: string; textoSimulado: string }> =
  Array.isArray(datasetModule) ? datasetModule : (datasetModule as any).default;

interface ExtractDto {
  texto: string;
}

interface ExtractionResponse {
  success: boolean;
  data: ExtractionResult | null;
  documentId?: string;
  filename?: string;
  extractedText?: string;
  error?: string;
}

@Controller('extract')
export class ExtractionController {
  private readonly logger = new Logger(ExtractionController.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly fileService: FileService,
  ) {}

  /**
   * POST /extract
   * Recibe texto libre de un documento y devuelve datos estructurados.
   */
  @Post()
  async extractFromText(
    @Body() body: ExtractDto,
  ): Promise<ExtractionResponse> {
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
   * POST /extract/upload
   * Recibe un archivo (PDF, imagen, texto) y extrae datos estructurados.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async extractFromFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ExtractionResponse> {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    if (!this.fileService.validateFileType(file.mimetype)) {
      return {
        success: false,
        data: null,
        error: `Tipo de archivo no soportado: ${file.mimetype}. Use PDF, JPG, PNG o TXT.`,
      };
    }

    try {
      this.logger.log(`Procesando archivo: ${file.originalname}`);

      // Extraer texto del archivo
      const extractedText = await this.fileService.extractText(
        file.buffer,
        file.mimetype,
        file.originalname,
      );

      // Procesar con LLM
      const result = await this.llmService.extractFromText(extractedText);

      return {
        success: true,
        data: result,
        filename: file.originalname,
        extractedText:
          extractedText.length > 500
            ? extractedText.substring(0, 500) + '...'
            : extractedText,
      };
    } catch (error) {
      this.logger.error(`Error procesando archivo: ${error.message}`);
      return {
        success: false,
        data: null,
        filename: file.originalname,
        error: error.message || 'Error interno al procesar el archivo.',
      };
    }
  }

  /**
   * GET /extract/mock/:id
   * Usa uno de los 3 documentos del dataset de prueba para la extracción.
   * IDs válidos: DOC-001, DOC-002, DOC-003
   */
  @Get('mock/:id')
  async extractFromMock(
    @Param('id') id: string,
  ): Promise<ExtractionResponse> {
    const doc = dataset.find((d) => d.id === id);

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
      documents: dataset.map((d) => ({
        id: d.id,
        nombre: d.nombre,
      })),
    };
  }
}
