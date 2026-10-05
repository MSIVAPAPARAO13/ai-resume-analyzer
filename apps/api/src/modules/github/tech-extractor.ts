const KNOWN_TECHNOLOGIES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Node.js',
  'React',
  'Vue',
  'Angular',
  'Next.js',
  'Express',
  'NestJS',
  'FastAPI',
  'Django',
  'Flask',
  'Go',
  'Golang',
  'Rust',
  'Java',
  'Spring Boot',
  'C++',
  'C#',
  '.NET',
  'Docker',
  'Kubernetes',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'GraphQL',
  'Kafka',
  'RabbitMQ',
  'AWS',
  'GCP',
  'Azure',
  'Terraform',
  'TailwindCSS',
  'Prometheus',
  'Elasticsearch',
  'Jest',
  'Playwright',
  'Prisma',
];

/**
 * Extracts recognized technologies from README text, repo topics, and primary languages.
 */
export function extractTechnologies(
  readmeText: string,
  languages: string[] = [],
  topics: string[] = [],
): string[] {
  const detected = new Set<string>();

  // Add explicit languages and topics
  for (const lang of languages) {
    if (lang && lang.trim()) detected.add(lang.trim());
  }

  for (const top of topics) {
    if (top && top.trim()) {
      const match = KNOWN_TECHNOLOGIES.find(
        (t) => t.toLowerCase() === top.toLowerCase(),
      );
      if (match) detected.add(match);
      else detected.add(top.trim());
    }
  }

  // Scan text for tech keywords
  const text = readmeText || '';
  for (const tech of KNOWN_TECHNOLOGIES) {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(text)) {
      detected.add(tech);
    }
  }

  return Array.from(detected).sort();
}

/**
 * Basic Markdown sanitization to protect against XSS when rendering README.
 * Strips script tags, iframe, object, embed, and inline event handlers (onload, onerror, onclick, etc.).
 */
export function sanitizeMarkdown(content: string): string {
  if (!content) return '';
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, 'about:blank;');
}
