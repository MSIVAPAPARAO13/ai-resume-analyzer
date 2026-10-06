/**
 * SSRF Guard Middleware & Utility
 *
 * Validates user-supplied URLs to prevent Server-Side Request Forgery.
 * Blocks private IP ranges, loopback, link-local, and metadata endpoints.
 */

import { AppError } from './error-handler.js';

const BLOCKED_HOSTNAMES = [
  'localhost',
  '0.0.0.0',
  'metadata.google.internal',
  '169.254.169.254', // AWS / GCP metadata endpoint
];

// Private IPv4 CIDR blocks (simplified prefix checks)
const PRIVATE_IP_PREFIXES = [
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '192.168.',
  '127.',
  '::1',
  'fc00:',
  'fd',
];

const ALLOWED_SCHEMES = ['https:', 'http:'];

/**
 * Validates a URL string against SSRF rules.
 * Throws AppError if the URL is invalid or potentially dangerous.
 */
export function assertSafeUrl(rawUrl: string, fieldName = 'URL'): void {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new AppError(
      `${fieldName} must be a valid URL`,
      400,
      'VALIDATION_ERROR',
    );
  }

  if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
    throw new AppError(
      `${fieldName} must use http or https scheme`,
      400,
      'VALIDATION_ERROR',
    );
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new AppError(
      `${fieldName} targets a blocked or private host`,
      400,
      'SSRF_BLOCKED',
    );
  }

  for (const prefix of PRIVATE_IP_PREFIXES) {
    if (hostname.startsWith(prefix)) {
      throw new AppError(
        `${fieldName} targets a blocked or private network`,
        400,
        'SSRF_BLOCKED',
      );
    }
  }
}

/**
 * Returns true if the URL is safe, false if it should be blocked.
 * Does NOT throw — use assertSafeUrl for throwing behavior.
 */
export function isSafeUrl(rawUrl: string): boolean {
  try {
    assertSafeUrl(rawUrl);
    return true;
  } catch {
    return false;
  }
}
