/**
 * Phase 8.5 — Realistic Synthetic QA & Demo Fixtures
 *
 * Clearly marked as SYNTHETIC TEST DATA for automated verification,
 * E2E tests, and development sandbox usage.
 */

export const SAMPLE_USER = {
  id: '00001111-2222-3333-4444-555566667777',
  email: 'alex.morgan.qa@resumind.dev',
  name: 'Alex Morgan',
  password: 'Password123!',
  role: 'USER' as const,
  plan: 'PRO' as const,
};

export const SAMPLE_CAREER_TWIN = {
  headline: 'Full Stack Developer | React | Node.js | PostgreSQL',
  summary:
    'Dedicated Full Stack Developer with hands-on experience designing modern web applications, scalable REST APIs, and automated data pipelines with React, Node.js, and relational databases.',
  targetRole: 'Full Stack Developer',
  targetLevel: 'Entry Level',
  skills: [
    { name: 'JavaScript', category: 'Language', proficiency: 'Advanced' },
    { name: 'TypeScript', category: 'Language', proficiency: 'Intermediate' },
    { name: 'React', category: 'Frontend', proficiency: 'Advanced' },
    { name: 'Node.js', category: 'Backend', proficiency: 'Advanced' },
    { name: 'Express', category: 'Backend', proficiency: 'Advanced' },
    { name: 'PostgreSQL', category: 'Database', proficiency: 'Intermediate' },
    { name: 'MongoDB', category: 'Database', proficiency: 'Intermediate' },
    { name: 'Python', category: 'Language', proficiency: 'Intermediate' },
    { name: 'Git', category: 'Tooling', proficiency: 'Advanced' },
    { name: 'REST APIs', category: 'Architecture', proficiency: 'Advanced' },
    { name: 'Docker', category: 'DevOps', proficiency: 'Beginner' },
  ],
  projects: [
    {
      name: 'TradeFlow',
      description:
        'Full-stack asset trading dashboard with real-time portfolio tracking, authentication, and execution ledger.',
      technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'JWT'],
      projectUrl: 'https://github.com/alexmorgan-qa/tradeflow-synthetic',
      role: 'Lead Full Stack Developer',
    },
    {
      name: 'AI Career Assistant',
      description:
        'Interactive career intelligence assistant leveraging Gemini API to analyze job descriptions and optimize user profile data.',
      technologies: ['React', 'Node.js', 'Gemini', 'REST API'],
      projectUrl:
        'https://github.com/alexmorgan-qa/ai-career-assistant-synthetic',
      role: 'Creator & Developer',
    },
    {
      name: 'ML Prediction System',
      description:
        'Supervised machine learning regression model predicting market transaction frequency using scikit-learn pipelines.',
      technologies: ['Python', 'Pandas', 'Scikit-learn'],
      projectUrl: 'https://github.com/alexmorgan-qa/ml-prediction-synthetic',
      role: 'Developer',
    },
  ],
  education: [
    {
      institution: 'Metropolitan Institute of Technology',
      degree: 'Bachelor of Science in Engineering',
      fieldOfStudy: 'Computer Science & Software Systems',
      startDate: new Date('2023-09-01'),
      endDate: new Date('2027-06-15'),
      isCurrent: true,
      grade: '3.85 GPA',
    },
  ],
  experiences: [
    {
      company: 'NextGen Solutions (Synthetic Internship)',
      title: 'Full Stack Engineering Intern',
      employmentType: 'Internship',
      location: 'Remote',
      startDate: new Date('2024-05-15'),
      endDate: new Date('2024-08-31'),
      isCurrent: false,
      description:
        'Built full-stack React components and Express API routes. Optimized database queries in PostgreSQL, improving response time on listing endpoints.',
    },
  ],
  certifications: [
    {
      name: 'Certified Full Stack Web Developer (Synthetic Certification)',
      issuer: 'Open Software Guild',
      issueDate: new Date('2024-01-15'),
      credentialUrl: 'https://example.com/certs/alex-morgan-synthetic-1',
    },
    {
      name: 'PostgreSQL Database Associate (Synthetic Certification)',
      issuer: 'Data Engineering Council',
      issueDate: new Date('2024-04-10'),
      credentialUrl: 'https://example.com/certs/alex-morgan-synthetic-2',
    },
  ],
  achievements: [
    {
      title: 'Hackathon Finalist — Web Innovation Sprint 2024 (Synthetic)',
      description:
        'Awarded 2nd place out of 45 teams for building an open-source real-time trading simulator with React and WebSocket.',
      achievedAt: new Date('2024-03-20'),
    },
    {
      title: 'Dean’s Honor Roll — Academic Excellence (Synthetic)',
      description:
        'Maintained high academic standing with a 3.85 GPA in Computer Science coursework.',
      achievedAt: new Date('2024-06-01'),
    },
  ],
};

