import { GoogleGenAI } from '@google/genai';
import { env } from '../../../config/env.js';
import { AppError } from '../../../middleware/error-handler.js';
import type {
  AIProvider,
  AIAnalysisResult,
  TailoringPromptParams,
  TailoringGenerationResult,
} from './ai.interface.js';
import { TailoringGenerationResultSchema } from './ai.interface.js';
import type { ParsedResumeData } from '../parser/section.parser.js';

export class GeminiProvider implements AIProvider {
  readonly name = 'GEMINI';
  private client: GoogleGenAI | null = null;
  private modelName = 'gemini-2.5-flash';

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || env.GEMINI_API_KEY;
    if (key) {
      this.client = new GoogleGenAI({ apiKey: key });
    }
    if (model) {
      this.modelName = model;
    }
  }

  private ensureClient(): GoogleGenAI {
    if (!this.client) {
      const key = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
      if (!key) {
        throw new AppError(
          'Gemini AI provider is not configured. GEMINI_API_KEY environment variable is required.',
          503,
        );
      }
      this.client = new GoogleGenAI({ apiKey: key });
    }
    return this.client;
  }

  async analyzeResume(
    text: string,
    parsedData: ParsedResumeData,
    careerTwin?: any,
  ): Promise<AIAnalysisResult> {
    const ai = this.ensureClient();

    const systemInstruction = `You are Resumind's expert resume intelligence engine.
Analyze the candidate's parsed resume and provide structured critique and highlights.
Return strictly valid JSON matching this schema:
{
  "summaryCritique": "string",
  "suggestedRoles": ["string"],
  "keyHighlights": ["string"],
  "recommendedKeywords": ["string"]
}
STRICT ANTI-HALLUCINATION RULES:
- Ground all suggestions strictly in the provided resume and career twin.
- Do NOT invent companies, credentials, or technologies not present in the evidence.`;

    const prompt = `RESUME TEXT:
${text.slice(0, 4000)}

PARSED RESUME SECTIONS:
${JSON.stringify(parsedData, null, 2)}

CAREER TWIN CONTEXT:
${careerTwin ? JSON.stringify(careerTwin, null, 2) : 'None provided'}

Provide analysis in the requested JSON format.`;

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new AppError('Gemini returned an empty response.', 502);
      }

      const parsed = JSON.parse(responseText);
      return {
        summaryCritique: parsed.summaryCritique || undefined,
        suggestedRoles: Array.isArray(parsed.suggestedRoles)
          ? parsed.suggestedRoles
          : [],
        keyHighlights: Array.isArray(parsed.keyHighlights)
          ? parsed.keyHighlights
          : [],
        recommendedKeywords: Array.isArray(parsed.recommendedKeywords)
          ? parsed.recommendedKeywords
          : [],
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        `Gemini AI analysis failed: ${err.message || 'Unknown provider error'}`,
        502,
      );
    }
  }

  async generateTailoringSuggestions(
    params: TailoringPromptParams,
  ): Promise<TailoringGenerationResult> {
    const ai = this.ensureClient();

    const systemInstruction = `You are Resumind's expert AI Career Advisor and Resume Tailoring Engine.
Your goal is to tailor the candidate's resume for a specific target job.

STRICT ANTI-HALLUCINATION RULES (CRITICAL):
1. NEVER invent employers, company names, job titles, or institutions.
2. NEVER invent technologies, frameworks, or tools not present in the candidate's resume or Career Twin.
3. NEVER invent numbers, metrics, user counts, percentages, revenue, or latency improvements.
   For example, NEVER change "improved API latency" to "improved API latency by 40%" unless "40%" is explicitly present in the provided evidence.
4. If a target job requirement is not present in the candidate's evidence, DO NOT fabricate it. Instead, flag it in unsupportedClaims or uncertainClaims.
5. All suggestions require user approval. Set requiresUserApproval: true.
6. Provide specific evidenceReferences for every suggestion (e.g. "Resume: Experience[0]", "CareerTwin: Skills").

Return strictly valid JSON adhering to this JSON schema:
{
  "tailoredSummary": "string",
  "prioritizedSkills": ["string"],
  "suggestions": [
    {
      "type": "REWRITE" | "REORDER" | "ADD_EVIDENCE" | "REMOVE_REDUNDANCY" | "KEYWORD_ALIGNMENT" | "SUMMARY_UPDATE" | "PROJECT_EMPHASIS",
      "original": "string",
      "proposed": "string",
      "reason": "string",
      "evidenceReferences": ["string"],
      "confidence": number between 0 and 1,
      "requiresUserApproval": true
    }
  ],
  "evidenceAnalysis": {
    "supportedClaims": ["string"],
    "unsupportedClaims": ["string"],
    "uncertainClaims": ["string"],
    "evidenceReferences": ["string"],
    "warnings": ["string"]
  }
}`;

    const prompt = `TARGET JOB DNA:
- Role: ${params.jobDna.role}
- Level: ${params.jobDna.level || 'Not specified'}
- Required & Preferred Skills: ${JSON.stringify(params.jobDna.skills)}
- Key Responsibilities: ${JSON.stringify(params.jobDna.responsibilities)}
- Target Keywords: ${JSON.stringify(params.jobDna.keywords)}
- Experience Requirement: ${params.jobDna.experienceRequirement || 'Not specified'}

CANDIDATE EVIDENCE (SOURCE OF TRUTH):
- Existing Summary: ${params.parsedResume.summary || 'None'}
- Candidate Skills: ${JSON.stringify(params.parsedResume.skills)}
- Experience: ${JSON.stringify(params.parsedResume.experience)}
- Projects: ${JSON.stringify(params.parsedResume.projects || [])}
- Education: ${JSON.stringify(params.parsedResume.education || [])}
- Career Twin Data: ${params.careerTwin ? JSON.stringify(params.careerTwin) : 'None'}

Generate tailored suggestions strictly grounded in the candidate evidence.`;

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new AppError('Gemini returned an empty response.', 502);
      }

      const parsedJson = JSON.parse(responseText);
      const validated = TailoringGenerationResultSchema.parse(parsedJson);
      return validated;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        `Gemini tailoring generation failed: ${err.message || 'Unknown provider error'}`,
        502,
      );
    }
  }
}
