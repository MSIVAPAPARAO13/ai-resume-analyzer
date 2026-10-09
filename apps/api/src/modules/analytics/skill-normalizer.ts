export type EvidenceSourceType =
  | 'CAREER_TWIN'
  | 'RESUME'
  | 'GITHUB'
  | 'JOB_REQUIREMENT';

export type VerificationStatusType =
  | 'VERIFIED_USER_DATA'
  | 'EXTERNAL_SOURCE'
  | 'NEEDS_REVIEW'
  | 'UNSUPPORTED';

export type SkillStrengthType = 'STRONG' | 'MODERATE' | 'WEAK' | 'UNKNOWN';

export interface CanonicalSkillDefinition {
  canonicalName: string;
  category: string;
  aliases: string[];
}

export interface SkillEvidenceItem {
  source: EvidenceSourceType;
  verificationStatus: VerificationStatusType;
  type: 'SKILL' | 'PROJECT' | 'EXPERIENCE' | 'CERTIFICATION' | 'GITHUB_REPO';
  referenceId?: string;
  label: string;
  description?: string;
  verifiedAt?: string;
}

export interface NormalizedSkillRecord {
  canonicalName: string;
  originalName: string;
  category: string;
  strength: SkillStrengthType;
  verificationStatus: VerificationStatusType;
  evidenceCount: number;
  evidenceItems: SkillEvidenceItem[];
  lastVerifiedDate?: string;
}

// Canonical Skill Dictionary
export const CANONICAL_SKILLS: CanonicalSkillDefinition[] = [
  {
    canonicalName: 'TypeScript',
    category: 'Programming Languages',
    aliases: ['typescript', 'ts'],
  },
  {
    canonicalName: 'JavaScript',
    category: 'Programming Languages',
    aliases: ['javascript', 'js', 'es6', 'ecmascript'],
  },
  {
    canonicalName: 'Python',
    category: 'Programming Languages',
    aliases: ['python', 'py', 'python3'],
  },
  {
    canonicalName: 'Go',
    category: 'Programming Languages',
    aliases: ['go', 'golang'],
  },
  {
    canonicalName: 'Java',
    category: 'Programming Languages',
    aliases: ['java', 'jdk', 'jvm'],
  },
  {
    canonicalName: 'Rust',
    category: 'Programming Languages',
    aliases: ['rust', 'rustlang'],
  },
  {
    canonicalName: 'C++',
    category: 'Programming Languages',
    aliases: ['c++', 'cpp'],
  },
  {
    canonicalName: 'React',
    category: 'Frontend Frameworks',
    aliases: ['react', 'react.js', 'reactjs'],
  },
  {
    canonicalName: 'Next.js',
    category: 'Frontend Frameworks',
    aliases: ['next.js', 'nextjs', 'next'],
  },
  {
    canonicalName: 'Vue.js',
    category: 'Frontend Frameworks',
    aliases: ['vue', 'vue.js', 'vuejs'],
  },
  {
    canonicalName: 'Node.js',
    category: 'Backend Frameworks',
    aliases: ['node.js', 'nodejs', 'node'],
  },
  {
    canonicalName: 'Express.js',
    category: 'Backend Frameworks',
    aliases: ['express', 'express.js', 'expressjs'],
  },
  {
    canonicalName: 'Spring Boot',
    category: 'Backend Frameworks',
    aliases: ['spring boot', 'spring', 'java spring'],
  },
  {
    canonicalName: 'PostgreSQL',
    category: 'Databases',
    aliases: ['postgresql', 'postgres', 'psql'],
  },
  {
    canonicalName: 'MySQL',
    category: 'Databases',
    aliases: ['mysql'],
  },
  {
    canonicalName: 'MongoDB',
    category: 'Databases',
    aliases: ['mongodb', 'mongo'],
  },
  {
    canonicalName: 'Redis',
    category: 'Databases',
    aliases: ['redis', 'redis-cache'],
  },
  {
    canonicalName: 'Docker',
    category: 'DevOps & Cloud',
    aliases: ['docker', 'containerization', 'containers'],
  },
  {
    canonicalName: 'Kubernetes',
    category: 'DevOps & Cloud',
    aliases: ['kubernetes', 'k8s'],
  },
  {
    canonicalName: 'AWS',
    category: 'DevOps & Cloud',
    aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
  },
  {
    canonicalName: 'GCP',
    category: 'DevOps & Cloud',
    aliases: ['gcp', 'google cloud', 'google cloud platform'],
  },
  {
    canonicalName: 'Azure',
    category: 'DevOps & Cloud',
    aliases: ['azure', 'microsoft azure'],
  },
  {
    canonicalName: 'CI/CD',
    category: 'DevOps & Cloud',
    aliases: [
      'ci/cd',
      'cicd',
      'continuous integration',
      'github actions',
      'jenkins',
      'gitlab ci',
    ],
  },
  {
    canonicalName: 'GraphQL',
    category: 'APIs & Networking',
    aliases: ['graphql', 'graph ql'],
  },
  {
    canonicalName: 'REST APIs',
    category: 'APIs & Networking',
    aliases: ['rest', 'restful', 'rest api', 'rest apis', 'restful api'],
  },
  {
    canonicalName: 'HTML',
    category: 'Frontend Fundamentals',
    aliases: ['html', 'html5'],
  },
  {
    canonicalName: 'CSS',
    category: 'Frontend Fundamentals',
    aliases: ['css', 'css3'],
  },
  {
    canonicalName: 'Bootstrap',
    category: 'UI Libraries',
    aliases: ['bootstrap', 'bootstrap 5', 'bootstrap5'],
  },
  {
    canonicalName: 'Git',
    category: 'Tools & Workflows',
    aliases: ['git', 'version control', 'github'],
  },
  {
    canonicalName: 'Microservices',
    category: 'Architecture',
    aliases: ['microservices', 'microservice architecture'],
  },
];

