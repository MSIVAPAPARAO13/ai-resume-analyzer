import { prisma } from '../../config/database.js';
import { aiProvider } from '../resume/ai/mock-ai.provider.js';
import {
  SkillNormalizer,
  type NormalizedSkillRecord,
  type SkillEvidenceItem,
} from './skill-normalizer.js';
import type {
  SkillGapItem,
  SkillPriority,
  CareerInsight,
} from '../resume/ai/ai.interface.js';

interface SkillAccumulator {
  canonicalName: string;
  originalName: string;
  category: string;
  proficiency?: string | null;
  evidenceItems: SkillEvidenceItem[];
  lastVerifiedDate?: string;
}

export class AnalyticsService {
  /**
   * Gather and normalize all candidate skills across Career Twin, Resumes, and GitHub
   */
  async gatherUserSkills(userId: string): Promise<NormalizedSkillRecord[]> {
    const careerProfile = await prisma.careerProfile.findUnique({
      where: { userId },
      include: {
        skills: true,
        projects: true,
        experiences: true,
        certifications: true,
      },
    });

    const resumeVersions = await prisma.resumeVersion.findMany({
      where: { resume: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const gitHubRepos = await (prisma as any).gitHubRepository.findMany({
      where: { userId },
    });

    const skillMap = new Map<string, SkillAccumulator>();

    // 1. Career Twin Skills (Source: CAREER_TWIN, VERIFIED_USER_DATA)
    if (careerProfile?.skills) {
      for (const sk of careerProfile.skills) {
        const { canonicalName, category } = SkillNormalizer.normalize(sk.name);
        const existing: SkillAccumulator = skillMap.get(canonicalName) || {
          canonicalName,
          originalName: sk.name,
          category,
          proficiency: sk.proficiency,
          evidenceItems: [],
          lastVerifiedDate: sk.updatedAt.toISOString(),
        };

        existing.evidenceItems.push({
          source: 'CAREER_TWIN',
          verificationStatus: 'VERIFIED_USER_DATA',
          type: 'SKILL',
          referenceId: sk.id,
          label: `Career Twin Skill: ${sk.name} (${sk.proficiency || 'General'})`,
          verifiedAt: sk.updatedAt.toISOString(),
        });

        skillMap.set(canonicalName, existing);
      }
    }

    // 2. Career Twin Projects (Source: CAREER_TWIN, VERIFIED_USER_DATA)
    if (careerProfile?.projects) {
      for (const proj of careerProfile.projects) {
        for (const tech of proj.technologies || []) {
          const { canonicalName, category } = SkillNormalizer.normalize(tech);
          const existing: SkillAccumulator = skillMap.get(canonicalName) || {
            canonicalName,
            originalName: tech,
            category,
            evidenceItems: [],
          };

          existing.evidenceItems.push({
            source: 'CAREER_TWIN',
            verificationStatus: 'VERIFIED_USER_DATA',
            type: 'PROJECT',
            referenceId: proj.id,
            label: `Project: ${proj.name}`,
            description: proj.description || undefined,
            verifiedAt: proj.updatedAt.toISOString(),
          });

          skillMap.set(canonicalName, existing);
        }
      }
    }

    // 3. Career Twin Experiences (Source: CAREER_TWIN, VERIFIED_USER_DATA)
    if (careerProfile?.experiences) {
      for (const exp of careerProfile.experiences) {
        const descLower = (exp.description || '').toLowerCase();
        for (const [canonical, entry] of skillMap.entries()) {
          if (
            descLower.includes(canonical.toLowerCase()) ||
            descLower.includes(entry.originalName.toLowerCase())
          ) {
            entry.evidenceItems.push({
              source: 'CAREER_TWIN',
              verificationStatus: 'VERIFIED_USER_DATA',
              type: 'EXPERIENCE',
              referenceId: exp.id,
              label: `Role: ${exp.title} at ${exp.company}`,
              verifiedAt: exp.updatedAt.toISOString(),
            });
          }
        }
      }
    }

    // 4. Resume Parsed Sections (Source: RESUME, NEEDS_REVIEW if not in Twin)
    for (const rv of resumeVersions) {
      const parsed: any = rv.parsedData;
      if (parsed && Array.isArray(parsed.skills)) {
        for (const sk of parsed.skills) {
          const rawName = typeof sk === 'string' ? sk : sk.name;
          if (!rawName) continue;
          const { canonicalName, category } =
            SkillNormalizer.normalize(rawName);
          const existing: SkillAccumulator = skillMap.get(canonicalName) || {
            canonicalName,
            originalName: rawName,
            category,
            evidenceItems: [],
          };

          // Check if already has verified entry
          const isVerified = existing.evidenceItems.some(
            (e) => e.verificationStatus === 'VERIFIED_USER_DATA',
          );

          existing.evidenceItems.push({
            source: 'RESUME',
            verificationStatus: isVerified
              ? 'VERIFIED_USER_DATA'
              : 'NEEDS_REVIEW',
            type: 'SKILL',
            referenceId: rv.id,
            label: `Resume v${rv.versionNumber} Mention`,
            verifiedAt: rv.createdAt.toISOString(),
          });

          skillMap.set(canonicalName, existing);
        }
      }
    }

    // 5. Approved GitHub Repositories (Source: GITHUB, EXTERNAL_SOURCE)
    for (const repo of gitHubRepos) {
      const languages: string[] = Array.isArray(repo.languages)
        ? repo.languages
        : repo.primaryLanguage
          ? [repo.primaryLanguage]
          : [];

      for (const lang of languages) {
        const { canonicalName, category } = SkillNormalizer.normalize(lang);
        const existing: SkillAccumulator = skillMap.get(canonicalName) || {
          canonicalName,
          originalName: lang,
          category,
          evidenceItems: [],
        };

        existing.evidenceItems.push({
          source: 'GITHUB',
          verificationStatus: 'EXTERNAL_SOURCE',
          type: 'GITHUB_REPO',
          referenceId: repo.id,
          label: `GitHub Repository: ${repo.fullName}`,
          description: repo.description || undefined,
          verifiedAt: repo.createdAt.toISOString(),
        });

        skillMap.set(canonicalName, existing);
      }
    }

    // Final normalization record compilation
    const records: NormalizedSkillRecord[] = [];
    for (const [canonicalName, data] of skillMap.entries()) {
      const strength = SkillNormalizer.evaluateStrength(
        data.evidenceItems,
        data.proficiency,
      );
      const verificationStatus = SkillNormalizer.getOverallVerificationStatus(
        data.evidenceItems,
      );

      records.push({
        canonicalName,
        originalName: data.originalName,
        category: data.category,
        strength,
        verificationStatus,
        evidenceCount: data.evidenceItems.length,
        evidenceItems: data.evidenceItems,
        lastVerifiedDate: data.lastVerifiedDate,
      });
    }

    return records.sort((a, b) => b.evidenceCount - a.evidenceCount);
  }

  /**
   * Feature 2: Explainable Career Readiness Score Calculation
   */
  async calculateCareerReadiness(userId: string) {
    const userSkills = await this.gatherUserSkills(userId);
    const careerProfile = await prisma.careerProfile.findUnique({
      where: { userId },
      include: {
        experiences: true,
        projects: true,
        skills: true,
        education: true,
      },
    });

    const resumeAnalyses = await prisma.resumeAnalysis.findMany({
      where: { resume: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const interviewSessions = await (prisma as any).interviewSession.findMany({
      where: { userId },
      select: { overallScore: true, status: true },
    });

    // 1. Skill Alignment (0–100)
    const verifiedSkills = userSkills.filter(
      (s) => s.strength === 'STRONG' || s.strength === 'MODERATE',
    );
    const skillAlignment = Math.min(
      100,
      Math.round(
        (verifiedSkills.length / Math.max(8, userSkills.length || 1)) * 100,
      ),
    );

    // 2. Resume Readiness (0–100)
    let resumeReadiness = 50;
    if (resumeAnalyses.length > 0) {
      const avg =
        resumeAnalyses.reduce((acc, curr) => acc + curr.overallScore, 0) /
        resumeAnalyses.length;
      resumeReadiness = Math.round(avg);
    }

    // 3. Evidence Strength (0–100)
    const totalEvidencePoints = userSkills.reduce((acc, s) => {
      if (s.strength === 'STRONG') return acc + 3;
      if (s.strength === 'MODERATE') return acc + 2;
      if (s.strength === 'WEAK') return acc + 1;
      return acc;
    }, 0);
    const evidenceStrength = Math.min(
      100,
      Math.round(
        (totalEvidencePoints / Math.max(15, userSkills.length * 2 || 1)) * 100,
      ),
    );

    // 4. Interview Readiness (0–100)
    let interviewReadiness = 50;
    const scoredInterviews = interviewSessions.filter(
      (s: any) => typeof s.overallScore === 'number',
    );
    if (scoredInterviews.length > 0) {
      const avg =
        scoredInterviews.reduce(
          (acc: number, curr: any) => acc + (curr.overallScore || 0),
          0,
        ) / scoredInterviews.length;
      interviewReadiness = Math.round(avg);
    }

    // 5. Career Twin Completeness (0–100)
    let completeness = 20; // baseline
    if (careerProfile?.headline) completeness += 15;
    if (careerProfile?.summary) completeness += 15;
    if ((careerProfile?.experiences?.length || 0) > 0) completeness += 20;
    if ((careerProfile?.projects?.length || 0) > 0) completeness += 15;
    if ((careerProfile?.skills?.length || 0) >= 5) completeness += 15;
    const careerTwinCompleteness = Math.min(100, completeness);

    // Weighted Overall Score (Weights: Skill 30%, Resume 25%, Evidence 20%, Interview 15%, Twin 10%)
    const overallScore = Math.round(
      skillAlignment * 0.3 +
        resumeReadiness * 0.25 +
        evidenceStrength * 0.2 +
        interviewReadiness * 0.15 +
        careerTwinCompleteness * 0.1,
    );

    return {
      overallScore,
      skillAlignment,
      resumeReadiness,
      evidenceStrength,
      interviewReadiness,
      careerTwinCompleteness,
      explanations: {
        skillAlignment: `Measures verified competency across core technical requirements. Currently ${verifiedSkills.length} strong/moderate skills verified.`,
        resumeReadiness: `Reflects ATS compatibility and structured impact scores across your active resume versions.`,
        evidenceStrength: `Evaluates verifiable proof-of-work in Career Twin projects, work experience, and approved repositories.`,
        interviewReadiness: `Reflects average performance across interactive mock interview sessions and STAR answer evaluations.`,
        careerTwinCompleteness: `Measures profile completeness across headline, executive summary, project records, and verified skill items.`,
      },
      topRecommendations: [
        overallScore < 70
          ? 'Add demonstrable project repositories to convert weak skills into verified evidence.'
          : 'Complete tailored mock interview sessions to boost communication readiness.',
        'Address critical skill gaps aligned with your target engineering role.',
      ],
    };
  }

  /**
   * Feature 5 & 6: Skill Gap Analysis & Priority Engine
   */
  async getSkillGaps(userId: string): Promise<{
    gaps: SkillGapItem[];
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    summary: string;
    hasSufficientData: boolean;
  }> {
    const userSkills = await this.gatherUserSkills(userId);
    const userSkillNames = new Set(
      userSkills.map((s) => s.canonicalName.toLowerCase()),
    );

    const careerProfile = await prisma.careerProfile.findUnique({
      where: { userId },
      select: { targetRole: true, targetLevel: true },
    });

    const targetRole = careerProfile?.targetRole || 'Software Engineer';

    // Gather actual job requirements stored in Resumind for user
    const jobs = await prisma.job.findMany({
      where: { userId },
      include: {
        analyses: true,
        requirements: { where: { type: 'SKILL' } },
      },
      take: 20,
    });

    const skillRequirementCounts = new Map<
      string,
      {
        canonicalName: string;
        category: string;
        requiredCount: number;
        preferredCount: number;
        totalJobCount: number;
      }
    >();

    for (const job of jobs) {
      for (const req of job.requirements) {
        const { canonicalName, category } = SkillNormalizer.normalize(req.name);
        const existing = skillRequirementCounts.get(
          canonicalName.toLowerCase(),
        ) || {
          canonicalName,
          category,
          requiredCount: 0,
          preferredCount: 0,
          totalJobCount: 0,
        };

        if (req.importance === 'REQUIRED') {
          existing.requiredCount += 1;
        } else {
          existing.preferredCount += 1;
        }
        existing.totalJobCount += 1;
        skillRequirementCounts.set(canonicalName.toLowerCase(), existing);
      }
    }

    const gaps: SkillGapItem[] = [];

    // Analyze gaps based on actual stored jobs
    for (const [lowerName, reqData] of skillRequirementCounts.entries()) {
      const userSkill = userSkills.find(
        (s) => s.canonicalName.toLowerCase() === lowerName,
      );
      const isMissing = !userSkill;
      const isWeak = userSkill && userSkill.strength === 'WEAK';

      if (isMissing || isWeak) {
        let priority: SkillPriority = 'LOW';
        let importance: 'REQUIRED' | 'PREFERRED' | 'NICE_TO_HAVE' =
          'NICE_TO_HAVE';

        if (
          reqData.requiredCount >= 2 ||
          (jobs.length > 0 && reqData.requiredCount / jobs.length >= 0.4)
        ) {
          priority = 'CRITICAL';
          importance = 'REQUIRED';
        } else if (reqData.requiredCount >= 1) {
          priority = 'HIGH';
          importance = 'REQUIRED';
        } else if (reqData.preferredCount >= 1) {
          priority = 'MEDIUM';
          importance = 'PREFERRED';
        }

        gaps.push({
          skill: reqData.canonicalName,
          canonicalSkill: reqData.canonicalName,
          category: reqData.category,
          importance,
          priority,
          status: isMissing ? 'MISSING' : 'PARTIAL',
          currentEvidence: isMissing
            ? 'No verified evidence in profile'
            : `Mentioned in ${userSkill?.evidenceCount || 1} unverified location`,
          requiredEvidence: `Demonstrable project or repository showcasing production use of ${reqData.canonicalName}`,
          affectedTargetRoles: [targetRole],
          whyItMatters: `Requested in ${reqData.totalJobCount} saved job description(s) for your target path.`,
          recommendedAction: `Create a learning task to build and document a ${reqData.canonicalName} module.`,
        });
      }
    }

    // Default gaps if no jobs exist yet (grounded guidance, not fake statistics)
    if (gaps.length === 0) {
      const commonBaseline = ['Docker', 'TypeScript', 'CI/CD', 'REST APIs'];
      for (const base of commonBaseline) {
        if (!userSkillNames.has(base.toLowerCase())) {
          const { canonicalName, category } = SkillNormalizer.normalize(base);
          gaps.push({
            skill: canonicalName,
            canonicalSkill: canonicalName,
            category,
            importance: 'PREFERRED',
            priority: 'MEDIUM',
            status: 'MISSING',
            currentEvidence: 'No verified evidence in Career Twin',
            requiredEvidence: `Add a project or repository showcasing ${canonicalName}`,
            affectedTargetRoles: [targetRole],
            whyItMatters: `Industry standard capability frequently expected for ${targetRole} positions.`,
            recommendedAction: `Add a learning goal to build verified evidence for ${canonicalName}.`,
          });
        }
      }
    }

    const priorityOrder: Record<SkillPriority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    gaps.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    const criticalCount = gaps.filter((g) => g.priority === 'CRITICAL').length;
    const highCount = gaps.filter((g) => g.priority === 'HIGH').length;
    const mediumCount = gaps.filter((g) => g.priority === 'MEDIUM').length;
    const lowCount = gaps.filter((g) => g.priority === 'LOW').length;

    const hasSufficientData = jobs.length >= 2;
    const summary = hasSufficientData
      ? `Identified ${gaps.length} prioritized skill gap(s) across ${jobs.length} target job posting(s).`
      : 'Baseline skill gaps shown. Save and analyze target jobs to personalize gap frequencies against real market demand.';

    return {
      gaps,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      summary,
      hasSufficientData,
    };
  }

  /**
   * Feature 1: Comprehensive Career Analytics Overview
   */
  async getOverview(userId: string) {
    const readiness = await this.calculateCareerReadiness(userId);
    const userSkills = await this.gatherUserSkills(userId);
    const gapAnalysis = await this.getSkillGaps(userId);

    const careerProfile = await prisma.careerProfile.findUnique({
      where: { userId },
      select: { targetRole: true, targetLevel: true },
    });

    const applicationCount = await prisma.application.count({
      where: { userId },
    });

    const activeApplications = await prisma.application.count({
      where: {
        userId,
        status: { in: ['APPLIED', 'ASSESSMENT', 'INTERVIEW'] },
      },
    });

    const interviewCount = await (prisma as any).interviewSession.count({
      where: { userId, status: 'COMPLETED' },
    });

    const activePlans = await (prisma as any).learningPlan.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { goals: { include: { tasks: true } } },
      take: 1,
    });

    let learningProgress = 0;
    if (activePlans.length > 0) {
      const allTasks = activePlans[0].goals.flatMap((g: any) => g.tasks);
      if (allTasks.length > 0) {
        const completed = allTasks.filter(
          (t: any) => t.status === 'COMPLETED',
        ).length;
        learningProgress = Math.round((completed / allTasks.length) * 100);
      }
    }

    const strongSkillsCount = userSkills.filter(
      (s) => s.strength === 'STRONG',
    ).length;

    // AI Career Insights
    let insights: CareerInsight[] = [];
    try {
      const aiInsightsResult = await aiProvider.generateCareerInsights({
        targetRole: careerProfile?.targetRole,
        targetLevel: careerProfile?.targetLevel,
        readinessScore: readiness.overallScore,
        strongSkillsCount,
        gapSkillsCount: gapAnalysis.gaps.length,
        applicationCount,
        interviewCount,
      });
      insights = aiInsightsResult.insights;
    } catch {
      // Safe fallback
      insights = [
        {
          title: 'Skill Evidence Grounding',
          category: 'SKILL_GAP',
          impact: 'HIGH',
          whatChanged: `Verified ${strongSkillsCount} strong technical skills in Career Twin.`,
          whyItMatters:
            'Demonstrable project evidence is the #1 signal hiring managers seek.',
          recommendedAction:
            'Focus on bridging critical skill gaps with verified repository code.',
        },
      ];
    }

    return {
      readiness,
      skillsSummary: {
        totalSkills: userSkills.length,
        strong: strongSkillsCount,
        moderate: userSkills.filter((s) => s.strength === 'MODERATE').length,
        weak: userSkills.filter((s) => s.strength === 'WEAK').length,
        verifiedUserData: userSkills.filter(
          (s) => s.verificationStatus === 'VERIFIED_USER_DATA',
        ).length,
      },
      gapSummary: {
        totalGaps: gapAnalysis.gaps.length,
        critical: gapAnalysis.criticalCount,
        high: gapAnalysis.highCount,
        hasSufficientData: gapAnalysis.hasSufficientData,
      },
      pipelineSummary: {
        totalApplications: applicationCount,
        activeApplications,
        completedInterviews: interviewCount,
      },
      learningSummary: {
        activePlanTitle: activePlans[0]?.title || null,
        activePlanId: activePlans[0]?.id || null,
        progress: learningProgress,
      },
      insights,
      targetRole: careerProfile?.targetRole || 'Not specified',
      targetLevel: careerProfile?.targetLevel || 'Not specified',
    };
  }

  /**
   * Feature 7: Target Role Analytics
   */
  async getRoleAnalytics(userId: string) {
    const careerProfile = await prisma.careerProfile.findUnique({
      where: { userId },
      select: { targetRole: true, targetLevel: true },
    });

    const userSkills = await this.gatherUserSkills(userId);
    const gapAnalysis = await this.getSkillGaps(userId);

    const strongSkills = userSkills
      .filter((s) => s.strength === 'STRONG')
      .map((s) => s.canonicalName);
    const partialSkills = gapAnalysis.gaps
      .filter((g) => g.status === 'PARTIAL')
      .map((g) => g.skill);
    const missingSkills = gapAnalysis.gaps
      .filter((g) => g.status === 'MISSING')
      .map((g) => g.skill);

    return {
      targetRole: careerProfile?.targetRole || 'Software Engineer',
      targetLevel: careerProfile?.targetLevel || 'Mid-Senior',
      topRequiredSkills: gapAnalysis.gaps
        .filter((g) => g.importance === 'REQUIRED')
        .map((g) => g.skill),
      strongSkills,
      partialSkills,
      missingSkills,
      whyThisMatters: `Role requirements are synthesized from active jobs in your pipeline. Demonstrating verified evidence for missing skills directly boosts your match rate.`,
    };
  }

  /**
   * Feature 8: Job Market Skill Analytics (Aggregated from actual stored jobs)
   */
  async getJobMarketSkillAnalytics(userId: string) {
    const userSkills = await this.gatherUserSkills(userId);
    const userSkillMap = new Map(
      userSkills.map((s) => [s.canonicalName.toLowerCase(), s]),
    );

    const jobs = await prisma.job.findMany({
      where: { userId },
      include: {
        requirements: { where: { type: 'SKILL' } },
      },
    });

    if (jobs.length < 2) {
      return {
        hasSufficientData: false,
        message:
          'Not enough data yet. Save or analyze at least 2 target jobs to aggregate market skill demands.',
        marketSkills: [],
        totalJobsAnalyzed: jobs.length,
      };
    }

    const map = new Map<
      string,
      {
        skill: string;
        category: string;
        jobCount: number;
        requiredCount: number;
        preferredCount: number;
      }
    >();

    for (const job of jobs) {
      for (const req of job.requirements) {
        const { canonicalName, category } = SkillNormalizer.normalize(req.name);
        const lower = canonicalName.toLowerCase();
        const existing = map.get(lower) || {
          skill: canonicalName,
          category,
          jobCount: 0,
          requiredCount: 0,
          preferredCount: 0,
        };

        existing.jobCount += 1;
        if (req.importance === 'REQUIRED') {
          existing.requiredCount += 1;
        } else {
          existing.preferredCount += 1;
        }
        map.set(lower, existing);
      }
    }

    const marketSkills = Array.from(map.values())
      .map((item) => {
        const userSk = userSkillMap.get(item.skill.toLowerCase());
        return {
          ...item,
          userStatus: userSk ? userSk.strength : 'MISSING',
          userVerification: userSk ? userSk.verificationStatus : 'UNSUPPORTED',
        };
      })
      .sort((a, b) => b.jobCount - a.jobCount);

    return {
      hasSufficientData: true,
      totalJobsAnalyzed: jobs.length,
      marketSkills,
    };
  }

  /**
   * Feature 9: Application CRM Analytics
   */
  async getApplicationAnalytics(userId: string) {
    const applications = await prisma.application.findMany({
      where: { userId },
      include: {
        resumeVersion: true,
        job: { select: { title: true, company: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalApplications = applications.length;
    const statusCounts: Record<string, number> = {
      SAVED: 0,
      APPLIED: 0,
      ASSESSMENT: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };

    for (const app of applications) {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    }

    const interviewRate =
      totalApplications > 0
        ? Math.round(
            ((statusCounts.INTERVIEW + statusCounts.OFFER) /
              totalApplications) *
              100,
          )
        : 0;
    const offerRate =
      totalApplications > 0
        ? Math.round((statusCounts.OFFER / totalApplications) * 100)
        : 0;
    const rejectionRate =
      totalApplications > 0
        ? Math.round((statusCounts.REJECTED / totalApplications) * 100)
        : 0;

    // Applications by Resume Version
    const versionMap = new Map<
      number,
      { versionNumber: number; count: number }
    >();
    for (const app of applications) {
      if (app.resumeVersion) {
        const vNum = app.resumeVersion.versionNumber;
        const entry = versionMap.get(vNum) || { versionNumber: vNum, count: 0 };
        entry.count += 1;
        versionMap.set(vNum, entry);
      }
    }

    return {
      totalApplications,
      statusCounts,
      interviewRate,
      offerRate,
      rejectionRate,
      versionDistribution: Array.from(versionMap.values()).sort(
        (a, b) => a.versionNumber - b.versionNumber,
      ),
    };
  }

  /**
   * Feature 10: Interview Intelligence Analytics
   */
  async getInterviewAnalytics(userId: string) {
    const sessions = await (prisma as any).interviewSession.findMany({
      where: { userId },
      include: {
        questions: {
          include: { answers: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (s: any) => s.status === 'COMPLETED',
    ).length;

    const scoredSessions = sessions.filter(
      (s: any) => typeof s.overallScore === 'number',
    );
    const averageScore =
      scoredSessions.length > 0
        ? Math.round(
            scoredSessions.reduce(
              (acc: number, curr: any) => acc + curr.overallScore,
              0,
            ) / scoredSessions.length,
          )
        : 0;

    // Categorized question readiness
    const categoryScores = new Map<string, { total: number; count: number }>();
    for (const sess of sessions) {
      for (const q of sess.questions || []) {
        const latestAns = q.answers?.[0];
        if (latestAns && typeof latestAns.score === 'number') {
          const entry = categoryScores.get(q.category) || {
            total: 0,
            count: 0,
          };
          entry.total += latestAns.score;
          entry.count += 1;
          categoryScores.set(q.category, entry);
        }
      }
    }

    const categoryReadiness: Array<{ category: string; averageScore: number }> =
      [];
    for (const [cat, data] of categoryScores.entries()) {
      categoryReadiness.push({
        category: cat,
        averageScore: Math.round(data.total / data.count),
      });
    }

    categoryReadiness.sort((a, b) => b.averageScore - a.averageScore);

    const strongestCategory = categoryReadiness[0]?.category || null;
    const weakestCategory =
      categoryReadiness.length > 0
        ? categoryReadiness[categoryReadiness.length - 1].category
        : null;

    return {
      totalSessions,
      completedSessions,
      averagePreparationScore: averageScore,
      strongestCategory,
      weakestCategory,
      categoryReadiness,
      recentSessions: sessions.slice(0, 5).map((s: any) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        overallScore: s.overallScore,
        startedAt: s.startedAt,
      })),
    };
  }

  /**
   * Feature 11: Resume Performance Analytics
   */
  async getResumePerformanceAnalytics(userId: string) {
    const versions = await prisma.resumeVersion.findMany({
      where: { resume: { userId } },
      include: {
        resume: { select: { title: true } },
        analyses: { orderBy: { createdAt: 'desc' }, take: 1 },
        jobMatches: { select: { overallScore: true } },
        applications: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const performance = versions.map((v) => {
      const matchScores = v.jobMatches.map((m) => m.overallScore);
      const avgMatch =
        matchScores.length > 0
          ? Math.round(
              matchScores.reduce((a, b) => a + b, 0) / matchScores.length,
            )
          : null;

      const interviewCount = v.applications.filter(
        (a) => a.status === 'INTERVIEW' || a.status === 'OFFER',
      ).length;

      return {
        id: v.id,
        resumeTitle: v.resume.title,
        versionNumber: v.versionNumber,
        score: v.analyses[0]?.overallScore ?? null,
        averageJobMatchScore: avgMatch,
        applicationCount: v.applications.length,
        interviewCount,
        createdAt: v.createdAt,
      };
    });

    return {
      totalVersions: versions.length,
      performance,
    };
  }

  /**
   * Feature 12: Evidence Coverage Matrix
   */
  async getEvidenceCoverage(userId: string) {
    const userSkills = await this.gatherUserSkills(userId);

    const matrix = userSkills.map((s) => ({
      skill: s.canonicalName,
      category: s.category,
      evidenceCount: s.evidenceCount,
      sources: Array.from(new Set(s.evidenceItems.map((e) => e.source))),
      verificationStatus: s.verificationStatus,
      strength: s.strength,
      evidenceDetails: s.evidenceItems.map((e) => ({
        source: e.source,
        type: e.type,
        label: e.label,
        verifiedAt: e.verifiedAt,
      })),
    }));

    return {
      totalTrackedSkills: matrix.length,
      matrix,
    };
  }

  /**
   * Feature 20: Historical Progress / Career Snapshots
   */
  async getHistoricalProgress(userId: string) {
    const snapshots = await (prisma as any).careerSnapshot.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 30,
    });

    const currentReadiness = await this.calculateCareerReadiness(userId);

    return {
      snapshots,
      current: {
        overallScore: currentReadiness.overallScore,
        skillAlignment: currentReadiness.skillAlignment,
        resumeReadiness: currentReadiness.resumeReadiness,
        evidenceStrength: currentReadiness.evidenceStrength,
        interviewReadiness: currentReadiness.interviewReadiness,
        careerTwinCompleteness: currentReadiness.careerTwinCompleteness,
      },
    };
  }

  /**
   * Create a career snapshot point
   */
  async createSnapshot(userId: string) {
    const readiness = await this.calculateCareerReadiness(userId);
    const userSkills = await this.gatherUserSkills(userId);
    const gaps = await this.getSkillGaps(userId);
    const appCount = await prisma.application.count({
      where: { userId, status: { in: ['APPLIED', 'ASSESSMENT', 'INTERVIEW'] } },
    });
    const intCount = await (prisma as any).interviewSession.count({
      where: { userId, status: 'COMPLETED' },
    });

    return (prisma as any).careerSnapshot.create({
      data: {
        userId,
        readinessScore: readiness.overallScore,
        skillScore: readiness.skillAlignment,
        resumeScore: readiness.resumeReadiness,
        evidenceScore: readiness.evidenceStrength,
        interviewScore: readiness.interviewReadiness,
        completenessScore: readiness.careerTwinCompleteness,
        skillsCount: userSkills.length,
        verifiedSkillsCount: userSkills.filter(
          (s) => s.verificationStatus === 'VERIFIED_USER_DATA',
        ).length,
        gapsCount: gaps.gaps.length,
        activeApplications: appCount,
        completedInterviews: intCount,
      },
    });
  }

  /**
   * Single skill detail inspection
   */
  async getSkillDetail(userId: string, rawSkillName: string) {
    const userSkills = await this.gatherUserSkills(userId);
    const { canonicalName } = SkillNormalizer.normalize(rawSkillName);

    const found = userSkills.find(
      (s) => s.canonicalName.toLowerCase() === canonicalName.toLowerCase(),
    );

    const careerProfile = await prisma.careerProfile.findUnique({
      where: { userId },
      select: { targetRole: true },
    });

    const targetRole = careerProfile?.targetRole || 'Software Engineer';

    // AI learning pathway guidance
    let pathway: any = null;
    try {
      pathway = await aiProvider.generateSkillGapExplanation({
        skill: canonicalName,
        targetRole,
        importance: 'REQUIRED',
        userEvidence: found ? found.evidenceItems.map((e) => e.label) : [],
      });
    } catch {
      pathway = {
        skill: canonicalName,
        explanation: `${canonicalName} is an important engineering capability for ${targetRole}.`,
        learningPathway: [
          `Master core abstractions of ${canonicalName}.`,
          `Build a functional demo incorporating ${canonicalName}.`,
          `Add code to GitHub and import evidence to Career Twin.`,
        ],
        evidenceBuildingAdvice: `Provide verifiable repository code demonstrating ${canonicalName}.`,
      };
    }

    return {
      skill: found || {
        canonicalName,
        originalName: rawSkillName,
        category: 'General Technical',
        strength: 'UNKNOWN',
        verificationStatus: 'UNSUPPORTED',
        evidenceCount: 0,
        evidenceItems: [],
      },
      pathway,
    };
  }
}

export const analyticsService = new AnalyticsService();
