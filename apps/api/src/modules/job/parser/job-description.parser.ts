import { JobDna, jobDnaSchema } from '../job.validation.js';
import { JobDescriptionParser } from './job-parser.interface.js';

// Comprehensive technical skill taxonomy for JD extraction
const KNOWN_SKILLS = [
  // Languages
  'TypeScript',
  'JavaScript',
  'Python',
  'Java',
  'Go',
  'Golang',
  'Rust',
  'C++',
  'C#',
  '.NET',
  'PHP',
  'Ruby',
  'Swift',
  'Kotlin',
  'Scala',
  'SQL',
  'HTML',
  'CSS',
  'Bash',
  'Shell',
  // Frontend
  'React',
  'Next.js',
  'Vue',
  'Vue.js',
  'Angular',
  'Svelte',
  'Tailwind',
  'TailwindCSS',
  'Redux',
  'Zustand',
  'GraphQL',
  'Webpack',
  'Vite',
  // Backend & Frameworks
  'Node.js',
  'Express',
  'Express.js',
  'NestJS',
  'FastAPI',
  'Django',
  'Flask',
  'Spring',
  'Spring Boot',
  'Ruby on Rails',
  'ASP.NET',
  'gRPC',
  'REST',
  'RESTful APIs',
  // Databases & Caches
  'PostgreSQL',
  'Postgres',
  'MySQL',
  'MongoDB',
  'Redis',
  'Elasticsearch',
  'DynamoDB',
  'Cassandra',
  'Prisma',
  'TypeORM',
  'Hibernate',
  'Kafka',
  'RabbitMQ',
  // Cloud & DevOps
  'AWS',
  'Amazon Web Services',
  'Azure',
  'GCP',
  'Google Cloud',
  'Docker',
  'Kubernetes',
  'Terraform',
  'CI/CD',
  'GitHub Actions',
  'Jenkins',
  'Linux',
  'Microservices',
  'Serverless',
  // Testing & Quality
  'Jest',
  'Vitest',
  'Playwright',
  'Cypress',
  'Mocha',
  'Chai',
  'JUnit',
  'PyTest',
  'TDD',
  // Methodologies & Architecture
  'Agile',
  'Scrum',
  'Distributed Systems',
  'Event-Driven Architecture',
  'System Design',
  'OAuth',
  'JWT',
];

export class DeterministicJobDescriptionParser implements JobDescriptionParser {
  async parse(title: string, description: string): Promise<JobDna> {
    const roleFamily = this.detectRoleFamily(title, description);
    const level = this.detectLevel(title, description);
    const { requiredSkills, preferredSkills } = this.extractSkills(description);
    const responsibilities = this.extractResponsibilities(description);
    const experienceRequirement = this.extractExperience(description);
    const educationRequirement = this.extractEducation(description);
    const keywords = this.extractKeywords(
      description,
      requiredSkills,
      preferredSkills,
    );
    const summary = this.extractSummary(title, description, level, roleFamily);

    const dna: JobDna = {
      role: title.trim(),
      roleFamily,
      level,
      summary,
      requiredSkills,
      preferredSkills,
      responsibilities,
      experienceRequirement,
      educationRequirement,
      keywords,
    };

    return jobDnaSchema.parse(dna);
  }

  private detectRoleFamily(title: string, description: string): string {
    const t = title.toLowerCase();
    if (
      t.includes('backend') ||
      t.includes('back-end') ||
      t.includes('server')
    ) {
      return 'Backend Engineering';
    }
    if (
      t.includes('frontend') ||
      t.includes('front-end') ||
      t.includes('ui/ux') ||
      t.includes('web developer')
    ) {
      return 'Frontend Engineering';
    }
    if (
      t.includes('fullstack') ||
      t.includes('full stack') ||
      t.includes('full-stack')
    ) {
      return 'Full Stack Engineering';
    }
    if (
      t.includes('devops') ||
      t.includes('site reliability') ||
      t.includes('sre') ||
      t.includes('infrastructure') ||
      t.includes('platform')
    ) {
      return 'DevOps & Cloud Infrastructure';
    }
    if (
      t.includes('data engineer') ||
      t.includes('data scientist') ||
      t.includes('machine learning') ||
      t.includes('ai engineer') ||
      t.includes('mlops')
    ) {
      return 'Data & AI Engineering';
    }
    if (t.includes('mobile') || t.includes('ios') || t.includes('android')) {
      return 'Mobile Engineering';
    }
    if (
      t.includes('security') ||
      t.includes('cybersecurity') ||
      t.includes('infosec')
    ) {
      return 'Security Engineering';
    }
    if (
      t.includes('engineering manager') ||
      t.includes('lead') ||
      t.includes('director') ||
      t.includes('head of')
    ) {
      return 'Engineering Leadership';
    }

    // Fallback to description analysis
    const d = description.toLowerCase();
    if (d.includes('backend') || d.includes('back-end')) {
      return 'Backend Engineering';
    }
    if (d.includes('frontend') || d.includes('front-end')) {
      return 'Frontend Engineering';
    }
    if (d.includes('fullstack') || d.includes('full stack')) {
      return 'Full Stack Engineering';
    }
    return 'Software Engineering';
  }

