import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'), // "/" (home page)
  route('/auth', 'routes/auth.tsx'), // "/auth" page
  route('/upload', 'routes/upload.tsx'),
  route('/resume/:id', 'routes/resume.tsx'),
] satisfies RouteConfig;
