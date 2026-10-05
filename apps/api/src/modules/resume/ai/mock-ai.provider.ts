import type {
  AIProvider,
  AIAnalysisResult,
  TailoringPromptParams,
  TailoringGenerationResult,
  TailoringSuggestion,
  GenerateInterviewQuestionsParams,
  InterviewQuestionGenerationResult,
  InterviewGeneratedQuestion,
  EvaluateAnswerParams,
  InterviewAnswerEvaluation,
  GeneratePrepPlanParams,
  InterviewPreparationPlan,
  GenerateFinalReportParams,
  InterviewFinalReport,
  TechnicalPrepItem,
} from './ai.interface.js';
import type { ParsedResumeData } from '../parser/section.parser.js';

export class MockAIProvider implements AIProvider {
  readonly name = 'MOCK';

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

  async generateTailoringSuggestions(
    params: TailoringPromptParams,
  ): Promise<TailoringGenerationResult> {
    const { parsedResume, careerTwin, jobDna } = params;

    // Identify candidate skills from resume and Career Twin
    const resumeSkillNames = parsedResume.skills.map((s) =>
      s.name.toLowerCase(),
    );
    const twinSkillNames = Array.isArray(careerTwin?.skills)
      ? careerTwin.skills.map((s: any) => s.name.toLowerCase())
      : [];
    const allEvidenceSkillNames = new Set([
      ...resumeSkillNames,
      ...twinSkillNames,
    ]);

    // Matching required skills from Job DNA
    const matchedJobSkills = jobDna.skills
      .filter((s) => allEvidenceSkillNames.has(s.name.toLowerCase()))
      .map((s) => s.name);

    const prioritizedSkills =
      matchedJobSkills.length > 0
        ? matchedJobSkills.slice(0, 8)
        : parsedResume.skills.slice(0, 6).map((s) => s.name);

    const suggestions: TailoringSuggestion[] = [];

    // 1. SUMMARY_UPDATE
    const existingSummary =
      parsedResume.summary || 'Software professional with industry experience.';
    const skillListStr =
      prioritizedSkills.slice(0, 3).join(', ') ||
      'modern software architectures';
    suggestions.push({
      type: 'SUMMARY_UPDATE',
      original: existingSummary,
      proposed: `Results-driven ${jobDna.role} with proven expertise in ${skillListStr}, delivering resilient, scalable solutions aligned with business objectives.`,
      reason: `Directly positions qualifications for target role of ${jobDna.role} highlighting verified technical competencies.`,
      evidenceReferences: ['Resume: Summary', 'CareerTwin: Skills'],
      confidence: 0.95,
      requiresUserApproval: true,
    });

    // 2. KEYWORD_ALIGNMENT
    if (prioritizedSkills.length > 0) {
      const topSkill = prioritizedSkills[0];
      suggestions.push({
        type: 'KEYWORD_ALIGNMENT',
        original:
          parsedResume.skills
            .map((s) => s.name)
            .slice(0, 5)
            .join(', ') || 'General Engineering',
        proposed: prioritizedSkills.join(' • '),
        reason: `Reorders technical skills section to position high-priority job match keyword '${topSkill}' upfront.`,
        evidenceReferences: ['JobDNA: RequiredSkills', 'CareerTwin: Skills'],
        confidence: 0.92,
        requiresUserApproval: true,
      });
    }

    // 3. REWRITE (Experience bullet)
    if (parsedResume.experience.length > 0) {
      const firstExp = parsedResume.experience[0];
      const origBullet =
        firstExp.bullets?.[0] ||
        firstExp.description ||
        `Developed software features at ${firstExp.company}.`;
      const techMention = matchedJobSkills[0] || 'Node.js';
      suggestions.push({
        type: 'REWRITE',
        original: origBullet,
        proposed: `Architected and implemented production services using ${techMention}, enhancing reliability and supporting cross-functional team deliverables.`,
        reason: `Reframes bullet point to highlight required technology (${techMention}) and engineering ownership.`,
        evidenceReferences: [
          `Resume: Experience (${firstExp.company})`,
          'CareerTwin: Experience',
        ],
        confidence: 0.88,
        requiresUserApproval: true,
      });
    }

    // 4. PROJECT_EMPHASIS
    if (Array.isArray(careerTwin?.projects) && careerTwin.projects.length > 0) {
      const proj = careerTwin.projects[0];
      suggestions.push({
        type: 'PROJECT_EMPHASIS',
        original: proj.description || proj.name,
        proposed: `Engineered ${proj.name}: ${proj.description || 'scalable system'} utilizing ${(proj.technologies || []).join(', ')}.`,
        reason: `Highlights verified portfolio project '${proj.name}' matching job architectural requirements.`,
        evidenceReferences: [`CareerTwin: Projects (${proj.name})`],
        confidence: 0.9,
        requiresUserApproval: true,
      });
    } else if (parsedResume.projects && parsedResume.projects.length > 0) {
      const proj = parsedResume.projects[0];
      suggestions.push({
        type: 'PROJECT_EMPHASIS',
        original: proj.description || proj.name,
        proposed: `Engineered ${proj.name}: ${proj.description || 'production system'} showcasing hands-on technical architecture.`,
        reason: `Spotlights portfolio project '${proj.name}' directly relevant to ${jobDna.role}.`,
        evidenceReferences: [`Resume: Projects (${proj.name})`],
        confidence: 0.89,
        requiresUserApproval: true,
      });
    }

    return {
      tailoredSummary: suggestions[0]?.proposed,
      prioritizedSkills,
      suggestions,
      evidenceAnalysis: {
        supportedClaims: [
          `Candidate verified expertise in ${prioritizedSkills.slice(0, 3).join(', ')}`,
          `Experience documented in ${parsedResume.experience[0]?.company || 'professional background'}`,
        ],
        unsupportedClaims: [],
        uncertainClaims: [],
        evidenceReferences: [
          'Resume: Experience',
          'Resume: Skills',
          'CareerTwin: Skills',
        ],
        warnings: [],
      },
    };
  }

