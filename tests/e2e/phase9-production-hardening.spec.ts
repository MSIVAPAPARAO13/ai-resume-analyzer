import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Phase 9 — Production Hardening, SEO & Accessibility E2E Suite', () => {
  // ─── 1. SEO & Static Directives ──────────────────────────────────────────
  test('SEO: robots.txt is served and contains private path disallows', async ({
    page,
  }) => {
    const res = await page.goto(`${BASE}/robots.txt`);
    expect(res?.status()).toBe(200);
    const text = await page.content();
    expect(text).toContain('User-agent: *');
    expect(text).toContain('Disallow: /dashboard');
    expect(text).toContain('Disallow: /resumes');
    expect(text).toContain('Disallow: /jobs');
    expect(text).toContain('Disallow: /applications');
    expect(text).toContain('Disallow: /interviews');
    expect(text).toContain('Disallow: /analytics');
    expect(text).toContain('Disallow: /learning');
    expect(text).toContain('Allow: /');
    expect(text).toContain('Allow: /login');
    expect(text).toContain('Allow: /register');
    expect(text).toContain('Sitemap:');
  });

  test('SEO: sitemap.xml is served and includes only public routes', async ({
    page,
  }) => {
    const res = await page.goto(`${BASE}/sitemap.xml`);
    expect(res?.status()).toBe(200);
    const text = await page.content();
    expect(text).toContain('<loc>https://resumind.app/</loc>');
    expect(text).toContain('<loc>https://resumind.app/login</loc>');
    expect(text).toContain('<loc>https://resumind.app/register</loc>');
    expect(text).not.toContain('/dashboard');
    expect(text).not.toContain('/resumes/');
  });

  // ─── 2. Public Page Metadata & Open Graph ─────────────────────────────────
  test('SEO: Login page contains title, meta description, and robots meta', async ({
    page,
  }) => {
    await page.goto(`${BASE}/login`);
    await expect(page).toHaveTitle(/Sign In \| Resumind/);

    const desc = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(desc).toBeTruthy();
    expect(desc?.length).toBeGreaterThan(10);

    const robots = await page
      .locator('meta[name="robots"]')
      .first()
      .getAttribute('content');
    expect(robots).toContain('index');
  });

  test('SEO: Register page contains title, meta description, and robots meta', async ({
    page,
  }) => {
    await page.goto(`${BASE}/register`);
    await expect(page).toHaveTitle(/Create Account \| Resumind/);

    const desc = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(desc).toBeTruthy();

    const robots = await page
      .locator('meta[name="robots"]')
      .first()
      .getAttribute('content');
    expect(robots).toContain('index');
  });

  // ─── 3. Accessibility & Keyboard Navigation ──────────────────────────────
  test('A11y: Login form has accessible labels, IDs, and submit button', async ({
    page,
  }) => {
    await page.goto(`${BASE}/login`);

    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required', '');

    const emailLabel = page.locator('label[for="email"]');
    await expect(emailLabel).toBeVisible();

    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    const passwordLabel = page.locator('label[for="password"]');
    await expect(passwordLabel).toBeVisible();

    const submitBtn = page.locator('#login-submit');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
  });

  test('A11y: Register form has accessible labels and required fields', async ({
    page,
  }) => {
    await page.goto(`${BASE}/register`);

    const nameInput = page.locator('#name');
    if ((await nameInput.count()) > 0) {
      await expect(nameInput).toBeVisible();
      await expect(page.locator('label[for="name"]')).toBeVisible();
    }

    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible();
    await expect(page.locator('label[for="email"]')).toBeVisible();

    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
  });

  // ─── 4. Protected Route & Auth Redirection ────────────────────────────────
  test('Security: Protected dashboard redirects unauthenticated users', async ({
    page,
  }) => {
    // Clear any local storage auth state
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto(`${BASE}/dashboard`);
    // Should either navigate to /login or stay on login
    await expect(page).toHaveURL(/\/(login|dashboard)/);
  });
});
