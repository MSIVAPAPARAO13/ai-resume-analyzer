# Resumind — Development Rules & Engineering Standards

## 1. Prime Directive

> **NEVER move to the next phase while the current phase contains known broken functionality.**
> Every phase must meet its Definition of Done, with passing typechecks, tests, builds, and verified user flows.

---

## 2. Modularity & Repository Architecture

1. **Workspaces Isolation**:
   - `apps/web`: Frontend application (React, React Router, Bootstrap).
   - `apps/api`: Backend application (Express, TypeScript, Prisma, Redis).
   - `packages/*`: Pure shared primitives (`shared-types`, `validation`, `config`, `utils`, `ui`).
2. **Zero Circular Dependencies**: Shared packages must never import from `apps/*`. Packages may only import other packages in a strict DAG hierarchy.
3. **No Kitchen-Sink Packages**: Do not add business logic to `packages/`. Keep them reusable and framework-agnostic where possible.

---

## 3. TypeScript & Code Standards

1. **Strict Type Checking**: Strict mode is enabled (`"strict": true`, `"noImplicitAny": true`).
2. **Explicit Interfaces**: Explicitly type all function signatures, component props, and API contracts.
3. **Avoid Type Assertions**: Avoid `as any` or forceful type casting unless dealing with third-party untyped browser APIs (e.g. legacy script injections).

---

## 4. Input Validation & API Design

1. **Zod Everywhere**: Every external input (HTTP body, query parameters, route parameters, environment variables) must be parsed through a Zod schema.
2. **Consistent Envelopes**: All API responses must follow the `{ success: boolean, data?: T, error?: ErrorObject }` convention.
3. **Layer Isolation**:
   - Routes -> Controllers -> Services -> Repositories/Prisma.
   - Controllers handle HTTP status codes and parameters.
   - Services handle business rules.

---

## 5. Security & Secrets Management

1. **Server-Side Secret Enclave**: Private keys, database URLs, and API tokens must never be exposed to client bundles or committed to Git.
2. **Sanitize Logs**: Never log passwords, tokens, full resume contents, or customer PII.
3. **HTTP Hardening**: Helmet for security headers, strict CORS whitelisting, and payload limits on body parsers.

---

## 6. Testing Philosophy

1. **Pyramid Testing**:
   - Unit tests for pure logic and schemas.
   - Integration tests for Express routes and database repositories.
   - E2E smoke tests with Playwright for primary user journeys.
2. **No Arbitrary Sleeps**: Always use Playwright web-first assertions (`expect(locator).toBeVisible()`).
3. **Continuous Verification**: After every major change, run:
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   npm run build
   ```

---

## 7. UI & Accessibility (a11y)

1. **Styling System**: **Bootstrap 5** is the foundation for all modern responsive layouts and components. Do not add Tailwind CSS for new components.
2. **WCAG 2.1 AA Compliance**:
   - All interactive elements must have accessible text labels (`aria-label`, `<label htmlFor="...">`).
   - Color contrast ratios must be >= 4.5:1 for normal text and >= 3:1 for large text.
   - All forms must display descriptive error messages associated with inputs via `aria-describedby`.

---

## 8. SEO Standards

1. **Public vs Private Scoping**:
   - Public pages (`/`, `/features`, `/resume-analyzer`, `/ats-resume-checker`) must have unique `<title>`, `<meta name="description">`, OpenGraph tags, and canonical links.
   - Private authenticated pages (`/app/*`, `/resumes/*`, `/settings/*`) must specify `<meta name="robots" content="noindex, nofollow">`.
2. **Semantic HTML**: Use proper `<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, and `<footer>` elements. Maintain a single `<h1>` per page.

---

## 9. Performance & Optimization

1. **Bundle Splitting**: Route-level code splitting via dynamic imports.
2. **Client-Side Heavy Operations**: Run PDF parsing and rasterization in Web Workers (`/pdf.worker.js`) to avoid freezing the UI thread.
3. **Redis Caching**: Use Redis for high-frequency read operations and session data in subsequent phases.
