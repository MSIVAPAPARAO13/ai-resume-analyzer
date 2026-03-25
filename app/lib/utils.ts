import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  // Find correct unit index
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Convert and format
  const size = (bytes / Math.pow(k, i)).toFixed(2);

  return `${parseFloat(size)} ${sizes[i]}`;
}

/**
 * Generate unique ID (UUID)
 */
export const generateUUID = (): string => {
  return crypto.randomUUID();
};
