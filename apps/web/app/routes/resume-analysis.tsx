import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { resumeApi } from '../lib/api.js';

export default function ResumeAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();

  const [resume, setResume] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    if (id && user) {
      loadData(id);
    }
  }, [id, user]);

  async function loadData(resumeId: string) {
    try {
      setLoading(true);
      setError(null);

      // Load resume details
      const resData = await resumeApi.getResume(resumeId);
      setResume(resData.resume);

      // Load or run analysis
      try {
        const analysisData = await resumeApi.getAnalysis(resumeId);
        setAnalysis(analysisData.analysis);
      } catch {
        // Not analyzed yet, auto-run analysis
        await handleRunAnalysis(resumeId);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  }

  async function handleRunAnalysis(resumeId?: string) {
    const targetId = resumeId || id;
    if (!targetId) return;

    try {
      setAnalyzing(true);
      setError(null);
      const res = await resumeApi.analyzeResume(targetId);
      setAnalysis(res.analysis);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to run analysis');
    } finally {
      setAnalyzing(false);
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
      <div className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="text-secondary small">
            Analyzing resume and Career Twin alignment…
          </p>
        </div>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div className="min-vh-100 bg-dark text-white container py-5">
        <div className="alert alert-danger">{error}</div>
        <Link to="/resumes" className="btn btn-outline-secondary">
          ← Back to Resumes
        </Link>
      </div>
    );
  }

  const result = analysis?.result || {};
  const scores = result.scores || {};
  const categories = scores.categories || {};
  const careerComp = result.careerComparison || {};
  const aiInsights = result.aiInsights || {};

  const overallScore = analysis?.overallScore || 0;
  const scoreBadgeClass =
    overallScore >= 80
      ? 'text-success border-success'
      : overallScore >= 60
        ? 'text-warning border-warning'
        : 'text-danger border-danger';

  const readinessTier =
    overallScore >= 80
      ? 'ATS Ready & Highly Competitive'
      : overallScore >= 60
        ? 'Solid Foundation (Room for Optimization)'
        : 'Requires Structural & Content Revisions';

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4">
        <div className="d-flex align-items-center gap-3">
          <Link
            to="/resumes"
            className="navbar-brand fw-bold text-primary mb-0"
          >
            ← Resumes
          </Link>
          <span className="text-secondary small">/</span>
          <span className="fw-semibold small text-white">{resume?.title}</span>
          <span className="text-secondary small">/</span>
          <span className="text-secondary small">Scorecard</span>
        </div>
        <div className="d-flex align-items-center gap-3">
          <Link
            to={`/resumes/${id}`}
            className="btn btn-outline-secondary btn-sm"
          >
            Inspect Sections
          </Link>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => handleRunAnalysis()}
            disabled={analyzing}
            id="re-analyze-btn"
          >
            {analyzing ? 'Analyzing…' : '↻ Re-Analyze'}
          </button>
        </div>
      </nav>

      <div className="container py-5">
        {/* Hero Scorecard */}
        <div className="card bg-dark border-secondary p-5 mb-5 shadow">
          <div className="row align-items-center g-4">
            <div className="col-12 col-md-4 text-center border-end-md border-secondary">
              <div
                className={`d-inline-flex flex-column align-items-center justify-content-center rounded-circle border border-4 ${scoreBadgeClass} p-4 mb-2`}
                style={{ width: 140, height: 140 }}
              >
                <span
                  className="display-4 fw-bold mb-0"
                  id="overall-score-display"
                >
                  {overallScore}
                </span>
                <span className="small text-secondary text-uppercase letter-spacing-1">
                  / 100
                </span>
              </div>
              <h6 className="fw-bold text-white mt-2 mb-0">
                Overall Resume Score
              </h6>
              <span className="badge bg-secondary bg-opacity-50 mt-1 small">
                {readinessTier}
              </span>
            </div>

            <div className="col-12 col-md-8 ps-md-4">
              <h4 className="fw-bold mb-1">Resume Structure & ATS Readiness</h4>
              <p className="text-secondary small mb-4">
                Explainable evaluation of machine readability, section
                composition, content impact, technical coverage, and Career Twin
                alignment.
              </p>

              <div className="row g-3">
                <div className="col-6 col-sm-4">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <span className="text-secondary small">ATS Readiness</span>
                    <div className="fs-5 fw-bold text-primary">
                      {analysis?.atsScore || 0}%
                    </div>
                  </div>
                </div>
                <div className="col-6 col-sm-4">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <span className="text-secondary small">Content Impact</span>
                    <div className="fs-5 fw-bold text-info">
                      {analysis?.contentScore || 0}%
                    </div>
                  </div>
                </div>
                <div className="col-6 col-sm-4">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <span className="text-secondary small">Skills Depth</span>
                    <div className="fs-5 fw-bold text-warning">
                      {analysis?.skillsScore || 0}%
                    </div>
                  </div>
                </div>
                <div className="col-6 col-sm-4">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <span className="text-secondary small">Experience</span>
                    <div className="fs-5 fw-bold text-success">
                      {analysis?.experienceScore || 0}%
                    </div>
                  </div>
                </div>
                <div className="col-6 col-sm-4">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <span className="text-secondary small">Education</span>
                    <div className="fs-5 fw-bold text-white">
                      {analysis?.educationScore || 0}%
                    </div>
                  </div>
                </div>
                <div className="col-6 col-sm-4">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary">
                    <span className="text-secondary small">Twin Alignment</span>
                    <div className="fs-5 fw-bold text-primary">
                      {careerComp.summary?.matchRate || 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Improvements Grid */}
        <div className="row g-4 mb-5">
          <div className="col-12 col-md-6">
            <div className="card bg-dark border-success border-opacity-50 h-100 p-4">
              <h5 className="fw-bold text-success mb-3 d-flex align-items-center gap-2">
                <span>✓</span> Key Detected Strengths
              </h5>
              <div className="d-flex flex-column gap-2">
                {(scores.topStrengths || []).map(
                  (strength: string, i: number) => (
                    <div
                      key={i}
                      className="d-flex align-items-start gap-2 text-white small"
                    >
                      <span className="text-success fw-bold">✓</span>
                      <span>{strength}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="card bg-dark border-warning border-opacity-50 h-100 p-4">
              <h5 className="fw-bold text-warning mb-3 d-flex align-items-center gap-2">
                <span>⚡</span> Actionable Improvements
              </h5>
              <div className="d-flex flex-column gap-2">
                {(scores.topImprovements || []).map(
                  (imp: string, i: number) => (
                    <div
                      key={i}
                      className="d-flex align-items-start gap-2 text-white small"
                    >
                      <span className="text-warning fw-bold">→</span>
                      <span>{imp}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Career Twin Comparison Section */}
        <div className="card bg-dark border-secondary p-4 mb-5">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
            <div>
              <h5 className="fw-bold mb-1">Career Twin Alignment</h5>
              <p className="text-secondary small mb-0">
                Comparing parsed resume facts with your verified Career Twin
                source of truth.
              </p>
            </div>
            <Link to="/career" className="btn btn-outline-primary btn-sm">
              Manage Career Twin →
            </Link>
          </div>

          <div className="row g-4">
            {/* Present in both */}
            <div className="col-12 col-md-4">
              <div className="card bg-secondary bg-opacity-10 border-secondary h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-success mb-0">
                    ✓ Present in Both
                  </h6>
                  <span className="badge bg-success small">
                    {careerComp.skills?.presentInBoth?.length || 0}
                  </span>
                </div>
                <p className="text-secondary small mb-3">
                  Skills confirmed in both your resume and your Career Twin.
                </p>
                <div className="d-flex flex-wrap gap-1">
                  {(careerComp.skills?.presentInBoth || []).map(
                    (s: string, i: number) => (
                      <span
                        key={i}
                        className="badge bg-success bg-opacity-25 text-success small"
                      >
                        {s}
                      </span>
                    ),
                  )}
                  {(!careerComp.skills?.presentInBoth ||
                    careerComp.skills.presentInBoth.length === 0) && (
                    <span className="text-secondary small">
                      None overlapping yet
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* In Career Twin Only */}
            <div className="col-12 col-md-4">
              <div className="card bg-secondary bg-opacity-10 border-secondary h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-primary mb-0">
                    💡 In Career Twin Only
                  </h6>
                  <span className="badge bg-primary small">
                    {careerComp.skills?.inTwinOnly?.length || 0}
                  </span>
                </div>
                <p className="text-secondary small mb-3">
                  Verified skills in your Career Twin that you haven't included
                  on this resume.
                </p>
                <div className="d-flex flex-wrap gap-1">
                  {(careerComp.skills?.inTwinOnly || []).map(
                    (s: string, i: number) => (
                      <span
                        key={i}
                        className="badge bg-primary bg-opacity-25 text-primary small"
                      >
                        + {s}
                      </span>
                    ),
                  )}
                  {(!careerComp.skills?.inTwinOnly ||
                    careerComp.skills.inTwinOnly.length === 0) && (
                    <span className="text-secondary small">
                      All twin skills present
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* In Resume Only */}
            <div className="col-12 col-md-4">
              <div className="card bg-secondary bg-opacity-10 border-secondary h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-warning mb-0">
                    📋 In Resume Only
                  </h6>
                  <span className="badge bg-warning text-dark small">
                    {careerComp.skills?.inResumeOnly?.length || 0}
                  </span>
                </div>
                <p className="text-secondary small mb-3">
                  Items found on your resume but not yet recorded in your Career
                  Twin.
                </p>
                <div className="d-flex flex-wrap gap-1">
                  {(careerComp.skills?.inResumeOnly || []).map(
                    (s: string, i: number) => (
                      <span
                        key={i}
                        className="badge bg-secondary text-white small"
                      >
                        {s}
                      </span>
                    ),
                  )}
                  {(!careerComp.skills?.inResumeOnly ||
                    careerComp.skills.inResumeOnly.length === 0) && (
                    <span className="text-secondary small">
                      No unrecorded skills
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Category Scoring Cards */}
        <h5 className="fw-bold mb-3">Detailed Category Scoring</h5>
        <div className="row g-3 mb-5">
          {Object.entries(categories).map(([catKey, cat]: [string, any]) => (
            <div key={catKey} className="col-12 col-md-6">
              <div className="card bg-dark border-secondary h-100 p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-white text-capitalize mb-0">
                    {catKey === 'ats' ? 'ATS Readiness' : catKey} Score
                  </h6>
                  <span className="badge bg-primary fs-6">{cat.score}/100</span>
                </div>
                <div
                  className="progress bg-secondary bg-opacity-25 mb-3"
                  style={{ height: 6 }}
                >
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
                <p className="text-secondary small mb-3">{cat.explanation}</p>

                {cat.improvements && cat.improvements.length > 0 && (
                  <div className="mt-auto">
                    <span className="text-warning small fw-bold">
                      Tips to improve:
                    </span>
                    <ul className="mb-0 text-secondary small ps-3 mt-1">
                      {cat.improvements.map((tip: string, ti: number) => (
                        <li key={ti}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* AI Recommendations */}
        {aiInsights && (
          <div className="card bg-primary bg-opacity-10 border border-primary p-4">
            <h5 className="fw-bold mb-2">🤖 AI Recommendations & Synthesis</h5>
            <p className="text-white small mb-3">
              {aiInsights.summaryCritique}
            </p>

            {aiInsights.suggestedRoles &&
              aiInsights.suggestedRoles.length > 0 && (
                <div className="mb-3">
                  <span className="text-secondary small d-block mb-1">
                    Target Roles Aligned with Extracted Profile:
                  </span>
                  <div className="d-flex flex-wrap gap-2">
                    {aiInsights.suggestedRoles.map(
                      (role: string, ri: number) => (
                        <span
                          key={ri}
                          className="badge bg-primary text-white small px-2 py-1"
                        >
                          {role}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
