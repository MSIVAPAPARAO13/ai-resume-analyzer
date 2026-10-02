import type { ParsedResumeData } from '../parser/section.parser.js';

export interface ScoreCategory {
  score: number;
  weight: number;
  explanation: string;
  strengths: string[];
  improvements: string[];
}

export interface ResumeScoreResult {
  overallScore: number;
  atsScore: number;
  contentScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  formattingScore: number;
  summaryScore: number;
  keywordScore: number;
  categories: {
    ats: ScoreCategory;
    content: ScoreCategory;
    skills: ScoreCategory;
    experience: ScoreCategory;
    education: ScoreCategory;
    formatting: ScoreCategory;
  };
  topStrengths: string[];
  topImprovements: string[];
}

const ACTION_VERBS = [
  'built',
  'developed',
  'architected',
  'designed',
  'led',
  'managed',
  'optimized',
  'improved',
  'scaled',
  'implemented',
  'orchestrated',
  'reduced',
  'increased',
  'generated',
  'engineered',
  'launched',
  'deployed',
  'mentored',
  'refactored',
  'spearheaded',
  'automated',
];

export class ScoringEngine {
  calculateScores(data: ParsedResumeData, rawText: string): ResumeScoreResult {
    const ats = this.calculateAtsScore(data, rawText);
    const content = this.calculateContentScore(data, rawText);
    const skills = this.calculateSkillsScore(data);
    const experience = this.calculateExperienceScore(data);
    const education = this.calculateEducationScore(data);
    const formatting = this.calculateFormattingScore(data, rawText);

    // Summary & Keyword standalone scores
    const summaryScore = data.summary
      ? Math.min(
          100,
          Math.max(50, Math.round((data.summary.length / 300) * 100)),
        )
      : 20;

    const keywordScore = Math.min(
      100,
      Math.round((data.skills.length / 12) * 100),
    );

    // Weighted Overall Score
    const overallScore = Math.round(
      ats.score * ats.weight +
        content.score * content.weight +
        skills.score * skills.weight +
        experience.score * experience.weight +
        education.score * education.weight +
        formatting.score * formatting.weight,
    );

    // Aggregate top strengths & improvements
    const topStrengths = [
      ...ats.strengths,
      ...content.strengths,
      ...skills.strengths,
      ...experience.strengths,
      ...education.strengths,
      ...formatting.strengths,
    ].slice(0, 5);

    const topImprovements = [
      ...ats.improvements,
      ...content.improvements,
      ...skills.improvements,
      ...experience.improvements,
      ...education.improvements,
      ...formatting.improvements,
    ].slice(0, 5);

    return {
      overallScore: Math.min(100, Math.max(0, overallScore)),
      atsScore: ats.score,
      contentScore: content.score,
      skillsScore: skills.score,
      experienceScore: experience.score,
      educationScore: education.score,
      formattingScore: formatting.score,
      summaryScore,
      keywordScore,
      categories: {
        ats,
        content,
        skills,
        experience,
        education,
        formatting,
      },
      topStrengths,
      topImprovements,
    };
  }

  private calculateAtsScore(
    data: ParsedResumeData,
    rawText: string,
  ): ScoreCategory {
    let score = 0;
    const strengths: string[] = [];
    const improvements: string[] = [];

    // 1. Text readability (25 pts)
    if (rawText.length > 200) {
      score += 25;
      strengths.push('Clean parseable text without unreadable characters');
    } else {
      improvements.push(
        'Resume text density is very low; ensure content is machine-readable',
      );
    }

    // 2. Standard section headers (25 pts)
    let headerCount = 0;
    if (data.experience.length > 0) headerCount++;
    if (data.education.length > 0) headerCount++;
    if (data.skills.length > 0) headerCount++;
    if (data.summary) headerCount++;

    if (headerCount >= 3) {
      score += 25;
      strengths.push(
        'Standard ATS section headings detected (Experience, Education, Skills)',
      );
    } else {
      score += headerCount * 8;
      improvements.push(
        'Add standard section headers like "Experience", "Skills", and "Education"',
      );
    }

    // 3. Contact information completeness (25 pts)
    let contactPts = 0;
    if (data.contact.email) contactPts += 10;
    if (data.contact.phone) contactPts += 8;
    if (data.contact.links && data.contact.links.length > 0) contactPts += 7;

    score += contactPts;
    if (contactPts >= 20) {
      strengths.push(
        'Contact info is complete with email, phone, and professional links',
      );
    } else {
      if (!data.contact.email)
        improvements.push('Include a clear professional email address');
      if (!data.contact.phone)
        improvements.push('Include a contact telephone number');
      if (!data.contact.links || data.contact.links.length === 0)
        improvements.push('Add LinkedIn or GitHub profile link');
    }

    // 4. File formatting safety (25 pts)
    score += 25;

    return {
      score: Math.min(100, score),
      weight: 0.2,
      explanation:
        'Evaluates ATS text readability, standard section headers, and contact information completeness.',
      strengths,
      improvements,
    };
  }

