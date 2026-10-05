import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';
const TEST_EMAIL = `crm-e2e-${Date.now()}@resumind-test.dev`;
const TEST_PASS = 'TestPassword123!';
const TEST_NAME = 'David Vance';

test.describe('Application CRM Lifecycle Playwright Tests', () => {
  test('Login, Create application, Set status, Add follow-up, Add timeline event, Change status, Verify persistence', async ({
    page,
  }) => {
    test.setTimeout(60000);
    let applicationState: any = {
      id: 'app-crm-spec-1',
      company: 'Datadog',
      role: 'Senior Cloud Engineer',
      status: 'APPLIED',
      jobUrl: 'https://datadoghq.com/careers/cloud-eng',
      appliedAt: '2026-10-01T00:00:00.000Z',
      followUpAt: '2026-10-10T00:00:00.000Z',
      recruiterName: 'Sarah Jenkins',
      recruiterEmail: 'sarah.j@datadoghq.com',
      notes: 'Applied via company careers page.',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
      events: [
        {
          id: 'ev-1',
          type: 'CREATED',
          description:
            'Application created for Senior Cloud Engineer at Datadog',
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
              applicationToInterviewRate: 100,
              offerRate: 0,
              averageMatchScore: 92,
              resumeVersionUsage: [],
            },
          }),
        });
      } else if (url.includes('/events') && request.method() === 'POST') {
        const body = request.postDataJSON();
        const ev = {
          id: `ev-${Date.now()}`,
          type: body.type,
          description: body.description,
          eventDate: body.eventDate || new Date().toISOString(),
        };
        applicationState.events.unshift(ev);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: ev }),
        });
      } else if (url.includes('/status') && request.method() === 'PATCH') {
        const body = request.postDataJSON();
        applicationState.status = body.status;
        applicationState.events.unshift({
          id: `ev-${Date.now()}`,
          type: body.status,
          description: `Status updated to ${body.status}`,
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
          id: 'app-crm-spec-1',
        };
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: applicationState }),
        });
      } else if (
        url.includes('/applications/app-crm-spec-1') &&
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

    // 1. Login / Register
    await page.goto(`${BASE}/register`);
    await page.fill('#name', TEST_NAME);
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', TEST_PASS);
    await page.fill('#confirmPassword', TEST_PASS);
    await page.click('#register-submit');

    // Wait for redirect to dashboard
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 10000 });
    await expect(page).toHaveURL(`${BASE}/dashboard`);

    // 2. Open Applications
    await page.click('#goto-applications');
    await expect(page).toHaveURL(`${BASE}/applications`);

    // 3. Create Application
    await page.click('#create-application-btn');
    await expect(page).toHaveURL(`${BASE}/applications/new`);

    await page.fill('#app-company-input', 'Datadog');
    await page.fill('#app-role-input', 'Senior Cloud Engineer');
    await page.fill('#app-followup-input', '2026-10-10');
    await page.fill('#app-recruiter-name', 'Sarah Jenkins');
    await page.click('#save-application-btn');

    // 4. Verify Detail & Follow-up
    await expect(page).toHaveURL(`${BASE}/applications/app-crm-spec-1`);
    await expect(
      page.locator('h4:has-text("Senior Cloud Engineer")').first(),
    ).toBeVisible();
    await expect(
      page.locator('strong:has-text("Datadog")').first(),
    ).toBeVisible();
    await expect(
      page.locator('text=Follow up: October 10, 2026').first(),
    ).toBeVisible();

    // 5. Change status to Interview
    await page.selectOption('#status-changer-select', 'INTERVIEW');

    // 6. Add timeline event
    await page.click('#add-event-toggle-btn');
    await page.selectOption('#new-event-type', 'INTERVIEW');
    await page.fill(
      '#new-event-desc',
      'Invited to Round 1 Architecture Interview',
    );
    await page.click('#save-event-btn');

    // 7. Verify Timeline & Persistence
    await expect(
      page.locator('text=Invited to Round 1 Architecture Interview').first(),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.locator('h4:has-text("Senior Cloud Engineer")').first(),
    ).toBeVisible();
    await expect(
      page.locator('text=Invited to Round 1 Architecture Interview').first(),
    ).toBeVisible();
  });
});
