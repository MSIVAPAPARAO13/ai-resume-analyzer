import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { StorageProvider } from './storage.interface.js';

export class LocalStorageProvider implements StorageProvider {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    // Default to an uploads/resumes folder in the API package root
    this.baseDir = baseDir || path.resolve(process.cwd(), 'uploads', 'resumes');
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  private sanitizeExtension(originalName: string, mimeType: string): string {
    const ext = path.extname(originalName).toLowerCase();
    if (ext === '.pdf' || mimeType === 'application/pdf') return '.pdf';
    if (
      ext === '.docx' ||
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return '.docx';
    }
    return '.bin';
  }

  private resolveSafePath(storageKey: string): string {
    // Validate storageKey to prevent path traversal
    const safeKey = path.basename(storageKey);
    if (!safeKey || safeKey !== storageKey) {
      throw new Error('INVALID_STORAGE_KEY');
    }
    return path.join(this.baseDir, safeKey);
  }

  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<{ storageKey: string; size: number }> {
    await this.ensureDir();

    const ext = this.sanitizeExtension(originalName, mimeType);
    const storageKey = `${randomUUID()}${ext}`;
    const filePath = this.resolveSafePath(storageKey);

    await fs.writeFile(filePath, buffer);

    return {
      storageKey,
      size: buffer.length,
    };
  }

  async read(storageKey: string): Promise<Buffer> {
    const filePath = this.resolveSafePath(storageKey);
    try {
      return await fs.readFile(filePath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new Error('FILE_NOT_FOUND');
      }
      throw err;
    }
  }

  async delete(storageKey: string): Promise<void> {
    const filePath = this.resolveSafePath(storageKey);
    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return; // Already deleted
      }
      throw err;
    }
  }
}

export const storageProvider: StorageProvider = new LocalStorageProvider();