const ALIAS_LOOKUP = new Map<
  string,
  { canonicalName: string; category: string }
>();

for (const def of CANONICAL_SKILLS) {
  ALIAS_LOOKUP.set(def.canonicalName.toLowerCase(), {
    canonicalName: def.canonicalName,
    category: def.category,
  });
  for (const alias of def.aliases) {
    ALIAS_LOOKUP.set(alias.toLowerCase(), {
      canonicalName: def.canonicalName,
      category: def.category,
    });
  }
}

export class SkillNormalizer {
  /**
   * Normalizes a raw skill name into its canonical name and category
   */
  static normalize(rawName: string): {
    canonicalName: string;
    category: string;
  } {
    if (!rawName || typeof rawName !== 'string') {
      return { canonicalName: 'General Skill', category: 'Other' };
    }

    const clean = rawName.trim();
    const lower = clean.toLowerCase();

    const found = ALIAS_LOOKUP.get(lower);
    if (found) {
      return found;
    }

    // Dynamic Title Case fallback
    const titleCased = clean
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return {
      canonicalName: titleCased,
      category: 'General Technical',
    };
  }

  /**
   * Evaluates skill strength based on available multi-source evidence
   */
  static evaluateStrength(
    evidenceItems: SkillEvidenceItem[],
    proficiency?: string | null,
  ): SkillStrengthType {
    if (!evidenceItems || evidenceItems.length === 0) {
      return 'UNKNOWN';
    }

    const hasVerifiedData = evidenceItems.some(
      (e) => e.verificationStatus === 'VERIFIED_USER_DATA',
    );
    const projectOrExpCount = evidenceItems.filter(
      (e) =>
        e.type === 'PROJECT' ||
        e.type === 'EXPERIENCE' ||
        e.type === 'GITHUB_REPO',
    ).length;

    // Advanced or Expert explicitly marked + at least 1 evidence item
    if (
      proficiency &&
      ['Advanced', 'Expert'].includes(proficiency) &&
      hasVerifiedData
    ) {
      return 'STRONG';
    }

    // Multiple project/experience evidences + verified
    if (
      hasVerifiedData &&
      (projectOrExpCount >= 2 || evidenceItems.length >= 3)
    ) {
      return 'STRONG';
    }

    // Moderate evidence: at least 1 project/experience or verified skill
    if (
      hasVerifiedData ||
      projectOrExpCount >= 1 ||
      evidenceItems.length >= 2
    ) {
      return 'MODERATE';
    }

    // Only 1 unverified mention
    return 'WEAK';
  }

  /**
   * Determines overall verification status from a list of evidence items
   */
  static getOverallVerificationStatus(
    evidenceItems: SkillEvidenceItem[],
  ): VerificationStatusType {
    if (
      evidenceItems.some((e) => e.verificationStatus === 'VERIFIED_USER_DATA')
    ) {
      return 'VERIFIED_USER_DATA';
    }
    if (evidenceItems.some((e) => e.verificationStatus === 'NEEDS_REVIEW')) {
      return 'NEEDS_REVIEW';
    }
    if (evidenceItems.some((e) => e.verificationStatus === 'EXTERNAL_SOURCE')) {
      return 'EXTERNAL_SOURCE';
    }
    return 'UNSUPPORTED';
  }
}
