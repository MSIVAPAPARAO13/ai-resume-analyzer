import { JobDna, MatchResult, matchResultSchema } from '../job.validation.js';
import {
  CareerTwinContext,
  MatchingEngine,
  MatchingEngineInput,
} from './matching.interface.js';

// Aliases and related technologies for partial & strong matching
const TECH_ALIASES: Record<string, string[]> = {
  typescript: ['ts', 'typescript'],
  javascript: ['js', 'javascript', 'es6', 'ecmascript'],
  react: ['react.js', 'reactjs', 'react'],
  'node.js': ['node', 'nodejs', 'node.js'],
  postgresql: ['postgres', 'postgresql', 'psql'],
  mongodb: ['mongo', 'mongodb'],
  aws: ['amazon web services', 'aws', 'ec2', 's3', 'lambda'],
  gcp: ['google cloud', 'google cloud platform', 'gcp'],
  azure: ['microsoft azure', 'azure'],
  docker: ['containerization', 'containers', 'docker'],
  kubernetes: ['k8s', 'kubernetes'],
  'spring boot': ['spring', 'spring boot', 'java spring'],
  rest: ['restful', 'rest api', 'rest apis', 'restful api', 'rest'],
  graphql: ['graph ql', 'graphql'],
  'ci/cd': [
    'continuous integration',
    'github actions',
    'jenkins',
    'gitlab ci',
    'ci/cd',
  ],
  sql: [
    'relational database',
    'rdbms',
    'sql',
    'mysql',
    'postgres',
    'postgresql',
  ],
  python: ['py', 'python', 'python3'],
};

export class ResumeJobMatchingEngine implements MatchingEngine {
  async match(input: MatchingEngineInput): Promise<MatchResult> {
    const { parsedResume, extractedText, jobDna, careerTwin } = input;

    // 1. Gather all candidate evidence pools
    const resumeSkills = this.gatherResumeSkills(parsedResume);
    const twinSkills = this.gatherTwinSkills(careerTwin);
    const allSkills = Array.from(new Set([...resumeSkills, ...twinSkills]));

    const resumeTextNormalized = (extractedText || '').toLowerCase();
    const candidateBullets = this.gatherCandidateBullets(
      parsedResume,
      careerTwin,
    );

    // 2. Evaluate Skills Match (Weight: 30%)
    const skillEvaluation = this.evaluateSkills(
      jobDna.requiredSkills,
      jobDna.preferredSkills,
      allSkills,
      resumeTextNormalized,
      parsedResume,
      careerTwin,
    );

    // 3. Evaluate Experience Match (Weight: 20%)
    const expEvaluation = this.evaluateExperience(
      jobDna,
      parsedResume,
      careerTwin,
    );

    // 4. Evaluate Responsibilities Match (Weight: 20%)
    const respEvaluation = this.evaluateResponsibilities(
      jobDna.responsibilities,
      candidateBullets,
    );

    // 5. Evaluate Education Match (Weight: 10%)
    const eduEvaluation = this.evaluateEducation(
      jobDna,
      parsedResume,
      careerTwin,
    );

    // 6. Evaluate Keywords Coverage (Weight: 10%)
    const keywordEvaluation = this.evaluateKeywords(
      jobDna.keywords,
      resumeTextNormalized,
      allSkills,
    );

    // 7. Evaluate Career Twin Alignment (Weight: 10%)
    const twinEvaluation = this.evaluateCareerTwin(jobDna, careerTwin);

    // 8. Compute Weighted Overall Score (0 - 100)
    const skillsScore = skillEvaluation.score;
    const experienceScore = expEvaluation.score;
    const responsibilitiesScore = respEvaluation.score;
    const educationScore = eduEvaluation.score;
    const keywordScore = keywordEvaluation.score;
    const careerTwinScore = twinEvaluation.score;

    const overallScore = Math.round(
      skillsScore * 0.3 +
        experienceScore * 0.2 +
        responsibilitiesScore * 0.2 +
        educationScore * 0.1 +
        keywordScore * 0.1 +
        careerTwinScore * 0.1,
    );

    // 9. Consolidate Strong, Partial, Missing items
    const strongMatches = [
      ...skillEvaluation.strongMatches,
      ...expEvaluation.strongMatches,
      ...respEvaluation.strongMatches,
      ...eduEvaluation.strongMatches,
    ];

    const partialMatches = [
      ...skillEvaluation.partialMatches,
      ...expEvaluation.partialMatches,
      ...respEvaluation.partialMatches,
      ...eduEvaluation.partialMatches,
    ];

    const missingRequirements = [
      ...skillEvaluation.missingMatches,
      ...expEvaluation.missingMatches,
      ...respEvaluation.missingMatches,
      ...eduEvaluation.missingMatches,
    ];

    // 10. Generate Actionable Preparation Recommendations
    const recommendations = this.generateRecommendations(
      missingRequirements,
      partialMatches,
      skillEvaluation.missingSkills,
      jobDna,
    );

    const result: MatchResult = {
      scores: {
        overallScore: Math.min(100, Math.max(0, overallScore)),
        skillsScore: Math.min(100, Math.max(0, skillsScore)),
        experienceScore: Math.min(100, Math.max(0, experienceScore)),
        responsibilitiesScore: Math.min(
          100,
          Math.max(0, responsibilitiesScore),
        ),
        educationScore: Math.min(100, Math.max(0, educationScore)),
        keywordScore: Math.min(100, Math.max(0, keywordScore)),
        careerTwinScore: Math.min(100, Math.max(0, careerTwinScore)),
      },
      strongMatches,
      partialMatches,
      missingRequirements,
      matchedSkills: skillEvaluation.matchedSkills,
      missingSkills: skillEvaluation.missingSkills,
      keywordCoverage: keywordEvaluation.coverage,
      recommendations,
    };

    return matchResultSchema.parse(result);
  }

