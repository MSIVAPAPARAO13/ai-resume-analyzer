import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';
const TEST_EMAIL = `phase6-e2e-${Date.now()}@resumind-test.dev`;
const TEST_PASS = 'TestPassword123!';
const TEST_NAME = 'David Vance';

test.describe('Phase 6: Application CRM & GitHub Career Evidence E2E Flow', () => {
  test('Complete flow: Register, Create Application, Update Status & Timeline, Connect GitHub (Mock), View Repos, and Import to Career Twin', async ({
    page,
  }) => {
    test.setTimeout(60000);
    // ─── Step 1: Mock Backend for Deterministic E2E Flow ─────────────────────
    let applicationState: any = {
      id: 'app-e2e-123',
      company: 'Stripe',
      role: 'Senior Backend Engineer',
      status: 'APPLIED',
      jobUrl: 'https://stripe.com/jobs/senior-backend',
      appliedAt: '2026-10-01T00:00:00.000Z',
      followUpAt: '2026-10-15T00:00:00.000Z',
      recruiterName: 'Alex Smith',
      recruiterEmail: 'alex.smith@stripe.com',
      notes: 'Referral from engineering lead. Initial application submitted.',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
      events: [
        {
          id: 'ev-1',
          type: 'CREATED',
          description:
            'Application created for Senior Backend Engineer at Stripe',
          eventDate: '2026-10-01T00:00:00.000Z',
        },
        {
          id: 'ev-2',
          type: 'APPLIED',
          description: 'Initial status set to APPLIED',
          eventDate: '2026-10-01T00:00:00.000Z',
        },
      ],
      job: null,
      resumeVersion: null,
      tailoringSession: null,
    };

    let githubConnected = false;
    const mockRepos = [
      {
        id: 'repo-101',
        githubRepositoryId: '101',
        name: 'tradeflow',
        fullName: 'octocat-engineer/tradeflow',
        description: 'High throughput matching engine with Redis & TypeScript.',
        htmlUrl: 'https://github.com/octocat-engineer/tradeflow',
        defaultBranch: 'main',
        language: 'TypeScript',
        stars: 142,
        forks: 24,
        isPrivate: false,
        topics: ['fintech', 'typescript', 'redis'],
        lastPushedAt: '2026-09-20T10:00:00.000Z',
        createdAt: '2026-09-01T00:00:00.000Z',
      },
      {
        id: 'repo-102',
        githubRepositoryId: '102',
        name: 'cloud-metrics-agent',
        fullName: 'octocat-engineer/cloud-metrics-agent',
        description: 'Telemetry collector using Go, Docker, and Prometheus.',
        htmlUrl: 'https://github.com/octocat-engineer/cloud-metrics-agent',
        defaultBranch: 'main',
        language: 'Go',
        stars: 89,
        forks: 11,
        isPrivate: false,
        topics: ['go', 'docker', 'prometheus'],
        lastPushedAt: '2026-08-15T14:30:00.000Z',
        createdAt: '2026-08-01T00:00:00.000Z',
      },
    ];

    let careerTwinProjects: any[] = [];

    // Intercept API routes
    await page.route('**/api/v1/auth/**', async (route) => {
      const request = route.request();
      if (
        request.url().includes('/register') ||
        request.url().includes('/login')
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                id: 'usr-e2e-1',
                email: TEST_EMAIL,
                name: TEST_NAME,
                role: 'USER',
              },
              tokens: {
                accessToken: 'mock_access_token',
                refreshToken: 'mock_refresh_token',
              },
            },
          }),
        });
      } else if (request.url().includes('/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'usr-e2e-1',
              email: TEST_EMAIL,
              name: TEST_NAME,
              role: 'USER',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/v1/applications**', async (route) => {
      const request = route.request();
      const url = request.url();

      if (url.endsWith('/analytics')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              totalApplications: 1,
              statusCounts: {
                SAVED: 0,
                APPLIED: applicationState.status === 'APPLIED' ? 1 : 0,
                ASSESSMENT: 0,
                INTERVIEW: applicationState.status === 'INTERVIEW' ? 1 : 0,
                OFFER: 0,
                REJECTED: 0,
                WITHDRAWN: 0,
              },
              applicationToInterviewRate:
                applicationState.status === 'INTERVIEW' ? 100 : 0,
              offerRate: 0,
              averageMatchScore: 88,
              resumeVersionUsage: [
                {
                  title: 'Backend Engineering Resume',
                  versionNumber: 1,
                  count: 1,
                },
              ],
            },
          }),
        });
      } else if (url.includes('/events') && request.method() === 'POST') {
        const body = request.postDataJSON();
        const newEv = {
          id: `ev-${Date.now()}`,
          type: body.type,
          description: body.description,
          eventDate: body.eventDate || new Date().toISOString(),
        };
        applicationState.events.unshift(newEv);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: newEv }),
        });
      } else if (url.includes('/status') && request.method() === 'PATCH') {
        const body = request.postDataJSON();
        applicationState.status = body.status;
        applicationState.events.unshift({
          id: `ev-${Date.now()}`,
          type: body.status,
          description: `Status updated to ${body.status}: ${body.notes || ''}`,
          eventDate: new Date().toISOString(),
        });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: applicationState }),
        });
      } else if (url.endsWith('/applications') && request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [applicationState] }),
        });
      } else if (url.endsWith('/applications') && request.method() === 'POST') {
        const body = request.postDataJSON();
        applicationState = {
          ...applicationState,
          ...body,
          id: 'app-e2e-123',
        };
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: applicationState }),
        });
      } else if (
        url.includes('/applications/app-e2e-123') &&
        request.method() === 'GET'
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: applicationState }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/v1/github/**', async (route) => {
      const request = route.request();
      const url = request.url();

      if (url.includes('/connect')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              url: `${BASE}/integrations?connected=true&username=octocat-engineer`,
              state: 'mock-state',
            },
          }),
        });
      } else if (url.includes('/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              connected: githubConnected,
              username: githubConnected ? 'octocat-engineer' : undefined,
              avatarUrl: githubConnected
                ? 'https://avatars.githubusercontent.com/u/583231?v=4'
                : undefined,
              repositoryCount: githubConnected ? mockRepos.length : 0,
            },
          }),
        });
      } else if (url.includes('/disconnect')) {
        githubConnected = false;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { message: 'Disconnected' },
          }),
        });
      } else if (
        url.includes('/repositories/tradeflow/languages') ||
        url.includes('/languages')
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { TypeScript: 85000, JavaScript: 15000 },
          }),
        });
      } else if (
        url.includes('/repositories/tradeflow/readme') ||
        url.includes('/readme')
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              readme:
                '# TradeFlow Matching Engine\nAlgorithmic trading engine with Redis and TypeScript.',
              detectedTechnologies: ['TypeScript', 'Redis', 'Node.js'],
            },
          }),
        });
      } else if (url.includes('/import') && request.method() === 'POST') {
        const body = request.postDataJSON();
        const newProj = {
          id: 'proj-github-1',
          name: body.name || 'TradeFlow Matching Engine',
          description: body.description,
          technologies: body.technologies || ['TypeScript', 'Redis'],
          repoUrl: body.repoUrl,
        };
        careerTwinProjects.push(newProj);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { project: newProj, status: 'VERIFIED_USER_DATA' },
          }),
        });
      } else if (
        url.includes('/repositories/tradeflow') ||
        url.includes('/repositories/repo-101')
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockRepos[0] }),
        });
      } else if (url.includes('/repositories')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockRepos }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/v1/career**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            experiences: [],
            education: [],
            skills: [],
            projects: careerTwinProjects,
            certifications: [],
            achievements: [],
          },
        }),
      });
    });

    // ─── Step 1b: Mock Auth Routes ──────────────────────────────────────────
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
                id: 'usr-1',
                email: TEST_EMAIL,
                name: TEST_NAME,
                role: 'USER',
              },
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
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
                id: 'usr-1',
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

    // ─── Step 2: Register & Login ─────────────────────────────────────────────
    await page.goto(`${BASE}/register`);
    await page.fill('#name', TEST_NAME);
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', TEST_PASS);
    await page.fill('#confirmPassword', TEST_PASS);
    await page.click('#register-submit');

    // Wait for redirect to dashboard
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 10000 });
    await expect(page).toHaveURL(`${BASE}/dashboard`);
    await expect(page.locator('text=Welcome back')).toBeVisible();

    // ─── Step 3: Application CRM Flow ─────────────────────────────────────────
    // Navigate to Applications CRM
    await page.click('#goto-applications');
    await expect(page).toHaveURL(`${BASE}/applications`);
    await expect(
      page.locator('h1:has-text("Job Application CRM")'),
    ).toBeVisible();

    // Open New Application Form
    await page.click('#create-application-btn');
    await expect(page).toHaveURL(`${BASE}/applications/new`);

    // Enter Application details
    await page.fill('#app-company-input', 'Stripe');
    await page.fill('#app-role-input', 'Senior Backend Engineer');
    await page.fill(
      '#app-joburl-input',
      'https://stripe.com/jobs/senior-backend',
    );
    await page.selectOption('#app-status-select', 'APPLIED');
    await page.fill('#app-followup-input', '2026-10-15');
    await page.fill('#app-recruiter-name', 'Alex Smith');
    await page.fill('#app-recruiter-email', 'alex.smith@stripe.com');
    await page.fill('#app-notes-input', 'Referral from engineering lead.');

    // Submit Application
    await page.click('#save-application-btn');

    // Verify detail page
    await expect(page).toHaveURL(`${BASE}/applications/app-e2e-123`);
    await expect(
      page.locator('h4:has-text("Senior Backend Engineer")').first(),
    ).toBeVisible();
    await expect(
      page.locator('strong:has-text("Stripe")').first(),
    ).toBeVisible();
    await expect(
      page.locator('text=Follow up: October 15, 2026').first(),
    ).toBeVisible();
    await expect(page.locator('text=Alex Smith').first()).toBeVisible();

    // Change status to Interview
    await page.selectOption('#status-changer-select', 'INTERVIEW');

    // Add Timeline Event
    await page.click('#add-event-toggle-btn');
    await page.selectOption('#new-event-type', 'INTERVIEW');
    await page.fill(
      '#new-event-desc',
      'Completed technical interview with Staff Engineer',
    );
    await page.click('#save-event-btn');

    // Verify timeline updated
    await expect(
      page
        .locator('text=Completed technical interview with Staff Engineer')
        .first(),
    ).toBeVisible();

    // Reload page to verify persistence
    await page.reload();
    await expect(
      page.locator('h4:has-text("Senior Backend Engineer")').first(),
    ).toBeVisible();
    await expect(
      page
        .locator('text=Completed technical interview with Staff Engineer')
        .first(),
    ).toBeVisible();

    // ─── Step 4: GitHub Career Evidence Flow ──────────────────────────────────
    // Navigate to Integrations
    await page.goto(`${BASE}/integrations`);
    await expect(
      page.locator('h1:has-text("External Integrations")').first(),
    ).toBeVisible();

    // Connect GitHub
    githubConnected = true;
    await page.click('#connect-github-btn');

    // Verify Connected Status Card
    await expect(page.locator('text=Connected').first()).toBeVisible();
    await expect(page.locator('#view-repos-btn')).toBeVisible();

    // View Repositories
    await page.click('#view-repos-btn');
    await expect(page).toHaveURL(`${BASE}/github/repositories`);
    await expect(page.locator('text=tradeflow').first()).toBeVisible();
    await expect(
      page.locator('text=cloud-metrics-agent').first(),
    ).toBeVisible();

    // Inspect repository details
    await page.click('#view-repo-tradeflow');
    await expect(page).toHaveURL(`${BASE}/github/repositories/repo-101`);
    await expect(
      page.locator('h3:has-text("tradeflow")').first(),
    ).toBeVisible();
    await expect(page.locator('text=TypeScript').first()).toBeVisible();
    await expect(
      page.locator('text=TradeFlow Matching Engine').first(),
    ).toBeVisible();

    // Import Project to Career Twin
    await page.click('#detail-import-btn');
    await page.fill('#detail-modal-name', 'TradeFlow Matching Engine');
    await page.click('#detail-confirm-import-btn');

    // Wait for redirect to Career Twin after timeout
    await page.waitForURL(`${BASE}/career`, { timeout: 15000 });
    await expect(page).toHaveURL(`${BASE}/career`);
    await expect(page.locator('text=Career Twin').first()).toBeVisible();
  });
});
