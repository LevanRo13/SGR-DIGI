import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth');

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  /**
   * Extrae texto de un archivo segun su tipo MIME.
   * Soporta: PDF, DOCX, imagenes (placeholder), texto plano.
   */
  async extractText(
    buffer: Buffer,
    mimetype: string,
    filename: string,
  ): Promise<string> {
    this.logger.log(`Procesando archivo: ${filename} (${mimetype})`);

    if (mimetype === 'application/pdf') {
      return this.extractFromPdf(buffer);
    }

    if (
      mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filename.toLowerCase().endsWith('.docx')
    ) {
      return this.extractFromDocx(buffer);
    }

    if (mimetype.startsWith('image/')) {
      // Sin OCR real en MVP - retornar mensaje informativo
      this.logger.warn('OCR no disponible en MVP, usando texto placeholder');
      return `[Imagen: ${filename}] - OCR no disponible en MVP. Use texto manual o documentos mock.`;
    }

    if (mimetype === 'text/plain') {
      return buffer.toString('utf-8');
    }

    throw new Error(`Tipo de archivo no soportado: ${mimetype}`);
  }

  /**
   * Extrae texto de un PDF usando pdf-parse.
   * Solo funciona con PDFs que tienen texto embebido (no escaneados).
   */
  private async extractFromPdf(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      const text = data.text.trim();

      if (!text || text.length < 10) {
        this.logger.warn('PDF sin texto extraible (posiblemente escaneado)');
        return '[PDF escaneado] - No se pudo extraer texto. Use OCR externo o ingrese texto manualmente.';
      }

      this.logger.log(`PDF procesado: ${text.length} caracteres extraidos`);
      return text;
    } catch (error) {
      this.logger.error(`Error al procesar PDF: ${error.message}`);
      throw new Error('No se pudo procesar el archivo PDF');
    }
  }

  /**
   * Extrae texto de un archivo DOCX usando mammoth.
   * Extraccion local recomendada por Google para Gemini API (2026).
   */
  private async extractFromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();

      if (!text || text.length < 10) {
        this.logger.warn('DOCX sin contenido extraible');
        return '[DOCX vacio] - El archivo no contiene texto extraible.';
      }

      this.logger.log(`DOCX procesado: ${text.length} caracteres extraidos`);
      return text;
    } catch (error) {
      this.logger.error(`Error al procesar DOCX: ${error.message}`);
      throw new Error('No se pudo procesar el archivo DOCX');
    }
  }

  /**
   * Valida que el archivo sea de un tipo permitido.
   * Actualizado 2026: Soporta DOCX con extraccion local (recomendado por Google).
   */
  validateFileType(mimetype: string): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'image/jpeg',
      'image/jpg',
      'image/png',
      'text/plain',
    ];
    return allowedTypes.includes(mimetype);
  }
}
