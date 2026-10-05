import { GoogleGenAI } from '@google/genai';
import { env } from '../../../config/env.js';
import { AppError } from '../../../middleware/error-handler.js';
import type {
  AIProvider,
  AIAnalysisResult,
  TailoringPromptParams,
  TailoringGenerationResult,
  GenerateInterviewQuestionsParams,
  InterviewQuestionGenerationResult,
  EvaluateAnswerParams,
  InterviewAnswerEvaluation,
  GeneratePrepPlanParams,
  InterviewPreparationPlan,
  GenerateFinalReportParams,
  InterviewFinalReport,
  GenerateLearningPlanParams,
  LearningPlanGenerationResult,
  GenerateSkillGapExplanationParams,
  SkillGapExplanationResult,
  GenerateCareerInsightsParams,
  CareerInsightsResult,
} from './ai.interface.js';
import {
  TailoringGenerationResultSchema,
  InterviewQuestionGenerationResultSchema,
  InterviewAnswerEvaluationSchema,
  InterviewPreparationPlanSchema,
  InterviewFinalReportSchema,
  LearningPlanGenerationSchema,
  CareerInsightsResultSchema,
} from './ai.interface.js';
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

  async generateInterviewQuestions(
    params: GenerateInterviewQuestionsParams,
  ): Promise<InterviewQuestionGenerationResult> {
    const ai = this.ensureClient();

    const systemInstruction = `You are Resumind's expert technical and behavioral interview preparation engine.
Your goal is to generate a personalized, balanced set of interview questions for a candidate preparing for a specific role.

STRICT ANTI-HALLUCINATION RULES:
1. NEVER invent employers, projects, metrics, certifications, degrees, or tools not present in the candidate's evidence.
2. If a target job requirement is missing from the candidate's evidence:
   - DO NOT pretend the candidate knows it.
   - Ask how they would ramp up, learn, or transfer existing principles to that technology (e.g. "How would you approach learning/using X for this role?").
3. Attach explicit evidenceReferences with source, type, and label for each question where relevant.
4. Categories must be one of: RESUME, CAREER_TWIN, PROJECT, TECHNICAL, JOB_SPECIFIC, BEHAVIORAL, SITUATIONAL, COMPANY_ROLE, EXPERIENCE.
5. Difficulties must be one of: EASY, MEDIUM, HARD.
6. Provide whyAsked, expectedSignals (array of strings), and preparationTips (array of strings) for every single question.

Return strictly valid JSON adhering to:
{
  "questions": [
    {
      "category": string,
      "difficulty": string,
      "question": string,
      "whyAsked": string,
      "expectedSignals": ["string"],
      "evidenceReferences": [
        {
          "source": "VERIFIED_USER_DATA" | "RESUME" | "CAREER_TWIN" | "GITHUB" | "JOB_DESCRIPTION" | "NEEDS_REVIEW" | "UNSUPPORTED",
          "type": string,
          "label": string,
          "referenceId": "string" optional,
          "quote": "string" optional
        }
      ],
      "preparationTips": ["string"]
    }
  ],
  "overallTheme": "string",
  "focusAreas": ["string"]
}`;

    const prompt = `TARGET ROLE: ${params.role}
COMPANY: ${params.company || 'Not specified'}
MODE: ${params.mode}
DIFFICULTY: ${params.difficulty}
TARGET QUESTION COUNT: ${params.questionCount || 10}

JOB DNA:
${params.jobDna ? JSON.stringify(params.jobDna, null, 2) : 'None provided'}

MATCH DATA (GAPS & STRONG SKILLS):
${params.matchData ? JSON.stringify(params.matchData, null, 2) : 'None provided'}

CANDIDATE RESUME EVIDENCE:
${params.resumeData ? JSON.stringify(params.resumeData, null, 2) : 'None provided'}

CAREER TWIN EVIDENCE:
${params.careerTwin ? JSON.stringify(params.careerTwin, null, 2) : 'None provided'}

Generate the requested balanced interview questions in valid JSON.`;

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

      const text = response.text;
      if (!text) {
        throw new AppError('Gemini returned an empty response.', 502);
      }

      const parsed = JSON.parse(text);
      return InterviewQuestionGenerationResultSchema.parse(parsed);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        `Gemini question generation failed: ${err.message || 'Unknown provider error'}`,
        502,
      );
    }
  }

  async evaluateInterviewAnswer(
    params: EvaluateAnswerParams,
  ): Promise<InterviewAnswerEvaluation> {
    const ai = this.ensureClient();

    const systemInstruction = `You are Resumind's expert AI interview evaluator and communication coach.
Analyze the candidate's answer to the given interview question.

IMPORTANT EVALUATION PRINCIPLES:
1. You are NOT a factual authority. Do NOT claim the answer is objectively factually correct.
2. Evaluate based on: relevance, completeness, clarity, technical depth, and structure.
3. For behavioral questions, evaluate STAR method (Situation, Task, Action, Result).
4. NEVER invent results or numbers. If the candidate lacks measurable metrics, advise them to add one if they have verified data.
5. Provide actionable strengths, weaknesses, missing points, and improvement suggestions.

Return strictly valid JSON adhering to:
{
  "score": number between 0 and 100,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missingPoints": ["string"],
  "improvementSuggestions": ["string"],
  "recommendedStructure": "string",
  "evidenceAlignment": "string",
  "dimensions": {
    "relevance": number (0-100),
    "completeness": number (0-100),
    "clarity": number (0-100),
    "technicalDepth": number (0-100),
    "evidenceAlignmentScore": number (0-100)
  }
}`;

    const prompt = `QUESTION:
${params.question}

CATEGORY: ${params.category}
DIFFICULTY: ${params.difficulty}
WHY ASKED: ${params.whyAsked || 'N/A'}
EXPECTED SIGNALS: ${JSON.stringify(params.expectedSignals || [])}

CANDIDATE ANSWER:
${params.answerText}

CANDIDATE BACKGROUND / EVIDENCE CONTEXT:
${params.candidateEvidenceSummary || 'Standard verified background'}

Evaluate the candidate's answer thoroughly in valid JSON.`;

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

      const text = response.text;
      if (!text) {
        throw new AppError('Gemini returned an empty response.', 502);
      }

      const parsed = JSON.parse(text);
      return InterviewAnswerEvaluationSchema.parse(parsed);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        `Gemini answer evaluation failed: ${err.message || 'Unknown provider error'}`,
        502,
      );
    }
  }

  async generateInterviewPreparationPlan(
    params: GeneratePrepPlanParams,
  ): Promise<InterviewPreparationPlan> {
    const ai = this.ensureClient();

    const systemInstruction = `You are Resumind's expert technical career coach.
Create a structured day-by-day interview preparation plan and technical readiness checklist.

RULES:
1. Ground the plan strictly in the provided Job DNA, skill gaps, and verified candidate evidence.
2. For the technical checklist, classify each skill as STRONG (verified in candidate evidence), REVIEW (partial match), or GAP (missing from evidence).
3. Do not invent candidate proficiencies.

Return strictly valid JSON adhering to:
{
  "durationDays": number,
  "dailyPlans": [
    {
      "day": number,
      "title": "string",
      "focus": "string",
      "tasks": ["string"],
      "targetCategories": ["RESUME" | "CAREER_TWIN" | "PROJECT" | "TECHNICAL" | "JOB_SPECIFIC" | "BEHAVIORAL" | "SITUATIONAL" | "COMPANY_ROLE" | "EXPERIENCE"]
    }
  ],
  "technicalChecklist": [
    {
      "skill": "string",
      "classification": "STRONG" | "REVIEW" | "GAP",
      "jobRequirement": "string",
      "candidateEvidence": "string",
      "recommendedTopics": ["string"]
    }
  ],
  "keyStrategyNotes": ["string"]
}`;

    const prompt = `ROLE: ${params.role}
COMPANY: ${params.company || 'Not specified'}
PLAN DURATION: ${params.durationDays || 5} days

JOB DNA:
${params.jobDna ? JSON.stringify(params.jobDna, null, 2) : 'None provided'}

MATCH DATA:
${params.matchData ? JSON.stringify(params.matchData, null, 2) : 'None provided'}

CANDIDATE EVIDENCE:
${params.careerTwin ? JSON.stringify(params.careerTwin, null, 2) : 'None provided'}

Generate the preparation plan in valid JSON.`;

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

      const text = response.text;
      if (!text) {
        throw new AppError('Gemini returned an empty response.', 502);
      }

      const parsed = JSON.parse(text);
      return InterviewPreparationPlanSchema.parse(parsed);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        `Gemini prep plan generation failed: ${err.message || 'Unknown provider error'}`,
        502,
      );
    }
  }

  async generateInterviewFinalReport(
    params: GenerateFinalReportParams,
  ): Promise<InterviewFinalReport> {
    const ai = this.ensureClient();

    const systemInstruction = `You are Resumind's interview evaluation engine.
Synthesize the overall performance across all answered questions into a comprehensive interview readiness report.

RULES:
1. Do NOT present scores as objective hiring probabilities. Use wording such as "Interview Preparation Score".
2. Provide readiness scores (0-100) across technical, behavioral, resume, job-specific, and project readiness.
3. Highlight genuine strongest areas, weakest areas, and evidence gaps.
4. Recommend actionable topics to review before the live interview.

Return strictly valid JSON adhering to:
{
  "overallPreparationScore": number (0-100),
  "technicalReadiness": number (0-100),
  "behavioralReadiness": number (0-100),
  "resumeReadiness": number (0-100),
  "jobSpecificReadiness": number (0-100),
  "projectReadiness": number (0-100),
  "strongestAreas": ["string"],
  "weakestAreas": ["string"],
  "evidenceGaps": ["string"],
  "recommendedTopics": ["string"],
  "questionsToRevisit": ["string"],
  "summaryFeedback": "string"
}`;

    const prompt = `SESSION: ${params.sessionTitle}
TARGET ROLE: ${params.role}
COMPANY: ${params.company || 'Not specified'}

QUESTIONS AND EVALUATIONS:
${JSON.stringify(params.questionsWithAnswers, null, 2)}

Generate the comprehensive final interview readiness report in valid JSON.`;

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

      const text = response.text;
      if (!text) {
        throw new AppError('Gemini returned an empty response.', 502);
      }

      const parsed = JSON.parse(text);
      return InterviewFinalReportSchema.parse(parsed);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        `Gemini report generation failed: ${err.message || 'Unknown provider error'}`,
        502,
      );
    }
  }

  async generateLearningPlan(
    params: GenerateLearningPlanParams,
  ): Promise<LearningPlanGenerationResult> {
    const ai = this.ensureClient();

    const systemInstruction = `You are Resumind's Career Progression Engine.
Create a personalized, evidence-building learning plan for target role: "${params.targetRole}".
CRITICAL CONSTRAINTS:
1. Never invent fake credentials or courses.
2. Focus on "proof-of-work" and evidence tasks (code repositories, architecture documentation, sandbox modules).
3. Every task must produce tangible, reviewable evidence.
4. Output strict JSON matching the schema.

JSON Schema:
{
  "title": "string",
  "targetRole": "string",
  "overview": "string",
  "estimatedWeeks": number,
  "goals": [
    {
      "skillName": "string",
      "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "currentLevel": "UNKNOWN" | "WEAK" | "MODERATE",
      "targetLevel": "STRONG",
      "rationale": "string",
      "learningObjective": "string",
      "tasks": [
        {
          "title": "string",
          "description": "string",
          "type": "PRACTICE" | "PROJECT" | "EVIDENCE" | "READING" | "REVIEW",
          "estimatedHours": number,
          "evidenceGoal": "string"
        }
      ]
    }
  ]
}`;

    const prompt = `TARGET ROLE: ${params.targetRole}
LEVEL: ${params.targetLevel || 'Mid-Senior'}
DURATION WEEKS: ${params.durationWeeks || 4}
SKILL GAPS TO BRIDGE:
${JSON.stringify(params.skillGaps, null, 2)}

Produce a structured evidence-building learning curriculum.`;

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

      const text = response.text;
      if (!text) {
        throw new AppError('Gemini returned an empty learning plan.', 502);
      }

      const parsed = JSON.parse(text);
      return LearningPlanGenerationSchema.parse(parsed);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        `Gemini learning plan generation failed: ${err.message || 'Unknown provider error'}`,
        502,
      );
    }
  }

  async generateSkillGapExplanation(
    params: GenerateSkillGapExplanationParams,
  ): Promise<SkillGapExplanationResult> {
    const ai = this.ensureClient();

    const systemInstruction = `You are a career intelligence advisor. Explain a candidate's skill gap for "${params.skill}" relative to role "${params.targetRole}".
Do not invent candidate background. Provide grounded, actionable advice. Output strict JSON:
{
  "skill": "string",
  "explanation": "string",
  "learningPathway": ["string"],
  "evidenceBuildingAdvice": "string"
}`;

    const prompt = `SKILL: ${params.skill}
TARGET ROLE: ${params.targetRole}
IMPORTANCE: ${params.importance}
EXISTING USER EVIDENCE: ${JSON.stringify(params.userEvidence)}`;

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

      const text = response.text;
      if (!text) {
        throw new AppError('Gemini returned empty skill gap explanation.', 502);
      }

      return JSON.parse(text);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        `Gemini skill gap explanation failed: ${err.message || 'Unknown provider error'}`,
        502,
      );
    }
  }

  async generateCareerInsights(
    params: GenerateCareerInsightsParams,
  ): Promise<CareerInsightsResult> {
    const ai = this.ensureClient();

    const systemInstruction = `You are Resumind's Career Analytics Advisor.
Generate 3 explainable, data-backed career insights based strictly on the candidate's metrics.
CRITICAL RULES:
1. Never invent fake market percentages or statistics.
2. Every insight must clearly answer: What changed? Why does it matter? What should the user do next?
3. Output strict JSON matching the schema:
{
  "insights": [
    {
      "title": "string",
      "category": "SKILL_GAP" | "APPLICATION" | "INTERVIEW" | "RESUME" | "MARKET",
      "impact": "HIGH" | "MEDIUM" | "LOW",
      "whatChanged": "string",
      "whyItMatters": "string",
      "recommendedAction": "string",
      "dataReference": "string"
    }
  ],
  "overallAssessment": "string"
}`;

    const prompt = `METRICS:
Target Role: ${params.targetRole || 'Software Engineering'}
Level: ${params.targetLevel || 'Mid-Senior'}
Career Readiness Score: ${params.readinessScore}/100
Strong Verified Skills: ${params.strongSkillsCount}
Prioritized Skill Gaps: ${params.gapSkillsCount}
Applications: ${params.applicationCount}
Interview Sessions: ${params.interviewCount}
Average Job Match Score: ${params.avgMatchScore ?? 'N/A'}
Weakest Interview Category: ${params.weakestInterviewCategory || 'None'}`;

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

      const text = response.text;
      if (!text) {
        throw new AppError('Gemini returned empty career insights.', 502);
      }

      const parsed = JSON.parse(text);
      return CareerInsightsResultSchema.parse(parsed);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        `Gemini career insights failed: ${err.message || 'Unknown provider error'}`,
        502,
      );
    }
  }
}
