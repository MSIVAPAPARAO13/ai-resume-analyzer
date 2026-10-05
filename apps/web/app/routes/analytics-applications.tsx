import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { analyticsApi } from '../lib/api.js';

export default function AnalyticsApplicationsPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appData, setAppData] = useState<any>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    loadAppAnalytics();
  }, []);

  async function loadAppAnalytics() {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getApplications();
      setAppData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load application analytics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">
            Loading application analytics...
          </span>
        </div>
      </div>
    );
  }

  const summary = appData?.summary || {
    totalApplications: 0,
    interviewCount: 0,
    offerCount: 0,
    rejectionCount: 0,
    withdrawnCount: 0,
  };

  const rates = appData?.rates || {
    interviewRate: 0,
    offerRate: 0,
    rejectionRate: 0,
  };

  const statusBreakdown = appData?.statusBreakdown || {};
  const resumeVersionPerformance = appData?.resumeVersionPerformance || [];

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link to="/analytics" className="btn btn-outline-secondary btn-sm">
            ← Analytics Overview
          </Link>
          <span className="navbar-brand fw-bold text-primary mb-0">
            📑 Application CRM Analytics
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link to="/applications" className="btn btn-outline-light btn-sm">
            Go to Applications CRM →
          </Link>
        </div>
      </nav>

      <div className="container py-4">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="alert alert-info py-2 small mb-4" role="alert">
          ℹ️ <strong>Observed Performance:</strong> Metrics are calculated from
          your tracked applications in Resumind CRM. Correlation in observed
          outcomes reflects tracking data, not guaranteed causation.
        </div>

        {/* Metric Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                TOTAL APPLICATIONS
              </span>
              <h2 className="text-white mt-2 mb-0 fw-bold">
                {summary.totalApplications}
              </h2>
              <span className="text-secondary small mt-1">
                Tracked in Resumind
              </span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                INTERVIEW RATE
              </span>
              <h2 className="text-warning mt-2 mb-0 fw-bold">
                {rates.interviewRate}%
              </h2>
              <span className="text-secondary small mt-1">
                {summary.interviewCount} moved to interview
              </span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                OFFER RATE
              </span>
              <h2 className="text-success mt-2 mb-0 fw-bold">
                {rates.offerRate}%
              </h2>
              <span className="text-secondary small mt-1">
                {summary.offerCount} offers received
              </span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                AVG JOB MATCH
              </span>
              <h2 className="text-info mt-2 mb-0 fw-bold">
                {appData?.averages?.jobMatchScore || 0}%
              </h2>
              <span className="text-secondary small mt-1">
                Avg Resume ATS: {appData?.averages?.resumeScore || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Status Breakdown & Resume Version Breakdown */}
        <div className="row g-4 mb-4">
          <div className="col-lg-5">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-4 h-100">
              <h5 className="fw-semibold text-white mb-3">
                Status Distribution
              </h5>
              <div className="d-flex flex-column gap-3">
                {Object.entries(statusBreakdown).map(
                  ([status, count]: [string, any], idx) => {
                    const percentage =
                      summary.totalApplications > 0
                        ? Math.round((count / summary.totalApplications) * 100)
                        : 0;
                    return (
                      <div key={idx}>
                        <div className="d-flex justify-content-between small mb-1">
                          <span className="text-light">{status}</span>
                          <span className="text-secondary">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div
                          className="progress bg-dark"
                          style={{ height: '8px' }}
                        >
                          <div
                            className="progress-bar bg-primary"
                            role="progressbar"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-4 h-100">
              <h5 className="fw-semibold text-white mb-3">
                Performance by Resume Version
              </h5>
              {resumeVersionPerformance.length === 0 ? (
                <p className="text-secondary small">
                  No resume versions linked to tracked applications yet.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-dark table-hover mb-0 align-middle">
                    <thead>
                      <tr className="text-secondary small">
                        <th>VERSION</th>
                        <th>ATS SCORE</th>
                        <th>APPLICATIONS</th>
                        <th>INTERVIEWS</th>
                        <th>OFFERS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumeVersionPerformance.map((rv: any, idx: number) => (
                        <tr key={idx}>
                          <td className="fw-bold text-white">
                            v{rv.versionNumber}
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {rv.score || 'N/A'}
                            </span>
                          </td>
                          <td className="text-light">{rv.applicationCount}</td>
                          <td className="text-warning">{rv.interviewCount}</td>
                          <td className="text-success">{rv.offerCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
