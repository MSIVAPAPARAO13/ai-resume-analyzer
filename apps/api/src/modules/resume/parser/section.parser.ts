import { z } from 'zod';

// ─── Parsed Resume Data Schema ────────────────────────────────────────────────

export const parsedContactSchema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  links: z.array(z.string()).default([]),
});

export const parsedExperienceItemSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().default(''),
  bullets: z.array(z.string()).default([]),
});

export const parsedEducationItemSchema = z.object({
  institution: z.string(),
  degree: z.string().nullable().optional(),
  fieldOfStudy: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const parsedSkillItemSchema = z.object({
  name: z.string(),
  category: z.string().nullable().optional(),
});

export const parsedProjectItemSchema = z.object({
  name: z.string(),
  description: z.string().default(''),
  technologies: z.array(z.string()).default([]),
  url: z.string().nullable().optional(),
});

export const parsedCertificationItemSchema = z.object({
  name: z.string(),
  issuer: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
});

export const parsedAchievementItemSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
});

export const parsedResumeDataSchema = z.object({
  contact: parsedContactSchema,
  summary: z.string().nullable(),
  experience: z.array(parsedExperienceItemSchema).default([]),
  education: z.array(parsedEducationItemSchema).default([]),
  skills: z.array(parsedSkillItemSchema).default([]),
  projects: z.array(parsedProjectItemSchema).default([]),
  certifications: z.array(parsedCertificationItemSchema).default([]),
  achievements: z.array(parsedAchievementItemSchema).default([]),
});

export type ParsedResumeData = z.infer<typeof parsedResumeDataSchema>;

// ─── Known Technical Skills Dictionary ────────────────────────────────────────

const COMMON_SKILLS: Record<string, string> = {
  // Programming Languages
  typescript: 'Programming',
  javascript: 'Programming',
  python: 'Programming',
  java: 'Programming',
  'c++': 'Programming',
  csharp: 'Programming',
  'c#': 'Programming',
  golang: 'Programming',
  go: 'Programming',
  rust: 'Programming',
  ruby: 'Programming',
  php: 'Programming',
  swift: 'Programming',
  kotlin: 'Programming',
  sql: 'Database',

  // Frontend & Mobile
  react: 'Frontend',
  'next.js': 'Frontend',
  nextjs: 'Frontend',
  vue: 'Frontend',
  vuejs: 'Frontend',
  angular: 'Frontend',
  svelte: 'Frontend',
  tailwind: 'Frontend',
  tailwindcss: 'Frontend',
  bootstrap: 'Frontend',
  html5: 'Frontend',
  css3: 'Frontend',
  sass: 'Frontend',
  redux: 'Frontend',
  flutter: 'Mobile',
  'react native': 'Mobile',

  // Backend & Cloud
  'node.js': 'Backend',
  nodejs: 'Backend',
  express: 'Backend',
  expressjs: 'Backend',
  nest: 'Backend',
  nestjs: 'Backend',
  fastapi: 'Backend',
  django: 'Backend',
  flask: 'Backend',
  'spring boot': 'Backend',
  graphql: 'Backend',
  rest: 'Backend',
  grpc: 'Backend',

  // Databases & Storage
  postgresql: 'Database',
  postgres: 'Database',
  mysql: 'Database',
  mongodb: 'Database',
  redis: 'Database',
  elasticsearch: 'Database',
  sqlite: 'Database',
  dynamodb: 'Database',
  prisma: 'Database',

  // DevOps & Cloud
  docker: 'DevOps',
  kubernetes: 'DevOps',
  aws: 'Cloud',
  gcp: 'Cloud',
  azure: 'Cloud',
  terraform: 'DevOps',
  ansible: 'DevOps',
  'ci/cd': 'DevOps',
  jenkins: 'DevOps',
  github: 'Tools',
  git: 'Tools',
  linux: 'DevOps',

  // Testing & Quality
  jest: 'Testing',
  vitest: 'Testing',
  cypress: 'Testing',
  playwright: 'Testing',

  // Methodologies & Soft Skills
  agile: 'Methodology',
  scrum: 'Methodology',
  leadership: 'Soft Skills',
  mentoring: 'Soft Skills',
  communication: 'Soft Skills',
};

// ─── Section Header Keywords ──────────────────────────────────────────────────

const SECTION_HEADERS: Record<string, RegExp> = {
  summary:
    /^(professional\s+summary|summary|profile|about\s+me|overview|executive\s+summary)\b/i,
  experience:
    /^(work\s+experience|experience|employment|professional\s+experience|work\s+history)\b/i,
  education: /^(education|academic\s+background|academics|qualifications)\b/i,
  skills:
    /^(technical\s+skills|skills|technologies|core\s+competencies|key\s+skills|tools\s+&\s+technologies)\b/i,
  projects:
    /^(projects|personal\s+projects|key\s+projects|portfolio\s+projects)\b/i,
  certifications: /^(certifications|licenses|courses|accreditations)\b/i,
  achievements: /^(achievements|awards|honors|publications)\b/i,
};

