/**
 * Shared Type Definitions for Resumind
 */

export type UUID = string;
export type DateString = string;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface HealthCheckData {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  environment: string;
  timestamp?: string;
  services?: {
    database?: 'connected' | 'disconnected';
    redis?: 'connected' | 'disconnected';
  };
}
