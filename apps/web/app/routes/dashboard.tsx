import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { careerApi, analyticsApi } from '../lib/api.js';
import AppNavbar from '../components/AppNavbar.js';

interface DashboardStats {
  targetRole: string;
  targetLevel: string;
  skillsCount: number;
  experiencesCount: number;
  projectsCount: number;
  readinessScore: number | null;
  activeApplicationsCount: number;
  completedInterviewsCount: number;
}

export default function DashboardPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    targetRole: 'Not set',
    targetLevel: 'Entry',
    skillsCount: 0,
    experiencesCount: 0,
    projectsCount: 0,
    readinessScore: null,
    activeApplicationsCount: 0,
    completedInterviewsCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    if (!user) return;
    async function loadDashboardData() {
      try {
        setLoadingStats(true);
        const [profileRes, skillsRes, expRes, projRes, overviewRes] =
          await Promise.allSettled([
            careerApi.getProfile(),
            careerApi.getSkills(),
            careerApi.getExperiences(),
            careerApi.getProjects(),
            analyticsApi.getOverview(),
          ]);

        const profile =
          profileRes.status === 'fulfilled' ? profileRes.value?.profile : null;
        const skills =
          skillsRes.status === 'fulfilled' ? skillsRes.value?.skills : [];
        const exp =
          expRes.status === 'fulfilled' ? expRes.value?.experiences : [];
        const proj =
          projRes.status === 'fulfilled' ? projRes.value?.projects : [];
        const overview =
          overviewRes.status === 'fulfilled' ? overviewRes.value : null;

        setStats({
          targetRole: profile?.targetRole || 'Not specified',
          targetLevel: profile?.targetLevel || 'Entry',
          skillsCount: skills?.length || 0,
          experiencesCount: exp?.length || 0,
          projectsCount: proj?.length || 0,
          readinessScore: overview?.readiness?.overallScore ?? null,
          activeApplicationsCount:
            overview?.pipelineSummary?.activeApplications ?? 0,
          completedInterviewsCount:
            overview?.pipelineSummary?.completedInterviews ?? 0,
        });
      } catch {
        // Fallback to default state gracefully
      } finally {
        setLoadingStats(false);
      }
    }

    loadDashboardData();
  }, [user]);

  if (!initialized || !user) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  const firstName = user.name?.split(' ')[0] || 'there';

  return (
    <div className="min-vh-100 bg-dark text-white">
      {/* Unified Application Navbar */}
      <AppNavbar />

      {/* Main Content Area */}
      <div className="container py-4 py-lg-5">
        {/* Welcome Header */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="h2 fw-bold mb-1">Welcome back, {firstName} 👋</h1>
            <p className="text-secondary mb-0">
              Your AI-powered career twin and application command center.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link
              to="/analytics"
              className="btn btn-outline-info btn-sm d-flex align-items-center gap-1"
              id="goto-analytics"
            >
              <span>📊</span> Analytics
            </Link>
            <Link
              to="/resumes"
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
              id="goto-resumes"
            >
              <span>📄</span> Resumes
            </Link>
          </div>
        </div>

        {/* Live Career Metrics */}
        <div className="row g-3 mb-4">
          <StatCard
            label="Target Role"
            value={stats.targetRole}
            subvalue={stats.targetLevel}
            icon="🎯"
            link="/career"
            loading={loadingStats}
          />
          <StatCard
            label="Career Readiness"
            value={
              stats.readinessScore !== null
                ? `${stats.readinessScore}%`
                : 'Pending'
            }
            subvalue="Overall alignment"
            icon="⚡"
            link="/analytics"
            loading={loadingStats}
          />
          <StatCard
            label="Verified Skills"
            value={String(stats.skillsCount)}
            subvalue="Career Twin skills"
            icon="🚀"
            link="/career"
            loading={loadingStats}
          />
          <StatCard
            label="Active Applications"
            value={String(stats.activeApplicationsCount)}
            subvalue={`${stats.completedInterviewsCount} interviews completed`}
            icon="📋"
            link="/applications"
            loading={loadingStats}
          />
        </div>

        {/* Career Twin Call to Action */}
        <div className="card bg-primary bg-opacity-10 border border-primary border-opacity-50 mb-5 shadow-sm">
          <div className="card-body d-flex align-items-center justify-content-between flex-wrap gap-3 p-4">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-primary">Source of Truth</span>
                <h5 className="fw-bold mb-0">Ground Your Career Twin</h5>
              </div>
              <p
                className="text-secondary mb-0 small"
                style={{ maxWidth: 640 }}
              >
                Your Career Twin provides verified evidence for resume
                tailoring, ATS matching, and interview simulations. Add verified
                work experiences, skills, and projects.
              </p>
            </div>
            <Link
              to="/career"
              className="btn btn-primary px-4 fw-semibold"
              id="goto-career"
            >
              Manage Career Twin →
            </Link>
          </div>
        </div>

        {/* Core Product Modules */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="text-secondary text-uppercase letter-spacing-1 mb-0 small fw-semibold">
            Core Application Workspaces
          </h6>
          <span className="text-muted small">8 Modules Active</span>
        </div>

        <div className="row g-3 mb-5">
          {/* Jobs & Matching */}
          <div className="col-12 col-md-6 col-lg-4">
            <Link to="/jobs" className="text-decoration-none">
              <div
                className="card bg-dark border-secondary h-100 hover-lift p-4 shadow-sm"
                id="dashboard-jobs-card"
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fs-3">🎯</div>
                  <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25">
                    Job Intelligence
                  </span>
                </div>
                <h5 className="fw-bold text-white mb-1">Jobs & Matching</h5>
                <p className="text-secondary small mb-3">
                  Parse job descriptions into Job DNA, extract required
                  capabilities, and calculate explainable match scores.
                </p>
                <span className="text-primary small fw-semibold">
                  Explore Target Jobs →
                </span>
              </div>
            </Link>
          </div>

          {/* Resumes */}
          <div className="col-12 col-md-6 col-lg-4">
            <Link to="/resumes" className="text-decoration-none">
              <div className="card bg-dark border-secondary h-100 hover-lift p-4 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fs-3">📄</div>
                  <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25">
                    ATS & Tailoring
                  </span>
                </div>
                <h5 className="fw-bold text-white mb-1">Resume Intelligence</h5>
                <p className="text-secondary small mb-3">
                  Upload PDF/DOCX resumes, inspect ATS readiness, and generate
                  evidence-grounded revisions tailored to jobs.
                </p>
                <span className="text-primary small fw-semibold">
                  Manage Resumes →
                </span>
              </div>
            </Link>
          </div>

          {/* Applications CRM */}
          <div className="col-12 col-md-6 col-lg-4">
            <Link to="/applications" className="text-decoration-none">
              <div className="card bg-dark border-secondary h-100 hover-lift p-4 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fs-3">📋</div>
                  <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25">
                    Application CRM
                  </span>
                </div>
                <h5 className="fw-bold text-white mb-1">
                  Applications Pipeline
                </h5>
                <p className="text-secondary small mb-3">
                  Track stages from Saved to Offer, schedule follow-ups, and
                  link tailored resumes to each submission.
                </p>
                <span className="text-success small fw-semibold">
                  View Pipeline →
                </span>
              </div>
            </Link>
          </div>

          {/* Interview Intelligence */}
          <div className="col-12 col-md-6 col-lg-4">
            <Link to="/interviews" className="text-decoration-none">
              <div className="card bg-dark border-secondary h-100 hover-lift p-4 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fs-3">🎙️</div>
                  <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25">
                    Interview Coach
                  </span>
                </div>
                <h5 className="fw-bold text-white mb-1">
                  Interview Intelligence
                </h5>
                <p className="text-secondary small mb-3">
                  Practice job-tailored STAR questions, run real-time mock
                  interviews, and evaluate answers against evidence.
                </p>
                <span className="text-warning small fw-semibold">
                  Practice Interviews →
                </span>
              </div>
            </Link>
          </div>

          {/* Career Analytics */}
          <div className="col-12 col-md-6 col-lg-4">
            <Link to="/analytics" className="text-decoration-none">
              <div
                className="card bg-dark border-secondary h-100 hover-lift p-4 shadow-sm"
                id="dashboard-analytics-card"
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fs-3">📊</div>
                  <span className="badge bg-info bg-opacity-25 text-info border border-info border-opacity-25">
                    Insights & Benchmarks
                  </span>
                </div>
                <h5 className="fw-bold text-white mb-1">Career Analytics</h5>
                <p className="text-secondary small mb-3">
                  Inspect career readiness scores, radar coverage, target role
                  skill gaps, and evidence verification strength.
                </p>
                <span className="text-info small fw-semibold">
                  View Analytics →
                </span>
              </div>
            </Link>
          </div>

          {/* Learning Roadmaps */}
          <div className="col-12 col-md-6 col-lg-4">
            <Link to="/learning" className="text-decoration-none">
              <div className="card bg-dark border-secondary h-100 hover-lift p-4 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fs-3">🎯</div>
                  <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25">
                    Skill Roadmaps
                  </span>
                </div>
                <h5 className="fw-bold text-white mb-1">Learning Plans</h5>
                <p className="text-secondary small mb-3">
                  Turn high-priority skill gaps into structured learning goals
                  with actionable tasks and evidence checkpoints.
                </p>
                <span className="text-success small fw-semibold">
                  Open Learning Plans →
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Quick Action Navigation Bar */}
        <div className="card bg-dark border-secondary p-4 shadow-sm">
          <h6 className="fw-bold text-white mb-3">Fast Actions</h6>
          <div className="d-flex flex-wrap gap-2">
            <Link
              to="/jobs"
              className="btn btn-outline-primary btn-sm"
              id="goto-jobs"
            >
              + Add / Match Job
            </Link>
            <Link
              to="/applications"
              className="btn btn-outline-secondary btn-sm"
              id="goto-applications"
            >
              + Track Application
            </Link>
            <Link
              to="/interviews"
              className="btn btn-outline-warning btn-sm"
              id="goto-interviews"
            >
              + Start Interview Session
            </Link>
            <Link
              to="/learning"
              className="btn btn-outline-success btn-sm"
              id="goto-learning"
            >
              + Create Learning Plan
            </Link>
            <Link
              to="/integrations"
              className="btn btn-outline-info btn-sm"
              id="goto-integrations"
            >
              🔌 Connect GitHub / Calendar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subvalue,
  icon,
  link,
  loading,
}: {
  label: string;
  value: string;
  subvalue?: string;
  icon: string;
  link: string;
  loading?: boolean;
}) {
  return (
    <div className="col-6 col-lg-3">
      <Link to={link} className="text-decoration-none">
        <div className="card bg-dark border-secondary h-100 hover-lift">
          <div className="card-body p-3 p-lg-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small">{label}</span>
              <span className="fs-5" aria-hidden="true">
                {icon}
              </span>
            </div>
            {loading ? (
              <div
                className="spinner-border spinner-border-sm text-secondary"
                role="status"
              />
            ) : (
              <div>
                <p className="fs-4 fw-bold text-white mb-0 text-truncate">
                  {value}
                </p>
                {subvalue && (
                  <span className="text-muted small" style={{ fontSize: 11 }}>
                    {subvalue}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
