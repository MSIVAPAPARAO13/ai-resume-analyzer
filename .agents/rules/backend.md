# Backend Development Rules

1. **Modular Monolith**: Structure server logic into self-contained feature modules containing controller, service, repository, and DTO definitions.
2. **Layer Separation**:
   - **Controllers**: Handle HTTP transport, status codes, and request/response mapping. No business logic.
   - **Services**: Pure business logic, orchestration, and domain rules.
   - **Repositories / Prisma**: Data access and database queries.
3. **Strict Zod Validation**: Validate every incoming request payload (body, query params, headers, path params) using Zod schemas before touching service layers.
4. **Centralized Error Handling**: Use custom application error classes inheriting from `AppError`. Never return raw database or runtime stack traces in production HTTP responses.
5. **Structured Logging**: Use **Pino** / **pino-http** with correlation IDs (`x-request-id`) on every incoming request.
6. **API Versioning**: Prefix all REST endpoints with explicit version tags (e.g. `/api/v1/...`).
7. **Provider Abstraction**: Abstract all external services (AI models, job providers, storage, email) behind clear TypeScript interfaces. Never tie business logic directly to a concrete third-party SDK.
