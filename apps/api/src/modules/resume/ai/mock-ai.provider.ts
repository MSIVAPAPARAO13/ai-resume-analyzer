import type {
  AIProvider,
  AIAnalysisResult,
  TailoringPromptParams,
  TailoringGenerationResult,
  TailoringSuggestion,
} from './ai.interface.js';
import type { ParsedResumeData } from '../parser/section.parser.js';

export class MockAIProvider implements AIProvider {
  readonly name = 'MOCK';

  async analyzeResume(
    _text: string,
    parsedData: ParsedResumeData,
    _careerTwin?: any,
  ): Promise<AIAnalysisResult> {
    const hasSkills = parsedData.skills.length > 0;
    const hasExp = parsedData.experience.length > 0;

    const suggestedRoles = [];
    if (
      parsedData.skills.some(
        (s) =>
          s.category === 'Frontend' || s.name.toLowerCase().includes('react'),
      )
    ) {
      suggestedRoles.push('Senior Frontend Engineer');
    }
    if (
      parsedData.skills.some(
        (s) =>
          s.category === 'Backend' || s.name.toLowerCase().includes('node'),
      )
    ) {
      suggestedRoles.push('Backend Software Engineer');
    }
    if (
      parsedData.skills.some(
        (s) => s.category === 'Cloud' || s.category === 'DevOps',
      )
    ) {
      suggestedRoles.push('DevOps / Cloud Architect');
    }
    if (suggestedRoles.length === 0) {
      suggestedRoles.push('Full Stack Software Engineer', 'Software Engineer');
    }

    const keyHighlights = [];
    if (hasExp) {
      keyHighlights.push(
        `Demonstrated professional track record with ${parsedData.experience.length} career positions.`,
      );
    }
    if (hasSkills) {
      keyHighlights.push(
        `Strong portfolio of ${parsedData.skills.length} recognized technical competencies.`,
      );
    }
    if (parsedData.education.length > 0) {
      keyHighlights.push(
        `Formal academic credentials verified from ${parsedData.education[0]?.institution}.`,
      );
    }

    return {
      summaryCritique: parsedData.summary
        ? 'Professional summary provides a solid baseline; ensure quantified business metrics are highlighted upfront.'
        : 'Adding a 2-3 line summary at the top will quickly position your target seniority and core domain expertise.',
      suggestedRoles,
      keyHighlights,
      recommendedKeywords: [
        'Architecture',
        'Scalability',
        'CI/CD Pipelines',
        'System Design',
        'Cross-functional Leadership',
      ],
    };
  }

