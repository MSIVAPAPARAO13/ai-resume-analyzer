import { test, expect } from '@playwright/test';

// Phase 2 E2E smoke tests — requires both API (port 4000) and web (port 5173) running
// Run with: npx playwright test tests/e2e/

const BASE = 'http://localhost:5173';
const TEST_EMAIL = `e2e-${Date.now()}@resumind-test.dev`;
const TEST_PASS = 'Test@12345';
const TEST_NAME = 'E2E Test User';

test.describe('Phase 2: Authentication Flow', () => {
  test('Register new account and reach dashboard', async ({ page }) => {
    await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h4')).toContainText('Create your account');

    await page.fill('#name', TEST_NAME);
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', TEST_PASS);
    await page.fill('#confirmPassword', TEST_PASS);
    await page.click('#register-submit');

    // Should land on dashboard after registration
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 15000 });
    await expect(page).toHaveURL(`${BASE}/dashboard`);
  });

  test('Logout and redirect to login', async ({ page }) => {
    // Login first
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', TEST_PASS);
    await page.click('#login-submit');
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 15000 });

    // Logout
    await page.click('#user-menu');
    await page.click('#logout-btn');
    await page.waitForURL(`${BASE}/login`, { timeout: 10000 });
    await expect(page).toHaveURL(`${BASE}/login`);
  });

  test('Protected dashboard redirects unauthenticated users', async ({
    page,
  }) => {
    // Clear storage to ensure no tokens
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(`${BASE}/login`, { timeout: 10000 });
    await expect(page).toHaveURL(`${BASE}/login`);
  });

  test('Login, open Career Twin, add a skill', async ({ page }) => {
    // Login
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', TEST_PASS);
    await page.click('#login-submit');
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 15000 });

    // Go to Career Twin
    await page.click('#goto-career');
    await page.waitForURL(`${BASE}/career`, { timeout: 10000 });

    // Add a skill
    await page.click('button:has-text("⚡")');
    await page.click('#add-skills');
    await page.fill('#skill-name-input', 'TypeScript');
    await page.click('button[type="submit"]:has-text("Save")');

    // Verify skill appears
    await expect(page.locator('text=TypeScript')).toBeVisible({
      timeout: 10000,
    });
  });
});