// ─── Deterministic Section Parser ─────────────────────────────────────────────

export class SectionParser {
  parse(rawText: string): ParsedResumeData {
    const lines = this.cleanAndSplit(rawText);
    const sections = this.segmentSections(lines);

    const contact = this.extractContact(lines, rawText);
    const summary = this.extractSummary(sections.summary);
    const experience = this.extractExperience(sections.experience);
    const education = this.extractEducation(sections.education);
    const skills = this.extractSkills(sections.skills, rawText);
    const projects = this.extractProjects(sections.projects);
    const certifications = this.extractCertifications(sections.certifications);
    const achievements = this.extractAchievements(sections.achievements);

    return parsedResumeDataSchema.parse({
      contact,
      summary,
      experience,
      education,
      skills,
      projects,
      certifications,
      achievements,
    });
  }

  private cleanAndSplit(text: string): string[] {
    return text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }

  private segmentSections(lines: string[]): Record<string, string[]> {
    const sections: Record<string, string[]> = {
      summary: [],
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      achievements: [],
      other: [],
    };

    let currentSection = 'other';

    for (const line of lines) {
      // Check if line matches a known section header
      let matchedHeader = false;
      const cleanHeaderLine = line.replace(/[:\-–—#*]/g, '').trim();

      for (const [key, regex] of Object.entries(SECTION_HEADERS)) {
        if (regex.test(cleanHeaderLine) && cleanHeaderLine.length < 40) {
          currentSection = key;
          matchedHeader = true;
          break;
        }
      }

      if (!matchedHeader) {
        sections[currentSection].push(line);
      }
    }

    return sections;
  }

  private extractContact(lines: string[], rawText: string) {
    // Email regex
    const emailMatch = rawText.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    );
    const email = emailMatch ? emailMatch[0].toLowerCase() : null;

    // Phone regex
    const phoneMatch = rawText.match(
      /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    );
    const phone = phoneMatch ? phoneMatch[0].trim() : null;

    // Links (LinkedIn, GitHub, Portfolios)
    const links: string[] = [];
    const urlMatches =
      rawText.match(
        /https?:\/\/[^\s)]+|www\.[^\s)]+|linkedin\.com\/in\/[^\s)]+|github\.com\/[^\s)]+/gi,
      ) || [];
    for (const url of urlMatches) {
      const clean = url.replace(/[,;)]$/, '');
      if (!links.includes(clean)) links.push(clean);
    }

    // Name heuristic: usually the first non-empty line of the resume
    const firstLine = lines[0] || '';
    const name =
      firstLine.length < 50 &&
      !firstLine.includes('@') &&
      !/resume|curriculum/i.test(firstLine)
        ? firstLine
        : null;

    return {
      name,
      email,
      phone,
      location: null,
      links,
    };
  }

  private extractSummary(lines: string[]): string | null {
    if (!lines || lines.length === 0) return null;
    const summary = lines.join(' ').trim();
    return summary.length > 20 ? summary : null;
  }

  private extractExperience(lines: string[]) {
    const items: Array<{
      title: string;
      company: string;
      location?: string | null;
      startDate?: string | null;
      endDate?: string | null;
      isCurrent: boolean;
      description: string;
      bullets: string[];
    }> = [];

    if (!lines || lines.length === 0) return items;

    let currentItem: any = null;

    for (const line of lines) {
      // Detect if line is likely a job title or company header (e.g. "Senior Engineer at Acme Corp" or "Acme Corp | 2020 - Present")
      const isHeader =
        /^(senior|lead|staff|principal|software|engineer|developer|manager|director|architect|consultant|analyst|intern)\b/i.test(
          line,
        ) ||
        (/\b(at|@|–|-|\|)\b/i.test(line) &&
          /\b(20\d\d|19\d\d|present)\b/i.test(line));

      const isBullet =
        line.startsWith('•') || line.startsWith('-') || line.startsWith('*');

      if (isHeader && !isBullet) {
        if (currentItem) items.push(currentItem);

        const parts = line.split(/\s*[-–|@•]\s*|\s+at\s+/i);
        const title = parts[0]?.trim() || line;
        const company = parts[1]?.trim() || 'Company';

        const dateMatch = line.match(
          /\b(20\d\d|19\d\d)\b.*?(\b(20\d\d|19\d\d|present)\b)?/i,
        );

        currentItem = {
          title,
          company,
          location: null,
          startDate: dateMatch ? dateMatch[1] : null,
          endDate: dateMatch && dateMatch[2] ? dateMatch[2] : null,
          isCurrent: /present/i.test(line),
          description: '',
          bullets: [],
        };
      } else if (currentItem) {
        const bulletText = line.replace(/^[•\-*]\s*/, '').trim();
        if (bulletText) {
          currentItem.bullets.push(bulletText);
          currentItem.description = currentItem.bullets.join(' ');
        }
      }
    }

    if (currentItem) items.push(currentItem);

    // Fallback if no specific role headers detected but lines exist
    if (items.length === 0 && lines.length > 0) {
      items.push({
        title: lines[0] || 'Experience',
        company: lines[1] || 'Organization',
        location: null,
        startDate: null,
        endDate: null,
        isCurrent: false,
        description: lines.slice(2).join(' '),
        bullets: lines.slice(2),
      });
    }

    return items;
  }

  private extractEducation(lines: string[]) {
    const items: Array<{
      institution: string;
      degree?: string | null;
      fieldOfStudy?: string | null;
      startDate?: string | null;
      endDate?: string | null;
      grade?: string | null;
      description?: string | null;
    }> = [];

    if (!lines || lines.length === 0) return items;

    let currentItem: any = null;

    for (const line of lines) {
      const isEduHeader =
        /\b(university|college|institute|school|academy|bachelor|master|phd|b\.s\.|m\.s\.|b\.a\.|btech|mtech)\b/i.test(
          line,
        );

      if (isEduHeader || !currentItem) {
        if (currentItem) items.push(currentItem);

        const degreeMatch = line.match(
          /\b(bachelor|master|phd|b\.s\.|m\.s\.|b\.a\.|btech|mtech|diploma|associate)\b[^\n,•]*/i,
        );
        const degree = degreeMatch ? degreeMatch[0].trim() : null;

        const dateMatch = line.match(
          /\b(20\d\d|19\d\d)\b.*?(\b(20\d\d|19\d\d|present)\b)?/i,
        );

        currentItem = {
          institution:
            line.replace(/^(bachelor|master|phd)[^–|-]*/i, '').trim() || line,
          degree: degree || 'Degree',
          fieldOfStudy: null,
          startDate: dateMatch ? dateMatch[1] : null,
          endDate: dateMatch && dateMatch[2] ? dateMatch[2] : null,
          grade: null,
          description: null,
        };
      }
    }

    if (currentItem) items.push(currentItem);

    return items;
  }

  private extractSkills(sectionLines: string[], rawText: string) {
    const foundSkillsMap = new Map<string, string>();

    // 1. Process explicit skills section lines
    const combinedSkillText = (
      sectionLines.join(' ') +
      ' ' +
      rawText
    ).toLowerCase();

    for (const [skillName, category] of Object.entries(COMMON_SKILLS)) {
      // Regex word boundary search
      const escaped = skillName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');

      if (regex.test(combinedSkillText)) {
        // Proper capitalization
        const formatted =
          skillName === 'c++'
            ? 'C++'
            : skillName === 'c#'
              ? 'C#'
              : skillName === 'sql'
                ? 'SQL'
                : skillName === 'aws'
                  ? 'AWS'
                  : skillName === 'gcp'
                    ? 'GCP'
                    : skillName.charAt(0).toUpperCase() + skillName.slice(1);

        foundSkillsMap.set(formatted, category);
      }
    }

    return Array.from(foundSkillsMap.entries()).map(([name, category]) => ({
      name,
      category,
    }));
  }

  private extractProjects(lines: string[]) {
    const items: Array<{
      name: string;
      description: string;
      technologies: string[];
      url?: string | null;
    }> = [];

    if (!lines || lines.length === 0) return items;

    let currentItem: any = null;

    for (const line of lines) {
      const isBullet =
        line.startsWith('•') || line.startsWith('-') || line.startsWith('*');

      if (!isBullet && line.length < 80) {
        if (currentItem) items.push(currentItem);

        // Detect project URL if present
        const urlMatch = line.match(/https?:\/\/[^\s)]+/);

        currentItem = {
          name: line.replace(/https?:\/\/[^\s)]+/, '').trim(),
          description: '',
          technologies: [],
          url: urlMatch ? urlMatch[0] : null,
        };
      } else if (currentItem) {
        const bulletText = line.replace(/^[•\-*]\s*/, '').trim();
        if (bulletText) {
          currentItem.description =
            (currentItem.description ? currentItem.description + ' ' : '') +
            bulletText;
        }
      }
    }

    if (currentItem) items.push(currentItem);

    return items;
  }

  private extractCertifications(lines: string[]) {
    return lines
      .filter((l) => l.length > 3)
      .map((line) => ({
        name: line.replace(/^[•\-*]\s*/, '').trim(),
        issuer: null,
        date: null,
      }));
  }

  private extractAchievements(lines: string[]) {
    return lines
      .filter((l) => l.length > 3)
      .map((line) => ({
        title: line.replace(/^[•\-*]\s*/, '').trim(),
        description: null,
        date: null,
      }));
  }
}

export const sectionParser = new SectionParser();
