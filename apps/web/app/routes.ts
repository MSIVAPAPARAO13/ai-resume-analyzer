import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  // ─── Public ───────────────────────────────────────────────────────────────
  index('routes/home.tsx'), // "/" (existing home page)
  route('/login', 'routes/login.tsx'),
  route('/register', 'routes/register.tsx'),
  route('/auth', 'routes/auth.tsx'), // existing Puter auth page

  // ─── Protected ────────────────────────────────────────────────────────────
  route('/dashboard', 'routes/dashboard.tsx'),
  route('/career', 'routes/career.tsx'),
  route('/resumes', 'routes/resumes.tsx'),
  route('/resumes/:id', 'routes/resume-detail.tsx'),
  route('/resumes/:id/analysis', 'routes/resume-analysis.tsx'),
  route('/jobs', 'routes/jobs.tsx'),
  route('/jobs/new', 'routes/job-new.tsx'),
  route('/jobs/:id', 'routes/job-detail.tsx'),
  route('/jobs/:id/analysis', 'routes/job-analysis.tsx'),
  route('/jobs/:id/match/:matchId', 'routes/job-match.tsx'),

  // ─── Existing Puter-powered routes (preserved) ────────────────────────────
  route('/upload', 'routes/upload.tsx'),
  route('/resume/:id', 'routes/resume.tsx'),
  route('/wipe', 'routes/wipe.tsx'),
  route('/edit/:id', 'routes/edit.tsx'),
] satisfies RouteConfig;