  async generateInterviewQuestions(
    params: GenerateInterviewQuestionsParams,
  ): Promise<InterviewQuestionGenerationResult> {
    const {
      role,
      company,
      difficulty,
      questionCount = 10,
      resumeData,
      careerTwin,
      jobDna,
      matchData,
    } = params;

    const questions: InterviewGeneratedQuestion[] = [];

    // Extract skills and projects from evidence
    const candidateSkills: string[] = [];
    if (resumeData?.skills) {
      candidateSkills.push(...resumeData.skills.map((s) => s.name));
    }
    if (Array.isArray(careerTwin?.skills)) {
      candidateSkills.push(...careerTwin.skills.map((s: any) => s.name));
    }

    const projects: Array<{ name: string; description?: string }> = [];
    if (Array.isArray(careerTwin?.projects)) {
      projects.push(...careerTwin.projects);
    } else if (resumeData?.projects) {
      projects.push(...resumeData.projects);
    }

    const experiences: Array<{ company: string; role?: string }> = [];
    if (resumeData?.experience) {
      experiences.push(...resumeData.experience);
    } else if (Array.isArray(careerTwin?.experiences)) {
      experiences.push(...careerTwin.experiences);
    }

    // 1. RESUME question
    if (experiences.length > 0) {
      const exp = experiences[0];
      questions.push({
        category: 'RESUME',
        difficulty,
        question: `In your role at ${exp.company}, what was your most impactful engineering initiative and how did you measure its success?`,
        whyAsked: `The candidate lists verified tenure at ${exp.company}. Evaluating delivery scope and business impact.`,
        expectedSignals: [
          'Ownership of initiative',
          'Clear technical trade-offs',
          'Quantifiable or business-oriented impact',
        ],
        evidenceReferences: [
          {
            source: 'RESUME',
            type: 'EXPERIENCE',
            label: `${exp.company} Work Experience`,
          },
        ],
        preparationTips: [
          'Structure your response using the STAR method (Situation, Task, Action, Result).',
          'Focus on your specific personal contribution rather than just what the team did.',
        ],
      });
    } else {
      questions.push({
        category: 'RESUME',
        difficulty,
        question: `Walk me through your engineering background and the key milestones that prepared you for this ${role} position.`,
        whyAsked: `Assessing career trajectory and communication clarity for the ${role} position.`,
        expectedSignals: ['Cohesive narrative', 'Relevant technical growth'],
        evidenceReferences: [
          {
            source: 'RESUME',
            type: 'OVERVIEW',
            label: 'Candidate Background',
          },
        ],
        preparationTips: [
          'Keep your overview concise (under 2 minutes) focusing on recent relevant highlights.',
        ],
      });
    }

    // 2. PROJECT question
    if (projects.length > 0) {
      const proj = projects[0];
      questions.push({
        category: 'PROJECT',
        difficulty,
        question: `Explain the architectural design of ${proj.name}. What were the key technical trade-offs you encountered?`,
        whyAsked: `The candidate built ${proj.name}. Verifying system design depth and architectural decision-making.`,
        expectedSignals: [
          'System architecture reasoning',
          'Component boundaries',
          'Handling failures or scaling bottlenecks',
        ],
        evidenceReferences: [
          {
            source: 'CAREER_TWIN',
            type: 'PROJECT',
            label: proj.name,
          },
        ],
        preparationTips: [
          'Draw or outline the high-level components first before diving into specifics.',
          'Be honest about trade-offs and what you would improve today.',
        ],
      });
    } else {
      questions.push({
        category: 'PROJECT',
        difficulty,
        question: `Describe a complex software project you designed from scratch. How did you structure the data flow and persistence layer?`,
        whyAsked:
          'Evaluating architecture and software engineering fundamentals.',
        expectedSignals: [
          'Database selection reasoning',
          'API contract design',
        ],
        evidenceReferences: [
          {
            source: 'RESUME',
            type: 'PROJECT',
            label: 'Engineering Portfolio',
          },
        ],
        preparationTips: [
          'Pick your most technically sophisticated project with end-to-end involvement.',
        ],
      });
    }

    // 3. TECHNICAL question (Ground in verified skills or missing skill)
    const primaryTech =
      candidateSkills[0] || jobDna?.skills[0]?.name || 'TypeScript';
    questions.push({
      category: 'TECHNICAL',
      difficulty,
      question: `How do you handle asynchronous error propagation and concurrency control in ${primaryTech}?`,
      whyAsked: `Verified technical competency in ${primaryTech} is required for the ${role} position.`,
      expectedSignals: [
        'Robust error handling mechanisms',
        'Promise/async-await or thread safety considerations',
        'Memory or resource leak avoidance',
      ],
      evidenceReferences: [
        {
          source: 'CAREER_TWIN',
          type: 'SKILL',
          label: primaryTech,
        },
      ],
      preparationTips: [
        'Provide concrete code patterns or design patterns rather than purely theoretical answers.',
      ],
    });

    // 4. JOB_SPECIFIC question
    const companyLabel = company || 'our engineering team';
    if (jobDna?.responsibilities && jobDna.responsibilities.length > 0) {
      const resp = jobDna.responsibilities[0];
      questions.push({
        category: 'JOB_SPECIFIC',
        difficulty,
        question: `This role at ${companyLabel} involves: "${resp}". How have you tackled similar requirements in previous environments?`,
        whyAsked: `Directly matches primary job responsibility from the job description for ${role}.`,
        expectedSignals: [
          'Familiarity with the domain',
          'Pragmatic operational execution',
        ],
        evidenceReferences: [
          {
            source: 'JOB_DESCRIPTION',
            type: 'RESPONSIBILITY',
            label: resp,
          },
        ],
        preparationTips: [
          'Tie your past accomplishments directly to the target team’s business goal.',
        ],
      });
    } else {
      questions.push({
        category: 'JOB_SPECIFIC',
        difficulty,
        question: `What excites you about the ${role} opening at ${companyLabel}, and how do your strengths align with our roadmap?`,
        whyAsked:
          'Assessing role motivation, company alignment, and value proposition.',
        expectedSignals: ['Genuine domain interest', 'Strategic thinking'],
        evidenceReferences: [
          {
            source: 'JOB_DESCRIPTION',
            type: 'ROLE',
            label: role,
          },
        ],
        preparationTips: [
          'Reference specific technical challenges typical for this company domain.',
        ],
      });
    }

    // 5. BEHAVIORAL / SITUATIONAL question
    questions.push({
      category: 'BEHAVIORAL',
      difficulty,
      question: `Describe a scenario where you strongly disagreed with a senior engineer or product manager about an architectural decision. How did you resolve it?`,
      whyAsked:
        'Evaluating cross-functional collaboration, technical communication, and conflict resolution.',
      expectedSignals: [
        'Objective data-driven persuasion',
        'Professionalism and empathy',
        'Commitment to team alignment',
      ],
      evidenceReferences: [
        {
          source: 'CAREER_TWIN',
          type: 'BEHAVIORAL',
          label: 'Team Collaboration & Leadership',
        },
      ],
      preparationTips: [
        'Focus on how the resolution benefited the product and engineering velocity.',
        'Never disparage colleagues; highlight mutual respect and evidence-based decisions.',
      ],
    });

    // 6. Address missing/partial skills if any exist in matchData
    if (matchData?.missingSkills && matchData.missingSkills.length > 0) {
      const missingSkill = matchData.missingSkills[0];
      questions.push({
        category: 'TECHNICAL',
        difficulty: 'MEDIUM',
        question: `The job requirement mentions ${missingSkill}, which is not prominent in your background. How would you ramp up and approach using ${missingSkill} in production?`,
        whyAsked: `Identified gap in job match requirements for ${missingSkill}. Evaluating learning agility and conceptual foundation.`,
        expectedSignals: [
          'Proactive learning framework',
          'Transferable conceptual principles from similar tech stacks',
        ],
        evidenceReferences: [
          {
            source: 'JOB_DESCRIPTION',
            type: 'REQUIREMENT_GAP',
            label: `Missing requirement: ${missingSkill}`,
          },
        ],
        preparationTips: [
          `Do NOT pretend you are an expert in ${missingSkill}. Be upfront about your familiarity and highlight analogous technologies you already master.`,
        ],
      });
    }

    // Adjust count to match questionCount
    const finalQuestions = questions.slice(0, questionCount);

    return {
      questions: finalQuestions,
      overallTheme: `Comprehensive ${difficulty} preparation for ${role} ${company ? `at ${company}` : ''}`,
      focusAreas: [
        'Core Technical Mastery',
        'Architecture & Trade-offs',
        'Collaboration & Delivery',
        'Job Requirement Alignment',
      ],
    };
  }

