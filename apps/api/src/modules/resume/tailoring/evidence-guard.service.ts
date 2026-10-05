import type { TailoringSuggestion } from '../ai/ai.interface.js';
import type { ParsedResumeData } from '../parser/section.parser.js';

export type EvidenceGuardStatus = 'VERIFIED' | 'NEEDS_REVIEW' | 'UNSUPPORTED';

export interface GuardedSuggestion extends TailoringSuggestion {
  guardStatus: EvidenceGuardStatus;
  guardExplanation: string;
  detectedUnsupportedClaims: string[];
  externalGitHubEvidence?: string[];
}

export interface EvidenceGuardResult {
  suggestions: GuardedSuggestion[];
  verifiedCount: number;
  needsReviewCount: number;
  unsupportedCount: number;
  summary: string;
}

interface EvidenceIndex {
  companies: Set<string>;
  titles: Set<string>;
  skills: Set<string>;
  technologies: Set<string>;
  metrics: Set<string>;
  corpus: string;
}

export class EvidenceGuardService {
  /**
   * Build in-memory evidence index from Career Twin and parsed resume
   */
  buildEvidenceIndex(
    careerTwin: any,
    parsedResume: ParsedResumeData,
  ): EvidenceIndex {
    const companies = new Set<string>();
    const titles = new Set<string>();
    const skills = new Set<string>();
    const technologies = new Set<string>();
    const metrics = new Set<string>();
    const textCorpusParts: string[] = [];

    // 1. Index Parsed Resume
    if (parsedResume.summary) {
      textCorpusParts.push(parsedResume.summary);
    }

    for (const sk of parsedResume.skills || []) {
      if (sk.name) {
        const norm = sk.name.toLowerCase().trim();
        skills.add(norm);
        technologies.add(norm);
      }
    }

    for (const exp of parsedResume.experience || []) {
      if (exp.company) companies.add(exp.company.toLowerCase().trim());
      if (exp.title) titles.add(exp.title.toLowerCase().trim());
      if (exp.description) textCorpusParts.push(exp.description);
      for (const h of exp.bullets || []) {
        textCorpusParts.push(h);
      }
    }

    for (const edu of parsedResume.education || []) {
      if (edu.institution) companies.add(edu.institution.toLowerCase().trim());
      if (edu.degree) textCorpusParts.push(edu.degree);
      if (edu.fieldOfStudy) textCorpusParts.push(edu.fieldOfStudy);
    }

    for (const proj of parsedResume.projects || []) {
      if (proj.name) textCorpusParts.push(proj.name);
      if (proj.description) textCorpusParts.push(proj.description);
      for (const t of proj.technologies || []) {
        const norm = t.toLowerCase().trim();
        skills.add(norm);
        technologies.add(norm);
      }
    }

    // 2. Index Career Twin
    if (careerTwin) {
      if (careerTwin.headline) textCorpusParts.push(careerTwin.headline);
      if (careerTwin.summary) textCorpusParts.push(careerTwin.summary);

      for (const exp of careerTwin.experiences || []) {
        if (exp.company) companies.add(exp.company.toLowerCase().trim());
        if (exp.title) titles.add(exp.title.toLowerCase().trim());
        if (exp.description) textCorpusParts.push(exp.description);
      }

      for (const sk of careerTwin.skills || []) {
        if (sk.name) {
          const norm = sk.name.toLowerCase().trim();
          skills.add(norm);
          technologies.add(norm);
        }
      }

      for (const proj of careerTwin.projects || []) {
        if (proj.name) textCorpusParts.push(proj.name);
        if (proj.description) textCorpusParts.push(proj.description);
        for (const t of proj.technologies || []) {
          const norm = t.toLowerCase().trim();
          skills.add(norm);
          technologies.add(norm);
        }
      }

      for (const edu of careerTwin.education || []) {
        if (edu.institution)
          companies.add(edu.institution.toLowerCase().trim());
        if (edu.degree) textCorpusParts.push(edu.degree);
      }

      for (const cert of careerTwin.certifications || []) {
        if (cert.name) textCorpusParts.push(cert.name);
      }

      for (const ach of careerTwin.achievements || []) {
        if (ach.title) textCorpusParts.push(ach.title);
        if (ach.description) textCorpusParts.push(ach.description);
      }
    }

    const corpus = textCorpusParts.join(' ').toLowerCase();

    // Extract all numbers and metrics from corpus
    const metricMatches = corpus.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
    for (const m of metricMatches) {
      metrics.add(m.trim());
    }

    return {
      companies,
      titles,
      skills,
      technologies,
      metrics,
      corpus,
    };
  }

