/**
 * Shared UI Primitives for Resumind
 * Note: Business logic and page-level layouts remain in apps/web.
 */

export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  onClick?: () => void;
}

export interface BadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'danger' | 'info';
}
