import { test, expect } from '@playwright/test';
import path from 'path';

// Phase 3 Resume Intelligence E2E Flow
// Requires both API (port 4000) and Web (port 5173) running
// Run with: npx playwright test tests/e2e/resume-intelligence.spec.ts

const BASE = 'http://localhost:5173';
const TEST_EMAIL = `resume-e2e-${Date.now()}@resumind-test.dev`;
const TEST_PASS = 'TestPassword123!';
const TEST_NAME = 'Alex Mercer';

test.describe('Phase 3: Resume Intelligence Critical User Journey', () => {
  test('Complete flow: Register, Upload Resume, Parse Sections, Run Analysis, Verify Score & Comparison, Delete', async ({
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

    // 2. Open Resumes page
    await page.click('#goto-resumes');
    await page.waitForURL(`${BASE}/resumes`, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Resume Intelligence');

    // 3. Upload a valid test resume
    const fixturePath = path.resolve(
      process.cwd(),
      'tests/fixtures/sample_resume.pdf',
    );
    await page.setInputFiles('#resume-file-input', fixturePath);
    await page.fill('#resume-title-input', 'Alex Mercer Lead Resume');
    await page.click('#resume-upload-submit');

    // 4. Verify upload succeeds and redirects to resume details
    await page.waitForURL(/\/resumes\/[a-zA-Z0-9-]+$/, { timeout: 20000 });
    await expect(page.locator('h3')).toContainText('Alex Mercer Lead Resume');
    await expect(page.locator('.badge.bg-success')).toContainText('READY');

    // 5. Verify extracted sections appear in the tabs
    await expect(page.locator('button:has-text("Experience")')).toBeVisible();
    await expect(page.locator('button:has-text("Skills")')).toBeVisible();

    // Click Skills tab and verify parsed skills are present
    await page.click('button:has-text("Skills")');
    await expect(page.locator('text=TypeScript')).toBeVisible();

    // 6. Run / View Analysis
    await page.click('#goto-analysis');
    await page.waitForURL(/\/resumes\/[a-zA-Z0-9-]+\/analysis$/, {
      timeout: 20000,
    });

    // 7. Verify score appears and score breakdown is displayed
    await expect(page.locator('#overall-score-display')).toBeVisible({
      timeout: 15000,
    });
    const scoreText = await page
      .locator('#overall-score-display')
      .textContent();
    const scoreNum = parseInt(scoreText || '0', 10);
    expect(scoreNum).toBeGreaterThan(0);
    expect(scoreNum).toBeLessThanOrEqual(100);

    // Verify breakdown categories
    await expect(page.locator('text=ATS Readiness')).toBeVisible();
    await expect(page.locator('text=Content Impact')).toBeVisible();
    await expect(page.locator('text=Key Detected Strengths')).toBeVisible();
    await expect(page.locator('text=Actionable Improvements')).toBeVisible();

    // 8. Verify Career Twin comparison section exists
    await expect(page.locator('text=Career Twin Alignment')).toBeVisible();
    await expect(page.locator('text=Present in Both')).toBeVisible();

    // 9. Refresh page and verify persisted data
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#overall-score-display')).toBeVisible({
      timeout: 15000,
    });
    const persistedScoreText = await page
      .locator('#overall-score-display')
      .textContent();
    expect(persistedScoreText).toBe(scoreText);

    // 10. Navigate back to Resumes list
    await page.click('a:has-text("← Resumes")');
    await page.waitForURL(`${BASE}/resumes`, { timeout: 10000 });
    await expect(
      page.locator('h6:has-text("Alex Mercer Lead Resume")'),
    ).toBeVisible();

    // 11. Delete resume and verify it disappears
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const deleteBtn = page.locator('button[title="Delete resume"]').first();
    await deleteBtn.click();

    // Verify resume item is deleted
    await expect(page.locator('text=Alex Mercer Lead Resume')).not.toBeVisible({
      timeout: 10000,
    });
  });
});
