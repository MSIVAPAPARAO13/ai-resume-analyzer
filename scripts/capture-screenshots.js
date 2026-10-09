import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOTS_DIR = path.resolve('docs/screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function capture() {
  console.log('🚀 Launching Google Chrome for screenshots...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // Retina high-DPI quality
  });

  const page = await context.newPage();

  // Helper for waiting and taking screenshot
  async function take(fileName, waitSelector = null, delayMs = 1200) {
    if (waitSelector) {
      try {
        await page.waitForSelector(waitSelector, { timeout: 8000 });
      } catch (e) {
        console.warn(`Selector ${waitSelector} timed out, continuing...`);
      }
    }
    await page.waitForTimeout(delayMs);
    const targetPath = path.join(SCREENSHOTS_DIR, fileName);
    await page.screenshot({ path: targetPath, fullPage: false });
    console.log(`📸 Saved: ${fileName}`);
  }

  try {
    // 1. Landing Page
    console.log('Capturing Landing Page...');
    await page.goto('http://localhost:5173/');
    await take('01-landing.png', 'header');

    // 2. Register Page
    console.log('Capturing Register Page...');
    await page.goto('http://localhost:5173/register');
    await take('02-register.png', 'form');

    // 3. Login Page
    console.log('Capturing Login Page...');
    await page.goto('http://localhost:5173/login');
    await take('03-login.png', 'form');

    // Perform Login
    console.log('Logging in as alex.morgan.qa@resumind.dev...');
    await page.fill('#email', 'alex.morgan.qa@resumind.dev');
    await page.fill('#password', 'Password123!');
    await page.click('#login-submit');

    // Wait for Dashboard navigation
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await take('04-dashboard.png', '.card', 2000);

    // 5. Career Twin
    console.log('Capturing Career Twin Profile...');
    await page.goto('http://localhost:5173/career');
    await take('05-career-twin.png', '.card', 2000);

    // 6. Resumes List
    console.log('Capturing Resumes List...');
    await page.goto('http://localhost:5173/resumes');
    await take('06-resume-list.png', '.card', 1500);

    // 7. Resume Detail / Upload
    console.log('Capturing Resume Upload / Detail...');
    await page.goto('http://localhost:5173/resumes/60e72d58-0cc7-4c04-9488-5a5fb04b5afc');
    await take('07-resume-upload.png', '.card', 1500);

    // 8. Resume Analysis
    console.log('Capturing Resume Analysis & Diagnostics...');
    await page.goto('http://localhost:5173/resumes/60e72d58-0cc7-4c04-9488-5a5fb04b5afc/analysis');
    await take('08-resume-analysis.png', '.card', 2000);

    // 9. Jobs List
    console.log('Capturing Jobs Board...');
    await page.goto('http://localhost:5173/jobs');
    await take('09-jobs.png', '.card', 1500);

    // 10. Job Detail & Match
    console.log('Capturing Job Match...');
    await page.goto('http://localhost:5173/jobs/9f502efe-7a08-4312-b980-bc2874521daf');
    await take('10-job-match.png', '.card', 2000);

    // 11. AI Resume Tailoring Studio
    console.log('Capturing AI Tailoring Studio with Evidence Guard...');
    await page.goto('http://localhost:5173/resumes/60e72d58-0cc7-4c04-9488-5a5fb04b5afc/tailor/9f502efe-7a08-4312-b980-bc2874521daf');
    await take('11-ai-tailoring.png', '.card', 2500);

    // 12. Applications Pipeline CRM
    console.log('Capturing Applications Pipeline...');
    await page.goto('http://localhost:5173/applications');
    await take('12-applications.png', '.card', 1800);

    // 13. Interview Intelligence
    console.log('Capturing Interview Intelligence...');
    await page.goto('http://localhost:5173/interviews');
    await take('13-interviews.png', '.card', 1800);

    // 14. Calendar Integration
    console.log('Capturing Calendar Integration...');
    await page.goto('http://localhost:5173/integrations/google-calendar');
    await take('14-calendar-integration.png', '.card', 1500);

    // 15. Analytics Overview
    console.log('Capturing Career Analytics...');
    await page.goto('http://localhost:5173/analytics');
    await take('15-analytics.png', '.card', 2000);

    // 16. Skill Gaps Analytics
    console.log('Capturing Skill Gaps Analytics...');
    await page.goto('http://localhost:5173/analytics/skills');
    await take('16-skill-gaps.png', '.card', 2000);

    // 17. Learning Plans
    console.log('Capturing Learning Plans...');
    await page.goto('http://localhost:5173/learning');
    await take('17-learning-plans.png', '.card', 1800);

    console.log('✨ All 17 screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

capture();
