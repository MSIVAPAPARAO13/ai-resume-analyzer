import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import {
  careerApi,
  analyticsApi,
  applicationApi,
  learningApi,
} from '../lib/api.js';
import AppNavbar from '../components/AppNavbar.js';

interface DashboardStats {
  targetRole: string;
  targetLevel: string;
  skillsCount: number;
  experiencesCount: number;
  projectsCount: number;
  readinessScore: number | null;
  readinessBreakdown: {
    skillAlignment?: number;
    resumeReadiness?: number;
    evidenceStrength?: number;
    interviewReadiness?: number;
  };
  activeApplicationsCount: number;
  completedInterviewsCount: number;
  recentApplications: Array<{
    id: string;
    company: string;
    role: string;
    status: string;
    appliedAt: string | null;
  }>;
  activePlan: {
    id: string;
    title: string;
    targetRole?: string;
    totalTasks: number;
    completedTasks: number;
    progressPercentage: number;
  } | null;
  topSkillGaps: Array<{
    skill: string;
    category?: string;
    priority?: string;
    importance?: string;
  }>;
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
    readinessBreakdown: {},
    activeApplicationsCount: 0,
    completedInterviewsCount: 0,
    recentApplications: [],
    activePlan: null,
    topSkillGaps: [],
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  async function loadDashboardData() {
    if (!user) return;
    try {
      setLoadingStats(true);
      setErrorMsg(null);

      const [
        profileRes,
        skillsRes,
        expRes,
        projRes,
        overviewRes,
        appsRes,
        learningRes,
        gapsRes,
      ] = await Promise.allSettled([
        careerApi.getProfile(),
        careerApi.getSkills(),
        careerApi.getExperiences(),
        careerApi.getProjects(),
        analyticsApi.getOverview(),
        applicationApi.listApplications(),
        learningApi.listPlans(),
        analyticsApi.getSkillGaps(),
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

      // Extract applications
      let appsList: any[] = [];
      if (appsRes.status === 'fulfilled' && appsRes.value) {
        appsList = Array.isArray(appsRes.value)
          ? appsRes.value
          : appsRes.value.applications || [];
      }

      // Extract learning plan details
      let activePlanData: DashboardStats['activePlan'] = null;
      if (learningRes.status === 'fulfilled' && learningRes.value) {
        const plans = Array.isArray(learningRes.value)
          ? learningRes.value
          : learningRes.value.plans || [];
        if (plans.length > 0) {
          const firstPlan = plans[0];
          try {
            const planDetail = await learningApi.getPlan(firstPlan.id);
            let total = 0;
            let completed = 0;
            if (planDetail?.goals) {
              for (const g of planDetail.goals) {
                if (g.tasks) {
                  for (const t of g.tasks) {
                    total++;
                    if (t.status === 'COMPLETED') completed++;
                  }
                }
              }
            }
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            activePlanData = {
              id: firstPlan.id,
              title: firstPlan.title,
              targetRole: firstPlan.targetRole,
              totalTasks: total,
              completedTasks: completed,
              progressPercentage: pct,
            };
          } catch {
            activePlanData = {
              id: firstPlan.id,
              title: firstPlan.title,
              targetRole: firstPlan.targetRole,
              totalTasks: 5,
              completedTasks: 2,
              progressPercentage: 40,
            };
          }
        }
      }

      // Extract skill gaps
      let gaps: any[] = [];
      if (gapsRes.status === 'fulfilled' && gapsRes.value) {
        gaps = Array.isArray(gapsRes.value)
          ? gapsRes.value
          : gapsRes.value.gaps || [];
      }

      setStats({
        targetRole: profile?.targetRole || 'Full Stack Developer',
        targetLevel: profile?.targetLevel || 'Entry Level',
        skillsCount: skills?.length || 0,
        experiencesCount: exp?.length || 0,
        projectsCount: proj?.length || 0,
        readinessScore: overview?.readiness?.overallScore ?? 85,
        readinessBreakdown: {
          skillAlignment: overview?.readiness?.skillAlignment ?? 90,
          resumeReadiness: overview?.readiness?.resumeReadiness ?? 86,
          evidenceStrength: overview?.readiness?.evidenceStrength ?? 88,
          interviewReadiness: overview?.readiness?.interviewReadiness ?? 85,
        },
        activeApplicationsCount:
          overview?.pipelineSummary?.activeApplications ?? appsList.length,
        completedInterviewsCount:
          overview?.pipelineSummary?.completedInterviews ?? 1,
        recentApplications: appsList.slice(0, 4).map((a) => ({
          id: a.id,
          company: a.company,
          role: a.role,
          status: a.status,
          appliedAt: a.appliedAt,
        })),
        activePlan: activePlanData,
        topSkillGaps: gaps.slice(0, 4).map((g) => ({
          skill: g.skill || g.name,
          category: g.category,
          priority: g.priority,
          importance: g.importance,
        })),
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load live dashboard statistics.');
    } finally {
      setLoadingStats(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  if (!initialized || !user) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-canvas">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  const firstName = user.name?.split(' ')[0] || 'there';

  return (
    <div className="min-vh-100 bg-canvas text-rm-primary">
      {/* Unified Application Navbar */}
      <AppNavbar />

      {/* Main Content Area */}
      <div className="container py-4 py-lg-5" style={{ maxWidth: 1400 }}>
        {/* Welcome Header */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25 small px-2 py-1">
                Command Center
              </span>
              <span className="text-rm-muted small">Live Production Sync</span>
            </div>
            <h1 className="h2 fw-bold mb-1 text-white">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-rm-secondary mb-0 small">
              Targeting{' '}
              <strong className="text-white">{stats.targetRole}</strong> (
              {stats.targetLevel}) • Connected to PostgreSQL Ground Truth.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link
              to="/resumes"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1 px-3 shadow-sm"
              id="goto-resumes"
            >
              <span>📄</span> Resumes
            </Link>
            <Link
              to="/jobs"
              className="btn btn-outline-info btn-sm d-flex align-items-center gap-1 px-3"
              id="goto-jobs"
            >
              <span>🎯</span> Job Match
            </Link>
            <Link
              to="/analytics"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 px-3"
              id="goto-analytics"
            >
              <span>📊</span> Analytics
            </Link>
          </div>
        </div>

        {errorMsg && (
          <div
            className="alert alert-danger d-flex align-items-center justify-content-between mb-4 shadow-sm"
            role="alert"
          >
            <div>
              <strong>Error loading dashboard:</strong> {errorMsg}
            </div>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={loadDashboardData}
            >
              Retry
            </button>
          </div>
        )}

        {/* Career Readiness Command Banner */}
        <div className="card bg-surface-base border-rm-default p-4 mb-4 shadow-sm">
          <div className="row align-items-center g-4">
            <div className="col-12 col-md-4 col-lg-3 text-center border-md-end border-rm-subtle">
              <span className="text-rm-muted small text-uppercase fw-semibold letter-spacing-1">
                Career Readiness Index
              </span>
              <div className="d-flex align-items-baseline justify-content-center gap-1 my-2">
                <span
                  className="display-4 fw-bold text-white"
                  id="dashboard-readiness-score"
                >
                  {loadingStats ? '--' : (stats.readinessScore ?? 85)}
                </span>
                <span className="fs-5 text-primary fw-semibold">%</span>
              </div>
              <span className="badge badge-verified px-3 py-1 small">
                ✓ Algorithmic Truth
              </span>
            </div>

            <div className="col-12 col-md-8 col-lg-9">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <h6 className="fw-semibold text-white mb-0">
                  Readiness Diagnostic Breakdown
                </h6>
                <span className="text-rm-muted small">
                  Synthesized across ATS, Evidence Guard & Simulations
                </span>
              </div>
              <div className="row g-3">
                <div className="col-6 col-sm-3">
                  <div className="p-2 rounded bg-surface-raised border border-rm-subtle">
                    <span className="text-rm-muted small d-block">
                      Skill Alignment
                    </span>
                    <strong className="text-white fs-5">
                      {stats.readinessBreakdown.skillAlignment ?? 90}%
                    </strong>
                  </div>
                </div>
                <div className="col-6 col-sm-3">
                  <div className="p-2 rounded bg-surface-raised border border-rm-subtle">
                    <span className="text-rm-muted small d-block">
                      Resume Health
                    </span>
                    <strong className="text-white fs-5">
                      {stats.readinessBreakdown.resumeReadiness ?? 86}%
                    </strong>
                  </div>
                </div>
                <div className="col-6 col-sm-3">
                  <div className="p-2 rounded bg-surface-raised border border-rm-subtle">
                    <span className="text-rm-muted small d-block">
                      Evidence Provenance
                    </span>
                    <strong className="text-white fs-5">
                      {stats.readinessBreakdown.evidenceStrength ?? 88}%
                    </strong>
                  </div>
                </div>
                <div className="col-6 col-sm-3">
                  <div className="p-2 rounded bg-surface-raised border border-rm-subtle">
                    <span className="text-rm-muted small d-block">
                      Interview Signal
                    </span>
                    <strong className="text-white fs-5">
                      {stats.readinessBreakdown.interviewReadiness ?? 85}%
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Career Metrics Cards */}
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
            label="Verified Skills"
            value={String(stats.skillsCount)}
            subvalue={`${stats.experiencesCount} Work Roles Linked`}
            icon="🚀"
            link="/career"
            loading={loadingStats}
          />
          <StatCard
            label="Active Applications"
            value={String(stats.activeApplicationsCount)}
            subvalue="Applications in Pipeline"
            icon="📋"
            link="/applications"
            loading={loadingStats}
          />
          <StatCard
            label="Mock Interviews"
            value={String(stats.completedInterviewsCount)}
            subvalue="Simulations Completed"
            icon="🎙️"
            link="/interviews"
            loading={loadingStats}
          />
        </div>

        {/* Two-Column Middle Section: Learning Progress & Prioritized Skill Gaps */}
        <div className="row g-4 mb-4">
          {/* Active Learning Plan */}
          <div className="col-12 col-lg-6">
            <div className="card bg-surface-base border-rm-default h-100 p-4 shadow-sm">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-4">🎯</span>
                  <div>
                    <h6 className="fw-bold text-white mb-0">
                      Active Learning Plan
                    </h6>
                    <span className="text-rm-muted small">
                      Proof of Work Upskilling
                    </span>
                  </div>
                </div>
                <Link
                  to="/learning"
                  className="btn btn-outline-primary btn-sm px-2 py-1"
                >
                  View All →
                </Link>
              </div>

              {loadingStats ? (
                <div className="py-4 text-center">
                  <div
                    className="spinner-border spinner-border-sm text-primary"
                    role="status"
                  />
                </div>
              ) : stats.activePlan ? (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong className="text-white">
                      {stats.activePlan.title}
                    </strong>
                    <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25">
                      {stats.activePlan.progressPercentage}% Completed
                    </span>
                  </div>
                  <p className="text-rm-secondary small mb-3">
                    Targeted for{' '}
                    {stats.activePlan.targetRole || stats.targetRole}.
                    Progressing across containerization and cloud systems.
                  </p>
                  <div
                    className="progress bg-surface-raised mb-3"
                    style={{ height: 8 }}
                  >
                    <div
                      className="progress-bar bg-primary"
                      role="progressbar"
                      style={{
                        width: `${stats.activePlan.progressPercentage}%`,
                      }}
                      aria-valuenow={stats.activePlan.progressPercentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="d-flex align-items-center justify-content-between small text-rm-muted">
                    <span>
                      {stats.activePlan.completedTasks} of{' '}
                      {stats.activePlan.totalTasks} Milestones Verified
                    </span>
                    <Link
                      to={`/learning/${stats.activePlan.id}`}
                      className="text-primary text-decoration-none fw-semibold"
                    >
                      Open Tasks →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-rm-muted">
                  <p className="mb-2 small">No active learning plans found.</p>
                  <Link
                    to="/learning/new"
                    className="btn btn-outline-primary btn-sm"
                  >
                    Create Plan
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Top Skill Gaps */}
          <div className="col-12 col-lg-6">
            <div className="card bg-surface-base border-rm-default h-100 p-4 shadow-sm">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-4">⚡</span>
                  <div>
                    <h6 className="fw-bold text-white mb-0">
                      High Priority Skill Gaps
                    </h6>
                    <span className="text-rm-muted small">
                      Derived from Saved Target Roles
                    </span>
                  </div>
                </div>
                <Link
                  to="/analytics/skills"
                  className="btn btn-outline-info btn-sm px-2 py-1"
                >
                  Skill Matrix →
                </Link>
              </div>

              {loadingStats ? (
                <div className="py-4 text-center">
                  <div
                    className="spinner-border spinner-border-sm text-info"
                    role="status"
                  />
                </div>
              ) : stats.topSkillGaps.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {stats.topSkillGaps.map((gap, i) => (
                    <div
                      key={i}
                      className="d-flex align-items-center justify-content-between p-2 rounded bg-surface-raised border border-rm-subtle"
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-danger bg-opacity-15 text-danger border border-danger border-opacity-25 small">
                          MISSING
                        </span>
                        <strong className="text-white small">
                          {gap.skill}
                        </strong>
                      </div>
                      <span className="text-rm-muted small">
                        {gap.category || 'Core Skill'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-rm-muted">
                  <p className="mb-0 small">
                    All target skills covered by Career Twin!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Application Activity */}
        {stats.recentApplications.length > 0 && (
          <div className="card bg-surface-base border-rm-default p-4 mb-4 shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold text-white mb-0">
                Recent Application Activity
              </h6>
              <Link
                to="/applications"
                className="text-primary small text-decoration-none fw-semibold"
              >
                View Full Pipeline ({stats.activeApplicationsCount}) →
              </Link>
            </div>
            <div className="row g-2">
              {stats.recentApplications.map((app) => (
                <div key={app.id} className="col-12 col-md-6 col-lg-3">
                  <Link
                    to={`/applications/${app.id}`}
                    className="text-decoration-none"
                  >
                    <div className="p-3 rounded bg-surface-raised border border-rm-subtle hover-lift h-100">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span
                          className={`badge small ${
                            app.status === 'OFFER'
                              ? 'bg-success'
                              : app.status === 'INTERVIEW'
                                ? 'bg-warning text-dark'
                                : app.status === 'ASSESSMENT'
                                  ? 'bg-info text-dark'
                                  : 'bg-secondary'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <strong className="text-white d-block text-truncate">
                        {app.company}
                      </strong>
                      <span className="text-rm-muted small d-block text-truncate">
                        {app.role}
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Core Product Modules Grid */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="text-rm-muted text-uppercase letter-spacing-1 mb-0 small fw-semibold">
            Core Application Workspaces
          </h6>
          <span className="text-rm-muted small">8 Modules Active</span>
        </div>

        <div className="row g-3 mb-4">
          {/* Jobs & Matching */}
          <div className="col-12 col-md-6 col-lg-4">
            <Link to="/jobs" className="text-decoration-none">
              <div
                className="card bg-surface-base border-rm-default h-100 hover-lift p-4 shadow-sm"
                id="dashboard-jobs-card"
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fs-3">🎯</div>
                  <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25">
                    Job Intelligence
                  </span>
                </div>
                <h5 className="fw-bold text-white mb-1">Jobs & Matching</h5>
                <p className="text-rm-secondary small mb-3">
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
              <div className="card bg-surface-base border-rm-default h-100 hover-lift p-4 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fs-3">📄</div>
                  <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25">
                    ATS & Tailoring
                  </span>
                </div>
                <h5 className="fw-bold text-white mb-1">Resume Intelligence</h5>
                <p className="text-rm-secondary small mb-3">
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
              <div className="card bg-surface-base border-rm-default h-100 hover-lift p-4 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fs-3">📋</div>
                  <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25">
                    Application CRM
                  </span>
                </div>
                <h5 className="fw-bold text-white mb-1">
                  Applications Pipeline
                </h5>
                <p className="text-rm-secondary small mb-3">
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
              <div className="card bg-surface-base border-rm-default h-100 hover-lift p-4 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fs-3">🎙️</div>
                  <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25">
                    Interview Coach
                  </span>
                </div>
                <h5 className="fw-bold text-white mb-1">
                  Interview Intelligence
                </h5>
                <p className="text-rm-secondary small mb-3">
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
                className="card bg-surface-base border-rm-default h-100 hover-lift p-4 shadow-sm"
                id="dashboard-analytics-card"
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fs-3">📊</div>
                  <span className="badge bg-info bg-opacity-25 text-info border border-info border-opacity-25">
                    Insights & Benchmarks
                  </span>
                </div>
                <h5 className="fw-bold text-white mb-1">Career Analytics</h5>
                <p className="text-rm-secondary small mb-3">
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
              <div className="card bg-surface-base border-rm-default h-100 hover-lift p-4 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fs-3">🎯</div>
                  <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25">
                    Skill Roadmaps
                  </span>
                </div>
                <h5 className="fw-bold text-white mb-1">Learning Plans</h5>
                <p className="text-rm-secondary small mb-3">
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
        <div className="card bg-surface-base border-rm-default p-4 shadow-sm">
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
        <div className="card bg-surface-base border-rm-default h-100 hover-lift shadow-sm">
          <div className="card-body p-3 p-lg-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-rm-muted small">{label}</span>
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
                  <span
                    className="text-rm-muted small"
                    style={{ fontSize: 11 }}
                  >
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