  /**
   * Evaluates AI suggestions against candidate evidence
   */
  evaluateSuggestions(
    suggestions: TailoringSuggestion[],
    careerTwin: any,
    parsedResume: ParsedResumeData,
    _jobDna?: any,
    githubEvidence?: any[],
  ): EvidenceGuardResult {
    const index = this.buildEvidenceIndex(careerTwin, parsedResume);
    const guarded: GuardedSuggestion[] = [];

    // Index external GitHub evidence
    const githubTechSet = new Set<string>();
    if (Array.isArray(githubEvidence)) {
      for (const ev of githubEvidence) {
        if (ev.detectedTechnologies) {
          for (const t of ev.detectedTechnologies) {
            githubTechSet.add(String(t).toLowerCase().trim());
          }
        }
        if (ev.topics) {
          for (const top of ev.topics) {
            githubTechSet.add(String(top).toLowerCase().trim());
          }
        }
        if (ev.language) {
          githubTechSet.add(String(ev.language).toLowerCase().trim());
        }
      }
    }

    let verifiedCount = 0;
    let needsReviewCount = 0;
    let unsupportedCount = 0;

    for (const sug of suggestions) {
      const unsupportedClaims: string[] = [];
      const externalGitHubDetected: string[] = [];
      const originalText = sug.original || '';
      const proposedText = sug.proposed || '';

      // 1. Metric Hallucination Check
      // Look for percentages, multipliers (e.g. 40%, 10x, $5M) in proposed not in original or corpus
      const proposedMetrics =
        proposedText.match(
          /\b\d+(?:\.\d+)?%|\b\d+x\b|\$\d+(?:\.\d+)?[kKmMbB]?\b/g,
        ) || [];
      const originalMetrics = new Set(
        (
          originalText.match(
            /\b\d+(?:\.\d+)?%|\b\d+x\b|\$\d+(?:\.\d+)?[kKmMbB]?\b/g,
          ) || []
        ).map((m) => m.toLowerCase()),
      );

      for (const pm of proposedMetrics) {
        const lowerPm = pm.toLowerCase();
        if (!originalMetrics.has(lowerPm) && !index.corpus.includes(lowerPm)) {
          unsupportedClaims.push(`Unverified metric: "${pm}"`);
        }
      }

      // 2. High-Risk Keyword / Technology Check
      // Common tech tokens to detect if added out of thin air
      const commonTechKeywords = [
        'aws',
        'gcp',
        'azure',
        'kubernetes',
        'docker',
        'graphql',
        'kafka',
        'redis',
        'react',
        'angular',
        'vue',
        'python',
        'java',
        'go',
        'golang',
        'rust',
        'terraform',
        'ci/cd',
        'typescript',
        'spark',
        'hadoop',
        'c++',
      ];

      const proposedLower = proposedText.toLowerCase();
      const originalLower = originalText.toLowerCase();

      for (const tech of commonTechKeywords) {
        const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(proposedLower) && !regex.test(originalLower)) {
          // Check if it's in the candidate's verified skills or corpus
          const inSkills = index.skills.has(tech);
          const inCorpus = index.corpus.includes(tech);
          if (!inSkills && !inCorpus) {
            if (githubTechSet.has(tech)) {
              externalGitHubDetected.push(tech.toUpperCase());
              unsupportedClaims.push(
                `External GitHub evidence detected: "${tech.toUpperCase()}". Review before adding to Career Twin.`,
              );
            } else {
              unsupportedClaims.push(
                `Unverified technology: "${tech.toUpperCase()}"`,
              );
            }
          }
        }
      }

      // 3. Classification Determination
      let guardStatus: EvidenceGuardStatus;
      let guardExplanation: string;

      if (unsupportedClaims.length > 0) {
        guardStatus = 'UNSUPPORTED';
        if (externalGitHubDetected.length > 0) {
          guardExplanation = `External GitHub evidence detected (${externalGitHubDetected.join(', ')}). Review before adding to Career Twin.`;
        } else {
          guardExplanation = `This suggestion could not be verified from your Career Twin or resume evidence (${unsupportedClaims.join(', ')}). Add supporting experience if it is accurate.`;
        }
        unsupportedCount++;
      } else if (
        sug.evidenceReferences &&
        sug.evidenceReferences.length > 0 &&
        sug.confidence >= 0.8
      ) {
        guardStatus = 'VERIFIED';
        guardExplanation =
          'Clearly supported by verified Career Twin and resume evidence.';
        verifiedCount++;
      } else {
        guardStatus = 'NEEDS_REVIEW';
        guardExplanation =
          'Potentially supported rephrasing; review to confirm this accurately reflects your actual responsibilities.';
        needsReviewCount++;
      }

      guarded.push({
        ...sug,
        guardStatus,
        guardExplanation,
        detectedUnsupportedClaims: unsupportedClaims,
        externalGitHubEvidence:
          externalGitHubDetected.length > 0
            ? externalGitHubDetected
            : undefined,
      });
    }

    const total = suggestions.length;
    const summary = `${verifiedCount} verified, ${needsReviewCount} needs review, ${unsupportedCount} unsupported out of ${total} suggestions.`;

    return {
      suggestions: guarded,
      verifiedCount,
      needsReviewCount,
      unsupportedCount,
      summary,
    };
  }
}

export const evidenceGuardService = new EvidenceGuardService();
