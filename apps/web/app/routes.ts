import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  // ─── Public ───────────────────────────────────────────────────────────────
  index('routes/home.tsx'),          // "/" (existing home page)
  route('/login', 'routes/login.tsx'),
  route('/register', 'routes/register.tsx'),
  route('/auth', 'routes/auth.tsx'), // existing Puter auth page

  // ─── Protected ────────────────────────────────────────────────────────────
  route('/dashboard', 'routes/dashboard.tsx'),
  route('/career', 'routes/career.tsx'),

  // ─── Existing Puter-powered routes (preserved) ────────────────────────────
  route('/upload', 'routes/upload.tsx'),
  route('/resume/:id', 'routes/resume.tsx'),
  route('/wipe', 'routes/wipe.tsx'),
  route('/edit/:id', 'routes/edit.tsx'),
] satisfies RouteConfig;
