# Resumind — API Conventions & Standards

## 1. Overview

All Resumind REST APIs follow strict architectural conventions to maintain consistency, reliability, and security across modules and consumer clients.

---

## 2. Base URL & Versioning

- **Base URL:** `http://localhost:4000/api/v1` (or production host equivalent)
- **Versioning Strategy:** URI path versioning (`/api/v1/`, `/api/v2/`). Minor, backward-compatible updates do not change the version. Breaking changes increment the version number.

---

## 3. Headers

### Request Headers

| Header          | Type     | Required                        | Description                                                                    |
| :-------------- | :------- | :------------------------------ | :----------------------------------------------------------------------------- |
| `Content-Type`  | `string` | Yes (for POST/PUT/PATCH)        | Must be `application/json`                                                     |
| `X-Request-Id`  | `string` | Optional                        | Client-provided correlation ID (UUIDv4). If omitted, the server generates one. |
| `Authorization` | `string` | Required on protected endpoints | Bearer token (`Bearer <jwt>`) (Phase 2+)                                       |

### Response Headers

| Header                      | Description                                             |
| :-------------------------- | :------------------------------------------------------ |
| `X-Request-Id`              | Echoed or generated correlation ID for request tracing. |
| `Content-Type`              | `application/json; charset=utf-8`                       |
| `Strict-Transport-Security` | Enforces HTTPS (Helmet).                                |
| `X-Content-Type-Options`    | `nosniff`                                               |

---

## 4. Response Envelopes

Every response returns a structured JSON envelope.

### 4.1 Success Response Envelope

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "v1",
    "environment": "development"
  }
}
```

### 4.2 Error Response Envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address format"
      }
    ]
  }
}
```

### 4.3 Standard Error Codes

| Code                    | HTTP Status | Meaning                                            |
| :---------------------- | :---------- | :------------------------------------------------- |
| `VALIDATION_ERROR`      | 400         | Payload failed Zod schema parsing.                 |
| `BAD_REQUEST`           | 400         | Malformed syntax or illegal request state.         |
| `UNAUTHORIZED`          | 401         | Missing or invalid authentication token.           |
| `FORBIDDEN`             | 403         | Insufficient permissions to access resource.       |
| `NOT_FOUND`             | 404         | Resource or route does not exist.                  |
| `CONFLICT`              | 409         | Unique constraint or state conflict.               |
| `UNPROCESSABLE_ENTITY`  | 422         | Semantic errors in request data.                   |
| `RATE_LIMIT_EXCEEDED`   | 429         | Too many requests; retry after specified duration. |
| `INTERNAL_SERVER_ERROR` | 500         | Unhandled server error (redacted in production).   |

---

## 5. Pagination Standard

Endpoints returning collections use query parameters `page` (default: 1) and `limit` (default: 10, max: 100):

**Request:** `GET /api/v1/items?page=1&limit=10`

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
}
```

---

## 6. Phase 1 Implemented Endpoints

### Health Check

- **Endpoint:** `GET /api/v1/health`
- **Access:** Public
- **Description:** Verifies server runtime readiness.
- **Sample Response:**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "v1",
    "environment": "development"
  }
}
```
