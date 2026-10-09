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
  route('/jobs/search', 'routes/job-search.tsx'),
  route('/jobs/:id', 'routes/job-detail.tsx'),
  route('/jobs/:id/analysis', 'routes/job-analysis.tsx'),
  route('/jobs/:id/match/:matchId', 'routes/job-match.tsx'),
  route('/resumes/:id/tailor/:jobId', 'routes/resume-tailor.tsx'),

  // ─── Phase 6: Application CRM ──────────────────────────────────────────────
  route('/applications', 'routes/applications.tsx'),
  route('/applications/new', 'routes/application-new.tsx'),
  route('/applications/:id', 'routes/application-detail.tsx'),

  // ─── Phase 6: GitHub Career Evidence ────────────────────────────────────────
  route('/integrations', 'routes/integrations.tsx'),
  route('/integrations/github', 'routes/integrations-github.tsx'),
  route('/github/repositories', 'routes/github-repositories.tsx'),
  route('/github/repositories/:id', 'routes/github-repository-detail.tsx'),

  // ─── Phase 7: Interview Intelligence ────────────────────────────────────────
  route('/interviews', 'routes/interviews.tsx'),
  route('/interviews/new', 'routes/interview-new.tsx'),
  route('/interviews/:id', 'routes/interview-detail.tsx'),
  route('/interviews/:id/questions', 'routes/interview-questions.tsx'),
  route('/interviews/:id/mock', 'routes/interview-mock.tsx'),
  route('/interviews/:id/report', 'routes/interview-report.tsx'),
  route(
    '/integrations/google-calendar',
    'routes/integrations-google-calendar.tsx',
  ),

  // ─── Phase 8: Career Analytics & Learning Plan ─────────────────────────────
  route('/analytics', 'routes/analytics.tsx'),
  route('/analytics/skills', 'routes/analytics-skills.tsx'),
  route('/analytics/roles', 'routes/analytics-roles.tsx'),
  route('/analytics/applications', 'routes/analytics-applications.tsx'),
  route('/analytics/interviews', 'routes/analytics-interviews.tsx'),
  route('/analytics/evidence', 'routes/analytics-evidence.tsx'),
  route('/learning', 'routes/learning.tsx'),
  route('/learning/new', 'routes/learning-new.tsx'),
  route('/learning/:id', 'routes/learning-detail.tsx'),

  // ─── Existing Puter-powered routes (preserved) ────────────────────────────
  route('/upload', 'routes/upload.tsx'),
  route('/resume/:id', 'routes/resume.tsx'),
  route('/wipe', 'routes/wipe.tsx'),
  route('/edit/:id', 'routes/edit.tsx'),
] satisfies RouteConfig;