  // ─── Skill Evaluation Helper ──────────────────────────────────────────────────

  private evaluateSkills(
    required: string[],
    preferred: string[],
    candidateSkills: string[],
    resumeText: string,
    parsedResume: any,
    careerTwin?: CareerTwinContext | null,
  ) {
    const strongMatches: any[] = [];
    const partialMatches: any[] = [];
    const missingMatches: any[] = [];
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    let requiredScoreTotal = 0;
    let preferredScoreTotal = 0;

    // Process Required Skills
    for (const reqSkill of required) {
      const match = this.findSkillMatch(
        reqSkill,
        candidateSkills,
        resumeText,
        parsedResume,
        careerTwin,
      );
      if (match.status === 'STRONG_MATCH') {
        strongMatches.push({
          requirement: reqSkill,
          type: 'SKILL',
          importance: 'REQUIRED',
          status: 'STRONG_MATCH',
          evidence: match.evidence,
        });
        matchedSkills.push(reqSkill);
        requiredScoreTotal += 100;
      } else if (match.status === 'PARTIAL_MATCH') {
        partialMatches.push({
          requirement: reqSkill,
          type: 'SKILL',
          importance: 'REQUIRED',
          status: 'PARTIAL_MATCH',
          evidence: match.evidence,
          gap: match.gap,
        });
        matchedSkills.push(reqSkill);
        requiredScoreTotal += 60;
      } else {
        missingMatches.push({
          requirement: reqSkill,
          type: 'SKILL',
          importance: 'REQUIRED',
          status: 'MISSING',
          suggestion: `Add verifiable experience with ${reqSkill} to your Career Twin or resume projects.`,
        });
        missingSkills.push(reqSkill);
      }
    }

    // Process Preferred Skills
    for (const prefSkill of preferred) {
      const match = this.findSkillMatch(
        prefSkill,
        candidateSkills,
        resumeText,
        parsedResume,
        careerTwin,
      );
      if (match.status === 'STRONG_MATCH') {
        strongMatches.push({
          requirement: prefSkill,
          type: 'SKILL',
          importance: 'PREFERRED',
          status: 'STRONG_MATCH',
          evidence: match.evidence,
        });
        matchedSkills.push(prefSkill);
        preferredScoreTotal += 100;
      } else if (match.status === 'PARTIAL_MATCH') {
        partialMatches.push({
          requirement: prefSkill,
          type: 'SKILL',
          importance: 'PREFERRED',
          status: 'PARTIAL_MATCH',
          evidence: match.evidence,
          gap: match.gap,
        });
        matchedSkills.push(prefSkill);
        preferredScoreTotal += 60;
      } else {
        missingMatches.push({
          requirement: prefSkill,
          type: 'SKILL',
          importance: 'PREFERRED',
          status: 'MISSING',
          suggestion: `Familiarity with ${prefSkill} is preferred; highlight any related side projects or courses.`,
        });
        missingSkills.push(prefSkill);
      }
    }

    const reqAvg =
      required.length > 0 ? requiredScoreTotal / required.length : 100;
    const prefAvg =
      preferred.length > 0 ? preferredScoreTotal / preferred.length : 100;

    // Required skills carry 75% weight of skills category, preferred carry 25%
    const score = Math.round(reqAvg * 0.75 + prefAvg * 0.25);

    return {
      score,
      strongMatches,
      partialMatches,
      missingMatches,
      matchedSkills,
      missingSkills,
    };
  }

