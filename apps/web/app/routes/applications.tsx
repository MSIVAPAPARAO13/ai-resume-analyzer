import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { applicationApi } from '../lib/api.js';
import AppNavbar from '../components/AppNavbar.js';

interface ApplicationItem {
  id: string;
  company: string;
  role: string;
  status:
    | 'SAVED'
    | 'APPLIED'
    | 'ASSESSMENT'
    | 'INTERVIEW'
    | 'OFFER'
    | 'REJECTED'
    | 'WITHDRAWN';
  jobUrl?: string | null;
  appliedAt?: string | null;
  followUpAt?: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: string;
    title: string;
    company: string;
    location?: string | null;
  } | null;
  resumeVersion?: {
    id: string;
    versionNumber: number;
    resume?: {
      id: string;
      title: string;
    } | null;
  } | null;
}

interface AnalyticsData {
  totalApplications: number;
  statusCounts: Record<string, number>;
  applicationToInterviewRate: number;
  offerRate: number;
  averageMatchScore: number | null;
  resumeVersionUsage: Array<{
    title: string;
    versionNumber: number;
    count: number;
  }>;
}

const STATUS_COLUMNS = [
  { key: 'SAVED', label: 'Saved', color: 'secondary', icon: '📌' },
  { key: 'APPLIED', label: 'Applied', color: 'primary', icon: '📨' },
  { key: 'ASSESSMENT', label: 'Assessment', color: 'info', icon: '📝' },
  { key: 'INTERVIEW', label: 'Interview', color: 'warning', icon: '🎙️' },
  { key: 'OFFER', label: 'Offer', color: 'success', icon: '🎉' },
  { key: 'REJECTED', label: 'Rejected', color: 'danger', icon: '❌' },
];