  private detectLevel(title: string, description: string): string {
    const t = title.toLowerCase();
    if (t.includes('intern') || t.includes('co-op')) {
      return 'Intern';
    }
    if (
      t.includes('junior') ||
      t.includes('entry') ||
      t.includes('associate') ||
      t.includes('new grad')
    ) {
      return 'Entry / Junior';
    }
    if (
      t.includes('principal') ||
      t.includes('distinguished') ||
      t.includes('architect')
    ) {
      return 'Principal / Architect';
    }
    if (t.includes('staff') || t.includes('lead') || t.includes('tech lead')) {
      return 'Staff / Lead';
    }
    if (t.includes('senior') || t.includes('sr.') || t.includes('sr ')) {
      return 'Senior';
    }
    if (t.includes('manager') || t.includes('director') || t.includes('vp')) {
      return 'Management / Executive';
    }

    // Fallback to description analysis
    const d = description.toLowerCase();
    if (d.includes('intern') || d.includes('internship')) {
      return 'Intern';
    }
    if (d.includes('junior') || d.includes('entry level')) {
      return 'Entry / Junior';
    }
    if (d.includes('staff engineer') || d.includes('tech lead')) {
      return 'Staff / Lead';
    }
    if (
      d.includes('senior engineer') ||
      d.includes('senior developer') ||
      d.includes('sr. engineer')
    ) {
      return 'Senior';
    }
    return 'Mid-Level';
  }

  private extractSkills(description: string): {
    requiredSkills: string[];
    preferredSkills: string[];
  } {
    const lines = description.split('\n');
    let currentSection: 'REQUIRED' | 'PREFERRED' | 'GENERAL' = 'GENERAL';

    const requiredFound = new Set<string>();
    const preferredFound = new Set<string>();

    const reqHeaders =
      /qualifications|requirements|must have|what you bring|required skills|what you'll need|minimum requirements/i;
    const prefHeaders =
      /preferred|nice to have|bonus|pluses|plus|good to have|desired/i;
    const generalHeaders =
      /responsibilities|what you'll do|about us|who we are|benefits|compensation|overview/i;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (prefHeaders.test(line)) {
        currentSection = 'PREFERRED';
        continue;
      } else if (reqHeaders.test(line)) {
        currentSection = 'REQUIRED';
        continue;
      } else if (generalHeaders.test(line)) {
        currentSection = 'GENERAL';
        continue;
      }

