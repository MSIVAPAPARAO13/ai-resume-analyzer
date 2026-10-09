import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { interviewApi } from '../lib/api.js';

export default function InterviewReportPage() {
  const { user, initialized } = useAuthStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    if (id) {
      loadReport();
    }
  }, [id]);

  async function loadReport() {
    try {
      setLoading(true);
      setError(null);
      const data = await interviewApi.getFinalReport(id!);
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load final interview report.');
    } finally {
      setLoading(false);
    }
  }

  if (loading || !reportData) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="spinner-border text-warning" role="status" />
      </div>
    );
  }

  const { session, report } = reportData;

  const scoreBadgeColor = (score: number) => {
    if (score >= 80) return 'text-success border-success';
    if (score >= 60) return 'text-warning border-warning';
    return 'text-danger border-danger';
  };

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      {/* Top Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link
            to={`/interviews/${id}`}
            className="btn btn-outline-secondary btn-sm"
          >
            ← Session Overview
          </Link>
          <span className="navbar-brand fw-bold text-success mb-0">
            📊 Final Interview Readiness: {session?.title || 'Report'}
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link
            to={`/interviews/${id}/questions`}
            className="btn btn-outline-warning btn-sm"
          >
            Review Questions
          </Link>
          <Link to="/interviews" className="btn btn-outline-light btn-sm">
            All Interviews
          </Link>
        </div>
      </nav>

      <div className="container py-4" style={{ maxWidth: 950 }}>
        {error && <div className="alert alert-danger mb-4">{error}</div>}

        {/* Overall Score Banner */}
        <div className="card bg-secondary bg-opacity-10 border-secondary p-4 mb-4 text-center">
          <span className="text-secondary small fw-bold mb-1">
            OVERALL INTERVIEW PREPARATION SCORE
          </span>
          <div className="d-flex justify-content-center align-items-center my-3">
            <div
              className={`rounded-circle border border-4 d-flex flex-column align-items-center justify-content-center bg-dark ${scoreBadgeColor(
                report.overallPreparationScore,
              )}`}
              style={{ width: 140, height: 140 }}
            >
              <h1 className="fw-bold mb-0 display-4">
                {report.overallPreparationScore}
              </h1>
              <span className="small text-secondary">/ 100</span>
            </div>
          </div>
          <p
            className="text-secondary small mb-0"
            style={{ maxWidth: 600, margin: '0 auto' }}
          >
            {report.summaryFeedback}
          </p>
          <span
            className="text-muted small mt-2 d-block"
            style={{ fontSize: '0.75rem' }}
          >
            Note: This score reflects preparation thoroughness and evidence
            depth. It is not an objective hiring guarantee.
          </span>
        </div>

        {/* Readiness Breakdown Categories */}
        <div className="row g-3 mb-4">
          <div className="col-md">
            <div className="card bg-dark border-secondary p-3 text-center h-100">
              <span className="text-secondary small">Technical</span>
              <h4 className="fw-bold text-white mt-1 mb-0">
                {report.technicalReadiness}%
              </h4>
            </div>
          </div>
          <div className="col-md">
            <div className="card bg-dark border-secondary p-3 text-center h-100">
              <span className="text-secondary small">Behavioral</span>
              <h4 className="fw-bold text-white mt-1 mb-0">
                {report.behavioralReadiness}%
              </h4>
            </div>
          </div>
          <div className="col-md">
            <div className="card bg-dark border-secondary p-3 text-center h-100">
              <span className="text-secondary small">Resume</span>
              <h4 className="fw-bold text-white mt-1 mb-0">
                {report.resumeReadiness}%
              </h4>
            </div>
          </div>
          <div className="col-md">
            <div className="card bg-dark border-secondary p-3 text-center h-100">
              <span className="text-secondary small">Job-Specific</span>
              <h4 className="fw-bold text-white mt-1 mb-0">
                {report.jobSpecificReadiness}%
              </h4>
            </div>
          </div>
          <div className="col-md">
            <div className="card bg-dark border-secondary p-3 text-center h-100">
              <span className="text-secondary small">Project</span>
              <h4 className="fw-bold text-white mt-1 mb-0">
                {report.projectReadiness}%
              </h4>
            </div>
          </div>
        </div>

        {/* Strongest & Weakest Areas */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <div className="card bg-secondary bg-opacity-10 border-success border-opacity-50 p-4 h-100">
              <h5 className="fw-bold text-success mb-3">
                ✓ Strongest Demonstrated Areas
              </h5>
              <ul className="text-secondary small mb-0 ps-3">
                {report.strongestAreas?.map((area: string, i: number) => (
                  <li key={i} className="mb-2">
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card bg-secondary bg-opacity-10 border-warning border-opacity-50 p-4 h-100">
              <h5 className="fw-bold text-warning mb-3">
                ⚠ Weakest Preparation Areas
              </h5>
              <ul className="text-secondary small mb-0 ps-3">
                {report.weakestAreas?.map((area: string, i: number) => (
                  <li key={i} className="mb-2">
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Evidence Gaps & Recommended Topics */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <div className="card bg-dark border-secondary p-4 h-100">
              <h5 className="fw-bold text-danger mb-3">
                🛡️ Evidence Gaps to Address
              </h5>
              <ul className="text-secondary small mb-0 ps-3">
                {report.evidenceGaps?.map((gap: string, i: number) => (
                  <li key={i} className="mb-2">
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card bg-dark border-secondary p-4 h-100">
              <h5 className="fw-bold text-info mb-3">
                💡 Recommended Topics to Review
              </h5>
              <ul className="text-secondary small mb-0 ps-3">
                {report.recommendedTopics?.map((topic: string, i: number) => (
                  <li key={i} className="mb-2">
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Questions to Revisit */}
        {report.questionsToRevisit?.length > 0 && (
          <div className="card bg-secondary bg-opacity-10 border-secondary p-4 mb-4">
            <h5 className="fw-bold text-white mb-2">🔄 Questions to Revisit</h5>
            <p className="text-secondary small mb-3">
              These answers received scores below 70 and would benefit from
              revision:
            </p>
            <ul className="list-group list-group-flush bg-transparent">
              {report.questionsToRevisit.map((q: string, i: number) => (
                <li
                  key={i}
                  className="list-group-item bg-dark border-secondary text-white small mb-1 rounded"
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <Link to={`/interviews/${id}`} className="btn btn-outline-secondary">
            ← Back to Session
          </Link>
          <Link
            to={`/interviews/${id}/questions`}
            className="btn btn-warning fw-semibold px-4"
          >
            Practice Again
          </Link>
        </div>
      </div>
    </div>
  );
}
