import type { AIProvider, AIAnalysisResult } from './ai.interface.js';
import type { ParsedResumeData } from '../parser/section.parser.js';

export class MockAIProvider implements AIProvider {
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
}

export const aiProvider: AIProvider = new MockAIProvider();
