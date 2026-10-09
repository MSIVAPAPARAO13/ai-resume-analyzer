import {
  PrismaClient,
  RequirementType,
  RequirementImportance,
  ResumeTailoringStatus,
  TailoringSuggestionType,
  EvidenceGuardStatus,
  SuggestionStatus,
  ApplicationStatus,
  ApplicationEventType,
  InterviewMode,
  InterviewStatus,
  InterviewDifficulty,
  InterviewQuestionCategory,
  LearningPlanStatus,
  SkillPriority,
  GoalTaskStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function seedUserWithConnectedData(email: string, name: string) {
  console.log(`🌱 Seeding user ${email} (${name})...`);

  const passwordHash = await argon2.hash('Password123!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // 1. Upsert User
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name },
    create: {
      email,
      passwordHash,
      name,
      role: 'USER',
      plan: 'FREE',
    },
  });

  // 2. CareerProfile
  const profile = await prisma.careerProfile.upsert({
    where: { userId: user.id },
    update: {
      headline: 'Full Stack Developer | React, Node.js & Cloud Systems',
      summary:
        'Software engineer with experience building full-stack platforms, high-performance REST APIs, and modern React interfaces. Strong foundation in data structures, automated testing, and cloud infrastructure.',
      targetRole: 'Full Stack Developer',
      targetLevel: 'Entry Level',
    },
    create: {
      userId: user.id,
      headline: 'Full Stack Developer | React, Node.js & Cloud Systems',
      summary:
        'Software engineer with experience building full-stack platforms, high-performance REST APIs, and modern React interfaces. Strong foundation in data structures, automated testing, and cloud infrastructure.',
      targetRole: 'Full Stack Developer',
      targetLevel: 'Entry Level',
    },
  });

  // Clear existing children for clean deterministic seed
  await prisma.experience.deleteMany({
    where: { careerProfileId: profile.id },
  });
  await prisma.education.deleteMany({ where: { careerProfileId: profile.id } });
  await prisma.skill.deleteMany({ where: { careerProfileId: profile.id } });
  await prisma.project.deleteMany({ where: { careerProfileId: profile.id } });
  await prisma.certification.deleteMany({
    where: { careerProfileId: profile.id },
  });
  await prisma.achievement.deleteMany({
    where: { careerProfileId: profile.id },
  });

  // 3. Experiences
  await prisma.experience.createMany({
    data: [
      {
        careerProfileId: profile.id,
        company: 'Apex Cloud Innovations',
        title: 'Junior Full Stack Engineer',
        employmentType: 'Full-time',
        location: 'San Francisco, CA (Hybrid)',
        startDate: new Date('2023-06-01'),
        isCurrent: true,
        description:
          'Developed microservices using Node.js and Express. Implemented responsive user interfaces in React with Bootstrap. Optimized PostgreSQL queries reducing latency by 28%.',
      },
      {
        careerProfileId: profile.id,
        company: 'Horizon Software Labs',
        title: 'Software Engineering Intern',
        employmentType: 'Internship',
        location: 'Remote',
        startDate: new Date('2022-05-15'),
        endDate: new Date('2022-08-30'),
        isCurrent: false,
        description:
          'Constructed RESTful API endpoints for analytics dashboards. Authored Jest integration tests achieving 90% unit test coverage. Collaborated on Git feature branch workflows.',
      },
    ],
  });

  // 4. Education
  await prisma.education.createMany({
    data: [
      {
        careerProfileId: profile.id,
        institution: 'University of Washington',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science & Engineering',
        startDate: new Date('2019-09-01'),
        endDate: new Date('2023-05-20'),
        isCurrent: false,
        grade: '3.85 GPA',
      },
    ],
  });

  // 5. Skills
  const skillsList = [
    { name: 'JavaScript', category: 'Languages', proficiency: 'Advanced' },
    { name: 'TypeScript', category: 'Languages', proficiency: 'Advanced' },
    { name: 'React', category: 'Frontend', proficiency: 'Advanced' },
    { name: 'Node.js', category: 'Backend', proficiency: 'Advanced' },
    { name: 'Express', category: 'Backend', proficiency: 'Advanced' },
    { name: 'PostgreSQL', category: 'Databases', proficiency: 'Intermediate' },
    { name: 'MongoDB', category: 'Databases', proficiency: 'Intermediate' },
    { name: 'Python', category: 'Languages', proficiency: 'Intermediate' },
    { name: 'Git', category: 'Tools', proficiency: 'Advanced' },
    { name: 'REST APIs', category: 'Architecture', proficiency: 'Advanced' },
    { name: 'Docker', category: 'DevOps', proficiency: 'Intermediate' },
  ];

  await prisma.skill.createMany({
    data: skillsList.map((s) => ({
      careerProfileId: profile.id,
      name: s.name,
      category: s.category,
      proficiency: s.proficiency,
    })),
  });

  // 6. Projects
  await prisma.project.createMany({
    data: [
      {
        careerProfileId: profile.id,
        name: 'TradeFlow',
        description:
          'Full-stack trading platform with real-time portfolio tracking, market depth indicators, and order execution simulations.',
        technologies: [
          'TypeScript',
          'React',
          'Node.js',
          'PostgreSQL',
          'Docker',
        ],
        projectUrl: 'https://github.com/alexmorgan/tradeflow',
      },
      {
        careerProfileId: profile.id,
        name: 'AI Career Assistant',
        description:
          'AI-powered career assistant providing ATS diagnostic feedback, semantic job matching, and automated resume tailoring.',
        technologies: ['React', 'Express', 'Gemini AI', 'PostgreSQL', 'Prisma'],
        projectUrl: 'https://github.com/alexmorgan/ai-career-assistant',
      },
      {
        careerProfileId: profile.id,
        name: 'ML Prediction System',
        description:
          'Machine-learning prediction pipeline forecasting system resource utilization using Python, Scikit-Learn, and FastAPI.',
        technologies: ['Python', 'FastAPI', 'Docker', 'REST APIs'],
        projectUrl: 'https://github.com/alexmorgan/ml-prediction-system',
      },
    ],
  });

  // 7. Certifications & Achievements
  await prisma.certification.createMany({
    data: [
      {
        careerProfileId: profile.id,
        name: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services',
        issueDate: new Date('2023-11-01'),
        credentialId: 'AWS-CCP-849201',
        credentialUrl: 'https://aws.amazon.com/verification',
      },
    ],
  });

  await prisma.achievement.createMany({
    data: [
      {
        careerProfileId: profile.id,
        title: 'Dean’s Honor List — UW Engineering',
        description:
          'Recognized for consecutive quarterly academic excellence 2021-2023.',
        date: new Date('2023-05-01'),
      },
    ],
  });

  // 8. Resume & Versions & Analysis
  let resume = await prisma.resume.findFirst({
    where: { userId: user.id },
  });

  if (!resume) {
    resume = await prisma.resume.create({
      data: {
        userId: user.id,
        title: 'Alex_Morgan_FullStack_Resume.pdf',
        originalFileName: 'Alex_Morgan_FullStack_Resume.pdf',
        fileType: 'application/pdf',
        fileSize: 145280,
        storageKey: `resumes/${user.id}/alex-morgan-v1.pdf`,
        status: 'READY',
      },
    });
  }

  // Ensure Base ResumeVersion (v1)
  let v1 = await prisma.resumeVersion.findFirst({
    where: { resumeId: resume.id, versionNumber: 1 },
  });

  if (!v1) {
    v1 = await prisma.resumeVersion.create({
      data: {
        resumeId: resume.id,
        versionNumber: 1,
        extractedText: `ALEX MORGAN
alex.morgan.qa@resumind.dev | San Francisco, CA | linkedin.com/in/alexmorgan | github.com/alexmorgan

SUMMARY
Full Stack Developer with experience in React, TypeScript, Node.js, and PostgreSQL. Passionate about building reliable software systems and intuitive user interfaces.

EXPERIENCE
Junior Full Stack Engineer — Apex Cloud Innovations (2023 - Present)
- Engineered backend REST API services using Node.js and Express handling 100k+ daily transactions.
- Developed modular React components using modern CSS and state management.
- Improved database performance in PostgreSQL with targeted indexing.

PROJECTS
TradeFlow — Full Stack Trading Platform
- Implemented real-time market dashboard with WebSocket streams and React.
- Built persistent relational schema using PostgreSQL and Prisma ORM.

SKILLS
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, Git, Docker, REST APIs`,
        parsedData: {
          name: 'Alex Morgan',
          email: 'alex.morgan.qa@resumind.dev',
          skills: [
            'JavaScript',
            'TypeScript',
            'React',
            'Node.js',
            'Express',
            'PostgreSQL',
            'Docker',
          ],
        },
      },
    });
  }

  // Ensure ResumeVersion (v2 Tailored)
  let v2 = await prisma.resumeVersion.findFirst({
    where: { resumeId: resume.id, versionNumber: 2 },
  });

  if (!v2) {
    v2 = await prisma.resumeVersion.create({
      data: {
        resumeId: resume.id,
        versionNumber: 2,
        extractedText: `ALEX MORGAN (Tailored for Cloud Full Stack Role)
Full Stack Developer with verified production experience across React, Node.js, and containerized Docker deployments.`,
        parsedData: {
          name: 'Alex Morgan',
          email: 'alex.morgan.qa@resumind.dev',
          tailoredFor: 'Full Stack Developer',
        },
      },
    });
  }

  // Resume Analysis
  const existingAnalysis = await prisma.resumeAnalysis.findFirst({
    where: { resumeId: resume.id },
  });

  if (!existingAnalysis) {
    await prisma.resumeAnalysis.create({
      data: {
        resumeId: resume.id,
        resumeVersionId: v1.id,
        overallScore: 86,
        atsScore: 91,
        contentScore: 84,
        skillsScore: 89,
        experienceScore: 85,
        educationScore: 90,
        formattingScore: 94,
        summaryScore: 82,
        keywordScore: 88,
        result: {
          strengths: [
            'Clean chronological layout easily parseable by standard ATS parsers',
            'Strong quantification of metrics in Apex Cloud Innovations bullet points',
            'Solid alignment between listed skills and project portfolio entries',
          ],
          weaknesses: [
            'Could emphasize cloud architecture (AWS/Docker) in summary headline',
            'Consider adding test automation experience (Jest/Playwright) to core skills',
          ],
          recommendations: [
            'Incorporate AWS Cloud Practitioner certification directly into header',
            'Highlight containerized deployment workflow for TradeFlow project',
          ],
          careerTwinComparison: {
            matchRatio: 0.92,
            verifiedSkillsCount: 11,
          },
        },
      },
    });
  }

  // 9. Jobs (3 Realistic Jobs)
  await prisma.job.deleteMany({ where: { userId: user.id } });

  // Job 1: Full Stack Developer
  const job1 = await prisma.job.create({
    data: {
      userId: user.id,
      title: 'Full Stack Developer',
      company: 'StripeWave Financial',
      location: 'San Francisco, CA (Hybrid)',
      employmentType: 'Full-time',
      status: 'SAVED',
      description: `We are seeking a Full Stack Developer to build our next-generation payments and merchant portal.
You will write clean React applications, architect scalable Node.js microservices, and design PostgreSQL schemas.

Required Qualifications:
- Proficiency in JavaScript and TypeScript
- Strong experience with React and modern UI development
- Solid background in Node.js and REST APIs
- Git version control fluency

Preferred Qualifications:
- Experience with Docker containerization
- PostgreSQL database administration
- Exposure to cloud platforms (AWS or GCP)`,
      requirements: {
        create: [
          {
            type: RequirementType.SKILL,
            name: 'JavaScript',
            importance: RequirementImportance.REQUIRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'React',
            importance: RequirementImportance.REQUIRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'Node.js',
            importance: RequirementImportance.REQUIRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'REST APIs',
            importance: RequirementImportance.REQUIRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'Git',
            importance: RequirementImportance.REQUIRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'TypeScript',
            importance: RequirementImportance.PREFERRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'Docker',
            importance: RequirementImportance.PREFERRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'PostgreSQL',
            importance: RequirementImportance.PREFERRED,
          },
        ],
      },
      analyses: {
        create: {
          role: 'Full Stack Developer',
          level: 'Entry/Mid',
          summary:
            'Modern financial technology role emphasizing React UI, Node backend, and relational data modeling.',
          experienceRequirement: '1-3 years',
          educationRequirement: 'B.S. in Computer Science or equivalent',
          jobDna: {
            role: 'Full Stack Developer',
            level: 'Entry/Mid',
            requiredSkills: [
              'JavaScript',
              'React',
              'Node.js',
              'REST APIs',
              'Git',
            ],
            preferredSkills: ['TypeScript', 'Docker', 'PostgreSQL'],
            keywords: ['payments', 'merchant portal', 'microservices', 'SQL'],
          },
        },
      },
    },
  });

  // Job 2: Frontend Developer
  const job2 = await prisma.job.create({
    data: {
      userId: user.id,
      title: 'Frontend Developer',
      company: 'Veloce Design Systems',
      location: 'Remote',
      employmentType: 'Full-time',
      status: 'SAVED',
      description: `Join our design engineering team building highly accessible, performant React component libraries.

Required Qualifications:
- Expertise in React, JavaScript, HTML, and CSS
- Deep understanding of web standards and responsive layout

Preferred Qualifications:
- TypeScript proficiency
- Automated unit and E2E testing (Jest, Playwright)
- Web accessibility (WCAG 2.1 AA) standards`,
      requirements: {
        create: [
          {
            type: RequirementType.SKILL,
            name: 'React',
            importance: RequirementImportance.REQUIRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'JavaScript',
            importance: RequirementImportance.REQUIRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'HTML',
            importance: RequirementImportance.REQUIRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'CSS',
            importance: RequirementImportance.REQUIRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'TypeScript',
            importance: RequirementImportance.PREFERRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'Testing',
            importance: RequirementImportance.PREFERRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'Accessibility',
            importance: RequirementImportance.PREFERRED,
          },
        ],
      },
      analyses: {
        create: {
          role: 'Frontend Developer',
          level: 'Mid',
          summary:
            'Design-centric web developer position with strong accessibility and testing criteria.',
          jobDna: {
            role: 'Frontend Developer',
            requiredSkills: ['React', 'JavaScript', 'HTML', 'CSS'],
            preferredSkills: ['TypeScript', 'Testing', 'Accessibility'],
          },
        },
      },
    },
  });

  // Job 3: Software Engineer
  const job3 = await prisma.job.create({
    data: {
      userId: user.id,
      title: 'Software Engineer',
      company: 'ScaleMetric Cloud',
      location: 'Seattle, WA (On-site)',
      employmentType: 'Full-time',
      status: 'SAVED',
      description: `ScaleMetric is hiring a Software Engineer to optimize high-scale telemetry ingestion pipelines.

Required Qualifications:
- Strong programming background in JavaScript or Python
- Node.js backend development
- Relational database experience (SQL)
- Git version control

Preferred Qualifications:
- Docker containerization
- Amazon Web Services (AWS)
- Performance and stress testing`,
      requirements: {
        create: [
          {
            type: RequirementType.SKILL,
            name: 'JavaScript',
            importance: RequirementImportance.REQUIRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'Node.js',
            importance: RequirementImportance.REQUIRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'SQL',
            importance: RequirementImportance.REQUIRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'Git',
            importance: RequirementImportance.REQUIRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'Docker',
            importance: RequirementImportance.PREFERRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'AWS',
            importance: RequirementImportance.PREFERRED,
          },
          {
            type: RequirementType.SKILL,
            name: 'Testing',
            importance: RequirementImportance.PREFERRED,
          },
        ],
      },
      analyses: {
        create: {
          role: 'Software Engineer',
          level: 'Entry/Mid',
          summary:
            'Data engineering & backend platform role focusing on telemetry and scale.',
          jobDna: {
            role: 'Software Engineer',
            requiredSkills: ['JavaScript', 'Node.js', 'SQL', 'Git'],
            preferredSkills: ['Docker', 'AWS', 'Testing'],
          },
        },
      },
    },
  });

  // 10. Job Match for Job 1
  await prisma.jobMatch.create({
    data: {
      jobId: job1.id,
      resumeVersionId: v1.id,
      overallScore: 88,
      skillsScore: 92,
      experienceScore: 85,
      responsibilitiesScore: 84,
      educationScore: 90,
      keywordScore: 86,
      careerTwinScore: 91,
      result: {
        strongMatches: [
          'JavaScript',
          'React',
          'Node.js',
          'REST APIs',
          'Git',
          'PostgreSQL',
          'TypeScript',
        ],
        partialMatches: ['Docker'],
        missing: ['AWS', 'Testing'],
        recommendations: [
          'Add Docker containerization evidence from the TradeFlow project to the resume header',
          'Highlight REST API latency improvements under Apex Cloud Innovations experience',
        ],
      },
    },
  });

  // 11. Tailoring Session with Evidence Guard for Job 1
  const tailoringSession = await prisma.resumeTailoringSession.create({
    data: {
      userId: user.id,
      jobId: job1.id,
      resumeVersionId: v1.id,
      status: ResumeTailoringStatus.REVIEWING,
      suggestions: {
        create: [
          {
            type: TailoringSuggestionType.REWRITE,
            originalText:
              'Engineered backend REST API services using Node.js and Express handling 100k+ daily transactions.',
            proposedText:
              'Architected high-throughput Node.js/Express REST microservices handling 100k+ daily transactions with 99.9% uptime across Dockerized deployments.',
            reason:
              'Explicitly emphasizes containerization and high-throughput architectural keywords requested by StripeWave Financial.',
            evidenceReferences: [
              'Project: TradeFlow (Docker)',
              'Experience: Apex Cloud Innovations',
            ],
            guardStatus: EvidenceGuardStatus.VERIFIED,
            status: SuggestionStatus.ACCEPTED,
          },
          {
            type: TailoringSuggestionType.KEYWORD_ALIGNMENT,
            originalText:
              'Developed modular React components using modern CSS and state management.',
            proposedText:
              'Engineered responsive merchant portal interfaces in React with TypeScript, reducing user checkout drop-off by 14%.',
            reason:
              'Alters general frontend wording to match financial portal merchant domain.',
            evidenceReferences: ['Experience: Apex Cloud Innovations'],
            guardStatus: EvidenceGuardStatus.NEEDS_REVIEW,
            status: SuggestionStatus.PENDING,
          },
          {
            type: TailoringSuggestionType.ADD_EVIDENCE,
            originalText:
              'Improved database performance in PostgreSQL with targeted indexing.',
            proposedText:
              'Led multi-region AWS Aurora PostgreSQL database migration cutting latency by 45%.',
            reason: 'Attempts to introduce cloud database scale.',
            evidenceReferences: [],
            guardStatus: EvidenceGuardStatus.UNSUPPORTED,
            status: SuggestionStatus.REJECTED,
          },
        ],
      },
    },
  });

  // 12. Application CRM Data (Saved, Applied, Assessment, Interview, Offer, Rejected)
  await prisma.application.deleteMany({ where: { userId: user.id } });

  const app1 = await prisma.application.create({
    data: {
      userId: user.id,
      jobId: job1.id,
      resumeVersionId: v1.id,
      tailoringSessionId: tailoringSession.id,
      company: 'StripeWave Financial',
      role: 'Full Stack Developer',
      status: ApplicationStatus.INTERVIEW,
      appliedAt: new Date(Date.now() - 14 * 86400000),
      followUpAt: new Date(Date.now() + 3 * 86400000),
      recruiterName: 'Sarah Jenkins',
      recruiterEmail: 's.jenkins@stripewave.example.com',
      notes:
        'Completed technical take-home assessment. Final round panel scheduled.',
      events: {
        create: [
          {
            type: ApplicationEventType.CREATED,
            description: 'Application created and resume matched (88%).',
          },
          {
            type: ApplicationEventType.APPLIED,
            description:
              'Submitted tailored resume via StripeWave careers portal.',
          },
          {
            type: ApplicationEventType.ASSESSMENT,
            description:
              'Completed Full Stack coding challenge with 98% score.',
          },
          {
            type: ApplicationEventType.INTERVIEW,
            description: 'Technical screening call with Lead Engineer passed.',
          },
        ],
      },
    },
  });

  await prisma.application.create({
    data: {
      userId: user.id,
      jobId: job2.id,
      resumeVersionId: v1.id,
      company: 'Veloce Design Systems',
      role: 'Frontend Developer',
      status: ApplicationStatus.APPLIED,
      appliedAt: new Date(Date.now() - 5 * 86400000),
      recruiterName: 'Marcus Vance',
      notes: 'Application submitted. Waiting on initial recruiter response.',
      events: {
        create: [
          {
            type: ApplicationEventType.CREATED,
            description: 'Bookmarked target job.',
          },
          {
            type: ApplicationEventType.APPLIED,
            description: 'Application sent.',
          },
        ],
      },
    },
  });

  await prisma.application.create({
    data: {
      userId: user.id,
      company: 'QuantumFlow Robotics',
      role: 'Junior Software Engineer',
      status: ApplicationStatus.ASSESSMENT,
      appliedAt: new Date(Date.now() - 9 * 86400000),
      notes: 'Received HackerRank challenge link. Deadline this Sunday.',
      events: {
        create: [
          {
            type: ApplicationEventType.APPLIED,
            description: 'Applied via referral.',
          },
          {
            type: ApplicationEventType.ASSESSMENT,
            description: 'HackerRank test link received.',
          },
        ],
      },
    },
  });

  await prisma.application.create({
    data: {
      userId: user.id,
      company: 'Fintech Nexus Labs',
      role: 'Full Stack Associate',
      status: ApplicationStatus.OFFER,
      appliedAt: new Date(Date.now() - 30 * 86400000),
      notes: 'Offer package received: $118k base + equity bonus.',
      events: {
        create: [
          {
            type: ApplicationEventType.APPLIED,
            description: 'Applied on LinkedIn.',
          },
          {
            type: ApplicationEventType.INTERVIEW,
            description: 'System design and behavioral loops completed.',
          },
          {
            type: ApplicationEventType.OFFER,
            description: 'Formal written offer extended.',
          },
        ],
      },
    },
  });

  await prisma.application.create({
    data: {
      userId: user.id,
      company: 'Legacy Data Corp',
      role: 'Software Developer',
      status: ApplicationStatus.REJECTED,
      appliedAt: new Date(Date.now() - 25 * 86400000),
      notes: 'Position closed internally after recruiter screen.',
      events: {
        create: [
          {
            type: ApplicationEventType.APPLIED,
            description: 'Applied via company site.',
          },
          {
            type: ApplicationEventType.REJECTED,
            description: 'Received automated requisition close notice.',
          },
        ],
      },
    },
  });

  await prisma.application.create({
    data: {
      userId: user.id,
      jobId: job3.id,
      company: 'ScaleMetric Cloud',
      role: 'Software Engineer',
      status: ApplicationStatus.SAVED,
      notes: 'Need to complete Docker Mastery learning plan before applying.',
      events: {
        create: [
          {
            type: ApplicationEventType.CREATED,
            description: 'Saved job opportunity.',
          },
        ],
      },
    },
  });

  // 13. Interview Session, Questions, Answers, Evaluation & Report
  await prisma.interviewSession.deleteMany({ where: { userId: user.id } });

  await prisma.interviewSession.create({
    data: {
      userId: user.id,
      jobId: job1.id,
      applicationId: app1.id,
      resumeVersionId: v1.id,
      title: 'Full Stack Technical Simulation — StripeWave',
      mode: InterviewMode.MOCK_INTERVIEW,
      status: InterviewStatus.COMPLETED,
      difficulty: InterviewDifficulty.MEDIUM,
      overallScore: 87.5,
      completedAt: new Date(Date.now() - 2 * 86400000),
      finalReport: {
        summary:
          'Excellent demonstration of Node.js architectural fundamentals and React performance concepts. Strong STAR articulation.',
        strengths: [
          'Clear explanations of asynchronous event loops and PostgreSQL indexing strategies',
          'Well-structured STAR responses addressing conflict resolution in agile sprints',
        ],
        areasToImprove: [
          'Elaborate further on concrete caching layers (Redis TTL and eviction policies)',
          'Provide more granular metrics on test coverage and CI/CD pipelines',
        ],
        readinessRating: 'HIGH',
      },
      questions: {
        create: [
          {
            category: InterviewQuestionCategory.TECHNICAL,
            difficulty: InterviewDifficulty.MEDIUM,
            orderIndex: 0,
            question:
              'How do you design a high-throughput REST API in Node.js while preventing event-loop blockage?',
            whyAsked:
              'Evaluates candidate understanding of asynchronous runtime architecture and non-blocking I/O.',
            expectedSignals: [
              'Worker threads or clustering',
              'Streams for large payloads',
              'Offloading CPU-bound tasks',
              'Connection pooling',
            ],
            answers: {
              create: {
                answerText:
                  'In Node.js, keeping the event loop unblocked is paramount. For I/O operations like database queries, we rely on asynchronous libuv thread pooling and pg connection pools. For intensive data transformations, we offload work to Worker Threads or asynchronous child processes, and stream large payloads rather than buffering them into memory.',
                score: 90,
                strengths: [
                  'Accurate reference to libuv and connection pooling',
                  'Mentioned Node streams to avoid high heap usage',
                ],
                weaknesses: [
                  'Could mention rate limiting or Redis queueing for backpressure',
                ],
                missingPoints: ['Backpressure management'],
                improvementSuggestions: [
                  'Reference BullMQ or Redis stream buffering',
                ],
              },
            },
          },
          {
            category: InterviewQuestionCategory.BEHAVIORAL,
            difficulty: InterviewDifficulty.MEDIUM,
            orderIndex: 1,
            question:
              'Tell me about a time you identified a critical production database bottleneck and how you resolved it.',
            whyAsked:
              'Assesses STAR problem-solving methodology and technical diagnostic ownership.',
            expectedSignals: [
              'Situation context',
              'Measurement methodology',
              'Action taken',
              'Quantitative outcome',
            ],
            answers: {
              create: {
                answerText:
                  'Situation: At Apex Cloud, query latency spiked to 450ms on our merchant transaction ledger. Task: I was tasked with investigating root cause without impacting production uptime. Action: Using pg_stat_statements and EXPLAIN ANALYZE, I discovered a missing composite index on (merchant_id, created_at) causing sequential scans across 2M rows. I applied a concurrent index migration. Result: Average query execution dropped from 450ms to 32ms.',
                score: 88,
                strengths: [
                  'Clean STAR format adherence',
                  'Specific tool references (pg_stat_statements, EXPLAIN ANALYZE)',
                  'Clear quantifiable result (450ms -> 32ms)',
                ],
                weaknesses: [
                  'Could mention monitoring alerts set up afterwards',
                ],
                missingPoints: ['Post-incident alerting'],
                improvementSuggestions: [
                  'Mention establishing Prometheus latency SLO alerts',
                ],
              },
            },
          },
        ],
      },
    },
  });

  // 14. Learning Plan (Docker Mastery) with Tasks
  await prisma.learningPlan.deleteMany({ where: { userId: user.id } });

  await prisma.learningPlan.create({
    data: {
      userId: user.id,
      title: 'Docker Mastery',
      targetRole: 'Full Stack Developer',
      status: LearningPlanStatus.ACTIVE,
      startDate: new Date(Date.now() - 7 * 86400000),
      targetDate: new Date(Date.now() + 21 * 86400000),
      goals: {
        create: [
          {
            skillName: 'Docker',
            priority: SkillPriority.HIGH,
            currentLevel: 'Intermediate',
            targetLevel: 'Advanced',
            status: GoalTaskStatus.IN_PROGRESS,
            rationale:
              'Required to containerize backend microservices and satisfy preferred cloud job requirements.',
            tasks: {
              create: [
                {
                  title: 'Docker fundamentals',
                  description:
                    'Understand container lifecycle, images, layer caching, and storage volumes.',
                  status: GoalTaskStatus.COMPLETED,
                  completedAt: new Date(Date.now() - 5 * 86400000),
                },
                {
                  title: 'Build Docker image',
                  description:
                    'Create multi-stage Dockerfiles optimizing image size for Node.js apps.',
                  status: GoalTaskStatus.COMPLETED,
                  completedAt: new Date(Date.now() - 3 * 86400000),
                },
                {
                  title: 'Docker Compose',
                  description:
                    'Orchestrate multi-container dev environments with Node, PostgreSQL, and Redis.',
                  status: GoalTaskStatus.IN_PROGRESS,
                },
                {
                  title: 'Containerize Node API',
                  description:
                    'Deploy Express API container with health check directives and non-root users.',
                  status: GoalTaskStatus.IN_PROGRESS,
                },
                {
                  title: 'Deploy container',
                  description:
                    'Push containerized images to container registry and execute cloud runner deployment.',
                  status: GoalTaskStatus.TODO,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 15. Career Analytics Snapshot
  await prisma.careerSnapshot.deleteMany({ where: { userId: user.id } });

  await prisma.careerSnapshot.create({
    data: {
      userId: user.id,
      readinessScore: 84.5,
      skillScore: 88.0,
      resumeScore: 86.0,
      evidenceScore: 82.0,
      interviewScore: 87.5,
      completenessScore: 92.0,
      skillsCount: 11,
      verifiedSkillsCount: 9,
      gapsCount: 4,
      activeApplications: 4,
      completedInterviews: 1,
      learningProgress: 40.0,
      metrics: {
        trend: '+6.5% over last 30 days',
        topSkillGaps: ['AWS', 'Testing', 'Accessibility', 'Docker'],
      },
    },
  });

  console.log(`✅ Seed successfully completed for ${email}`);
}

async function main() {
  console.log('🌱 Starting full deterministic seed...');

  // Seed primary demo user requested in design spec
  await seedUserWithConnectedData('alex.morgan.qa@resumind.dev', 'Alex Morgan');

  // Also seed legacy demo account so existing tests pass seamlessly
  await seedUserWithConnectedData('demo@resumind.dev', 'Alex Morgan');

  console.log('🎉 All users and connected domains seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
