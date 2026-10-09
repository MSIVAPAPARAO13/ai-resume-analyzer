export interface StorageProvider {
  /**
   * Saves a file buffer to storage.
   * Returns a unique, opaque storage key and the written size in bytes.
   */
  upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<{ storageKey: string; size: number }>;

  /**
   * Reads a file buffer from storage by storage key.
   */
  read(storageKey: string): Promise<Buffer>;

  /**
   * Deletes a file from storage by storage key.
   */
  delete(storageKey: string): Promise<void>;
}
