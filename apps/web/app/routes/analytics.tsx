import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { analyticsApi } from '../lib/api.js';

export default function AnalyticsDashboardPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotMsg, setSnapshotMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getOverview();
      setOverview(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load career analytics');
    } finally {
      setLoading(false);
    }
  }

  async function handleTakeSnapshot() {
    try {
      setSnapshotLoading(true);
      setSnapshotMsg(null);
      await analyticsApi.createSnapshot();
      setSnapshotMsg('Career progress snapshot captured successfully!');
      setTimeout(() => setSnapshotMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to capture snapshot');
    } finally {
      setSnapshotLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading analytics...</span>
        </div>
      </div>
    );
  }

  const cr = overview?.careerReadiness || {
    overallScore: 0,
    skillAlignment: 0,
    resumeReadiness: 0,
    evidenceStrength: 0,
    interviewReadiness: 0,
    careerTwinCompleteness: 0,
    explanations: {},
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'text-success border-success';
    if (score >= 60) return 'text-info border-info';
    if (score >= 40) return 'text-warning border-warning';
    return 'text-danger border-danger';
  };

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      {/* Top Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link to="/dashboard" className="btn btn-outline-secondary btn-sm">
            ← Dashboard
          </Link>
          <span className="navbar-brand fw-bold text-primary mb-0">
            📊 Career Intelligence & Analytics
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={handleTakeSnapshot}
            disabled={snapshotLoading}
            className="btn btn-outline-light btn-sm"
            id="capture-snapshot-btn"
          >
            {snapshotLoading ? 'Capturing...' : '📸 Save Progress Snapshot'}
          </button>
          <Link to="/learning" className="btn btn-success btn-sm fw-semibold">
            🎯 Learning Plans
          </Link>
        </div>
      </nav>

      <div className="container py-4">
        {snapshotMsg && (
          <div
            className="alert alert-success alert-dismissible fade show"
            role="alert"
          >
            {snapshotMsg}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Subnav Navigation */}
        <div className="d-flex flex-wrap gap-2 mb-4 p-2 bg-secondary bg-opacity-10 rounded border border-secondary">
          <Link to="/analytics" className="btn btn-sm btn-primary">
            Overview
          </Link>
          <Link
            to="/analytics/skills"
            className="btn btn-sm btn-outline-secondary text-white"
          >
            Skill Intelligence & Gaps
          </Link>
          <Link
            to="/analytics/roles"
            className="btn btn-sm btn-outline-secondary text-white"
          >
            Target Role Alignment
          </Link>
          <Link
            to="/analytics/evidence"
            className="btn btn-sm btn-outline-secondary text-white"
          >
            Evidence Coverage
          </Link>
          <Link
            to="/analytics/applications"
            className="btn btn-sm btn-outline-secondary text-white"
          >
            Application CRM Analytics
          </Link>
          <Link
            to="/analytics/interviews"
            className="btn btn-sm btn-outline-secondary text-white"
          >
            Interview Readiness
          </Link>
        </div>

        {/* Hero Section: Career Readiness Score */}
        <div className="card bg-secondary bg-opacity-10 border-secondary mb-4 p-4">
          <div className="row align-items-center">
            <div className="col-lg-4 text-center border-end border-secondary pb-3 pb-lg-0">
              <span className="text-secondary small fw-bold tracking-wide">
                EXPLAINABLE READINESS INDEX
              </span>
              <div
                className={`display-2 fw-bold my-2 p-3 rounded-circle d-inline-block border border-3 ${getScoreBadgeClass(
                  cr.overallScore,
                )}`}
                style={{ width: '130px', height: '130px', lineHeight: '100px' }}
              >
                {cr.overallScore}
              </div>
              <h4 className="fw-bold mb-1">Career Readiness Score</h4>
              <p className="text-secondary small mb-0">
                Composite readiness evaluated against your target role &
                verified evidence
              </p>
            </div>

            <div className="col-lg-8 ps-lg-4">
              <h5 className="fw-semibold text-white mb-3">
                Score Components & Explanations
              </h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="p-3 bg-dark rounded border border-secondary h-100">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold text-light">
                        Skill Alignment
                      </span>
                      <span className="badge bg-primary fs-6">
                        {cr.skillAlignment} / 100
                      </span>
                    </div>
                    <small className="text-secondary d-block">
                      {cr.explanations?.skillAlignment ||
                        'Coverage of required vs preferred target job skills.'}
                    </small>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 bg-dark rounded border border-secondary h-100">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold text-light">
                        Resume Readiness
                      </span>
                      <span className="badge bg-info fs-6">
                        {cr.resumeReadiness} / 100
                      </span>
                    </div>
                    <small className="text-secondary d-block">
                      {cr.explanations?.resumeReadiness ||
                        'Quality and ATS score of your latest resume version.'}
                    </small>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 bg-dark rounded border border-secondary h-100">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold text-light">
                        Evidence Strength
                      </span>
                      <span className="badge bg-success fs-6">
                        {cr.evidenceStrength} / 100
                      </span>
                    </div>
                    <small className="text-secondary d-block">
                      {cr.explanations?.evidenceStrength ||
                        'Ratio of multi-source verified proof (Projects, GitHub, Career Twin).'}
                    </small>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 bg-dark rounded border border-secondary h-100">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold text-light">
                        Interview Readiness
                      </span>
                      <span className="badge bg-warning text-dark fs-6">
                        {cr.interviewReadiness} / 100
                      </span>
                    </div>
                    <small className="text-secondary d-block">
                      {cr.explanations?.interviewReadiness ||
                        'Evaluated score across preparation sessions and mock interview answers.'}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Metric Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                VERIFIED SKILLS
              </span>
              <h2 className="text-white mt-2 mb-0 fw-bold">
                {overview?.skills?.totalSkills || 0}
              </h2>
              <span className="text-secondary small mt-1">
                {overview?.skills?.strongSkills || 0} Strong •{' '}
                {overview?.skills?.moderateSkills || 0} Moderate
              </span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                IDENTIFIED GAPS
              </span>
              <h2 className="text-danger mt-2 mb-0 fw-bold">
                {overview?.skillGaps?.totalGaps || 0}
              </h2>
              <span className="text-secondary small mt-1">
                {overview?.skillGaps?.criticalGaps || 0} Critical priority
              </span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                ACTIVE LEARNING
              </span>
              <h2 className="text-success mt-2 mb-0 fw-bold">
                {overview?.learningProgress?.activePlans || 0}
              </h2>
              <span className="text-secondary small mt-1">
                {overview?.learningProgress?.activeGoals || 0} Active Goals •{' '}
                {overview?.learningProgress?.completedTasks || 0} Completed
                Tasks
              </span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                TARGET ROLE
              </span>
              <h4 className="text-info mt-2 mb-0 fw-bold text-truncate">
                {overview?.targetRole?.title || 'Not Set'}
              </h4>
              <span className="text-secondary small mt-1">
                Level: {overview?.targetRole?.level || 'Mid'}
              </span>
            </div>
          </div>
        </div>

        {/* Actionable Career Insights */}
        {overview?.insights && overview.insights.length > 0 && (
          <div className="card bg-secondary bg-opacity-10 border-secondary mb-4 p-4">
            <h5 className="fw-semibold text-white mb-3">
              💡 Explainable Career Insights
            </h5>
            <div className="row g-3">
              {overview.insights.map((insight: any, idx: number) => (
                <div key={idx} className="col-lg-4">
                  <div className="p-3 bg-dark rounded border border-secondary h-100 d-flex flex-column">
                    <span className="badge bg-info text-dark align-self-start mb-2">
                      {insight.category || 'Career Insight'}
                    </span>
                    <h6 className="fw-bold text-white mb-2">{insight.title}</h6>
                    <p className="text-light small flex-grow-1 mb-2">
                      {insight.observation}
                    </p>
                    <div className="border-top border-secondary pt-2 mt-auto">
                      <small className="text-warning fw-semibold d-block">
                        Next Action: {insight.recommendation}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Priority Skill Gaps Preview */}
        <div className="card bg-secondary bg-opacity-10 border-secondary mb-4 p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-semibold text-white mb-0">
              🚨 Top Priority Skill Gaps
            </h5>
            <Link
              to="/analytics/skills"
              className="btn btn-outline-primary btn-sm"
            >
              View All Gaps & Normalized Skills →
            </Link>
          </div>

          {overview?.skillGaps?.topGaps &&
          overview.skillGaps.topGaps.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0 align-middle">
                <thead>
                  <tr className="text-secondary small">
                    <th>SKILL</th>
                    <th>PRIORITY</th>
                    <th>CURRENT EVIDENCE</th>
                    <th>GAP STATUS</th>
                    <th>WHY IT MATTERS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.skillGaps.topGaps
                    .slice(0, 5)
                    .map((gap: any, idx: number) => (
                      <tr key={idx}>
                        <td className="fw-bold text-white">{gap.skill}</td>
                        <td>
                          <span
                            className={`badge ${
                              gap.priority === 'CRITICAL'
                                ? 'bg-danger'
                                : gap.priority === 'HIGH'
                                  ? 'bg-warning text-dark'
                                  : 'bg-secondary'
                            }`}
                          >
                            {gap.priority}
                          </span>
                        </td>
                        <td className="small text-secondary">
                          {gap.currentEvidence || 'No verified evidence'}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              gap.status === 'STRONG'
                                ? 'bg-success'
                                : gap.status === 'PARTIAL'
                                  ? 'bg-warning text-dark'
                                  : 'bg-danger'
                            }`}
                          >
                            {gap.status}
                          </span>
                        </td>
                        <td className="small text-light">{gap.reason}</td>
                        <td>
                          <Link
                            to={`/learning/new?skill=${encodeURIComponent(gap.skill)}`}
                            className="btn btn-outline-success btn-sm py-0"
                          >
                            + Add Goal
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-secondary mb-0">
              No immediate critical gaps detected for your profile.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
