# Security Rules

1. **Server-Side Secret Enclave**: Never expose private API keys, database credentials, JWT secrets, or cloud tokens in frontend client code or browser bundles.
2. **Strict Input Sanitization**: All inbound parameters must pass through Zod schemas before processing to guard against injection, prototype pollution, and malformed inputs.
3. **HTTP Security Hardening**:
   - Use **Helmet** to set appropriate HTTP response headers (`Content-Security-Policy`, `X-Content-Type-Options`, `Strict-Transport-Security`).
   - Configure **CORS** explicitly to whitelist only trusted frontend origins.
4. **Log Sanitization**: Redact sensitive fields (passwords, tokens, resume PII, authorization headers) from server logs.
5. **Payload Limits**: Enforce strict request body size limits (`express.json({ limit: '10mb' })`) to prevent Denial of Service (DoS) attacks via oversized payloads.
