import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';

export function meta() {
  return [
    { title: 'Create Account | Resumind' },
    {
      name: 'description',
      content:
        'Create your Resumind account to analyze resumes and accelerate your career.',
    },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'Create Account | Resumind' },
    {
      property: 'og:description',
      content:
        'Create your Resumind account to analyze resumes and accelerate your career.',
    },
    { property: 'og:type', content: 'website' },
  ];
}

export default function RegisterPage() {
  const { register, user, loading, initialized } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialized && user) {
      navigate('/dashboard');
    }
  }, [user, initialized, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        'Registration failed. Please try again.';
      setError(msg);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
      <div
        className="card bg-dark border-secondary shadow-lg"
        style={{ width: '100%', maxWidth: '460px' }}
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
            <h4 className="text-white fw-bold mb-1 tracking-tight">Create your account</h4>
            <p className="text-secondary small">
              Start building your Career Twin today
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="name" className="form-label text-secondary small">
                Full name
              </label>
              <input
                id="name"
                type="text"
                className="form-control bg-dark border-secondary text-white"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
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
            <div className="mb-3">
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
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="confirmPassword"
                className="form-label text-secondary small"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="form-control bg-dark border-secondary text-white"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              id="register-submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                />
              ) : null}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <hr className="border-secondary my-4" />
          <p className="text-center text-secondary small mb-0">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary text-decoration-none fw-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