      // Check for skill tokens on this line only if in explicit sections
      if (currentSection === 'REQUIRED' || currentSection === 'PREFERRED') {
        for (const skill of KNOWN_SKILLS) {
          const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
          const pattern = new RegExp(
            `(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`,
            'i',
          );
          if (pattern.test(line)) {
            if (currentSection === 'PREFERRED') {
              preferredFound.add(skill);
            } else {
              requiredFound.add(skill);
            }
          }
        }
      }
    }

    // Remove duplicates from preferred if already present in required
    for (const skill of requiredFound) {
      preferredFound.delete(skill);
    }

    // If no explicit required skills were isolated from sections, scan whole text
    if (requiredFound.size === 0 && preferredFound.size === 0) {
      for (const skill of KNOWN_SKILLS) {
        const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const pattern = new RegExp(
          `(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`,
          'i',
        );
        if (pattern.test(description)) {
          requiredFound.add(skill);
        }
      }
    }

    return {
      requiredSkills: Array.from(requiredFound),
      preferredSkills: Array.from(preferredFound),
    };
  }

  private extractResponsibilities(description: string): string[] {
    const lines = description.split('\n');
    const responsibilities: string[] = [];
    let inRespSection = false;

    const respHeaders =
      /responsibilities|what you'll do|role overview|key duties|your role|what you will do|day to day/i;
    const endHeaders =
      /qualifications|requirements|must have|preferred|benefits|about us|who we are/i;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (respHeaders.test(line)) {
        inRespSection = true;
        continue;
      }

      if (inRespSection && endHeaders.test(line)) {
        inRespSection = false;
        break;
      }

      if (inRespSection) {
        // Check if line looks like a bullet or sentence
        const cleaned = line.replace(/^[-*•\d.)\s]+/, '').trim();
        if (cleaned.length > 15) {
          responsibilities.push(cleaned);
        }
      }
    }

    // Fallback: If no dedicated section found, look for action-oriented bullets
    if (responsibilities.length === 0) {
      const actionBullets = lines
        .map((l) =>
          l
            .trim()
            .replace(/^[-*•\d.)\s]+/, '')
            .trim(),
        )
        .filter((l) =>
          /^(Build|Develop|Architect|Lead|Design|Maintain|Implement|Collaborate|Create|Drive|Write)\b/i.test(
            l,
          ),
        );
      responsibilities.push(...actionBullets.slice(0, 8));
    }

    return responsibilities.slice(0, 10);
  }

  private extractExperience(description: string): {
    years: number | null;
    raw: string;
    details?: string;
  } {
    // Matches expressions like: "3+ years", "3 to 5 years", "at least 5 years", "3-5 yrs of experience"
    const expRegex =
      /(\d+)(?:\s*(?:-|to|\+)\s*(\d+))?\+?\s*(?:years?|yrs?)(?:\s+of)?\s*(?:relevant|hands-on|professional|work)?\s*experience/i;
    const match = description.match(expRegex);

    if (match) {
      const minYears = parseInt(match[1], 10);
      return {
        years: isNaN(minYears) ? null : minYears,
        raw: match[0],
        details: `Identified expectation of ${match[0]} in job requirements.`,
      };
    }

    // Secondary search for simple year patterns
    const simpleMatch = description.match(/(\d+)\+?\s*years?\b/i);
    if (simpleMatch) {
      const years = parseInt(simpleMatch[1], 10);
      return {
        years: isNaN(years) ? null : years,
        raw: simpleMatch[0],
        details: `General mention of ${simpleMatch[0]}.`,
      };
    }

    return {
      years: null,
      raw: 'Not explicitly specified',
      details: 'No specific minimum years of experience stated.',
    };
  }

  private extractEducation(description: string): {
    degree: string | null;
    field: string | null;
    raw: string;
  } {
    const text = description.toLowerCase();

    let degree: string | null = null;
    let field: string | null = null;

    if (
      text.includes("bachelor's") ||
      text.includes('bachelor') ||
      text.includes('b.s.') ||
      text.includes('bs degree')
    ) {
      degree = "Bachelor's Degree";
    } else if (
      text.includes("master's") ||
      text.includes('master') ||
      text.includes('m.s.') ||
      text.includes('ms degree')
    ) {
      degree = "Master's Degree";
    } else if (
      text.includes('ph.d.') ||
      text.includes('phd') ||
      text.includes('doctorate')
    ) {
      degree = 'PhD';
    }

    if (
      text.includes('computer science') ||
      text.includes('software engineering')
    ) {
      field = 'Computer Science / Software Engineering';
    } else if (
      text.includes('engineering') ||
      text.includes('information technology') ||
      text.includes('stem')
    ) {
      field = 'Engineering or STEM Field';
    }

    const eduSentence = description
      .split(/[.\n]/)
      .find((s) =>
        /degree|bachelor|master|phd|computer science|equivalent experience/i.test(
          s,
        ),
      );

    return {
      degree,
      field,
      raw: eduSentence
        ? eduSentence.trim()
        : degree
          ? `${degree} in related field or equivalent experience`
          : 'Degree or equivalent practical experience',
    };
  }

  private extractKeywords(
    description: string,
    required: string[],
    preferred: string[],
  ): string[] {
    const keywordsSet = new Set<string>([...required, ...preferred]);

    // Domain & Architectural keywords to search for
    const domainKeywords = [
      'Microservices',
      'REST',
      'GraphQL',
      'CI/CD',
      'Distributed Systems',
      'Cloud Native',
      'High Availability',
      'Scalability',
      'System Architecture',
      'API Design',
      'Test Automation',
      'Security',
      'Agile',
      'Code Review',
      'Performance Optimization',
      'Monitoring',
      'Logging',
      'Observability',
      'Clean Architecture',
    ];

    for (const kw of domainKeywords) {
      const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      if (
        new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, 'i').test(
          description,
        )
      ) {
        keywordsSet.add(kw);
      }
    }

    return Array.from(keywordsSet).slice(0, 20);
  }

  private extractSummary(
    title: string,
    description: string,
    level: string,
    roleFamily: string,
  ): string {
    const paragraphs = description
      .split('\n\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 40 && !p.startsWith('#'));
    if (paragraphs.length > 0) {
      const first = paragraphs[0].replace(/\n/g, ' ').trim();
      if (first.length <= 350) return first;
      return first.substring(0, 347) + '...';
    }
    return `${level} ${title} position specializing in ${roleFamily}.`;
  }
}
