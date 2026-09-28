# Resumind Core Development Rules

1. **Preserve Existing Functionality**: Never delete or break existing working features. Every refactor must be verified against existing routes and workflows.
2. **Modular Architecture**: Maintain a clean separation between `apps/web` (frontend), `apps/api` (backend), and `packages/*` (shared libraries). Do not bleed business logic across boundaries.
3. **No Unnecessary Dependencies**: Strictly evaluate all additions. Do not install heavy frameworks, redundant libraries, or packages planned for future phases.
4. **No Unrelated Refactors**: Keep PRs and commits focused strictly on the phase objectives.
5. **Incremental Verification**: After every major structural or code change, run:
   - Typecheck (`tsc` / `npm run typecheck`)
   - Lint & Format check
   - Automated tests (unit, integration, E2E)
   - Build verification
6. **Preview Major Changes**: Verify user interface adjustments directly in the browser or via automated smoke tests.
7. **Zero Secret Leakage**: Never commit `.env` files, production credentials, API keys, or certificates.
8. **Document Architectural Shifts**: Keep documentation in `docs/` synchronized with actual implementation realities.
