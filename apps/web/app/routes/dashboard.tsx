import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';

const UPCOMING_MODULES = [
  {
    icon: '💼',
    label: 'Job Tracker',
    desc: 'Track applications & matches',
    route: '/jobs',
    phase: 4,
  },
  {
    icon: '📝',
    label: 'Interview Prep',
    desc: 'AI-powered interview coach',
    route: '/interviews',
    phase: 5,
  },
  {
    icon: '📊',
    label: 'Analytics',
    desc: 'Career insights & benchmarks',
    route: '/analytics',
    phase: 6,
  },
];

export default function DashboardPage() {
  const { user, logout, initialized } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  if (!initialized || !user) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <div className="min-vh-100 bg-dark text-white">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4">
        <Link to="/dashboard" className="navbar-brand fw-bold text-primary">
          Resumind
        </Link>
        <div className="d-flex align-items-center gap-3">
          <Link
            to="/applications"
            className="btn btn-outline-info btn-sm"
            id="goto-applications"
          >
            📋 Applications
          </Link>
          <Link
            to="/jobs"
            className="btn btn-outline-primary btn-sm"
            id="goto-jobs"
          >
            🎯 Jobs & Matching
          </Link>
          <Link
            to="/resumes"
            className="btn btn-outline-secondary btn-sm"
            id="goto-resumes"
          >
            Resumes ⚡
          </Link>
          <Link
            to="/interviews"
            className="btn btn-outline-warning btn-sm"
            id="goto-interviews"
          >
            🎙️ Interviews
          </Link>
          <Link to="/career" className="btn btn-outline-secondary btn-sm">
            Career Twin
          </Link>
          <Link to="/integrations" className="btn btn-outline-secondary btn-sm">
            🐙 GitHub
          </Link>
          <div className="dropdown">
            <button
              className="btn btn-dark border-secondary dropdown-toggle d-flex align-items-center gap-2"
              type="button"
              data-bs-toggle="dropdown"
              id="user-menu"
            >
              <div
                className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
                style={{ width: 32, height: 32, fontSize: 13 }}
              >
                {initials}
              </div>
              <span className="text-secondary small">
                {user.name || user.email}
              </span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end bg-dark border-secondary">
              <li>
                <button
                  className="dropdown-item text-danger"
                  onClick={handleLogout}
                  id="logout-btn"
                >
                  Sign out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container py-5">
        {/* Welcome */}
        <div className="mb-5">
          <h1 className="display-6 fw-bold">
            Welcome back, {user.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-secondary">Here's your career overview.</p>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-5">
          <StatCard
            label="Target Role"
            value="Not set"
            icon="🎯"
            link="/career"
          />
          <StatCard label="Experiences" value="0" icon="💼" link="/career" />
          <StatCard label="Projects" value="0" icon="🚀" link="/career" />
          <StatCard label="Skills" value="0" icon="⚡" link="/career" />
        </div>

        {/* Career Twin CTA */}
        <div className="card bg-primary bg-opacity-10 border border-primary mb-5">
          <div className="card-body d-flex align-items-center justify-content-between flex-wrap gap-3 p-4">
            <div>
              <h5 className="fw-bold mb-1">Build your Career Twin</h5>
              <p className="text-secondary mb-0 small">
                Your Career Twin is the verified source of truth for your
                career. Add your experience, education, projects, and skills.
              </p>
            </div>
            <Link
              to="/career"
              className="btn btn-primary px-4"
              id="goto-career"
            >
              Open Career Twin →
            </Link>
          </div>
        </div>

        {/* Active Modules */}
        <h6 className="text-secondary text-uppercase letter-spacing-1 mb-3 small">
          Active Modules
        </h6>
        <div className="row g-3 mb-5">
          <div className="col-12 col-md-4">
            <Link to="/jobs" className="text-decoration-none">
              <div
                className="card bg-dark border-primary h-100 hover-lift p-4 shadow-sm"
                id="dashboard-jobs-card"
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fs-2">🎯</div>
                  <span className="badge bg-primary">Phase 4 · Active</span>
                </div>
                <h5 className="fw-bold text-white mb-1">Job Intelligence</h5>
                <p className="text-secondary small mb-3">
                  Parse Job Descriptions into Job DNA, extract required skills,
                  and calculate explainable resume match scores.
                </p>
                <span className="text-primary small fw-semibold">
                  Open Jobs & Matching →
                </span>
              </div>
            </Link>
          </div>
          <div className="col-12 col-md-4">
            <Link to="/resumes" className="text-decoration-none">
              <div className="card bg-dark border-primary border-opacity-50 h-100 hover-lift p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fs-2">📄</div>
                  <span className="badge bg-primary">Phase 3 · Active</span>
                </div>
                <h5 className="fw-bold text-white mb-1">Resume Intelligence</h5>
                <p className="text-secondary small mb-3">
                  Upload resumes (PDF/DOCX), parse structured sections, generate
                  explainable ATS scores, and compare with your Career Twin.
                </p>
                <span className="text-primary small fw-semibold">
                  Open Resumes →
                </span>
              </div>
            </Link>
          </div>
          <div className="col-12 col-md-4">
            <Link to="/career" className="text-decoration-none">
              <div className="card bg-dark border-secondary h-100 hover-lift p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fs-2">💼</div>
                  <span className="badge bg-success bg-opacity-25 text-success">
                    Phase 2 · Active
                  </span>
                </div>
                <h5 className="fw-bold text-white mb-1">Career Twin</h5>
                <p className="text-secondary small mb-3">
                  Your verified source of truth for work experiences, skills,
                  education, projects, certifications, and achievements.
                </p>
                <span className="text-primary small fw-semibold">
                  Manage Career Twin →
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Future Modules */}
        <h6 className="text-secondary text-uppercase letter-spacing-1 mb-3 small">
          Coming in future phases
        </h6>
        <div className="row g-3">
          {UPCOMING_MODULES.map((m) => (
            <div key={m.label} className="col-12 col-sm-6 col-lg-4">
              <div className="card bg-dark border-secondary h-100 opacity-50">
                <div className="card-body p-4">
                  <div className="fs-3 mb-2">{m.icon}</div>
                  <h6 className="fw-semibold text-white mb-1">{m.label}</h6>
                  <p className="text-secondary small mb-2">{m.desc}</p>
                  <span className="badge bg-secondary">Phase {m.phase}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  link,
}: {
  label: string;
  value: string;
  icon: string;
  link: string;
}) {
  return (
    <div className="col-6 col-lg-3">
      <Link to={link} className="text-decoration-none">
        <div className="card bg-dark border-secondary h-100 hover-lift">
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small">{label}</span>
              <span className="fs-5">{icon}</span>
            </div>
            <p className="fs-4 fw-bold text-white mb-0">{value}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}
