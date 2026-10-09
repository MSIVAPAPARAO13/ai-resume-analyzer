import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';
const TEST_EMAIL = `phase7-e2e-${Date.now()}@resumind-test.dev`;
const TEST_PASS = 'TestPassword123!';
const TEST_NAME = 'Sarah Connor';

test.describe('Phase 7: Interview Intelligence & Preparation E2E Flow', () => {
  test('Complete flow: Create Interview Session, Generate Questions, Answer Question, AI Evaluate, Mock Interview, and Final Report', async ({
    page,
  }) => {
    test.setTimeout(60000);

    let interviewSession: any = {
      id: 'sess-e2e-777',
      title: 'Senior Engineer Prep — Stripe',
      mode: 'PREPARATION',
      difficulty: 'MEDIUM',
      status: 'IN_PROGRESS',
      overallScore: 85,
      startedAt: new Date().toISOString(),
      completedAt: null,
      application: {
        id: 'app-e2e-123',
        company: 'Stripe',
        role: 'Senior Backend Engineer',
        status: 'INTERVIEW',
      },
      job: null,
      resumeVersion: null,
      tailoringSession: null,
      questions: [
        {
          id: 'q-101',
          category: 'TECHNICAL',
          difficulty: 'MEDIUM',
          question:
            'How do you manage distributed concurrency and idempotency in payment processing architectures?',
          whyAsked:
            'Core requirement for Stripe backend engineering to ensure zero duplicate financial operations.',
          expectedSignals: [
            'Idempotency keys',
            'Distributed locking (Redis/Redlock)',
            'ACID transactions',
          ],
          evidenceReferences: [
            {
              source: 'CAREER_TWIN',
              type: 'PROJECT',
              label: 'TradeFlow Architecture',
            },
          ],
          preparationTips: [
            'Mention how you handle network timeouts and retries.',
          ],
          orderIndex: 0,
          answers: [],
        },
      ],
    };

    let calendarConnected = false;

    // Mock API routes for clean offline Playwright runs
    await page.route('**/api/v1/auth/**', async (route) => {
      const req = route.request();
      if (req.url().includes('/register') || req.url().includes('/login')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                id: 'user-777',
                email: TEST_EMAIL,
                name: TEST_NAME,
                role: 'USER',
              },
              accessToken: 'mock-jwt-token-phase7',
              refreshToken: 'mock-refresh-token-phase7',
            },
          }),
        });
      } else if (req.url().includes('/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                id: 'user-777',
                email: TEST_EMAIL,
                name: TEST_NAME,
                role: 'USER',
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/v1/interviews', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        interviewSession.title = body.title || interviewSession.title;
        interviewSession.mode = body.mode || interviewSession.mode;
        interviewSession.difficulty =
          body.difficulty || interviewSession.difficulty;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: interviewSession,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [interviewSession],
          }),
        });
      }
    });

    await page.route('**/api/v1/interviews/sess-e2e-777', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: interviewSession,
        }),
      });
    });

    await page.route(
      '**/api/v1/interviews/sess-e2e-777/generate-questions',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sessionId: 'sess-e2e-777',
              count: interviewSession.questions.length,
              questions: interviewSession.questions,
            },
          }),
        });
      },
    );

    await page.route(
      '**/api/v1/interviews/sess-e2e-777/questions',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: interviewSession.questions,
          }),
        });
      },
    );

    await page.route(
      '**/api/v1/interviews/sess-e2e-777/questions/q-101/answer',
      async (route) => {
        const body = route.request().postDataJSON();
        const ans = {
          id: 'ans-101',
          questionId: 'q-101',
          answerText: body.answerText,
          submittedAt: new Date().toISOString(),
          score: null,
        };
        interviewSession.questions[0].answers = [ans];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: ans }),
        });
      },
    );

    await page.route(
      '**/api/v1/interviews/sess-e2e-777/questions/q-101/evaluate',
      async (route) => {
        const evalFeedback = {
          score: 88,
          strengths: [
            'Directly articulates idempotency key caching and atomic database write operations.',
          ],
          weaknesses: [],
          missingPoints: [
            'Could briefly mention deadlock prevention in high-contention accounts.',
          ],
          improvementSuggestions: [
            'Highlight how you simulate network partitions in test suites.',
          ],
          evidenceAlignment:
            'Matches candidate experience in high-concurrency systems.',
        };
        interviewSession.questions[0].answers[0].score = 88;
        interviewSession.questions[0].answers[0].strengths =
          evalFeedback.strengths;
        interviewSession.questions[0].answers[0].improvementSuggestions =
          evalFeedback.improvementSuggestions;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { evaluation: evalFeedback },
          }),
        });
      },
    );

    await page.route(
      '**/api/v1/interviews/sess-e2e-777/complete',
      async (route) => {
        interviewSession.status = 'COMPLETED';
        interviewSession.completedAt = new Date().toISOString();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: interviewSession }),
        });
      },
    );

    await page.route(
      '**/api/v1/interviews/sess-e2e-777/report',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              session: interviewSession,
              report: {
                overallPreparationScore: 88,
                technicalReadiness: 90,
                behavioralReadiness: 85,
                resumeReadiness: 92,
                jobSpecificReadiness: 88,
                projectReadiness: 86,
                strongestAreas: [
                  'Distributed systems architecture',
                  'Concurrency control',
                ],
                weakestAreas: ['Quantifying edge-case telemetry metrics'],
                evidenceGaps: [
                  'Verify latency benchmarking numbers with production metrics',
                ],
                recommendedTopics: [
                  'High-throughput database connection pooling',
                ],
                questionsToRevisit: [],
                summaryFeedback:
                  'Outstanding readiness for Stripe Senior Backend Engineer. Grounded in TradeFlow architecture.',
              },
            },
          }),
        });
      },
    );

    await page.route('**/api/v1/calendar/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            connected: calendarConnected,
            connection: calendarConnected
              ? { provider: 'GOOGLE', scope: 'calendar.events' }
              : null,
          },
        }),
      });
    });

    await page.route(
      '**/api/v1/interviews/sess-e2e-777/calendar-event',
      async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              message: 'Calendar event added successfully',
              event: { id: 'evt-101', summary: 'Interview Prep' },
            },
          }),
        });
      },
    );

    await page.route('**/api/v1/applications**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'app-e2e-123',
              company: 'Stripe',
              role: 'Senior Backend Engineer',
              status: 'INTERVIEW',
            },
          ],
        }),
      });
    });

    // ─── Step 0: Register & Authenticate ─────────────────────────────────────
    await page.goto(`${BASE}/register`);
    await page.fill('#name', TEST_NAME);
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', TEST_PASS);
    await page.fill('#confirmPassword', TEST_PASS);
    await page.click('#register-submit');
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 10000 });

    // ─── Step 1: Visit Interviews Dashboard ───────────────────────────────────
    await page.goto(`${BASE}/interviews`);
    await expect(
      page.locator('text=Interview Preparation Sessions'),
    ).toBeVisible();
    await expect(page.locator('#new-interview-btn')).toBeVisible();

    // ─── Step 2: Navigate to New Interview Page ───────────────────────────────
    await page.click('#new-interview-btn');
    await expect(page).toHaveURL(`${BASE}/interviews/new`);
    await expect(
      page.locator('h4:has-text("New Preparation Session")'),
    ).toBeVisible();

    // Fill form
    await page.locator('#interview-title-input').waitFor({ state: 'visible' });
    await page.fill('#interview-title-input', 'Senior Engineer Prep — Stripe');
    await page.click('#submit-interview-create-btn');

    // ─── Step 3: Practice Questions Flow ──────────────────────────────────────
    await page.waitForURL(`**/interviews/sess-e2e-777/questions*`);
    await expect(
      page.locator('h4:has-text("distributed concurrency")'),
    ).toBeVisible();
    await expect(page.locator('text=EVIDENCE GUARD GROUNDING')).toBeVisible();

    // Type Answer
    await page.fill(
      '#answer-textarea',
      'I use Redis distributed locks with exponential backoff and idempotency keys to guarantee at-most-once financial execution.',
    );

    // Save Draft
    await page.click('#save-draft-btn');
    await expect(page.locator('#save-draft-btn')).toBeEnabled();

    // Submit & Evaluate
    await page.click('#submit-evaluate-btn');
    await expect(page.locator('text=AI Answer Evaluation')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Score: 88 / 100')).toBeVisible();
    await expect(page.locator('text=STRENGTHS')).toBeVisible();

    // ─── Step 4: Final Report ────────────────────────────────────────────────
    await page.goto(`${BASE}/interviews/sess-e2e-777/report`);
    await expect(
      page.locator('text=OVERALL INTERVIEW PREPARATION SCORE'),
    ).toBeVisible();
    await expect(page.locator('h1:has-text("88")')).toBeVisible();
    await expect(page.locator('text=Technical')).toBeVisible();
    await expect(
      page.locator('text=Strongest Demonstrated Areas'),
    ).toBeVisible();

    // ─── Step 5: Google Calendar Integration View ────────────────────────────
    await page.goto(`${BASE}/integrations/google-calendar`);
    await expect(page.locator('h5:has-text("Google Calendar")')).toBeVisible();
    await expect(page.locator('#connect-google-calendar-btn')).toBeVisible();
  });
});
