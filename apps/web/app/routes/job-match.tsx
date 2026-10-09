import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { jobApi } from '../lib/api.js';

export default function JobMatchPage() {
  const { id, matchId } = useParams<{ id: string; matchId: string }>();
  const { user, initialized } = useAuthStore();

  const [job, setJob] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && matchId && initialized && user) {
      loadData();
    }
  }, [id, matchId, initialized, user]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [jobData, matchData] = await Promise.all([
        jobApi.getJob(id!),
        jobApi.getMatchById(id!, matchId!),
      ]);

      setJob(jobData);
      setMatch(matchData);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Failed to load match report.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (!initialized || !user) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark text-white">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="text-secondary small">
            Loading match evaluation scorecard…
          </p>
        </div>
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="min-vh-100 bg-dark text-white container py-5">
        <div className="alert alert-danger">{error}</div>
        <Link to={`/jobs/${id}`} className="btn btn-outline-secondary">
          ← Back to Job
        </Link>
      </div>
    );
  }

  const result = match?.result || {};
  const scores = result.scores || {};
  const strongMatches = result.strongMatches || [];
  const partialMatches = result.partialMatches || [];
  const missingRequirements = result.missingRequirements || [];
  const keywordCoverage = result.keywordCoverage || {};
  const recommendations = result.recommendations || [];

  const overallScore = match?.overallScore || 0;
  const matchBadgeClass =
    overallScore >= 80
      ? 'text-success border-success'
      : overallScore >= 60
        ? 'text-warning border-warning'
        : 'text-danger border-danger';

  const matchTier =
    overallScore >= 80
      ? 'Strong Match — Highly Competitive Alignment'
      : overallScore >= 60
        ? 'Competitive Match — Solid Baseline (Refinement Recommended)'
        : 'Gap Alignment Needed — Significant Requirement Mismatch';

  const resumeTitle = match?.resumeVersion?.resume?.title || 'Selected Resume';

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/jobs" className="navbar-brand fw-bold text-primary mb-0">
            ← Jobs
          </Link>
          <span className="text-secondary small">/</span>
          <Link
            to={`/jobs/${id}`}
            className="text-secondary small text-decoration-none"
          >
            {job?.title}
          </Link>
          <span className="text-secondary small">/</span>
          <span className="text-white small fw-semibold">Match Scorecard</span>
        </div>
        <div className="d-flex align-items-center gap-3">
          {match?.resumeVersion?.resumeId && (
            <Link
              to={`/resumes/${match.resumeVersion.resumeId}/tailor/${id}`}
              className="btn btn-primary btn-sm fw-bold"
              id="tailor-resume-btn"
            >
              ✨ Tailor Resume with AI
            </Link>
          )}
          <Link to={`/jobs/${id}`} className="btn btn-outline-secondary btn-sm">
            Match Another Resume
          </Link>
          <Link
            to={`/jobs/${id}/analysis`}
            className="btn btn-outline-primary btn-sm"
          >
            Job DNA
          </Link>
        </div>
      </nav>

      <div className="container py-5">
        {/* Scorecard Hero */}
        <div className="card bg-dark border-secondary p-4 p-md-5 mb-5 shadow-sm">
          <div className="row align-items-center g-4">
            {/* Score Ring / Gauge */}
            <div className="col-12 col-md-4 text-center border-end-md border-secondary">
              <div
                className={`d-inline-flex flex-column align-items-center justify-content-center rounded-circle border border-3 ${matchBadgeClass} p-4 mb-2 shadow`}
                style={{
                  width: '160px',
                  height: '160px',
                  background: 'rgba(0,0,0,0.3)',
                }}
              >
                <span
                  className="display-4 fw-bold mb-0"
                  id="overall-match-score"
                >
                  {overallScore}
                </span>
                <span className="small text-secondary text-uppercase letter-spacing-1">
                  / 100
                </span>
              </div>
              <h5 className="fw-bold text-white mt-2 mb-0">
                Overall Match Score
              </h5>
              <span className="badge bg-secondary bg-opacity-50 mt-1 small">
                {matchTier}
              </span>
              <p className="text-secondary small mt-2 mb-0">
                Matched against{' '}
                <span className="text-white fw-semibold">{resumeTitle}</span>
              </p>
            </div>

            {/* Category Breakdown Progress */}
            <div className="col-12 col-md-8 ps-md-4">
              <h4 className="fw-bold mb-1">
                Explainable Requirement Alignment
              </h4>
              <p className="text-secondary small mb-4">
                Transparent evaluation comparing required qualifications,
                technical skills, work experience tenure, and verified Career
                Twin facts.
              </p>

              <div className="row g-3" id="match-score-breakdown-section">
                <div className="col-6 col-sm-4">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <span className="text-secondary small">
                      Skills Match (30%)
                    </span>
                    <div className="fs-5 fw-bold text-primary">
                      {scores.skillsScore || 0}%
                    </div>
                  </div>
                </div>
                <div className="col-6 col-sm-4">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <span className="text-secondary small">
                      Experience (20%)
                    </span>
                    <div className="fs-5 fw-bold text-success">
                      {scores.experienceScore || 0}%
                    </div>
                  </div>
                </div>
                <div className="col-6 col-sm-4">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <span className="text-secondary small">
                      Responsibilities (20%)
                    </span>
                    <div className="fs-5 fw-bold text-info">
                      {scores.responsibilitiesScore || 0}%
                    </div>
                  </div>
                </div>
                <div className="col-6 col-sm-4">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <span className="text-secondary small">
                      Education (10%)
                    </span>
                    <div className="fs-5 fw-bold text-warning">
                      {scores.educationScore || 0}%
                    </div>
                  </div>
                </div>
                <div className="col-6 col-sm-4">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <span className="text-secondary small">Keywords (10%)</span>
                    <div className="fs-5 fw-bold text-white">
                      {scores.keywordScore || 0}%
                    </div>
                  </div>
                </div>
                <div className="col-6 col-sm-4">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <span className="text-secondary small">
                      Career Twin (10%)
                    </span>
                    <div className="fs-5 fw-bold text-primary">
                      {scores.careerTwinScore || 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Strong Matches */}
        <div
          className="card bg-dark border-success border-opacity-50 p-4 mb-4 shadow-sm"
          id="strong-matches-section"
        >
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="fw-bold text-success mb-0 d-flex align-items-center gap-2">
              <span>✓</span> Strong Matches ({strongMatches.length})
            </h5>
            <span className="badge bg-success bg-opacity-25 text-success small">
              Verified Supporting Evidence
            </span>
          </div>
          <p className="text-secondary small mb-3">
            Qualifications where clear, supporting evidence was identified in
            the resume or your verified Career Twin.
          </p>

          {strongMatches.length === 0 ? (
            <span className="text-secondary small">
              No strong matches detected yet.
            </span>
          ) : (
            <div className="d-flex flex-column gap-2">
              {strongMatches.map((item: any, i: number) => (
                <div
                  key={i}
                  className="p-3 bg-success bg-opacity-10 rounded border border-success border-opacity-25"
                >
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                    <span className="fw-bold text-white small">
                      {item.requirement}
                    </span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-secondary bg-opacity-50 small">
                        {item.type}
                      </span>
                      <span className="badge bg-success bg-opacity-25 text-success small">
                        {item.importance}
                      </span>
                    </div>
                  </div>
                  {item.evidence && (
                    <p className="text-secondary small mb-0 font-italic">
                      <span className="text-success fw-semibold">
                        Evidence:
                      </span>{' '}
                      {item.evidence}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Partial Matches */}
        <div
          className="card bg-dark border-warning border-opacity-50 p-4 mb-4 shadow-sm"
          id="partial-matches-section"
        >
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="fw-bold text-warning mb-0 d-flex align-items-center gap-2">
              <span>⚡</span> Partial Matches ({partialMatches.length})
            </h5>
            <span className="badge bg-warning bg-opacity-25 text-warning small">
              Incomplete Evidence
            </span>
          </div>
          <p className="text-secondary small mb-3">
            Requirements where related evidence was found, but does not yet
            fully satisfy the stated job expectation.
          </p>

          {partialMatches.length === 0 ? (
            <span className="text-secondary small">
              No partial match gaps identified.
            </span>
          ) : (
            <div className="d-flex flex-column gap-2">
              {partialMatches.map((item: any, i: number) => (
                <div
                  key={i}
                  className="p-3 bg-warning bg-opacity-10 rounded border border-warning border-opacity-25"
                >
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                    <span className="fw-bold text-white small">
                      {item.requirement}
                    </span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-secondary bg-opacity-50 small">
                        {item.type}
                      </span>
                      <span className="badge bg-warning bg-opacity-25 text-warning small">
                        {item.importance}
                      </span>
                    </div>
                  </div>
                  {item.evidence && (
                    <p className="text-secondary small mb-1">
                      <span className="text-warning fw-semibold">
                        Detected Evidence:
                      </span>{' '}
                      {item.evidence}
                    </p>
                  )}
                  {item.gap && (
                    <p className="text-warning small mb-0">
                      <span className="fw-bold">Gap:</span> {item.gap}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Missing Requirements */}
        <div
          className="card bg-dark border-secondary p-4 mb-4 shadow-sm"
          id="missing-requirements-section"
        >
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
              <span className="text-secondary">○</span> Missing Requirements (
              {missingRequirements.length})
            </h5>
            <span className="badge bg-secondary small">
              Not Found in Candidate Profile
            </span>
          </div>
          <p className="text-secondary small mb-3">
            Qualifications where no clear evidence was found. Review whether you
            have unrecorded experience to add to your Career Twin.
          </p>

          {missingRequirements.length === 0 ? (
            <span className="text-success small">
              Outstanding! All identified requirements have supporting evidence.
            </span>
          ) : (
            <div className="d-flex flex-column gap-2">
              {missingRequirements.map((item: any, i: number) => (
                <div
                  key={i}
                  className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary"
                >
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                    <span className="fw-bold text-white small">
                      {item.requirement}
                    </span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-secondary small">
                        {item.type}
                      </span>
                      <span className="badge bg-danger bg-opacity-25 text-danger small">
                        {item.importance}
                      </span>
                    </div>
                  </div>
                  {item.suggestion && (
                    <p className="text-secondary small mb-0">
                      <span className="text-white fw-semibold">Guidance:</span>{' '}
                      {item.suggestion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Actionable Preparation Recommendations */}
        <div
          className="card bg-dark border-primary border-opacity-50 p-4 mb-4 shadow-sm"
          id="recommendations-section"
        >
          <h5 className="fw-bold text-primary mb-3 d-flex align-items-center gap-2">
            <span>💡</span> Actionable Preparation Recommendations
          </h5>
          <div className="d-flex flex-column gap-2">
            {recommendations.map((rec: string, i: number) => (
              <div
                key={i}
                className="d-flex align-items-start gap-2 p-2 bg-primary bg-opacity-10 rounded text-white small"
              >
                <span className="text-primary fw-bold">→</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Technical Keywords Coverage */}
        <div
          className="card bg-dark border-secondary p-4 shadow-sm"
          id="keyword-coverage-section"
        >
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="fw-bold mb-0">Technical Keyword Alignment</h5>
            <span className="badge bg-primary bg-opacity-25 text-primary">
              {keywordCoverage.matched || 0} / {keywordCoverage.total || 0} (
              {keywordCoverage.percentage || 0}%)
            </span>
          </div>

          <div className="mb-3">
            <span className="text-success small fw-bold mb-2 d-block">
              ✓ Matched Keywords:
            </span>
            <div className="d-flex flex-wrap gap-2">
              {(keywordCoverage.matchedKeywords || []).map(
                (kw: string, i: number) => (
                  <span
                    key={i}
                    className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-25 px-2 py-1 small"
                  >
                    {kw}
                  </span>
                ),
              )}
            </div>
          </div>

          {(keywordCoverage.missingKeywords || []).length > 0 && (
            <div>
              <span className="text-secondary small fw-bold mb-2 d-block">
                ○ Unmatched Keywords:
              </span>
              <div className="d-flex flex-wrap gap-2">
                {keywordCoverage.missingKeywords.map(
                  (kw: string, i: number) => (
                    <span
                      key={i}
                      className="badge bg-secondary bg-opacity-20 text-secondary border border-secondary px-2 py-1 small"
                    >
                      {kw}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