  private calculateContentScore(
    data: ParsedResumeData,
    rawText: string,
  ): ScoreCategory {
    let score = 0;
    const strengths: string[] = [];
    const improvements: string[] = [];

    // 1. Professional Summary (25 pts)
    if (data.summary && data.summary.length >= 50) {
      score += 25;
      strengths.push(
        'Strong professional summary positions career seniority and focus',
      );
    } else {
      improvements.push(
        'Add a 2-4 sentence professional summary highlighting your specialization',
      );
    }

    // 2. Action verbs (25 pts)
    const lowerText = rawText.toLowerCase();
    const detectedVerbs = ACTION_VERBS.filter((v) =>
      new RegExp(`\\b${v}\\b`, 'i').test(lowerText),
    );

    if (detectedVerbs.length >= 6) {
      score += 25;
      strengths.push(
        `Rich action-oriented language (${detectedVerbs.slice(0, 4).join(', ')}…)`,
      );
    } else if (detectedVerbs.length >= 3) {
      score += 15;
      improvements.push(
        'Increase use of strong action verbs at the start of bullet points',
      );
    } else {
      score += 5;
      improvements.push(
        'Begin experience bullets with strong impact verbs (e.g., Architected, Reduced, Accelerated)',
      );
    }

    // 3. Quantified metrics / numbers (25 pts)
    const metricsMatches =
      rawText.match(
        /\b\d+(?:\.\d+)?%|\$\d+(?:,\d+)*(?:\.\d+)?|\b\d+x\b|\b\d+\s*(?:users|clients|engineers|teams|ms|seconds|minutes|hours|days|fold|percent)\b/gi,
      ) || [];

    if (metricsMatches.length >= 3) {
      score += 25;
      strengths.push(
        `Quantifiable metrics and business outcomes identified (${metricsMatches.length} metrics found)`,
      );
    } else if (metricsMatches.length >= 1) {
      score += 15;
      improvements.push(
        'Add more measurable impact metrics (percentages, dollar amounts, scale)',
      );
    } else {
      improvements.push(
        'Quantify your achievements with concrete numbers, scale, or percentage improvements',
      );
    }

    // 4. Detailed descriptions (25 pts)
    const hasBullets = data.experience.some(
      (e) => e.bullets && e.bullets.length >= 2,
    );
    if (hasBullets) {
      score += 25;
      strengths.push(
        'Bullet points provide structured accomplishment breakdowns',
      );
    } else {
      score += 10;
      improvements.push(
        'Break down work experience into concise, high-impact bullet points',
      );
    }

    return {
      score: Math.min(100, score),
      weight: 0.25,
      explanation:
        'Assesses impact verbs, quantified accomplishments, and narrative clarity.',
      strengths,
      improvements,
    };
  }

  private calculateSkillsScore(data: ParsedResumeData): ScoreCategory {
    let score = 0;
    const strengths: string[] = [];
    const improvements: string[] = [];

    const skillCount = data.skills.length;
    const categories = new Set(
      data.skills.map((s) => s.category).filter(Boolean),
    );

    if (skillCount >= 10) {
      score += 50;
      strengths.push(
        `Extensive skill inventory (${skillCount} technical skills detected)`,
      );
    } else if (skillCount >= 5) {
      score += 35;
      strengths.push(`${skillCount} technical skills recognized`);
      improvements.push(
        'Add more specific technical tools, libraries, or frameworks you have used',
      );
    } else {
      score += 15;
      improvements.push(
        'Include a dedicated skills section listing core programming languages and technologies',
      );
    }

    if (categories.size >= 4) {
      score += 50;
      strengths.push(
        `Diverse competency coverage across ${categories.size} categories (${Array.from(categories).slice(0, 3).join(', ')})`,
      );
    } else if (categories.size >= 2) {
      score += 30;
      improvements.push(
        'Categorize skills (e.g. Languages, Frameworks, Databases, DevOps)',
      );
    } else {
      score += 15;
      improvements.push(
        'Broaden your skill set across infrastructure, databases, and tooling',
      );
    }

    return {
      score: Math.min(100, score),
      weight: 0.2,
      explanation:
        'Evaluates depth, breadth, and categorical balance of detected technical skills.',
      strengths,
      improvements,
    };
  }

