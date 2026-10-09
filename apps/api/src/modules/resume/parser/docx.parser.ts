import mammoth from 'mammoth';
import type { DocumentParser } from './document-parser.interface.js';

export class DocxParser implements DocumentParser {
  async parse(buffer: Buffer): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new Error('EMPTY_DOCUMENT');
    }

    try {
      const result = await mammoth.extractRawText({ buffer });
      const cleaned = (result.value || '').trim();

      if (!cleaned) {
        throw new Error('EMPTY_DOCUMENT');
      }

      return cleaned;
    } catch (err: any) {
      if (err.message === 'EMPTY_DOCUMENT') {
        throw err;
      }
      throw new Error(
        `DOCX_PARSER_ERROR: ${err.message || 'Unable to parse DOCX'}`,
      );
    }
  }
}

export const docxParser = new DocxParser();