  async evaluateInterviewAnswer(
    params: EvaluateAnswerParams,
  ): Promise<InterviewAnswerEvaluation> {
    const { answerText, category } = params;

    const wordCount = answerText.trim().split(/\s+/).length;
    const isShort = wordCount < 30;

    let score = isShort ? 55 : 82;
    if (wordCount > 100) score = 88;

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const missingPoints: string[] = [];
    const improvementSuggestions: string[] = [];

    if (wordCount >= 30) {
      strengths.push(
        'Provides concrete context and demonstrates hands-on understanding of the core technical concepts.',
      );
      strengths.push(
        'Directly addresses the prompt with relevant professional perspective.',
      );
    } else {
      weaknesses.push(
        'Response is brief and lacks depth regarding implementation details and architectural trade-offs.',
      );
      missingPoints.push(
        'Specific technical decisions, challenges encountered, or measurable outcomes.',
      );
      improvementSuggestions.push(
        'Elaborate on the rationale behind your decisions and include a tangible outcome or lesson learned.',
      );
    }

    if (category === 'BEHAVIORAL' || category === 'SITUATIONAL') {
      improvementSuggestions.push(
        'Structure your answer using STAR: Situation (context), Task (goal), Action (what YOU did), Result (quantifiable or qualitative impact).',
      );
      if (
        !answerText.toLowerCase().includes('result') &&
        !/\d+/.test(answerText)
      ) {
        improvementSuggestions.push(
          'Add a measurable result or business outcome if you have verified data for one.',
        );
      }
    } else {
      improvementSuggestions.push(
        'Mention any failure modes or production edge cases you considered during design.',
      );
    }

    return {
      score,
      strengths,
      weaknesses,
      missingPoints,
      improvementSuggestions,
      recommendedStructure:
        category === 'BEHAVIORAL'
          ? 'STAR Method: Situation -> Task -> Action -> Result'
          : 'Context -> Technical Architecture -> Trade-offs -> Outcome',
      evidenceAlignment:
        'Grounds responses in verified candidate background without overstating unverified metrics.',
      dimensions: {
        relevance: isShort ? 60 : 85,
        completeness: isShort ? 50 : 80,
        clarity: 85,
        technicalDepth: isShort ? 55 : 82,
        evidenceAlignmentScore: 90,
      },
    };
  }

