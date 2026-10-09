import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { interviewApi, applicationApi } from '../lib/api.js';

export default function InterviewNewPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preApplicationId = searchParams.get('applicationId') || '';
  const preJobId = searchParams.get('jobId') || '';
  const preResumeVersionId = searchParams.get('resumeVersionId') || '';
  const preCompany = searchParams.get('company') || '';
  const preRole = searchParams.get('role') || '';

  const [title, setTitle] = useState(
    preRole
      ? `Preparation for ${preRole}${preCompany ? ` at ${preCompany}` : ''}`
      : '',
  );
  const [mode, setMode] = useState<'PREPARATION' | 'MOCK_INTERVIEW'>(
    'PREPARATION',
  );
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>(
    'MEDIUM',
  );
  const [applicationId, setApplicationId] = useState(preApplicationId);
  const [jobId, setJobId] = useState(preJobId);
  const [resumeVersionId, setResumeVersionId] = useState(preResumeVersionId);
  const [questionCount, setQuestionCount] = useState(10);

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    async function loadMeta() {
      try {
        setLoading(true);
        const apps = await applicationApi.listApplications();
        setApplications(apps);
      } catch {
        // Safe ignore
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a session title.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const session = await interviewApi.createSession({
        title: title.trim(),
        mode,
        difficulty,
        applicationId: applicationId || null,
        jobId: jobId || null,
        resumeVersionId: resumeVersionId || null,
      });

      // Automatically trigger initial question generation
      await interviewApi.generateQuestions(session.id, {
        questionCount,
        targetRole: preRole || undefined,
        targetCompany: preCompany || undefined,
      });

      if (mode === 'MOCK_INTERVIEW') {
        navigate(`/interviews/${session.id}/mock`);
      } else {
        navigate(`/interviews/${session.id}/questions`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create interview session.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link to="/interviews" className="btn btn-outline-secondary btn-sm">
            ← Interviews
          </Link>
          <span className="navbar-brand fw-bold text-warning mb-0">
            Create Interview Preparation Session
          </span>
        </div>
      </nav>

      <div className="container py-5" style={{ maxWidth: 700 }}>
        <div className="card bg-secondary bg-opacity-10 border-secondary p-4">
          <h4 className="fw-bold mb-1">New Preparation Session</h4>
          <p className="text-secondary small mb-4">
            Ground your interview preparation in verified Career Twin evidence
            and target Job DNA.
          </p>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-secondary small fw-semibold">
                SESSION TITLE *
              </label>
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary"
                placeholder="e.g. Senior Frontend Engineer Prep — Stripe"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                id="interview-title-input"
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label text-secondary small fw-semibold">
                  MODE
                </label>
                <select
                  className="form-select bg-dark text-white border-secondary"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                  id="interview-mode-select"
                >
                  <option value="PREPARATION">
                    Study & Answer Preparation
                  </option>
                  <option value="MOCK_INTERVIEW">
                    Interactive Mock Interview
                  </option>
                </select>
                <span className="text-secondary small d-block mt-1">
                  {mode === 'PREPARATION'
                    ? 'Explore questions at your own pace with hints.'
                    : 'Simulate a live interview step-by-step.'}
                </span>
              </div>

              <div className="col-md-6">
                <label className="form-label text-secondary small fw-semibold">
                  DIFFICULTY
                </label>
                <select
                  className="form-select bg-dark text-white border-secondary"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  id="interview-difficulty-select"
                >
                  <option value="EASY">
                    Easy — Fundamentals & Walkthroughs
                  </option>
                  <option value="MEDIUM">
                    Medium — Standard Industry Depth
                  </option>
                  <option value="HARD">Hard — High Scale & Edge Cases</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-secondary small fw-semibold">
                LINK APPLICATION (OPTIONAL)
              </label>
              <select
                className="form-select bg-dark text-white border-secondary"
                value={applicationId}
                disabled={loading}
                onChange={(e) => {
                  setApplicationId(e.target.value);
                  const sel = applications.find((a) => a.id === e.target.value);
                  if (sel) {
                    if (sel.jobId) setJobId(sel.jobId);
                    if (sel.resumeVersionId)
                      setResumeVersionId(sel.resumeVersionId);
                    if (!title) {
                      setTitle(`Prep for ${sel.role} at ${sel.company}`);
                    }
                  }
                }}
                id="interview-application-select"
              >
                <option value="">-- Generic / No Application --</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.role} at {app.company} ({app.status})
                  </option>
                ))}
              </select>
              <span className="text-secondary small d-block mt-1">
                Linking an application automatically pulls its Job DNA, resume
                match, and company context.
              </span>
            </div>

            <div className="mb-4">
              <label className="form-label text-secondary small fw-semibold">
                INITIAL QUESTION COUNT: {questionCount}
              </label>
              <input
                type="range"
                className="form-range"
                min="5"
                max="20"
                step="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
              />
              <div className="d-flex justify-content-between text-secondary small">
                <span>5 (Quick)</span>
                <span>10 (Balanced Mix)</span>
                <span>20 (Comprehensive)</span>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <Link
                to="/interviews"
                className="btn btn-outline-secondary btn-sm"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-warning fw-semibold px-4"
                disabled={submitting}
                id="submit-interview-create-btn"
              >
                {submitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    />
                    Generating Questions…
                  </>
                ) : (
                  'Start Session'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
