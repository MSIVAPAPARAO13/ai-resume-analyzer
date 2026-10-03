import { test, expect } from '@playwright/test';
import path from 'path';

const BASE = 'http://localhost:5173';
const TEST_EMAIL = `phase5-e2e-${Date.now()}@resumind-test.dev`;
const TEST_PASS = 'TestPassword123!';
const TEST_NAME = 'Elena Rostova';

const SAMPLE_TECH_JD = `About the Role:
We are seeking a Senior Backend Engineer to build scalable distributed systems and high-throughput REST APIs.

Responsibilities:
- Architect and develop scalable RESTful APIs using Node.js, TypeScript, and PostgreSQL.
- Implement real-time data pipelines and caching layers using Redis.
- Collaborate with frontend engineers to integrate web applications.
- Design database schemas and optimize complex SQL queries.
- Build CI/CD pipelines and containerize services using Docker and AWS.

Requirements:
- 3+ years of professional backend software development experience.
- Strong proficiency in TypeScript, Node.js, and PostgreSQL.
- Practical experience with REST APIs and automated testing.
- Bachelor's degree in Computer Science or equivalent practical experience.`;

test.describe('Phase 5: AI Resume Tailoring & Adzuna Discovery E2E Flow', () => {
  test('Complete flow: Register, Upload Resume, Add Job, AI Tailoring with Evidence Guard, Accept/Reject, Version Creation, and Adzuna Job Search', async ({
    page,
  }) => {
    // 1. Mock Adzuna backend route to ensure deterministic, offline-resilient execution
    await page.route('**/api/v1/job-search*', async (route) => {
      const request = route.request();
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              results: [
                {
                  id: 'adzuna-101010',
                  title: 'Lead Cloud Software Engineer',
                  company: 'Apex Cloud Solutions',
                  location: 'Bangalore, India',
                  description:
                    'Design and deploy modern distributed microservices using Node.js and TypeScript.',
                  salary: '₹2,000,000 - ₹3,000,000',
                  source: 'ADZUNA',
                  sourceUrl: 'https://adzuna.in/land/ad/101010',
                  postedAt: new Date().toISOString(),
                },
              ],
              total: 1,
              page: 1,
              resultsPerPage: 10,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // 2. Register new user
    await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h4')).toContainText('Create your account');

    await page.fill('#name', TEST_NAME);
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', TEST_PASS);
    await page.fill('#confirmPassword', TEST_PASS);
    await page.click('#register-submit');

    await page.waitForURL(`${BASE}/dashboard`, { timeout: 15000 });
    await expect(page).toHaveURL(`${BASE}/dashboard`);

    // 3. Upload resume fixture
    await page.click('#goto-resumes');
    await page.waitForURL(`${BASE}/resumes`, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Resume Intelligence');

    const fixturePath = path.resolve(
      process.cwd(),
      'tests/fixtures/sample_resume.pdf',
    );
    await page.setInputFiles('#resume-file-input', fixturePath);

    // Wait for resume to appear in list
    await expect(
      page.locator('.card:has-text("sample_resume.pdf")'),
    ).toBeVisible({
      timeout: 15000,
    });

    // Get resume ID from URL or link
    await page
      .locator('.card:has-text("sample_resume.pdf") a:has-text("View Details")')
      .first()
      .click();
    await page.waitForURL(/\/resumes\/[a-f0-9-]+/, { timeout: 10000 });
    const resumeUrl = page.url();
    const resumeIdMatch = resumeUrl.match(/\/resumes\/([a-f0-9-]+)/);
    const resumeId = resumeIdMatch ? resumeIdMatch[1] : '';
    expect(resumeId).toBeTruthy();

    // 4. Create Job
    await page.goto(`${BASE}/jobs/new`, { waitUntil: 'domcontentloaded' });
    await page.fill('#job-title', 'Senior Backend Engineer');
    await page.fill('#job-company', 'Stargate Cloud');
    await page.fill('#job-location', 'Remote');
    await page.fill('#job-description', SAMPLE_TECH_JD);
    await page.click('#submit-job');

    await page.waitForURL(/\/jobs\/[a-f0-9-]+/, { timeout: 15000 });
    const jobUrl = page.url();
    const jobIdMatch = jobUrl.match(/\/jobs\/([a-f0-9-]+)/);
    const jobId = jobIdMatch ? jobIdMatch[1] : '';
    expect(jobId).toBeTruthy();

    // Extract Job DNA
    const extractBtn = page.locator('#extract-dna-btn');
    if (await extractBtn.isVisible()) {
      await extractBtn.click();
      await page.waitForTimeout(1500);
    }

    // 5. Navigate to AI Tailoring Studio
    await page.goto(`${BASE}/resumes/${resumeId}/tailor/${jobId}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('text=Resumind AI Tailoring Studio')).toBeVisible(
      { timeout: 15000 },
    );

    // Verify Evidence Guard audit section is visible
    await expect(page.locator('text=Evidence Guard Audit')).toBeVisible();
    await expect(page.locator('text=Verified Evidence').first()).toBeVisible();

    // 6. Accept one suggestion and reject another
    const acceptBtns = page.locator('button:has-text("Accept Proposal")');
    await expect(acceptBtns.first()).toBeVisible({ timeout: 10000 });
    await acceptBtns.first().click();
    await expect(page.locator('text=ACCEPTED').first()).toBeVisible({
      timeout: 5000,
    });

    const rejectBtns = page.locator('button:has-text("Reject")');
    if ((await rejectBtns.count()) > 1) {
      await rejectBtns.nth(1).click();
      await expect(page.locator('text=REJECTED').first()).toBeVisible({
        timeout: 5000,
      });
    }

    // 7. Complete Tailoring Session -> Create New Resume Version
    const applyBtn = page.locator('button:has-text("Apply")');
    await applyBtn.click();

    await expect(
      page.locator('text=New Tailored Resume Version Created!'),
    ).toBeVisible({ timeout: 15000 });

    // 8. Refresh & Verify Persistence
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Tailoring Completed')).toBeVisible({
      timeout: 10000,
    });

    // 9. Adzuna Job Discovery Flow
    await page.goto(`${BASE}/jobs/search`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h2')).toContainText('Discover Real-Time Jobs');

    await page.fill(
      'input[placeholder*="Software Engineer"]',
      'Cloud Software Engineer',
    );
    await page.click('button:has-text("Search Jobs")');

    await expect(page.locator('text=Lead Cloud Software Engineer')).toBeVisible(
      { timeout: 10000 },
    );
    await expect(page.locator('text=ADZUNA')).toBeVisible();

    // Click Import
    const importBtn = page.locator('button:has-text("Import to Resumind")');
    await importBtn.click();

    await expect(page.locator('text=Imported! View Job')).toBeVisible({
      timeout: 10000,
    });
  });
});
