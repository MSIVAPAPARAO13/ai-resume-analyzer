import { test, expect } from '@playwright/test';
import path from 'path';

// Phase 4 Job Intelligence & Resume-Job Matching E2E Flow
// Requires both API (port 4000) and Web (port 5173) running
// Run with: npx playwright test tests/e2e/job-intelligence.spec.ts

const BASE = 'http://localhost:5173';
const TEST_EMAIL = `job-e2e-${Date.now()}@resumind-test.dev`;
const TEST_PASS = 'TestPassword123!';
const TEST_NAME = 'Jordan Lee';

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
- Bachelor's degree in Computer Science or equivalent practical experience.

Preferred Qualifications:
- Experience with Docker, Redis, and AWS cloud services.
- Familiarity with Kubernetes and microservice architectures.`;

test.describe('Phase 4: Job Intelligence & Resume-Job Matching Critical User Journey', () => {
  test('Complete flow: Register, Upload Resume, Add Job Description, Extract Job DNA, Match Resume, Verify Score & Recommendations, Refresh Persistence', async ({
    page,
  }) => {
    // 1. Register new user account
    await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h4')).toContainText('Create your account');

    await page.fill('#name', TEST_NAME);
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', TEST_PASS);
    await page.fill('#confirmPassword', TEST_PASS);
    await page.click('#register-submit');

    // Land on dashboard
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 15000 });
    await expect(page).toHaveURL(`${BASE}/dashboard`);

    // 2. Upload a test resume first so we can match against it
    await page.click('#goto-resumes');
    await page.waitForURL(`${BASE}/resumes`, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Resume Intelligence');

    const fixturePath = path.resolve(
      process.cwd(),
      'tests/fixtures/sample_resume.pdf',
    );
    await page.setInputFiles('#resume-file-input', fixturePath);
    await page.fill('#resume-title-input', 'Jordan Lee Backend Resume');
    await page.click('#resume-upload-submit');
    await page.waitForURL(/\/resumes\/[a-zA-Z0-9-]+$/, { timeout: 20000 });

    // 3. Open Jobs & Matching page
    await page.goto(`${BASE}/jobs`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText(
      'Job Intelligence & Matching',
    );

    // 4. Add a sample Job Description
    await page.click('#add-job-btn');
    await page.waitForURL(`${BASE}/jobs/new`, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Add Target Job');

    // Fill job form
    await page.fill('#job-title-input', 'Senior Backend Engineer');
    await page.fill('#job-company-input', 'CloudScale Systems');
    await page.fill('#job-location-input', 'San Francisco, CA / Remote');
    await page.fill('#job-description-input', SAMPLE_TECH_JD);
    await page.click('#save-job-submit');

    // 5. Land on Job Details page and verify Job DNA
    await page.waitForURL(/\/jobs\/[a-zA-Z0-9-]+$/, { timeout: 20000 });
    await expect(page.locator('h3')).toContainText('Senior Backend Engineer');
    await expect(page.locator('text=CloudScale Systems')).toBeVisible();

    // 6. Inspect Job DNA view
    await page.click('#goto-job-dna');
    await page.waitForURL(/\/jobs\/[a-zA-Z0-9-]+\/analysis$/, {
      timeout: 15000,
    });
    await expect(page.locator('#job-dna-role-heading')).toContainText(
      'Senior Backend Engineer',
    );
    await expect(page.locator('text=Required Skills')).toBeVisible();
    await expect(page.locator('text=TypeScript')).toBeVisible();
    await expect(page.locator('text=Preferred Skills')).toBeVisible();
    await expect(page.locator('text=Experience Expectations')).toBeVisible();

    // 7. Return to Job and run Matching against the uploaded resume
    await page.click('#match-resume-nav-btn');
    await page.waitForURL(/\/jobs\/[a-zA-Z0-9-]+$/, { timeout: 15000 });

    // Select resume and run match
    await page.click('#run-match-btn');
    await page.waitForURL(/\/jobs\/[a-zA-Z0-9-]+\/match\/[a-zA-Z0-9-]+$/, {
      timeout: 20000,
    });

    // 8. Verify Overall Match Score & Breakdown
    await expect(page.locator('#overall-match-score')).toBeVisible({
      timeout: 15000,
    });
    const matchScoreText = await page
      .locator('#overall-match-score')
      .textContent();
    const matchScoreNum = parseInt(matchScoreText || '0', 10);
    expect(matchScoreNum).toBeGreaterThanOrEqual(0);
    expect(matchScoreNum).toBeLessThanOrEqual(100);

    // Verify breakdown categories
    await expect(page.locator('text=Skills Match')).toBeVisible();
    await expect(page.locator('text=Experience')).toBeVisible();
    await expect(page.locator('text=Responsibilities')).toBeVisible();

    // Verify Strong Matches and Recommendations sections
    await expect(page.locator('#strong-matches-section')).toBeVisible();
    await expect(page.locator('#recommendations-section')).toBeVisible();

    // 9. Refresh page and verify persisted data
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#overall-match-score')).toBeVisible({
      timeout: 15000,
    });
    const persistedScoreText = await page
      .locator('#overall-match-score')
      .textContent();
    expect(persistedScoreText).toBe(matchScoreText);

    // 10. Navigate back to Jobs list
    await page.click('a:has-text("← Jobs")');
    await page.waitForURL(`${BASE}/jobs`, { timeout: 10000 });
    await expect(
      page.locator('h6:has-text("Senior Backend Engineer")'),
    ).toBeVisible();
  });
});
