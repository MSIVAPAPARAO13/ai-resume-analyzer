/**
 * Shared Configuration Constants for Resumind
 */

export const APP_NAME = 'Resumind';
export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export const SUPPORTED_RESUME_MIME_TYPES = ['application/pdf'] as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
