import { expect, test } from '@playwright/test';

test.describe('Resumind Phase 1 E2E Smoke Tests', () => {
  test('should load public authentication / welcome view without fatal errors', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/auth', { waitUntil: 'domcontentloaded' });

    // Verify main card heading
    await expect(
      page.getByRole('heading', { name: 'Welcome', level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText('Log In to Continue Your Job Journey'),
    ).toBeVisible();

    // Verify auth button is rendered
    const authButton = page.locator('button.auth-button');
    await expect(authButton).toBeVisible();

    // Capture screenshot
    await page.screenshot({ path: 'test-results/preview_auth.png' });

    // Verify no fatal uncaught exceptions
    const fatalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('Puter') &&
        !err.includes('favicon') &&
        !err.includes('404'),
    );
    expect(fatalErrors).toHaveLength(0);
  });

  test('should load resume upload route with all input fields', async ({
    page,
  }) => {
    await page.goto('/upload', { waitUntil: 'domcontentloaded' });

    // Verify page title and header
    await expect(
      page.getByRole('heading', {
        name: 'Smart feedback for your dream job',
        level: 1,
      }),
    ).toBeVisible();

    // Verify form input controls
    await expect(page.getByPlaceholder('Google')).toBeVisible();
    await expect(page.getByPlaceholder('Frontend Developer')).toBeVisible();
    await expect(
      page.getByPlaceholder('Paste job description...'),
    ).toBeVisible();

    // Verify submit button
    await expect(
      page.getByRole('button', { name: /Analyze Resume/i }),
    ).toBeVisible();

    // Capture screenshot
    await page.screenshot({ path: 'test-results/preview_upload.png' });
  });

  test('should load homepage dashboard', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Capture screenshot
    await page.screenshot({ path: 'test-results/preview_home.png' });
  });
});
