import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { githubApi } from '../lib/api.js';

interface GitHubStatus {
  connected: boolean;
  username?: string;
  avatarUrl?: string;
  repositoryCount?: number;
  connectedAt?: string;
  lastUpdatedAt?: string;
}

export default function IntegrationsPage() {
  const { user, initialized, logout } = useAuthStore();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && user) {
      if (searchParams.get('connected') === 'true') {
        setMessage('GitHub account successfully connected!');
      }
      loadStatus();
    }
  }, [initialized, user]);

  async function loadStatus() {
    try {
      setLoading(true);
      setError(null);
      const data = await githubApi.getConnectionStatus();
      setStatus(data);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to load integration status.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    try {
      setConnecting(true);
      setError(null);
      const res = await githubApi.getConnectUrl();
      if (res && res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to initialize GitHub connection.',
      );
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (
      !confirm(
        'Disconnect GitHub? This will remove synced repositories from your cache, but imported Career Twin projects will remain preserved.',
      )
    )
      return;
    try {
      setDisconnecting(true);
      await githubApi.disconnect();
      setStatus({ connected: false });
      setMessage('GitHub account disconnected.');
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Failed to disconnect GitHub.',
      );
    } finally {
      setDisconnecting(false);
    }
  }

  if (!initialized || !user) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-dark text-white">
      {/* Top Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link
            to="/dashboard"
            className="navbar-brand fw-bold text-primary mb-0"
          >
            Resumind
          </Link>
          <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary">
            Integrations
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link to="/applications" className="btn btn-outline-secondary btn-sm">
            Applications CRM
          </Link>
          <Link to="/jobs" className="btn btn-outline-secondary btn-sm">
            Jobs & Matching
          </Link>
          <Link to="/career" className="btn btn-outline-secondary btn-sm">
            Career Twin
          </Link>
          <button
            onClick={() => logout()}
            className="btn btn-outline-danger btn-sm ms-2"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="container py-5" style={{ maxWidth: 900 }}>
        <div className="mb-4">
          <h1 className="h3 fw-bold mb-1">External Integrations</h1>
          <p className="text-secondary small mb-0">
            Connect developer platforms to extract verified career evidence,
            showcase open-source projects, and enrich your Career Twin.
          </p>
        </div>

        {message && (
          <div
            className="alert alert-success alert-dismissible fade show"
            role="alert"
          >
            {message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setMessage(null)}
            />
          </div>
        )}

        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
          >
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError(null)}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : (
          <div className="card bg-dark border-secondary p-4 shadow-sm mb-4">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
              <div className="d-flex align-items-start gap-3">
                <div
                  className="rounded-circle bg-secondary bg-opacity-25 d-flex align-items-center justify-content-center p-3 text-white"
                  style={{ width: 64, height: 64, fontSize: 32 }}
                >
                  🐙
                </div>

                <div>
                  <div className="d-flex align-items-center gap-2">
                    <h4 className="fw-bold text-white mb-0">GitHub</h4>
                    {status?.connected ? (
                      <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50">
                        Connected
                      </span>
                    ) : (
                      <span className="badge bg-secondary bg-opacity-25 text-secondary border border-secondary">
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-secondary small mt-1 mb-0 col-md-10">
                    Import your repositories, extract verified languages &
                    technologies, and integrate project evidence into your
                    Career Twin with user approval.
                  </p>
                </div>
              </div>

              <div>
                {status?.connected ? (
                  <div className="d-flex align-items-center gap-2">
                    <Link
                      to="/github/repositories"
                      className="btn btn-primary btn-sm"
                      id="view-repos-btn"
                    >
                      View Repositories ({status.repositoryCount || 0})
                    </Link>
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="btn btn-outline-danger btn-sm"
                      id="disconnect-github-btn"
                    >
                      {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                    id="connect-github-btn"
                  >
                    <span>🐙</span>
                    {connecting ? 'Connecting to GitHub…' : 'Connect GitHub'}
                  </button>
                )}
              </div>
            </div>

            {/* Connected Details Box */}
            {status?.connected && (
              <div className="mt-4 pt-3 border-top border-secondary d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-3">
                  {status.avatarUrl && (
                    <img
                      src={status.avatarUrl}
                      alt={status.username}
                      className="rounded-circle border border-secondary"
                      style={{ width: 44, height: 44 }}
                    />
                  )}
                  <div>
                    <span className="fw-semibold text-white d-block">
                      @{status.username}
                    </span>
                    <span className="text-secondary small">
                      {status.repositoryCount || 0} repositories synced
                    </span>
                  </div>
                </div>

                <div className="text-secondary small">
                  Evidence Guard Status:{' '}
                  <span className="text-info fw-semibold">
                    External GitHub Evidence Enabled
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security & Evidence Notice */}
        <div className="card bg-dark border-secondary p-3 bg-opacity-50">
          <h6 className="fw-bold text-white small mb-1">
            🔒 Career Evidence & Privacy Guarantee
          </h6>
          <ul className="text-secondary small mb-0 ps-3">
            <li>
              Resumind never modifies your Career Twin automatically.
              Repositories must be explicitly reviewed and approved by you
              before being added.
            </li>
            <li>
              GitHub tokens are stored using AES-256 server-side encryption and
              never exposed to the browser.
            </li>
            <li>
              The Evidence Guard classifies raw GitHub repository metadata as{' '}
              <code>EXTERNAL_SOURCE</code>, distinguishing it from verified user
              claims.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
