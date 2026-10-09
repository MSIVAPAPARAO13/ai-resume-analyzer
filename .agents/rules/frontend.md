# Frontend Development Rules

1. **TypeScript First**: All components, hooks, services, and utilities must be strongly typed without using `any`.
2. **Styling Foundation**: Use **Bootstrap 5** for modern responsive layouts and components. Do not introduce Tailwind CSS for new components or multi-framework conflicts.
3. **Component Architecture**: Organize components into `components/ui/` (primitives), `components/layout/` (structural shells), and feature-oriented modules (`features/`).
4. **Server vs Client State**:
   - Use **TanStack Query** (`@tanstack/react-query`) for all server state (fetching, caching, synchronization, mutations).
   - Use **Zustand** exclusively for localized client/UI state (sidebar open/close, multi-step wizards, theme toggle).
5. **No Scattered API Calls**: All HTTP communications must go through centralized service clients (e.g. `services/api-client.ts`), never raw `fetch` or `axios` calls directly inside JSX components.
6. **Accessibility (a11y)**: Adhere to WCAG 2.1 AA standards:
   - All interactive controls must have accessible names (`aria-label`, `<label htmlFor="...">`).
   - Maintain visible focus rings and proper heading hierarchies (`h1` -> `h2` -> `h3`).
7. **Responsive Design**: Ensure mobile-first responsiveness across standard viewports (360px, 768px, 1024px, 1440px).
