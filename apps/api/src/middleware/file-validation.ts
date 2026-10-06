/**
 * File validation utilities for resume uploads.
 *
 * Performs magic-byte (file signature) validation to verify that uploaded
 * files are what they claim to be, regardless of extension or MIME type.
 * This prevents malicious files masquerading as PDFs or DOCXs.
 */

import { AppError } from './error-handler.js';

/**
 * PDF signature: %PDF- (hex: 25 50 44 46 2D)
 */
const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);

/**
 * DOCX/ZIP signature: PK (hex: 50 4B 03 04)
 * DOCX is a ZIP archive — the signature is the ZIP local file header.
 */
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

/**
 * Validates file buffer against known magic bytes for PDF and DOCX.
 *
 * @param buffer - The file buffer to validate
 * @param declaredMime - The MIME type declared by the client
 * @param originalName - The original filename (used for extension fallback)
 * @throws AppError if the file signature does not match the declared type
 */
export function validateFileSignature(
  buffer: Buffer,
  declaredMime?: string,
  originalName?: string,
): void {
  if (buffer.length < 5) {
    throw new AppError(
      'Uploaded file is too small to be a valid PDF or DOCX',
      400,
      'INVALID_FILE_TYPE',
    );
  }

  const mime = (declaredMime || '').toLowerCase();
  const filename = (originalName || declaredMime || '').toLowerCase();
  const isPdfDeclared = mime === 'application/pdf' || filename.endsWith('.pdf');
  const isDocxDeclared =
    mime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword' ||
    filename.endsWith('.docx') ||
    filename.endsWith('.doc');

  if (isPdfDeclared) {
    // Verify PDF magic bytes
    const header = buffer.slice(0, 5);
    if (!header.equals(PDF_MAGIC)) {
      throw new AppError(
        'File does not appear to be a valid PDF (magic bytes mismatch)',
        400,
        'INVALID_FILE_TYPE',
      );
    }
    return;
  }

  if (isDocxDeclared) {
    // Verify ZIP/PK magic bytes (DOCX is ZIP-based)
    const header = buffer.slice(0, 4);
    if (!header.equals(ZIP_MAGIC)) {
      throw new AppError(
        'File does not appear to be a valid DOCX (magic bytes mismatch)',
        400,
        'INVALID_FILE_TYPE',
      );
    }
    return;
  }

  throw new AppError(
    'Only PDF and DOCX file types are supported',
    400,
    'INVALID_FILE_TYPE',
  );
}

/**
 * Sanitizes an uploaded filename to prevent path traversal attacks.
 * Returns a safe basename with only allowed characters.
 *
 * @param originalName - The raw filename from the client
 * @returns A sanitized filename safe for storage
 */
export function sanitizeFilename(originalName: string): string {
  // Extract just the basename, strip directories
  const base = originalName.split(/[\\/]/).pop() || 'upload';

  // Remove null bytes and control characters
  const stripped = base.replace(/[\x00-\x1f\x7f]/g, '');

  // Replace anything that is not alphanumeric, dash, underscore, dot, or space
  const safe = stripped.replace(/[^a-zA-Z0-9._\- ]/g, '_');

  // Prevent leading dots (hidden files) and limit total length
  const noLeadingDot = safe.startsWith('.') ? `file${safe}` : safe;

  return noLeadingDot.slice(0, 200) || 'upload';
}