export default function ApplicationsPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    if (initialized && user) {
      loadData();
    }
  }, [initialized, user]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [appsData, analyticsData] = await Promise.all([
        applicationApi.listApplications(),
        applicationApi.getAnalytics(),
      ]);
      setApplications(appsData);
      setAnalytics(analyticsData);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Failed to load applications.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickStatusChange(
    id: string,
    newStatus: string,
    e: React.ChangeEvent<HTMLSelectElement>,
  ) {
    e.stopPropagation();
    try {
      await applicationApi.updateStatus(id, newStatus);
      await loadData();
    } catch (err: any) {
      alert(
        err.response?.data?.error?.message ||
          'Failed to update application status.',
      );
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      await applicationApi.deleteApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      loadData();
    } catch {
      alert('Failed to delete application.');
    }
  }

  if (!initialized || !user) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      !search ||
      app.company.toLowerCase().includes(search.toLowerCase()) ||
      app.role.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-vh-100 bg-dark text-white">
      <AppNavbar />

      <div className="container-fluid px-4 py-4">
        {/* Header & Page Title */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">Job Application CRM</h1>
            <p className="text-secondary small mb-0">
              Manage your end-to-end application lifecycle, linked resumes, and
              interview timeline.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link
              to="/applications/new"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1"
              id="create-application-btn"
            >
              <span>+</span> New Application
            </Link>
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setViewMode('kanban')}
                id="view-kanban-btn"
              >
                📋 Kanban Board
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setViewMode('list')}
                id="view-list-btn"
              >
                📑 Table List
              </button>
            </div>
            <button
              onClick={loadData}
              className="btn btn-outline-secondary btn-sm"
              title="Refresh"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Error Alert */}
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

        {/* Analytics Cards */}
        {analytics && (
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-2">
              <div className="card bg-dark border-secondary h-100 p-3">
                <span className="text-secondary small">Total Applications</span>
                <span
                  className="h4 fw-bold text-white mt-1 mb-0"
                  id="total-apps-count"
                >
                  {analytics.totalApplications}
                </span>
              </div>
            </div>
            <div className="col-6 col-md-2">
              <div className="card bg-dark border-secondary h-100 p-3">
                <span className="text-secondary small">Applied</span>
                <span className="h4 fw-bold text-primary mt-1 mb-0">
                  {analytics.statusCounts.APPLIED || 0}
                </span>
              </div>
            </div>
            <div className="col-6 col-md-2">
              <div className="card bg-dark border-secondary h-100 p-3">
                <span className="text-secondary small">Interviews</span>
                <span className="h4 fw-bold text-warning mt-1 mb-0">
                  {analytics.statusCounts.INTERVIEW || 0}
                </span>
              </div>
            </div>
            <div className="col-6 col-md-2">
              <div className="card bg-dark border-secondary h-100 p-3">
                <span className="text-secondary small">Offers</span>
                <span className="h4 fw-bold text-success mt-1 mb-0">
                  {analytics.statusCounts.OFFER || 0}
                </span>
              </div>
            </div>
            <div className="col-6 col-md-2">
              <div className="card bg-dark border-secondary h-100 p-3">
                <span className="text-secondary small">Interview Rate</span>
                <span className="h4 fw-bold text-info mt-1 mb-0">
                  {analytics.applicationToInterviewRate}%
                </span>
              </div>
            </div>
            <div className="col-6 col-md-2">
              <div className="card bg-dark border-secondary h-100 p-3">
                <span className="text-secondary small">Offer Rate</span>
                <span className="h4 fw-bold text-success mt-1 mb-0">
                  {analytics.offerRate}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="card bg-dark border-secondary p-3 mb-4">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-dark border-secondary text-secondary">
                  🔍
                </span>
                <input
                  type="text"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="Search by company or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  id="search-applications"
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="d-flex align-items-center gap-2">
                <span className="text-secondary small text-nowrap">
                  Filter Status:
                </span>
                <select
                  className="form-select form-select-sm bg-dark text-white border-secondary"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  id="status-filter"
                >
                  <option value="ALL">
                    All Statuses ({applications.length})
                  </option>
                  {STATUS_COLUMNS.map((col) => (
                    <option key={col.key} value={col.key}>
                      {col.icon} {col.label} (
                      {applications.filter((a) => a.status === col.key).length})
                    </option>
                  ))}
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>
            </div>

            <div className="col-md-3 text-md-end text-secondary small">
              Showing {filteredApps.length} of {applications.length}{' '}
              applications
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-secondary mt-2 small">Loading your CRM board…</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="card bg-dark border-secondary text-center py-5 px-3">
            <div className="display-5 mb-3">💼</div>
            <h4 className="fw-bold">No Applications Yet</h4>
            <p className="text-secondary col-md-6 mx-auto mb-4 small">
              Track your entire job hunt in one place. Link your tailored
              resumes, save job URLs, log recruiter notes, and monitor your
              interview conversion rates.
            </p>
            <div>
              <Link
                to="/applications/new"
                className="btn btn-primary btn-sm px-4"
                id="empty-create-app-btn"
              >
                + Add Your First Application
              </Link>
            </div>
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban Board */
          <div
            className="row g-3 flex-nowrap overflow-auto pb-4"
            style={{ minHeight: '65vh' }}
          >
            {STATUS_COLUMNS.map((column) => {
              const colApps = filteredApps.filter(
                (app) => app.status === column.key,
              );
              return (
                <div
                  key={column.key}
                  className="col-12 col-md-4 col-lg-3"
                  style={{ minWidth: 280 }}
                >
                  <div className="card bg-dark border-secondary h-100 shadow-sm">
                    {/* Column Header */}
                    <div className="card-header bg-dark border-bottom border-secondary d-flex justify-content-between align-items-center py-2 px-3">
                      <div className="d-flex align-items-center gap-2">
                        <span>{column.icon}</span>
                        <span className="fw-semibold small">
                          {column.label}
                        </span>
                      </div>
                      <span
                        className={`badge bg-${column.color} bg-opacity-25 text-${column.color} rounded-pill`}
                      >
                        {colApps.length}
                      </span>
                    </div>

                    {/* Column Body / Cards */}
                    <div
                      className="card-body p-2 d-flex flex-column gap-2 overflow-auto"
                      style={{ maxHeight: '70vh' }}
                    >
                      {colApps.length === 0 ? (
                        <div className="text-center py-4 text-secondary small border border-secondary border-dashed rounded p-3 bg-dark bg-opacity-50">
                          No {column.label.toLowerCase()} jobs
                        </div>
                      ) : (
                        colApps.map((app) => (
                          <div
                            key={app.id}
                            className="card bg-dark border-secondary p-3 shadow-sm hover-border-primary cursor-pointer application-card"
                            onClick={() => navigate(`/applications/${app.id}`)}
                            style={{
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                              <div>
                                <h6
                                  className="fw-bold text-white mb-0 text-truncate"
                                  style={{ maxWidth: 180 }}
                                >
                                  {app.role}
                                </h6>
                                <span
                                  className="text-secondary small fw-medium text-truncate d-block"
                                  style={{ maxWidth: 180 }}
                                >
                                  🏢 {app.company}
                                </span>
                              </div>
                              <button
                                className="btn btn-link text-secondary p-0 text-decoration-none"
                                onClick={(e) => handleDelete(app.id, e)}
                                title="Delete application"
                              >
                                ×
                              </button>
                            </div>

                            {/* Resume version badge */}
                            {app.resumeVersion && (
                              <div className="mb-2">
                                <span className="badge bg-secondary bg-opacity-50 text-light small fw-normal">
                                  📄{' '}
                                  {app.resumeVersion.resume?.title || 'Resume'}{' '}
                                  (v{app.resumeVersion.versionNumber})
                                </span>
                              </div>
                            )}

                            {/* Follow up reminder */}
                            {app.followUpAt && (
                              <div className="small text-info mb-2">
                                ⏰ Follow up:{' '}
                                {new Date(app.followUpAt).toLocaleDateString()}
                              </div>
                            )}

                            {/* Quick status selector */}
                            <div className="mt-2 pt-2 border-top border-secondary d-flex justify-content-between align-items-center">
                              <select
                                className="form-select form-select-sm bg-dark text-white border-secondary py-0 px-2"
                                style={{ fontSize: 11, width: 'auto' }}
                                value={app.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  handleQuickStatusChange(
                                    app.id,
                                    e.target.value,
                                    e,
                                  )
                                }
                              >
                                {STATUS_COLUMNS.map((col) => (
                                  <option key={col.key} value={col.key}>
                                    Move: {col.label}
                                  </option>
                                ))}
                                <option value="WITHDRAWN">
                                  Move: Withdrawn
                                </option>
                              </select>

                              <Link
                                to={`/applications/${app.id}`}
                                className="btn btn-outline-primary btn-sm py-0 px-2 text-decoration-none"
                                style={{ fontSize: 11 }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Details →
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table List View */
          <div className="card bg-dark border-secondary overflow-hidden">
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0 align-middle">
                <thead>
                  <tr className="border-secondary text-secondary small">
                    <th>Company</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Resume Used</th>
                    <th>Applied Date</th>
                    <th>Follow-up</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => (
                    <tr
                      key={app.id}
                      className="border-secondary cursor-pointer"
                      onClick={() => navigate(`/applications/${app.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="fw-semibold text-white">
                        🏢 {app.company}
                      </td>
                      <td className="text-white">{app.role}</td>
                      <td>
                        <span
                          className={`badge bg-${
                            STATUS_COLUMNS.find((c) => c.key === app.status)
                              ?.color || 'secondary'
                          } bg-opacity-25 text-${
                            STATUS_COLUMNS.find((c) => c.key === app.status)
                              ?.color || 'secondary'
                          } border border-${
                            STATUS_COLUMNS.find((c) => c.key === app.status)
                              ?.color || 'secondary'
                          } border-opacity-50`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="small text-secondary">
                        {app.resumeVersion ? (
                          <span>
                            {app.resumeVersion.resume?.title} (v
                            {app.resumeVersion.versionNumber})
                          </span>
                        ) : (
                          <span className="text-muted">Not specified</span>
                        )}
                      </td>
                      <td className="small text-secondary">
                        {app.appliedAt
                          ? new Date(app.appliedAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="small">
                        {app.followUpAt ? (
                          <span className="text-info">
                            {new Date(app.followUpAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td
                        className="text-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          to={`/applications/${app.id}`}
                          className="btn btn-outline-primary btn-sm py-0 px-2 me-2"
                        >
                          View
                        </Link>
                        <button
                          onClick={(e) => handleDelete(app.id, e)}
                          className="btn btn-outline-danger btn-sm py-0 px-2"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resume Usage Insights Card */}
        {analytics && analytics.resumeVersionUsage.length > 0 && (
          <div className="card bg-dark border-secondary p-3 mt-4">
            <h6 className="fw-bold text-white mb-2">Resume Version Usage</h6>
            <p className="text-secondary small mb-3">
              Distribution of resume versions deployed across your active
              applications.
            </p>
            <div className="d-flex flex-wrap gap-3">
              {analytics.resumeVersionUsage.map((usage, idx) => (
                <div
                  key={idx}
                  className="card bg-dark border-secondary p-2 d-flex flex-row align-items-center gap-3"
                  style={{ minWidth: 200 }}
                >
                  <span className="display-6" style={{ fontSize: 24 }}>
                    📄
                  </span>
                  <div>
                    <div className="fw-semibold small text-white">
                      {usage.title} (v{usage.versionNumber})
                    </div>
                    <div className="text-secondary small">
                      Used in{' '}
                      <strong className="text-primary">{usage.count}</strong>{' '}
                      application{usage.count > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
