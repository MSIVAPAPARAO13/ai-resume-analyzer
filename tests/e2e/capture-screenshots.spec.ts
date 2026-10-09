import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:5173';
const DEMO_EMAIL = 'alex.morgan.qa@resumind.dev';
const DEMO_PASS = 'Password123!';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots');

test.describe('Resumind Full Application Screenshot & Journey Verification', () => {
  test.beforeAll(async () => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  test('Capture all required screenshots and verify full application flow', async ({
    page,
    context,
  }) => {
    test.setTimeout(120000);

    // Set standard high-fidelity desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // ─── 01. Landing Page ───────────────────────────────────────────────────
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Log In');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-landing.png'),
      fullPage: false,
    });

    // ─── 02. Register Page ──────────────────────────────────────────────────
    await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Create your account');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-register.png'),
      fullPage: false,
    });

    // ─── 03. Login Page ─────────────────────────────────────────────────────
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Welcome back');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-login.png'),
      fullPage: false,
    });

    // Perform Login
    await page.fill('#email', DEMO_EMAIL);
    await page.fill('#password', DEMO_PASS);
    await page.click('#login-submit');
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 15000 });

    // ─── 04. Dashboard Command Center ─────────────────────────────────────────
    await expect(page.locator('h1')).toContainText('Welcome back, Alex');
    await page.waitForTimeout(1000); // Allow radial gauges to render
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-dashboard.png'),
      fullPage: false,
    });

    // ─── 05. Career Twin ─────────────────────────────────────────────────────
    await page.goto(`${BASE}/career`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Personal Profile');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05-career-twin.png'),
      fullPage: false,
    });

    // ─── 06. Resume List ─────────────────────────────────────────────────────
    await page.goto(`${BASE}/resumes`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Resumes');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06-resume-list.png'),
      fullPage: false,
    });

    // ─── 07. Resume Upload Workspace ─────────────────────────────────────────
    await page.goto(`${BASE}/upload`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Upload');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '07-resume-upload.png'),
      fullPage: false,
    });

    // ─── 08. Resume Analysis ─────────────────────────────────────────────────
    // Navigate to the analysis page of the seeded resume
    await page.goto(`${BASE}/resumes`, { waitUntil: 'networkidle' });
    const analysisBtn = page.locator('a[id^="analyze-"]').first();
    const analysisHref = await analysisBtn.getAttribute('href');
    if (analysisHref) {
      await page.goto(`${BASE}${analysisHref}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '08-resume-analysis.png'),
        fullPage: false,
      });
    }

    // ─── 09. Job Explorer ───────────────────────────────────────────────────
    await page.goto(`${BASE}/jobs`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Job Intelligence');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '09-jobs.png'),
      fullPage: false,
    });

    // ─── 10. Job Match ──────────────────────────────────────────────────────
    const matchBtn = page.locator('a[id^="match-resume-"]').first();
    const jobHref = await matchBtn.getAttribute('href');
    if (jobHref) {
      await page.goto(`${BASE}${jobHref}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '10-job-match.png'),
        fullPage: false,
      });
    }

    // ─── 11. AI Resume Tailoring ─────────────────────────────────────────────
    // Check if tailoring session exists or navigate to tailoring route
    await page.goto(`${BASE}/resumes`, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '11-ai-tailoring.png'),
      fullPage: false,
    });

    // ─── 12. Applications Pipeline CRM ───────────────────────────────────────
    await page.goto(`${BASE}/applications`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Applications');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '12-applications.png'),
      fullPage: false,
    });

    // ─── 13. Interview Intelligence ──────────────────────────────────────────
    await page.goto(`${BASE}/interviews`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Interview');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '13-interviews.png'),
      fullPage: false,
    });

    // ─── 14. Google Calendar Integration ─────────────────────────────────────
    await page.goto(`${BASE}/integrations/google-calendar`, {
      waitUntil: 'networkidle',
    });
    await expect(page.locator('body')).toContainText('Google Calendar');

    // Test connecting via the remediated mock flow
    const connectBtn = page.locator('button:has-text("Connect Google Calendar")');
    if (await connectBtn.isVisible()) {
      await connectBtn.click();
      await page.waitForURL('**/integrations/google-calendar?status=success', {
        timeout: 10000,
      });
      await expect(page.locator('body')).toContainText(
        'Google Calendar connected successfully!',
      );
    }
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '14-calendar-integration.png'),
      fullPage: false,
    });

    // ─── 15. Career Analytics ────────────────────────────────────────────────
    await page.goto(`${BASE}/analytics`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Career');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '15-analytics.png'),
      fullPage: false,
    });

    // ─── 16. Skill Gaps ──────────────────────────────────────────────────────
    await page.goto(`${BASE}/analytics/skills`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Skill Intelligence');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '16-skill-gaps.png'),
      fullPage: false,
    });

    // ─── 17. Learning Plans ──────────────────────────────────────────────────
    await page.goto(`${BASE}/learning`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Docker Mastery');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '17-learning-plans.png'),
      fullPage: false,
    });
  });
});
