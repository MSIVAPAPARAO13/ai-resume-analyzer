import { pdfParser } from './pdf.parser.js';
import { docxParser } from './docx.parser.js';
import { sectionParser, type ParsedResumeData } from './section.parser.js';

export interface ParseResumeResult {
  extractedText: string;
  parsedData: ParsedResumeData;
}

export class ResumeParserService {
  async extractText(
    buffer: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<string> {
    const lowerName = filename.toLowerCase();

    if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
      return pdfParser.parse(buffer);
    }

    if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' ||
      lowerName.endsWith('.docx')
    ) {
      return docxParser.parse(buffer);
    }

    throw new Error('UNSUPPORTED_FILE_TYPE');
  }

  async parseResume(
    buffer: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<ParseResumeResult> {
    const extractedText = await this.extractText(buffer, mimeType, filename);
    const parsedData = sectionParser.parse(extractedText);

    return {
      extractedText,
      parsedData,
    };
  }
}

export const resumeParserService = new ResumeParserService();