  async generateTailoringSuggestions(
    params: TailoringPromptParams,
  ): Promise<TailoringGenerationResult> {
    const { parsedResume, careerTwin, jobDna } = params;

    // Identify candidate skills from resume and Career Twin
    const resumeSkillNames = parsedResume.skills.map((s) =>
      s.name.toLowerCase(),
    );
    const twinSkillNames = Array.isArray(careerTwin?.skills)
      ? careerTwin.skills.map((s: any) => s.name.toLowerCase())
      : [];
    const allEvidenceSkillNames = new Set([
      ...resumeSkillNames,
      ...twinSkillNames,
    ]);

    // Matching required skills from Job DNA
    const matchedJobSkills = jobDna.skills
      .filter((s) => allEvidenceSkillNames.has(s.name.toLowerCase()))
      .map((s) => s.name);

    const prioritizedSkills =
      matchedJobSkills.length > 0
        ? matchedJobSkills.slice(0, 8)
        : parsedResume.skills.slice(0, 6).map((s) => s.name);

    const suggestions: TailoringSuggestion[] = [];

    // 1. SUMMARY_UPDATE
    const existingSummary =
      parsedResume.summary || 'Software professional with industry experience.';
    const skillListStr =
      prioritizedSkills.slice(0, 3).join(', ') ||
      'modern software architectures';
    suggestions.push({
      type: 'SUMMARY_UPDATE',
      original: existingSummary,
      proposed: `Results-driven ${jobDna.role} with proven expertise in ${skillListStr}, delivering resilient, scalable solutions aligned with business objectives.`,
      reason: `Directly positions qualifications for target role of ${jobDna.role} highlighting verified technical competencies.`,
      evidenceReferences: ['Resume: Summary', 'CareerTwin: Skills'],
      confidence: 0.95,
      requiresUserApproval: true,
    });

    // 2. KEYWORD_ALIGNMENT
    if (prioritizedSkills.length > 0) {
      const topSkill = prioritizedSkills[0];
      suggestions.push({
        type: 'KEYWORD_ALIGNMENT',
        original:
          parsedResume.skills
            .map((s) => s.name)
            .slice(0, 5)
            .join(', ') || 'General Engineering',
        proposed: prioritizedSkills.join(' • '),
        reason: `Reorders technical skills section to position high-priority job match keyword '${topSkill}' upfront.`,
        evidenceReferences: ['JobDNA: RequiredSkills', 'CareerTwin: Skills'],
        confidence: 0.92,
        requiresUserApproval: true,
      });
    }

    // 3. REWRITE (Experience bullet)
    if (parsedResume.experience.length > 0) {
      const firstExp = parsedResume.experience[0];
      const origBullet =
        firstExp.bullets?.[0] ||
        firstExp.description ||
        `Developed software features at ${firstExp.company}.`;
      const techMention = matchedJobSkills[0] || 'Node.js';
      suggestions.push({
        type: 'REWRITE',
        original: origBullet,
        proposed: `Architected and implemented production services using ${techMention}, enhancing reliability and supporting cross-functional team deliverables.`,
        reason: `Reframes bullet point to highlight required technology (${techMention}) and engineering ownership.`,
        evidenceReferences: [
          `Resume: Experience (${firstExp.company})`,
          'CareerTwin: Experience',
        ],
        confidence: 0.88,
        requiresUserApproval: true,
      });
    }

    // 4. PROJECT_EMPHASIS
    if (Array.isArray(careerTwin?.projects) && careerTwin.projects.length > 0) {
      const proj = careerTwin.projects[0];
      suggestions.push({
        type: 'PROJECT_EMPHASIS',
        original: proj.description || proj.name,
        proposed: `Engineered ${proj.name}: ${proj.description || 'scalable system'} utilizing ${(proj.technologies || []).join(', ')}.`,
        reason: `Highlights verified portfolio project '${proj.name}' matching job architectural requirements.`,
        evidenceReferences: [`CareerTwin: Projects (${proj.name})`],
        confidence: 0.9,
        requiresUserApproval: true,
      });
    } else if (parsedResume.projects && parsedResume.projects.length > 0) {
      const proj = parsedResume.projects[0];
      suggestions.push({
        type: 'PROJECT_EMPHASIS',
        original: proj.description || proj.name,
        proposed: `Engineered ${proj.name}: ${proj.description || 'production system'} showcasing hands-on technical architecture.`,
        reason: `Spotlights portfolio project '${proj.name}' directly relevant to ${jobDna.role}.`,
        evidenceReferences: [`Resume: Projects (${proj.name})`],
        confidence: 0.89,
        requiresUserApproval: true,
      });
    }

    return {
      tailoredSummary: suggestions[0]?.proposed,
      prioritizedSkills,
      suggestions,
      evidenceAnalysis: {
        supportedClaims: [
          `Candidate verified expertise in ${prioritizedSkills.slice(0, 3).join(', ')}`,
          `Experience documented in ${parsedResume.experience[0]?.company || 'professional background'}`,
        ],
        unsupportedClaims: [],
        uncertainClaims: [],
        evidenceReferences: [
          'Resume: Experience',
          'Resume: Skills',
          'CareerTwin: Skills',
        ],
        warnings: [],
      },
    };
  }
}

export const aiProvider: AIProvider = new MockAIProvider();
