import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Phase 8: Career Analytics, Skill Gap & Learning Plan E2E Flow', () => {
  test('Journey 1 & 2: Analytics Dashboard -> View Gaps -> Create Plan -> Complete Task', async ({
    page,
  }) => {
    test.setTimeout(60000);

    // Mock auth & profile state
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock-access-token-phase8');
      localStorage.setItem('refreshToken', 'mock-refresh-token-phase8');
    });

    // Mock auth/me
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'u-phase8-123',
              email: 'candidate@resumind.dev',
              name: 'Sarah Connor',
              role: 'USER',
            },
          },
        }),
      });
    });

    // Mock analytics overview
    await page.route('**/api/v1/analytics/overview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            careerReadiness: {
              overallScore: 82,
              skillAlignment: 85,
              resumeReadiness: 80,
              evidenceStrength: 78,
              interviewReadiness: 84,
              careerTwinCompleteness: 90,
              explanations: {
                skillAlignment: 'High coverage of core backend requirements.',
                resumeReadiness: 'Latest ATS score 84/100.',
                evidenceStrength:
                  'Verified projects and GitHub repositories present.',
                interviewReadiness:
                  'Completed 3 preparation sessions with high scores.',
              },
            },
            skills: {
              totalSkills: 12,
              strongSkills: 7,
              moderateSkills: 4,
              weakSkills: 1,
            },
            skillGaps: {
              totalGaps: 3,
              criticalGaps: 1,
              topGaps: [
                {
                  skill: 'Docker',
                  priority: 'CRITICAL',
                  status: 'MISSING',
                  currentEvidence: 'Mentioned once in older resume',
                  reason: 'Required for container deployment in target role',
                  recommendedAction: 'Build and document a Dockerized project',
                },
                {
                  skill: 'Kubernetes',
                  priority: 'HIGH',
                  status: 'PARTIAL',
                  currentEvidence: 'Basic configuration in sandbox',
                  reason: 'Preferred for cloud platform orchestration',
                  recommendedAction: 'Deploy a cluster with Helm chart',
                },
              ],
            },
            learningProgress: {
              activePlans: 1,
              activeGoals: 2,
              completedTasks: 3,
            },
            targetRole: { title: 'Senior Backend Engineer', level: 'Senior' },
            insights: [
              {
                category: 'Evidence',
                title: 'Strong Full-Stack Foundation',
                observation:
                  'Your strongest evidence is currently in TypeScript & Node.js backend systems.',
                recommendation:
                  'Target roles heavily utilizing TypeScript microservices.',
              },
            ],
          },
        }),
      });
    });

    // Mock skills & gaps
    await page.route('**/api/v1/analytics/skills/gaps', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            targetRole: 'Senior Backend Engineer',
            gaps: [
              {
                skill: 'Docker',
                priority: 'CRITICAL',
                status: 'MISSING',
                importance: 'REQUIRED',
                currentEvidence: 'Mentioned once in older resume',
                reason: 'Required for container deployment in target role',
                recommendedAction: 'Build and document a Dockerized project',
              },
            ],
          },
        }),
      });
    });

    await page.route('**/api/v1/analytics/skills', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            skills: [
              {
                canonicalName: 'TypeScript',
                originalName: 'TypeScript',
                category: 'Programming Languages',
                strength: 'STRONG',
                verificationStatus: 'VERIFIED_USER_DATA',
                evidenceCount: 3,
                evidenceItems: [{ source: 'CAREER_TWIN', label: 'Twin Skill' }],
              },
            ],
          },
        }),
      });
    });

    // Mock learning plans
    let mockPlan = {
      id: 'plan-e2e-888',
      title: 'Docker & Containerization Mastery',
      targetRole: 'Senior Backend Engineer',
      description: 'Proof of work containerization plan',
      status: 'ACTIVE',
      goals: [
        {
          id: 'goal-e2e-1',
          skill: 'Docker',
          priority: 'CRITICAL',
          currentLevel: 'WEAK',
          targetLevel: 'STRONG',
          status: 'IN_PROGRESS',
          rationale: 'Required for cloud deployments',
          tasks: [
            {
              id: 'task-e2e-1',
              title: 'Containerize microservice architecture',
              type: 'EVIDENCE',
              status: 'TODO',
              description: 'Create multi-stage Dockerfile and push to GitHub',
            },
          ],
        },
      ],
    };

    await page.route('**/api/v1/learning-plans', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [mockPlan] }),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockPlan }),
        });
      }
    });

    await page.route('**/api/v1/learning-plans/plan-e2e-888', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockPlan }),
      });
    });

    await page.route(
      '**/api/v1/learning-plans/plan-e2e-888/generate',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockPlan }),
        });
      },
    );

    await page.route('**/api/v1/learning-tasks/task-e2e-1', async (route) => {
      mockPlan.goals[0].tasks[0].status = 'COMPLETED';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockPlan.goals[0].tasks[0],
        }),
      });
    });

    // 1. Visit Analytics Overview
    await page.goto(`${BASE}/analytics`);
    await expect(page.locator('text=Career Readiness Score')).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.locator('text=Score Components & Explanations'),
    ).toBeVisible();

    // 2. Navigate to Skill Intelligence & Gaps
    await page.goto(`${BASE}/analytics/skills`);
    await expect(
      page.locator(':has-text("Identified Skill Gaps")').first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Docker').first()).toBeVisible({
      timeout: 10000,
    });

    // 3. Navigate to Learning Plans (with prefilled skill)
    await page.goto(`${BASE}/learning/new?skill=Docker`);
    await expect(page.locator('#plan-title-input')).toBeVisible();

    // 4. Submit plan creation
    await page.locator('#create-plan-submit-btn').click();

    // 5. Arrive at plan detail page
    await expect(
      page.locator('text=Learning Goals & Proof-of-Work Tasks'),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('text=Containerize microservice architecture'),
    ).toBeVisible({ timeout: 10000 });

    // 6. Complete task
    await page.locator('#complete-task-task-e2e-1').click();
    await expect(page.locator('text=Completed').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Journey 3: Applications, Interview Readiness & Evidence Verification', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock-access-token-phase8');
      localStorage.setItem('refreshToken', 'mock-refresh-token-phase8');
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'u-1',
              email: 'test@resumind.dev',
              name: 'Tester',
              role: 'USER',
            },
          },
        }),
      });
    });

    await page.route('**/api/v1/analytics/applications', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            summary: {
              totalApplications: 10,
              interviewCount: 4,
              offerCount: 2,
            },
            rates: { interviewRate: 40, offerRate: 20, rejectionRate: 10 },
            statusBreakdown: { APPLIED: 3, INTERVIEWING: 4, OFFERED: 2 },
          },
        }),
      });
    });

    await page.route('**/api/v1/analytics/evidence', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalEvidencePieces: 8,
            statusBreakdown: {
              VERIFIED_USER_DATA: 5,
              EXTERNAL_SOURCE: 2,
              NEEDS_REVIEW: 1,
            },
            sourceBreakdown: {
              CAREER_TWIN: 4,
              PROJECTS: 2,
              GITHUB: 1,
              RESUME: 1,
            },
            skills: [
              {
                skill: 'TypeScript',
                status: 'VERIFIED_USER_DATA',
                evidenceCount: 3,
                sources: ['CAREER_TWIN', 'PROJECTS'],
              },
            ],
          },
        }),
      });
    });

    await page.goto(`${BASE}/analytics/applications`);
    await expect(page.locator('text=Application CRM Analytics')).toBeVisible();
    await expect(page.locator('text=INTERVIEW RATE')).toBeVisible();

    await page.goto(`${BASE}/analytics/evidence`);
    await expect(
      page.locator(':has-text("Evidence Coverage")').first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator(':has-text("VERIFIED USER DATA")').first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