  private findSkillMatch(
    skillName: string,
    candidateSkills: string[],
    resumeText: string,
    parsedResume: any,
    careerTwin?: CareerTwinContext | null,
  ): {
    status: 'STRONG_MATCH' | 'PARTIAL_MATCH' | 'MISSING';
    evidence?: string;
    gap?: string;
  } {
    const sLower = skillName.toLowerCase();
    const aliases = TECH_ALIASES[sLower] || [sLower];

    // 1. Direct match in candidate skill lists
    const directSkill = candidateSkills.find((cs) => {
      const csLower = cs.toLowerCase();
      return aliases.some((a) => a === csLower || csLower.includes(a));
    });

    if (directSkill) {
      // Find where it's evidenced
      let evidence = `Skill listed as "${directSkill}" in candidate profile.`;
      const twinSkill = careerTwin?.skills?.find(
        (s: { name: string; proficiency?: string | null }) =>
          s.name.toLowerCase() === directSkill.toLowerCase(),
      );
      if (twinSkill?.proficiency) {
        evidence += ` Verified Career Twin proficiency: ${twinSkill.proficiency}.`;
      }
      return { status: 'STRONG_MATCH', evidence };
    }

    // 2. Mentioned in experience or project descriptions
    const matchingProject = parsedResume?.projects?.find((p: any) =>
      (p.technologies || []).some((t: string) =>
        aliases.some((a) => t.toLowerCase().includes(a)),
      ),
    );
    if (matchingProject) {
      return {
        status: 'STRONG_MATCH',
        evidence: `Used in project "${matchingProject.name}" (${matchingProject.technologies.join(', ')}).`,
      };
    }

    // 3. Mentioned in resume raw text
    for (const alias of aliases) {
      const escaped = alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      if (
        new RegExp(
          `(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`,
          'i',
        ).test(resumeText)
      ) {
        return {
          status: 'PARTIAL_MATCH',
          evidence: `Keyword "${alias}" referenced in resume work history or summary.`,
          gap: `Mentioned in context but not highlighted in dedicated technical skills list.`,
        };
      }
    }

    return { status: 'MISSING' };
  }

  // ─── Experience Evaluation Helper ─────────────────────────────────────────────

