import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  /**
   * Extrae texto de un archivo segun su tipo MIME.
   * Soporta: PDF, imagenes (retorna placeholder), texto plano.
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
   * Valida que el archivo sea de un tipo permitido.
   */
  validateFileType(mimetype: string): boolean {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'text/plain',
    ];
    return allowedTypes.includes(mimetype);
  }
}
