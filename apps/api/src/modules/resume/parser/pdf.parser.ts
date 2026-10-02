import { PDFParse } from 'pdf-parse';
import type { DocumentParser } from './document-parser.interface.js';

export class PdfParser implements DocumentParser {
  async parse(buffer: Buffer): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new Error('EMPTY_DOCUMENT');
    }

    try {
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      const rawText =
        typeof textResult === 'string'
          ? textResult
          : (textResult as any)?.text || '';

      const cleaned = rawText.trim();
      if (!cleaned) {
        throw new Error('EMPTY_DOCUMENT');
      }

      return cleaned;
    } catch (err: any) {
      if (err.message === 'EMPTY_DOCUMENT') {
        throw err;
      }
      throw new Error(
        `PDF_PARSER_ERROR: ${err.message || 'Unable to parse PDF'}`,
      );
    }
  }
}

export const pdfParser = new PdfParser();
