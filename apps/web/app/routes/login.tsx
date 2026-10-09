import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';

export function meta() {
  return [
    { title: 'Sign In | Resumind' },
    {
      name: 'description',
      content: 'Sign in to your Resumind AI career intelligence workspace.',
    },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'Sign In | Resumind' },
    {
      property: 'og:description',
      content: 'Sign in to your Resumind AI career intelligence workspace.',
    },
    { property: 'og:type', content: 'website' },
  ];
}

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
            <Link to="/" className="text-decoration-none d-inline-block">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-25 text-primary border border-primary border-opacity-30 shadow-sm mb-3"
                style={{ width: 48, height: 48, fontSize: 22 }}
              >
                ✦
              </div>
            </Link>
            <h4 className="text-white fw-bold mb-1 tracking-tight">Welcome back</h4>
            <p className="text-secondary small">
              Sign in to your Resumind workspace
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
