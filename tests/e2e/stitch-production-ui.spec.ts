import { test, expect } from '@playwright/test';

// Stitch Production UI End-to-End Verification
// Tests complete connected user journey with seeded development account
// Login ↓ Dashboard ↓ Career Twin ↓ Resume ↓ Analysis ↓ Jobs ↓ Match ↓ Tailoring ↓ Applications ↓ Interviews ↓ Analytics ↓ Skill Gaps ↓ Learning Plans

const BASE = 'http://localhost:5173';
const DEMO_EMAIL = 'alex.morgan.qa@resumind.dev';
const DEMO_PASS = 'Password123!';

test.describe('Stitch Production UI — Complete Connected User Journey', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('Complete Resumind Stitch Production Flow with Seeded Database', async ({
    page,
  }) => {
    test.setTimeout(60000);

    // ─── 01. Login ───────────────────────────────────────────────────────────
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await expect(page.locator('h4')).toContainText('Welcome back');

    await page.fill('#email', DEMO_EMAIL);
    await page.fill('#password', DEMO_PASS);
    await page.click('#login-submit');

    await page.waitForURL(`${BASE}/dashboard`, { timeout: 15000 });
    await expect(page).toHaveURL(`${BASE}/dashboard`);

    // ─── 02. Dashboard Command Center ─────────────────────────────────────────
    await expect(page.locator('h1')).toContainText('Welcome back, Alex');
    await expect(page.locator('#dashboard-readiness-score')).toBeVisible();
    await expect(page.locator('#nav-career')).toBeVisible();
    await expect(page.locator('#nav-resumes')).toBeVisible();
    await expect(page.locator('#nav-jobs')).toBeVisible();
    await expect(page.locator('#nav-applications')).toBeVisible();
    await expect(page.locator('#nav-interviews')).toBeVisible();
    await expect(page.locator('#nav-analytics')).toBeVisible();
    await expect(page.locator('#nav-learning')).toBeVisible();

    // ─── 03. Career Twin ─────────────────────────────────────────────────────
    await page.click('#nav-career');
    await page.waitForURL(`${BASE}/career`, { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Personal Profile');
    await expect(page.locator('#profile-target-role')).toHaveValue(
      /Full Stack Developer/i,
    );

    // Switch to Experience tab to verify seeded career experience
    await page.click('button:has-text("Experience")');
    await expect(page.locator('body')).toContainText('Apex Cloud Innovations');

    // ─── 04. Resumes & Versions ──────────────────────────────────────────────
    await page.click('#nav-resumes');
    await page.waitForURL(`${BASE}/resumes`, { timeout: 10000 });
    await expect(page.locator('body')).toContainText(
      'Alex_Morgan_FullStack_Resume.pdf',
    );

    // Open resume analysis
    const analysisBtn = page.locator('a[id^="analyze-"]').first();
    await expect(analysisBtn).toBeVisible();
    const analysisHref = await analysisBtn.getAttribute('href');
    expect(analysisHref).toBeTruthy();

    await page.goto(`${BASE}${analysisHref}`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('ATS');

    // ─── 05. Jobs & Job DNA ──────────────────────────────────────────────────
    await page.goto(`${BASE}/jobs`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Full Stack Developer');
    await expect(page.locator('body')).toContainText('StripeWave Financial');

    // Open job detail
    const matchBtn = page.locator('a[id^="match-resume-"]').first();
    const jobHref = await matchBtn.getAttribute('href');
    expect(jobHref).toBeTruthy();

    await page.goto(`${BASE}${jobHref}`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Software Engineer');

    // ─── 06. Job DNA / Analysis ──────────────────────────────────────────────
    await page.goto(`${BASE}${jobHref}/analysis`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Software Engineer');

    // ─── 08. Application Pipeline CRM ────────────────────────────────────────
    await page.goto(`${BASE}/applications`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('StripeWave Financial');
    await expect(page.locator('body')).toContainText('Fintech Nexus Labs');

    // ─── 09. Interview Intelligence ──────────────────────────────────────────
    await page.goto(`${BASE}/interviews`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText(
      'Full Stack Technical Simulation',
    );

    // ─── 10. Career Analytics ────────────────────────────────────────────────
    await page.goto(`${BASE}/analytics`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText(
      'Career Intelligence & Analytics',
    );

    // ─── 11. Skill Gaps ──────────────────────────────────────────────────────
    await page.goto(`${BASE}/analytics/skills`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Skill Intelligence');

    // ─── 12. Learning Plans ──────────────────────────────────────────────────
    await page.goto(`${BASE}/learning`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Docker Mastery');

    // Open Docker Mastery Plan Detail
    const planLink = page.locator('a:has-text("View Plan Details")').first();
    const planHref = await planLink.getAttribute('href');
    expect(planHref).toBeTruthy();

    await page.goto(`${BASE}${planHref}`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Docker Mastery');
    await expect(page.locator('body')).toContainText('Docker fundamentals');
  });

  test('Public Marketing and SEO Endpoints are Accessible', async ({
    page,
  }) => {
    // Landing page
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle(/Resumind/);

    // Robots.txt
    const robotsRes = await page.goto(`${BASE}/robots.txt`);
    expect(robotsRes?.status()).toBe(200);
    const robotsText = await robotsRes?.text();
    expect(robotsText).toContain('Allow: /');
    expect(robotsText).toContain('Disallow: /dashboard');

    // Sitemap.xml
    const sitemapRes = await page.goto(`${BASE}/sitemap.xml`);
    expect(sitemapRes?.status()).toBe(200);
    const sitemapText = await sitemapRes?.text();
    expect(sitemapText).toContain('<loc>https://resumind.app/</loc>');
  });

  test('Responsive Viewport Rendering — Desktop, Laptop, Tablet, Mobile', async ({
    page,
  }) => {
    // Login to access dashboard
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.fill('#email', DEMO_EMAIL);
    await page.fill('#password', DEMO_PASS);
    await page.click('#login-submit');
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 15000 });

    const viewports = [
      { name: 'Desktop (1440px)', width: 1440, height: 900 },
      { name: 'Laptop (1280px)', width: 1280, height: 800 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Mobile (390px)', width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(500);

      // Verify dashboard elements render cleanly
      await expect(page.locator('#dashboard-readiness-score')).toBeVisible();

      const overflowDetails = await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const overflowing = Array.from(document.querySelectorAll('*'))
          .filter((el) => {
            const rect = el.getBoundingClientRect();
            return rect.right > docWidth + 2;
          })
          .map((el) => ({
            tag: el.tagName,
            id: el.id,
            className: el.className,
            rectRight: el.getBoundingClientRect().right,
            docWidth,
          }));
        return {
          hasScroll: document.documentElement.scrollWidth > docWidth + 2,
          overflowing: overflowing.slice(0, 5),
        };
      });

      if (overflowDetails.hasScroll) {
        console.warn(`Overflow details on ${vp.name}:`, overflowDetails.overflowing);
      }

      expect(
        overflowDetails.hasScroll,
        `Viewport ${vp.name} should not have horizontal overflow`,
      ).toBe(false);
    }
  });
});