  private evaluateExperience(
    jobDna: JobDna,
    parsedResume: any,
    careerTwin?: CareerTwinContext | null,
  ) {
    const strongMatches: any[] = [];
    const partialMatches: any[] = [];
    const missingMatches: any[] = [];

    const reqYears = jobDna.experienceRequirement.years;
    const candidateYears = this.calculateTotalExperienceYears(
      parsedResume,
      careerTwin,
    );

    let score = 80; // default baseline

    if (reqYears !== null && reqYears > 0) {
      if (candidateYears >= reqYears) {
        score = 100;
        strongMatches.push({
          requirement: `${reqYears}+ years experience (${jobDna.roleFamily})`,
          type: 'EXPERIENCE',
          importance: 'REQUIRED',
          status: 'STRONG_MATCH',
          evidence: `Candidate demonstrates approximately ${candidateYears.toFixed(1)} years of verified engineering experience.`,
        });
      } else if (candidateYears >= reqYears * 0.6) {
        score = Math.round((candidateYears / reqYears) * 90);
        partialMatches.push({
          requirement: `${reqYears}+ years experience (${jobDna.roleFamily})`,
          type: 'EXPERIENCE',
          importance: 'REQUIRED',
          status: 'PARTIAL_MATCH',
          evidence: `Demonstrates ${candidateYears.toFixed(1)} years of experience.`,
          gap: `Target requirement is ${reqYears}+ years. Highlight leadership, rapid impact, or equivalent project tenure.`,
        });
      } else {
        score = Math.max(30, Math.round((candidateYears / reqYears) * 80));
        missingMatches.push({
          requirement: `${reqYears}+ years experience (${jobDna.roleFamily})`,
          type: 'EXPERIENCE',
          importance: 'REQUIRED',
          status: 'MISSING',
          suggestion: `Candidate experience profile (${candidateYears.toFixed(1)} yrs) is below stated ${reqYears} year threshold. Emphasize senior project scope.`,
        });
      }
    } else {
      score = candidateYears > 1 ? 95 : 85;
      strongMatches.push({
        requirement: 'Experience Level',
        type: 'EXPERIENCE',
        importance: 'REQUIRED',
        status: 'STRONG_MATCH',
        evidence: `No rigid minimum years specified; candidate brings ${candidateYears.toFixed(1)} years of relevant background.`,
      });
    }

    return { score, strongMatches, partialMatches, missingMatches };
  }

  // ─── Responsibilities Evaluation Helper ───────────────────────────────────────

  private evaluateResponsibilities(
    responsibilities: string[],
    candidateBullets: string[],
  ) {
    const strongMatches: any[] = [];
    const partialMatches: any[] = [];
    const missingMatches: any[] = [];

    if (responsibilities.length === 0) {
      return { score: 85, strongMatches, partialMatches, missingMatches };
    }

    let matchCount = 0;
    const bulletsConcat = candidateBullets.join(' ').toLowerCase();

    for (const resp of responsibilities) {
      const respWords = resp
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(
          (w) =>
            w.length > 4 &&
            ![
              'about',
              'their',
              'which',
              'using',
              'other',
              'build',
              'ensure',
            ].includes(w),
        );

      let matchedWords = 0;
      for (const word of respWords) {
        if (bulletsConcat.includes(word)) {
          matchedWords++;
        }
      }

      const ratio = respWords.length > 0 ? matchedWords / respWords.length : 0;

      if (ratio >= 0.5) {
        matchCount += 1.0;
        strongMatches.push({
          requirement: resp.length > 80 ? resp.substring(0, 77) + '...' : resp,
          type: 'RESPONSIBILITY',
          importance: 'REQUIRED',
          status: 'STRONG_MATCH',
          evidence: `Resume / Career Twin achievements substantiate this duty.`,
        });
      } else if (ratio >= 0.25) {
        matchCount += 0.6;
        partialMatches.push({
          requirement: resp.length > 80 ? resp.substring(0, 77) + '...' : resp,
          type: 'RESPONSIBILITY',
          importance: 'REQUIRED',
          status: 'PARTIAL_MATCH',
          evidence: `Related work found in profile.`,
          gap: `Opportunity to quantify specific outcomes matching this responsibility.`,
        });
      } else {
        missingMatches.push({
          requirement: resp.length > 80 ? resp.substring(0, 77) + '...' : resp,
          type: 'RESPONSIBILITY',
          importance: 'REQUIRED',
          status: 'MISSING',
          suggestion: `Prepare to discuss experience handling responsibilities like "${resp.substring(0, 50)}...".`,
        });
      }
    }

    const score = Math.min(
      100,
      Math.max(30, Math.round((matchCount / responsibilities.length) * 100)),
    );
    return { score, strongMatches, partialMatches, missingMatches };
  }

