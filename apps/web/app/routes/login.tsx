import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';

export default function LoginPage() {
  const { login, user, loading, initialized } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialized && user) {
      navigate('/dashboard');
    }
  }, [user, initialized, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        'Login failed. Please try again.';
      setError(msg);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
      <div
        className="card bg-dark border-secondary shadow-lg"
        style={{ width: '100%', maxWidth: '420px' }}
      >
        <div className="card-body p-5">
          {/* Logo */}
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mb-3"
              style={{ width: 56, height: 56 }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 12h6M9 16h6M9 8h6M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                  stroke="#0d6efd"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h4 className="text-white fw-bold mb-1">Welcome back</h4>
            <p className="text-secondary small">
              Sign in to your Resumind account
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label
                htmlFor="email"
                className="form-label text-secondary small"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="form-control bg-dark border-secondary text-white"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="password"
                className="form-label text-secondary small"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-control bg-dark border-secondary text-white"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              id="login-submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                />
              ) : null}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <hr className="border-secondary my-4" />
          <p className="text-center text-secondary small mb-0">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary text-decoration-none fw-semibold"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
