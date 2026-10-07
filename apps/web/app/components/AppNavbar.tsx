import { Link, useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';

interface NavItem {
  to: string;
  label: string;
  icon?: string;
  id?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠', id: 'nav-dashboard' },
  { to: '/career', label: 'Career Twin', icon: '💼', id: 'nav-career' },
  { to: '/resumes', label: 'Resumes', icon: '📄', id: 'nav-resumes' },
  { to: '/jobs', label: 'Jobs & Matching', icon: '🎯', id: 'nav-jobs' },
  {
    to: '/applications',
    label: 'Applications',
    icon: '📋',
    id: 'nav-applications',
  },
  { to: '/interviews', label: 'Interviews', icon: '🎙️', id: 'nav-interviews' },
  { to: '/analytics', label: 'Analytics', icon: '📊', id: 'nav-analytics' },
  { to: '/learning', label: 'Learning', icon: '🎯', id: 'nav-learning' },
  {
    to: '/integrations',
    label: 'Integrations',
    icon: '🔌',
    id: 'nav-integrations',
  },
];

export default function AppNavbar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email
      ? user.email[0].toUpperCase()
      : 'U';

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary px-3 px-lg-4 sticky-top"
      role="navigation"
      aria-label="Main Application Navigation"
    >
      <div className="container-fluid px-0">
        <Link
          to="/dashboard"
          className="navbar-brand fw-bold text-primary d-flex align-items-center gap-2 me-3 me-xl-4"
        >
          <div
            className="d-inline-flex align-items-center justify-content-center rounded bg-primary bg-opacity-25 text-primary"
            style={{ width: 28, height: 28, fontSize: 14 }}
            aria-hidden="true"
          >
            ✦
          </div>
          <span>Resumind</span>
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler border-secondary"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#app-navbar-collapse"
          aria-controls="app-navbar-collapse"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* Collapsible Content */}
        <div className="collapse navbar-collapse" id="app-navbar-collapse">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1 gap-xl-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.to === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.to);

              return (
                <li key={item.to} className="nav-item">
                  <Link
                    to={item.to}
                    id={item.id}
                    className={`nav-link px-2 py-1 rounded small d-flex align-items-center gap-1 ${
                      isActive
                        ? 'active bg-primary bg-opacity-10 text-primary fw-semibold'
                        : 'text-secondary hover-text-white'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* User Profile & Actions */}
          <div className="d-flex align-items-center gap-3 pt-2 pt-lg-0 border-top border-secondary border-lg-0">
            <div className="dropdown">
              <button
                className="btn btn-dark border-secondary dropdown-toggle d-flex align-items-center gap-2 py-1 px-2"
                type="button"
                data-bs-toggle="dropdown"
                id="user-menu"
                aria-expanded="false"
              >
                <div
                  className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{ width: 28, height: 28, fontSize: 12 }}
                  aria-hidden="true"
                >
                  {initials}
                </div>
                <span
                  className="text-secondary small d-none d-sm-inline text-truncate"
                  style={{ maxWidth: 160 }}
                >
                  {user?.name || user?.email || 'Account'}
                </span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end bg-dark border-secondary shadow-lg">
                <li className="px-3 py-2 border-bottom border-secondary text-secondary small">
                  <div className="fw-semibold text-white">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-truncate" style={{ maxWidth: 200 }}>
                    {user?.email}
                  </div>
                </li>
                <li>
                  <Link
                    to="/career"
                    className="dropdown-item text-white small py-2"
                  >
                    💼 Career Twin Profile
                  </Link>
                </li>
                <li>
                  <Link
                    to="/integrations"
                    className="dropdown-item text-white small py-2"
                  >
                    🔌 Connected Integrations
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider border-secondary" />
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger small py-2"
                    onClick={handleLogout}
                    id="logout-btn"
                  >
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