  // ─── Education Evaluation Helper ──────────────────────────────────────────────

  private evaluateEducation(
    jobDna: JobDna,
    parsedResume: any,
    careerTwin?: CareerTwinContext | null,
  ) {
    const strongMatches: any[] = [];
    const partialMatches: any[] = [];
    const missingMatches: any[] = [];

    const reqDegree = jobDna.educationRequirement.degree;
    const candidateEdu = [
      ...(parsedResume?.education || []),
      ...(careerTwin?.education || []),
    ];

    if (!reqDegree) {
      strongMatches.push({
        requirement: 'Education Requirements',
        type: 'EDUCATION',
        importance: 'REQUIRED',
        status: 'STRONG_MATCH',
        evidence:
          candidateEdu.length > 0
            ? `Candidate degree recorded.`
            : 'Degree or equivalent practical experience.',
      });
      return { score: 95, strongMatches, partialMatches, missingMatches };
    }

    const hasDegree = candidateEdu.some((e: any) => {
      const deg = (e.degree || '').toLowerCase();
      if (
        reqDegree.includes('Bachelor') &&
        (deg.includes('bachelor') ||
          deg.includes('b.s.') ||
          deg.includes('bs') ||
          deg.includes('b.e.'))
      ) {
        return true;
      }
      if (
        reqDegree.includes('Master') &&
        (deg.includes('master') ||
          deg.includes('m.s.') ||
          deg.includes('ms') ||
          deg.includes('m.b.a.'))
      ) {
        return true;
      }
      return false;
    });

    if (hasDegree) {
      strongMatches.push({
        requirement: reqDegree,
        type: 'EDUCATION',
        importance: 'REQUIRED',
        status: 'STRONG_MATCH',
        evidence: `Candidate holds qualifying ${reqDegree} from accredited institution.`,
      });
      return { score: 100, strongMatches, partialMatches, missingMatches };
    }

    if (candidateEdu.length > 0) {
      partialMatches.push({
        requirement: reqDegree,
        type: 'EDUCATION',
        importance: 'REQUIRED',
        status: 'PARTIAL_MATCH',
        evidence: `Candidate holds formal degree: ${candidateEdu[0].degree || 'Higher Education'}.`,
        gap: `Field or level differences can typically be bridged by proven professional experience.`,
      });
      return { score: 80, strongMatches, partialMatches, missingMatches };
    }

    missingMatches.push({
      requirement: reqDegree,
      type: 'EDUCATION',
      importance: 'REQUIRED',
      status: 'MISSING',
      suggestion:
        'Highlight equivalent practical engineering experience or industry certifications.',
    });
    return { score: 50, strongMatches, partialMatches, missingMatches };
  }

  // ─── Keyword Coverage Helper ─────────────────────────────────────────────────

  private evaluateKeywords(
    keywords: string[],
    resumeText: string,
    allSkills: string[],
  ) {
    if (keywords.length === 0) {
      return {
        score: 85,
        coverage: {
          total: 0,
          matched: 0,
          percentage: 100,
          matchedKeywords: [],
          missingKeywords: [],
        },
      };
    }

    const matched: string[] = [];
    const missing: string[] = [];

    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      const inSkills = allSkills.some((s) => s.toLowerCase() === kwLower);
      const inText = resumeText.includes(kwLower);

      if (inSkills || inText) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    }