export const SAMPLE_RESUME_TEXT = `
ALEX MORGAN (SYNTHETIC QA RESUME)
Full Stack Developer | React | Node.js | PostgreSQL
Email: alex.morgan.qa@resumind.dev | Portfolio: https://github.com/alexmorgan-qa

PROFESSIONAL SUMMARY
Dedicated and analytical Full Stack Developer with practical experience engineering scalable web applications, robust REST APIs, and responsive React interfaces. Proficient in TypeScript, JavaScript, Node.js, Express, and PostgreSQL. Demonstrated ability to collaborate in agile environments and deliver maintainable software solutions.

TECHNICAL SKILLS
- Programming Languages: JavaScript (ES6+), TypeScript, Python, HTML5, CSS3, SQL
- Frontend Technologies: React, Bootstrap 5, Redux Toolkit, Responsive Web Design
- Backend & APIs: Node.js, Express, RESTful APIs, JWT Authentication
- Databases: PostgreSQL, MongoDB, Prisma ORM
- Tools & DevOps: Git, GitHub, Docker, Postman, Vite, Vitest

PROJECTS
TradeFlow — Full Stack Asset Management System (2024)
- Architected a responsive asset management dashboard using React, Node.js, and Express.
- Designed RESTful API endpoints secured with JWT tokens and bcrypt password hashing.
- Structured persistent MongoDB schema models for transactions and user portfolios.

AI Career Assistant (2024)
- Engineered a generative AI web app integrating Google Gemini API for intelligent text summarization.
- Implemented robust error recovery and structured JSON parsing on backend endpoints.

ML Prediction System (2023)
- Implemented machine learning regression pipelines using Python, Pandas, and Scikit-learn.
- Visualized validation accuracy metrics and residual distributions.

WORK EXPERIENCE
Full Stack Engineering Intern | NextGen Solutions (Synthetic Internship) | Remote
May 2024 – August 2024
- Developed modern React interface modules with accessible form controls and clean component hierarchy.
- Crafted Express REST API routes for customer profile management backed by PostgreSQL.
- Collaborated with senior engineers using Git feature branches, pull request reviews, and automated linting.

EDUCATION
Bachelor of Science in Engineering, Computer Science
Metropolitan Institute of Technology — Expected Graduation: 2027
GPA: 3.85 / 4.0

CERTIFICATIONS & HONORS
- Certified Full Stack Web Developer — Open Software Guild (2024)
- Finalist, Web Innovation Sprint Hackathon (2024)
`;

export const SAMPLE_JOBS = [
  {
    title: 'Full Stack Developer',
    company: 'Apex Cloud Systems (Synthetic Corp)',
    location: 'San Francisco, CA (Hybrid)',
    employmentType: 'Full-time',
    description: `Apex Cloud Systems is seeking a Full Stack Developer to build our next-generation cloud workflow suite.
You will write clean, well-tested TypeScript and JavaScript code across our frontend and backend microservices.

Requirements:
- Strong proficiency in JavaScript, React, and Node.js
- Solid understanding of REST APIs and HTTP architecture
- Version control proficiency with Git
- Experience with relational databases like PostgreSQL

Preferred:
- Experience with TypeScript
- Containerization with Docker
- Familiarity with CI/CD pipelines`,
    requirements: [
      { name: 'JavaScript', type: 'SKILL', importance: 'REQUIRED' },
      { name: 'React', type: 'SKILL', importance: 'REQUIRED' },
      { name: 'Node.js', type: 'SKILL', importance: 'REQUIRED' },
      { name: 'REST APIs', type: 'SKILL', importance: 'REQUIRED' },
      { name: 'Git', type: 'SKILL', importance: 'REQUIRED' },
      { name: 'TypeScript', type: 'SKILL', importance: 'PREFERRED' },
      { name: 'Docker', type: 'SKILL', importance: 'PREFERRED' },
      { name: 'PostgreSQL', type: 'SKILL', importance: 'PREFERRED' },
    ],
  },
  {
    title: 'Frontend Developer',
    company: 'PixelCraft Interactive (Synthetic Corp)',
    location: 'Remote',
    employmentType: 'Full-time',
    description: `PixelCraft Interactive is hiring a Frontend Developer to craft intuitive web applications with high visual polish.

Requirements:
- Deep expertise in React and modern JavaScript
- Mastery of HTML and CSS styling patterns
- Focus on clean user experience and component reusability

Preferred:
- Experience with TypeScript
- Automated testing (Vitest / Jest / Playwright)
- Web accessibility (WCAG) standards`,
    requirements: [
      { name: 'React', type: 'SKILL', importance: 'REQUIRED' },
      { name: 'JavaScript', type: 'SKILL', importance: 'REQUIRED' },
      { name: 'HTML', type: 'SKILL', importance: 'REQUIRED' },
      { name: 'CSS', type: 'SKILL', importance: 'REQUIRED' },
      { name: 'TypeScript', type: 'SKILL', importance: 'PREFERRED' },
      { name: 'Testing', type: 'SKILL', importance: 'PREFERRED' },
      { name: 'Accessibility', type: 'SKILL', importance: 'PREFERRED' },
    ],
  },
  {
    title: 'Software Engineer',
    company: 'CoreData Infrastructure (Synthetic Corp)',
    location: 'Austin, TX (On-site)',
    employmentType: 'Full-time',
    description: `CoreData Infrastructure is looking for a Software Engineer to support scalable backend services and data integrations.

Requirements:
- Experience with JavaScript or TypeScript
- Backend service development in Node.js
- Relational database querying with SQL
- Version control with Git

Preferred:
- Experience with Docker containers
- Cloud infrastructure exposure (AWS)
- Unit and integration testing practices`,
    requirements: [
      { name: 'JavaScript', type: 'SKILL', importance: 'REQUIRED' },
      { name: 'Node.js', type: 'SKILL', importance: 'REQUIRED' },
      { name: 'SQL', type: 'SKILL', importance: 'REQUIRED' },
      { name: 'Git', type: 'SKILL', importance: 'REQUIRED' },
      { name: 'Docker', type: 'SKILL', importance: 'PREFERRED' },
      { name: 'AWS', type: 'SKILL', importance: 'PREFERRED' },
      { name: 'Testing', type: 'SKILL', importance: 'PREFERRED' },
    ],
  },
];