  private calculateExperienceScore(data: ParsedResumeData): ScoreCategory {
    let score = 0;
    const strengths: string[] = [];
    const improvements: string[] = [];

    const expCount = data.experience.length;

    if (expCount >= 2) {
      score += 40;
      strengths.push(
        `Solid career progression with ${expCount} documented positions`,
      );
    } else if (expCount === 1) {
      score += 25;
      strengths.push('Documented professional experience entry');
    } else {
      improvements.push(
        'Add detailed professional work experiences or substantial internship history',
      );
    }

    // Check dates and company names
    const hasDates = data.experience.every((e) => e.startDate || e.endDate);
    if (hasDates && expCount > 0) {
      score += 30;
      strengths.push('Clear chronological timeline with dates');
    } else if (expCount > 0) {
      score += 10;
      improvements.push(
        'Ensure start and end dates (month/year) are clearly stated for each role',
      );
    }

    // Check descriptions
    const hasBulletDetails = data.experience.some(
      (e) => (e.bullets && e.bullets.length >= 3) || e.description.length > 150,
    );
    if (hasBulletDetails) {
      score += 30;
      strengths.push(
        'Well-developed role descriptions with multiple achievement points',
      );
    } else if (expCount > 0) {
      score += 15;
      improvements.push(
        'Add 3-5 descriptive bullet points for each position detailing responsibilities and results',
      );
    }

    return {
      score: Math.min(100, score),
      weight: 0.2,
      explanation:
        'Analyzes timeline consistency, job titles, companies, and responsibilities.',
      strengths,
      improvements,
    };
  }

  private calculateEducationScore(data: ParsedResumeData): ScoreCategory {
    let score = 0;
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (data.education.length > 0) {
      const first = data.education[0];
      score += 50;
      strengths.push(`Verified academic credential from ${first.institution}`);

      if (first.degree && first.degree !== 'Degree') {
        score += 50;
        strengths.push(`Degree stated: ${first.degree}`);
      } else {
        score += 25;
        improvements.push(
          'Specify degree title and major (e.g. B.S. in Computer Science)',
        );
      }
    } else {
      improvements.push(
        'Include your formal education, degree, or relevant certification details',
      );
    }

    return {
      score: Math.min(100, score),
      weight: 0.08,
      explanation:
        'Checks presence of educational institutions, degrees, and academic backgrounds.',
      strengths,
      improvements,
    };
  }

  private calculateFormattingScore(
    data: ParsedResumeData,
    rawText: string,
  ): ScoreCategory {
    let score = 0;
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Text length heuristic (1-2 pages: ~300 - 1500 words)
    const wordCount = rawText.split(/\s+/).length;
    if (wordCount >= 250 && wordCount <= 1200) {
      score += 50;
      strengths.push(
        `Ideal resume length (~${wordCount} words, roughly 1-2 pages)`,
      );
    } else if (wordCount < 250) {
      score += 20;
      improvements.push(
        'Resume is brief; elaborate on key projects, responsibilities, and achievements',
      );
    } else {
      score += 30;
      improvements.push(
        'Resume is lengthy; consider streamlining to 1-2 focused pages',
      );
    }

    // Projects or Certifications extra boost
    if (data.projects.length > 0) {
      score += 25;
      strengths.push(
        'Dedicated projects section highlights practical hands-on engineering',
      );
    }

    if (data.certifications.length > 0) {
      score += 25;
      strengths.push(
        'Certifications provide verified third-party competence proof',
      );
    }

    if (score < 50) score = 50; // minimum baseline for parseable resumes

    return {
      score: Math.min(100, score),
      weight: 0.07,
      explanation:
        'Evaluates document length, layout density, and supplementary project/cert sections.',
      strengths,
      improvements,
    };
  }
}

export const scoringEngine = new ScoringEngine();
