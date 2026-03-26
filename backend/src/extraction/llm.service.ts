import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ExtractionResult {
  tipo: string;
  cantidad: number;
  valor: number;
  riskFlag: 'BAJO' | 'MEDIO' | 'ALTO';
}

const SYSTEM_PROMPT = `Eres un analista financiero experto en Sociedades de Garantía Recíproca (SGR) de Argentina.
Tu tarea es analizar el texto de un documento comercial y extraer información estructurada.

REGLAS ESTRICTAS:
1. Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks.
2. El JSON debe tener exactamente esta estructura:
   {
     "tipo": "string - tipo de documento (ej: FACTURA, WARRANT, PAGARE, CERTIFICADO_DEPOSITO, OTRO)",
     "cantidad": number - cantidad principal del activo (toneladas, unidades, etc.),
     "valor": number - valor total en USD. Si el monto está en ARS, convierte usando el tipo de cambio mencionado en el documento. Si no hay tipo de cambio, usa 1180 ARS/USD como referencia,
     "riskFlag": "BAJO | MEDIO | ALTO"
   }
3. Para determinar riskFlag, evalúa:
   - BAJO: documento con garantía real, cliente sin antecedentes negativos, producto certificado.
   - MEDIO: garantía parcial, historial mixto, condiciones de mercado volátiles.
   - ALTO: sin garantía real, antecedentes de impago, ratio de endeudamiento elevado, cheques rechazados.
4. Si no puedes determinar un campo con certeza, usa null para strings y 0 para números.
5. NUNCA inventes datos que no estén en el texto proporcionado.`;

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('Gemini AI inicializado correctamente');
    } else {
      this.logger.warn(
        'GEMINI_API_KEY no configurada. El servicio LLM operará en modo fallback.',
      );
    }
  }

  async extractFromText(documentText: string): Promise<ExtractionResult> {
    if (!this.genAI) {
      this.logger.warn('Gemini no disponible, usando extracción fallback');
      return this.fallbackExtraction(documentText);
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
      });

      const result = await model.generateContent([
        { text: SYSTEM_PROMPT },
        {
          text: `Analiza el siguiente documento y extrae la información estructurada:\n\n${documentText}`,
        },
      ]);

      const response = result.response;
      const text = response.text().trim();

      // Limpiar posible markdown wrapping
      const cleanJson = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed: ExtractionResult = JSON.parse(cleanJson);

      // Validar estructura mínima
      if (!parsed.tipo || typeof parsed.valor !== 'number') {
        this.logger.warn(
          'Respuesta LLM con estructura incompleta, complementando con fallback',
        );
        return {
          tipo: parsed.tipo || 'OTRO',
          cantidad: parsed.cantidad || 0,
          valor: parsed.valor || 0,
          riskFlag: parsed.riskFlag || 'MEDIO',
        };
      }

      this.logger.log(
        `Extracción exitosa: tipo=${parsed.tipo}, valor=${parsed.valor}`,
      );
      return parsed;
    } catch (error) {
      this.logger.error(`Error en extracción LLM: ${error.message}`);
      return this.fallbackExtraction(documentText);
    }
  }

  /**
   * Extracción fallback basada en heurísticas simples.
   * Se usa cuando Gemini no está disponible o falla.
   */
  private fallbackExtraction(text: string): ExtractionResult {
    const upperText = text.toUpperCase();

    let tipo = 'OTRO';
    if (upperText.includes('FACTURA')) tipo = 'FACTURA';
    else if (upperText.includes('WARRANT') || upperText.includes('DEPÓSITO'))
      tipo = 'WARRANT';
    else if (upperText.includes('PAGARÉ') || upperText.includes('PAGARE'))
      tipo = 'PAGARE';

    // Intentar extraer valor USD con regex
    const usdMatch = text.match(/USD\s*([\d.,]+)/i);
    let valor = 0;
    if (usdMatch) {
      valor = parseFloat(usdMatch[1].replace(/\./g, '').replace(',', '.'));
    }

    // Intentar extraer cantidad
    const cantidadMatch = text.match(
      /(\d[\d.,]*)\s*(toneladas?|unidades?|kilos?|kg)/i,
    );
    let cantidad = 0;
    if (cantidadMatch) {
      cantidad = parseFloat(
        cantidadMatch[1].replace(/\./g, '').replace(',', '.'),
      );
    }

    // Risk flag básico
    let riskFlag: 'BAJO' | 'MEDIO' | 'ALTO' = 'MEDIO';
    if (
      upperText.includes('RECHAZADO') ||
      upperText.includes('SIN GARANTÍA') ||
      upperText.includes('SIN GARANTIA')
    ) {
      riskFlag = 'ALTO';
    } else if (
      upperText.includes('CERTIFICAD') ||
      upperText.includes('ASEGURAD')
    ) {
      riskFlag = 'BAJO';
    }

    this.logger.log(`Fallback extraction: tipo=${tipo}, valor=${valor}`);
    return { tipo, cantidad, valor, riskFlag };
  }
}
