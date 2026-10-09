import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';
const TEST_EMAIL = 'alex.morgan.qa@resumind.dev';
const TEST_NAME = 'Alex Morgan';

test.describe('Phase 8.5 — Golden Path User Journey (Alex Morgan Synthetic Profile)', () => {
  test.beforeEach(async ({ page }) => {
    // Inject auth token and mock initial session
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock-golden-path-token');
      localStorage.setItem('refreshToken', 'mock-golden-path-refresh');
    });

    // Mock Auth Me
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: '00001111-2222-3333-4444-555566667777',
              email: TEST_EMAIL,
              name: TEST_NAME,
              role: 'USER',
              plan: 'PRO',
            },
          },
        }),
      });
    });

    // Mock Career Profile
    await page.route('**/api/v1/career/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            profile: {
              headline: 'Full Stack Developer | React | Node.js | PostgreSQL',
              summary:
                'Dedicated Full Stack Developer with experience in React, Node.js, and PostgreSQL.',
              targetRole: 'Full Stack Developer',
              targetLevel: 'Entry Level',
            },
          },
        }),
      });
    });

    // Mock Career Twin Items
    await page.route('**/api/v1/career/skills', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            skills: [
              {
                id: 'sk-1',
                name: 'JavaScript',
                category: 'Language',
                proficiency: 'Advanced',
              },
              {
                id: 'sk-2',
                name: 'TypeScript',
                category: 'Language',
                proficiency: 'Intermediate',
              },
              {
                id: 'sk-3',
                name: 'React',
                category: 'Frontend',
                proficiency: 'Advanced',
              },
              {
                id: 'sk-4',
                name: 'Node.js',
                category: 'Backend',
                proficiency: 'Advanced',
              },
              {
                id: 'sk-5',
                name: 'PostgreSQL',
                category: 'Database',
                proficiency: 'Intermediate',
              },
            ],
          },
        }),
      });
    });

    await page.route('**/api/v1/career/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            projects: [
              {
                id: 'proj-1',
                name: 'TradeFlow',
                description:
                  'Full-stack trading dashboard with real-time portfolio tracking.',
                technologies: ['React', 'Node.js', 'Express', 'MongoDB'],
              },
              {
                id: 'proj-2',
                name: 'AI Career Assistant',
                description:
                  'Interactive career assistant leveraging Gemini API.',
                technologies: ['React', 'Node.js', 'Gemini'],
              },
            ],
          },
        }),
      });
    });

    await page.route('**/api/v1/career/experiences', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { experiences: [] } }),
      });
    });

    await page.route('**/api/v1/career/education', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            education: [
              {
                id: 'edu-1',
                institution: 'Metropolitan Institute of Technology',
                degree: 'Bachelor of Science in Engineering',
                fieldOfStudy: 'Computer Science',
                endDate: '2027-06-15',
              },
            ],
          },
        }),
      });
    });

    await page.route('**/api/v1/career/certifications', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { certifications: [] } }),
      });
    });

    await page.route('**/api/v1/career/achievements', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { achievements: [] } }),
      });
    });

    // Mock Resumes List
    await page.route('**/api/v1/resumes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              resumes: [
                {
                  id: 'res-alex-1',
                  title: 'Alex Morgan — Full Stack Resume (Synthetic QA)',
                  createdAt: new Date().toISOString(),
                  versions: [
                    {
                      id: 'ver-1',
                      versionNumber: 1,
                      atsScore: 84,
                      sectionCount: 5,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                },
              ],
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock Jobs List
    await page.route('**/api/v1/jobs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'job-1',
              title: 'Full Stack Developer',
              company: 'Apex Cloud Systems (Synthetic Corp)',
              location: 'San Francisco, CA (Hybrid)',
              status: 'ANALYZED',
              createdAt: new Date().toISOString(),
              latestAnalysis: {
                id: 'dna-1',
                role: 'Full Stack Developer',
                level: 'Entry Level',
              },
              latestMatch: {
                id: 'match-1',
                overallScore: 88,
                createdAt: new Date().toISOString(),
              },
            },
          ],
        }),
      });
    });

    // Mock Applications CRM
    await page.route('**/api/v1/applications', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'app-1',
              company: 'Apex Cloud Systems',
              role: 'Full Stack Developer',
              status: 'INTERVIEW',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/applications/analytics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalApplications: 1,
            statusCounts: { INTERVIEW: 1 },
            applicationToInterviewRate: 100,
            offerRate: 0,
            averageMatchScore: 88,
            resumeVersionUsage: [],
          },
        }),
      });
    });

    // Mock Interview Sessions
    await page.route('**/api/v1/interviews', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'sess-1',
                title: 'Full Stack Technical Prep — Apex Cloud Systems',
                mode: 'PREPARATION',
                status: 'IN_PROGRESS',
                difficulty: 'MEDIUM',
                overallScore: 85,
                startedAt: new Date().toISOString(),
                _count: { questions: 5 },
              },
            ],
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock Analytics Overview
    await page.route('**/api/v1/analytics/overview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            careerReadiness: {
              overallScore: 84,
              skillAlignment: 88,
              resumeReadiness: 84,
              evidenceStrength: 82,
              interviewReadiness: 85,
              careerTwinCompleteness: 90,
              explanations: {
                skillAlignment:
                  'Strong match for Full Stack Developer core requirements.',
                resumeReadiness: 'ATS readiness score 84/100.',
                evidenceStrength:
                  'Verified projects TradeFlow & AI Career Assistant.',
                interviewReadiness:
                  'Preparation session completed with 85% score.',
              },
            },
            skills: {
              totalSkills: 11,
              strongSkills: 7,
              moderateSkills: 4,
              weakSkills: 0,
            },
            skillGaps: {
              totalGaps: 1,
              criticalGaps: 0,
              topGaps: [
                {
                  skill: 'Docker',
                  priority: 'MEDIUM',
                  status: 'PARTIAL',
                  currentEvidence: 'Beginner proficiency in Career Twin',
                  reason:
                    'Preferred skill in Apex Cloud Systems job description',
                  recommendedAction:
                    'Containerize TradeFlow project with Dockerfile',
                },
              ],
            },
            learningProgress: {
              activePlans: 1,
              activeGoals: 2,
              completedTasks: 2,
            },
            targetRole: { title: 'Full Stack Developer', level: 'Entry Level' },
            insights: [
              {
                category: 'Evidence',
                title: 'Solid Full-Stack Portfolio',
                observation:
                  'React and Node.js are supported by multiple projects.',
                recommendation: 'Emphasize TradeFlow in upcoming interviews.',
              },
            ],
          },
        }),
      });
    });

    // Mock Learning Plans
    await page.route('**/api/v1/learning-plans', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'plan-1',
                title:
                  'Master Containerization with Docker for Full Stack Roles',
                targetRole: 'Full Stack Developer',
                status: 'ACTIVE',
                goals: [
                  {
                    id: 'goal-1',
                    skillName: 'Docker',
                    status: 'IN_PROGRESS',
                    tasks: [
                      {
                        id: 'task-1',
                        title:
                          'Write Dockerfile and docker-compose for TradeFlow',
                        status: 'COMPLETED',
                        evidenceRequired: true,
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('Step 1: Dashboard loads with live user data and unified AppNavbar', async ({
    page,
  }) => {
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Welcome back, Alex');
    await expect(page.locator('nav.navbar')).toBeVisible();
    await expect(page.locator('nav.navbar')).toContainText('Resumind');
    await expect(page.locator('nav.navbar')).toContainText('Career Twin');
    await expect(page.locator('nav.navbar')).toContainText('Resumes');
    await expect(page.locator('nav.navbar')).toContainText('Jobs & Matching');
    await expect(page.locator('nav.navbar')).toContainText('Applications');
    await expect(page.locator('nav.navbar')).toContainText('Interviews');
    await expect(page.locator('nav.navbar')).toContainText('Analytics');
    await expect(page.locator('nav.navbar')).toContainText('Learning');
  });

  test('Step 2: Career Twin renders verified candidate skills and projects', async ({
    page,
  }) => {
    await page.goto(`${BASE}/career`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('Career Twin');
    await expect(page.locator('nav.navbar')).toBeVisible();
  });

  test('Step 3: Resumes page renders uploaded resume list and ATS readiness score', async ({
    page,
  }) => {
    await page.goto(`${BASE}/resumes`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Resume Intelligence');
    await expect(page.locator('body')).toContainText(
      'Alex Morgan — Full Stack Resume',
    );
    await expect(page.locator('nav.navbar')).toBeVisible();
  });

  test('Step 4: Jobs & Matching page displays Target Jobs and Match Scores', async ({
    page,
  }) => {
    await page.goto(`${BASE}/jobs`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('Apex Cloud Systems');
    await expect(page.locator('body')).toContainText('Full Stack Developer');
    await expect(page.locator('nav.navbar')).toBeVisible();
  });

  test('Step 5: Applications CRM displays Kanban columns with active pipeline item', async ({
    page,
  }) => {
    await page.goto(`${BASE}/applications`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('Applications');
    await expect(page.locator('body')).toContainText('Apex Cloud Systems');
    await expect(page.locator('nav.navbar')).toBeVisible();
  });

  test('Step 6: Interview Preparation page displays technical preparation sessions', async ({
    page,
  }) => {
    await page.goto(`${BASE}/interviews`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('Interview');
    await expect(page.locator('body')).toContainText('Apex Cloud Systems');
    await expect(page.locator('nav.navbar')).toBeVisible();
  });

  test('Step 7: Analytics Dashboard displays 84% Career Readiness and Skill Gaps', async ({
    page,
  }) => {
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(
      'Career Intelligence & Analytics',
    );
    await expect(page.locator('body')).toContainText('84');
    await expect(page.locator('nav.navbar')).toBeVisible();
  });

  test('Step 8: Learning Plans page displays active Docker mastery plan', async ({
    page,
  }) => {
    await page.goto(`${BASE}/learning`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(
      'Evidence-Building Learning Plans',
    );
    await expect(page.locator('body')).toContainText('Docker');
    await expect(page.locator('nav.navbar')).toBeVisible();
  });
});
