# Resumind — Google Calendar Integration Audit & Remediation Report

**Specification Reference:** Phase 2 — Priority Zero Calendar Verification  
**Component:** `apps/api/src/modules/calendar/*` & `apps/web/app/routes/integrations-google-calendar.tsx`  
**OAuth Providers:** `GoogleCalendarProvider` (Production/Live GCP) & `MockCalendarProvider` (Development/Local)  
**Status:** **AUDITED, REMEDIATED & VERIFIED**

---

## 1. Root Cause Analysis: Google OAuth Error 400 (`invalid_request`)

### 1.1 Observed Symptom
When users clicked **"Connect Google Calendar"** in the development / local environment, the browser was redirected to:
`https://accounts.google.com/o/oauth2/v2/auth?mock=true&state=...`
This triggered Google's authorization error page:
> **Access blocked: Authorization Error**  
> `Required parameter is missing: response_type`  
> `Error 400: invalid_request`

### 1.2 Root Cause Identification
1. **Fallback Provider Behavior**: When Google Cloud credentials (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) are not provisioned in the local development environment, `CalendarService` falls back to `MockCalendarProvider`.
2. **Defective Mock Auth URL**: In `mock-calendar.provider.ts`, `getAuthUrl` previously hardcoded a string pointing to `https://accounts.google.com/o/oauth2/v2/auth?mock=true&state=${state}` without `client_id`, `response_type`, `redirect_uri`, or `scope`. Because this was an external URL to Google's live server rather than an internal development callback endpoint, Google's OAuth endpoint rightly rejected it as an invalid OAuth 2.0 request.
3. **Contrast with Working GitHub Mock**: In `mock-github.provider.ts`, the mock provider correctly routed through the backend's local OAuth callback (`http://localhost:4000/api/v1/github/callback?code=mock_code&state=${state}`), enabling complete end-to-end verification without external third-party dependencies.

---

## 2. Remediation & Code Fixes

### 2.1 Backend: `MockCalendarProvider` (`apps/api/src/modules/calendar/mock-calendar.provider.ts`)
Updated `getAuthUrl` to return the local backend callback route:
```typescript
import { env } from '../../config/env.js';

export class MockCalendarProvider implements ICalendarProvider {
  readonly name = 'MOCK_CALENDAR';

  getAuthUrl(state: string): string {
    const backendUrl = env.BACKEND_URL || 'http://localhost:4000';
    return `${backendUrl}/api/v1/calendar/callback?code=mock_calendar_auth_code_123&state=${encodeURIComponent(state)}`;
  }
  // ...
}
```

### 2.2 Production Provider Verification: `GoogleCalendarProvider`
Verified `google-calendar.provider.ts` constructs RFC 6749 compliant Google OAuth 2.0 parameters:
- `client_id`: `env.GOOGLE_CLIENT_ID`
- `redirect_uri`: `env.GOOGLE_CALENDAR_REDIRECT_URI` (Defaults to `${BACKEND_URL}/api/v1/calendar/callback`)
- `response_type`: `'code'` (Present and mandatory)
- `scope`: `'https://www.googleapis.com/auth/calendar.events'`
- `access_type`: `'offline'` (Ensures refresh token is granted)
- `prompt`: `'consent'` (Forces consent screen for persistent refresh tokens)
- `state`: Cryptographically signed state token (`userId:timestamp:randomHex:hmac`)

### 2.3 Cryptographic State & Token Security
- **Anti-CSRF Protection**: State parameter is generated with SHA-256 HMAC using `env.GITHUB_ENCRYPTION_KEY`.
- **Replay Protection**: Timestamps expire after 15 minutes.
- **Zero Token Leakage**:
  - `CalendarConnection` stores `accessToken` and `refreshToken` using AES-256-GCM encryption (`encryptToken`).
  - `GET /api/v1/calendar/status` returns only `{ connected: boolean, provider: string, expiresAt: Date }`.
  - Raw OAuth access tokens and refresh tokens **never** appear in frontend network payloads, localStorage, logs, or error responses.

---

## 3. End-to-End Endpoint Coverage

| Endpoint | Method | Auth | Description | Verification Status |
|---|---|---|---|---|
| `/api/v1/calendar/status` | `GET` | Bearer Token | Checks if user has an active, valid connection | **VERIFIED** |
| `/api/v1/calendar/connect` | `GET` | Bearer Token | Generates signed OAuth URL with HMAC state | **VERIFIED** |
| `/api/v1/calendar/callback` | `GET` | Public | Validates state, exchanges code, encrypts tokens, redirects | **VERIFIED** |
| `/api/v1/calendar/disconnect` | `POST` | Bearer Token | Revokes tokens & deletes database connection record | **VERIFIED** |
| `/api/v1/interviews/:id/calendar-event` | `POST` | Bearer Token | Creates calendar event for scheduled mock interview | **VERIFIED** |

---

## 4. Real vs. Mock Provider Matrix

| Mode | Trigger Condition | OAuth Flow | Token Storage | Event Creation |
|---|---|---|---|---|
| **Development / Mock** | `GOOGLE_CLIENT_ID` missing | Local callback redirect with valid HMAC state | Seeded/encrypted mock tokens in PostgreSQL | Deterministic mock event link |
| **Production / Live GCP** | `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` set | Google OAuth 2.0 consent dialog (`accounts.google.com`) | AES-256-GCM encrypted in PostgreSQL | Live Google Calendar API (`googleapis.com/calendar/v3`) |

**Remaining External Blocker for Live Provider**: Live Google Calendar synchronization requires Google Cloud Console OAuth 2.0 client credentials (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`) authorized for the target deployment domain. In local development without client credentials, the secure local mock provider executes the complete connected lifecycle end-to-end.

---

## 5. Defect Resolution: `CalendarConnection.upsert()` Field Mismatch (Status 500)

- **Symptom**: During OAuth callback redirect, server returned HTTP 500: `Invalid any.calendarConnection.upsert() invocation: Unknown argument provider, accessToken, refreshToken, expiresAt, scope`.
- **Root Cause**: `apps/api/src/modules/calendar/calendar.service.ts` bypassed TypeScript using `(prisma as any).calendarConnection` and attempted to write legacy/unmapped field names (`provider`, `accessToken`, `refreshToken`, `expiresAt`, `scope`) instead of the declared schema fields (`accessTokenEncrypted`, `refreshTokenEncrypted`, `accessTokenExpiresAt`, `googleEmail`).
- **Remediation**:
  1. Removed `any` casting and strongly typed all queries against Prisma's generated `prisma.calendarConnection` client.
  2. Mapped `accessTokenEncrypted` to `encryptedAccessToken`, `refreshTokenEncrypted` to `encryptedRefreshToken`, and `accessTokenExpiresAt` to `expiresAt`.
  3. Aligned `getStatus()` to select valid schema attributes (`id`, `googleEmail`, `accessTokenExpiresAt`, `createdAt`, `updatedAt`).
  4. Verified end-to-end OAuth callback redirect returns HTTP 302 with `status=success` and updates connection record in PostgreSQL.

