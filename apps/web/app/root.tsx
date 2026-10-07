import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'; // ✅ IMPORTANT (NOT react-router-dom)

import type { Route } from './+types/root';
import './app.css';

import { usePuterStore } from './lib/puter';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';

// Bootstrap CSS — loaded globally for Phase 2
import 'bootstrap/dist/css/bootstrap.min.css';

/* ================= LINKS ================= */

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900',
  },
];

/* ================= META ================= */

export const meta: Route.MetaFunction = () => [
  { name: 'robots', content: 'noindex, nofollow' },
];

/* ================= LAYOUT ================= */

export function Layout({ children }: { children: React.ReactNode }) {
  const { init } = usePuterStore();
  const restore = useAuthStore((s) => s.restore);

  useEffect(() => {
    init(); // ✅ REQUIRED — initializes Puter session
  }, [init]);

  useEffect(() => {
    // Restore auth session from localStorage on app boot
    restore();
  }, [restore]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />

        {/* Puter Script */}
        <script src="https://js.puter.com/v2/"></script>
        {/* Bootstrap JS */}
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          crossOrigin="anonymous"
        ></script>
      </head>

      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/* ================= APP ================= */

export default function App() {
  return <Outlet />;
}

/* ================= ERROR ================= */

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Something went wrong';
  let details = 'An unexpected error occurred. Please try again.';
  let _statusCode = 500;
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    _statusCode = error.status;
    if (error.status === 404) {
      message = '404 — Page not found';
      details = 'The page you are looking for does not exist.';
    } else {
      message = `Error ${error.status}`;
      details = error.statusText || details;
    }
  } else if (import.meta.env.DEV && error instanceof Error) {
    message = 'Unexpected error';
    details = error.message;
    stack = error.stack;
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{message} | Resumind</title>
        <meta name="robots" content="noindex, nofollow" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-dark text-white">
        <div className="min-vh-100 d-flex align-items-center justify-content-center">
          <div className="text-center p-4" style={{ maxWidth: 500 }}>
            <div className="mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mb-3"
                style={{ width: 72, height: 72 }}
                role="img"
                aria-label="Error icon"
              >
                <svg
                  width="36"
                  height="36"
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
              <h1 className="h4 fw-bold text-white mb-2">{message}</h1>
              <p className="text-secondary mb-4">{details}</p>
            </div>

            {stack && import.meta.env.DEV && (
              <pre
                className="text-start p-3 rounded bg-dark border border-secondary text-danger small overflow-auto mb-4"
                style={{ maxHeight: 200 }}
              >
                {stack}
              </pre>
            )}

            <div className="d-flex gap-2 justify-content-center">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
              <a href="/dashboard" className="btn btn-primary btn-sm">
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