  async generateInterviewPreparationPlan(
    params: GeneratePrepPlanParams,
  ): Promise<InterviewPreparationPlan> {
    const { role, company, durationDays = 5, matchData, jobDna } = params;

    const technicalChecklist: TechnicalPrepItem[] = [];

    if (jobDna?.skills && Array.isArray(jobDna.skills)) {
      jobDna.skills.slice(0, 5).forEach((s: any) => {
        const isMissing = matchData?.missingSkills?.includes(s.name);
        const isPartial = matchData?.partialSkills?.includes(s.name);
        const classification = isMissing
          ? 'GAP'
          : isPartial
            ? 'REVIEW'
            : 'STRONG';

        technicalChecklist.push({
          skill: s.name,
          classification,
          jobRequirement: `Key requirement for ${role}`,
          candidateEvidence: isMissing
            ? 'No documented evidence in Career Twin'
            : 'Verified competency in candidate profile',
          recommendedTopics: [
            `${s.name} core principles & internals`,
            `Best practices and failure recovery in ${s.name}`,
            `Common system design scenarios using ${s.name}`,
          ],
        });
      });
    }

    if (technicalChecklist.length === 0) {
      technicalChecklist.push({
        skill: 'System Architecture',
        classification: 'REVIEW',
        jobRequirement: `Standard engineering requirement for ${role}`,
        candidateEvidence: 'Verified in projects and experience',
        recommendedTopics: [
          'High-availability microservice design',
          'Data consistency and caching patterns',
        ],
      });
    }

    const companyStr = company ? ` for ${company}` : '';

    return {
      durationDays,
      dailyPlans: [
        {
          day: 1,
          title: 'Resume & Career Story Alignment',
          focus:
            'Mastering your resume narrative and project architectural deep dives.',
          tasks: [
            'Review past career transitions and prepare a 90-second elevator pitch.',
            'Deep dive into primary portfolio projects, outlining tech stack trade-offs.',
          ],
          targetCategories: ['RESUME', 'PROJECT', 'EXPERIENCE'],
        },
        {
          day: 2,
          title: 'Core Technical Competencies',
          focus: `Deep dive into required skills and architecture for ${role}.`,
          tasks: [
            'Review key technical checklist items and syntax/concurrency details.',
            'Prepare answers for asynchronous error handling and data pipelines.',
          ],
          targetCategories: ['TECHNICAL'],
        },
        {
          day: 3,
          title: 'Behavioral & Leadership Scenarios',
          focus:
            'Structuring conflict resolution and leadership examples using STAR.',
          tasks: [
            'Prepare 3 STAR stories: technical disagreement, project delivery under pressure, mentoring.',
            'Refine measurable results without fabricating unverifiable statistics.',
          ],
          targetCategories: ['BEHAVIORAL', 'SITUATIONAL'],
        },
        {
          day: 4,
          title: `Role & Company Domain Readiness${companyStr}`,
          focus:
            'Aligning with target company requirements, product challenges, and roadmap.',
          tasks: [
            'Map your previous domain achievements to the target job responsibilities.',
            'Formulate 4 thoughtful reverse-interview questions to ask the interviewer.',
          ],
          targetCategories: ['JOB_SPECIFIC', 'COMPANY_ROLE'],
        },
        {
          day: 5,
          title: 'Comprehensive Mock Interview Simulation',
          focus:
            'Timed simulation covering all question categories and reviewing final report.',
          tasks: [
            'Complete a full 5-question mock interview session in Resumind.',
            'Review feedback strengths and missing points before the live interview.',
          ],
          targetCategories: ['MOCK_INTERVIEW' as any],
        },
      ],
      technicalChecklist,
      keyStrategyNotes: [
        'Always be honest about technical boundaries; explain how you learn rather than feigning mastery.',
        'Use the STAR method for behavioral questions and emphasize your specific personal actions.',
        'Tie every architectural choice to its operational trade-offs.',
      ],
    };
  }