    const percentage = Math.round((matched.length / keywords.length) * 100);
    return {
      score: percentage,
      coverage: {
        total: keywords.length,
        matched: matched.length,
        percentage,
        matchedKeywords: matched,
        missingKeywords: missing,
      },
    };
  }

  // ─── Career Twin Alignment Helper ────────────────────────────────────────────

  private evaluateCareerTwin(
    jobDna: JobDna,
    careerTwin?: CareerTwinContext | null,
  ) {
    if (!careerTwin) return { score: 70 };

    const twinSkills = careerTwin.skills || [];
    const twinExps = careerTwin.experiences || [];
    const twinProjects = careerTwin.projects || [];

    let bonus = 0;
    if (twinSkills.length >= 5) bonus += 30;
    if (twinExps.length >= 1) bonus += 35;
    if (twinProjects.length >= 1) bonus += 20;
    if (
      careerTwin.targetRole &&
      jobDna.role.toLowerCase().includes(careerTwin.targetRole.toLowerCase())
    ) {
      bonus += 15;
    }

    return { score: Math.min(100, bonus) };
  }

  // ─── Utility Helpers ─────────────────────────────────────────────────────────

  private gatherResumeSkills(parsedResume: any): string[] {
    const list: string[] = [];
    if (Array.isArray(parsedResume?.skills)) {
      for (const s of parsedResume.skills) {
        if (typeof s === 'string') list.push(s);
        else if (s?.name) list.push(s.name);
      }
    }
    return list;
  }

  private gatherTwinSkills(careerTwin?: CareerTwinContext | null): string[] {
    return (careerTwin?.skills || []).map((s: { name: string }) => s.name);
  }

  private gatherCandidateBullets(
    parsedResume: any,
    careerTwin?: CareerTwinContext | null,
  ): string[] {
    const bullets: string[] = [];
    if (Array.isArray(parsedResume?.experience)) {
      for (const exp of parsedResume.experience) {
        if (Array.isArray(exp.highlights)) {
          bullets.push(...exp.highlights);
        }
        if (exp.description) bullets.push(exp.description);
      }
    }
    if (Array.isArray(careerTwin?.experiences)) {
      for (const exp of careerTwin.experiences) {
        if (exp.description) bullets.push(exp.description);
      }
    }
    return bullets;
  }

  private calculateTotalExperienceYears(
    parsedResume: any,
    careerTwin?: CareerTwinContext | null,
  ): number {
    let totalMonths = 0;
    const exps = [
      ...(parsedResume?.experience || []),
      ...(careerTwin?.experiences || []),
    ];

    for (const exp of exps) {
      try {
        const start = exp.startDate ? new Date(exp.startDate) : null;
        const end = exp.endDate
          ? new Date(exp.endDate)
          : exp.isCurrent
            ? new Date()
            : null;
        if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const months =
            (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth());
          if (months > 0) totalMonths += months;
        }
      } catch {
        // ignore date parse issues
      }
    }

    // Default to at least 2.5 years if experiences are present but lack precise dates
    if (totalMonths === 0 && exps.length > 0) {
      return exps.length * 1.5;
    }

    return Math.max(0, totalMonths / 12);
  }

  private generateRecommendations(
    missing: any[],
    partial: any[],
    missingSkills: string[],
    jobDna: JobDna,
  ): string[] {
    const recs: string[] = [];

    if (missingSkills.length > 0) {
      const topMissing = missingSkills.slice(0, 3).join(', ');
      recs.push(
        `Technical Gaps: The job highlights ${topMissing}. If you possess experience with these tools that is not yet reflected in your Career Twin, add them to your profile.`,
      );
    }

    if (partial.some((p) => p.type === 'EXPERIENCE')) {
      recs.push(
        `Experience Framing: The role emphasizes ${jobDna.experienceRequirement.raw}. Emphasize the architectural complexity and team leadership of your past projects during discussions.`,
      );
    }

    if (missing.some((m) => m.type === 'RESPONSIBILITY')) {
      recs.push(
        `Interview Preparation: Prepare structured STAR stories demonstrating practical experience with core duties like "${jobDna.responsibilities[0] || 'core engineering responsibilities'}".`,
      );
    }

    if (recs.length < 3) {
      recs.push(
        `Keyword Alignment: Enhance your resume summary to prominently reference "${jobDna.roleFamily}" and "${jobDna.role}".`,
      );
    }

    return recs.slice(0, 4);
  }
}
