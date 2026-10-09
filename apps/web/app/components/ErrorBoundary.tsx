/**
 * ErrorBoundary Component
 *
 * A React class component that catches errors in its children and displays
 * a graceful error UI rather than crashing the entire application.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponentThatMightFail />
 *   </ErrorBoundary>
 *
 * The fallback UI provides "Try Again" (remount) and "Go to Dashboard" actions.
 * Stack traces are only shown in development mode.
 */

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /**
   * Optional custom fallback element. If not provided, renders the built-in
   * Resumind error UI.
   */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console only in development; in production this would go to an
    // error tracking service. Do NOT expose error details to the UI in prod.
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error, info);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const isDev = import.meta.env.DEV;
    const errorMessage = this.state.error?.message || 'Unknown error';
    const stack = this.state.error?.stack;

    return (
      <div
        className="p-4 d-flex align-items-center justify-content-center"
        style={{ minHeight: 300 }}
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center" style={{ maxWidth: 500 }}>
          {/* Error icon */}
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mb-3"
            style={{ width: 64, height: 64 }}
            role="img"
            aria-label="Error"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="#dc3545"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className="h5 fw-bold text-white mb-2">Something went wrong</h2>
          <p className="text-secondary small mb-4">
            A component error occurred. Your other content is unaffected.
          </p>

          {/* Stack trace — dev only */}
          {isDev && stack && (
            <pre
              className="text-start p-3 rounded border border-secondary text-danger small overflow-auto mb-4"
              style={{ maxHeight: 200, background: 'rgba(220,53,69,0.05)' }}
              aria-label="Error stack trace"
            >
              {errorMessage}
              {'\n\n'}
              {stack}
            </pre>
          )}

          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={this.handleRetry}
              type="button"
            >
              Try Again
            </button>
            <a href="/dashboard" className="btn btn-primary btn-sm">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