  async generateInterviewFinalReport(
    params: GenerateFinalReportParams,
  ): Promise<InterviewFinalReport> {
    const { questionsWithAnswers, role, company } = params;

    const scores = questionsWithAnswers
      .map((q) => q.score)
      .filter((s): s is number => typeof s === 'number');

    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 75;

    const companyName = company || 'target company';

    return {
      overallPreparationScore: avgScore,
      technicalReadiness: Math.min(100, avgScore + 2),
      behavioralReadiness: Math.min(100, avgScore - 3),
      resumeReadiness: Math.min(100, avgScore + 5),
      jobSpecificReadiness: Math.min(100, avgScore),
      projectReadiness: Math.min(100, avgScore + 4),
      strongestAreas: [
        'Clear architectural justification in project explanations.',
        'Effective articulation of core technical stack trade-offs.',
      ],
      weakestAreas: [
        'Quantifying business impact and measurable metrics in behavioral responses.',
        'Deep-dive coverage on newer or peripheral job requirements.',
      ],
      evidenceGaps: [
        'Ensure measurable production metrics (e.g. latency, scale) are grounded in verified data.',
      ],
      recommendedTopics: [
        `High-concurrency patterns in target stack for ${role}`,
        'System resilience and graceful degradation under load',
        'Structured STAR storytelling for senior engineering leadership',
      ],
      questionsToRevisit: questionsWithAnswers
        .filter((q) => (q.score ?? 100) < 70)
        .map((q) => q.question),
      summaryFeedback: `Candidate displays strong technical readiness for ${role} at ${companyName}. Focus remaining preparation on quantifying verified outcomes and addressing identified skill gaps with confident learning frameworks.`,
    };
  }
}

export const aiProvider: AIProvider = new MockAIProvider();
