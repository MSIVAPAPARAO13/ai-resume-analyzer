import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { resumeApi, jobApi, tailoringApi } from '../lib/api.js';

export default function ResumeTailorPage() {
  const { id: resumeId, jobId } = useParams<{ id: string; jobId: string }>();
  const { user, initialized } = useAuthStore();

  const [resume, setResume] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    'ALL' | 'VERIFIED' | 'NEEDS_REVIEW' | 'UNSUPPORTED' | 'ACCEPTED'
  >('ALL');
  const [completedResult, setCompletedResult] = useState<any>(null);

  useEffect(() => {
    if (resumeId && jobId && initialized && user) {
      initTailoring();
    }
  }, [resumeId, jobId, initialized, user]);

  async function initTailoring(forceRefresh: boolean = false) {
    try {
      setLoading(true);
      setError(null);

      const [resumeData, jobData] = await Promise.all([
        resumeApi.getResume(resumeId!),
        jobApi.getJob(jobId!),
      ]);

      setResume(resumeData);
      setJob(jobData);

      // Generate or retrieve tailoring session
      const tailoringResult = await tailoringApi.generateTailoring(
        resumeId!,
        jobId!,
        {
          forceRefresh,
        },
      );

      const activeSession = tailoringResult.session || tailoringResult;
      setSession(activeSession);
      setSuggestions(activeSession.suggestions || []);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to initialize tailoring session.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(suggestionId: string) {
    if (!session) return;
    try {
      setActionLoading(suggestionId);
      const updated = await tailoringApi.acceptSuggestion(
        session.id,
        suggestionId,
      );
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestionId ? { ...s, status: updated.status } : s,
        ),
      );
    } catch (err: any) {
      alert(
        err.response?.data?.error?.message || 'Failed to accept suggestion.',
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(suggestionId: string) {
    if (!session) return;
    try {
      setActionLoading(suggestionId);
      const updated = await tailoringApi.rejectSuggestion(
        session.id,
        suggestionId,
      );
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestionId ? { ...s, status: updated.status } : s,
        ),
      );
    } catch (err: any) {
      alert(
        err.response?.data?.error?.message || 'Failed to reject suggestion.',
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCompleteSession() {
    if (!session) return;
    const acceptedCount = suggestions.filter(
      (s) => s.status === 'ACCEPTED',
    ).length;
    if (acceptedCount === 0) {
      alert(
        'Please accept at least one suggestion before completing the tailoring session.',
      );
      return;
    }

    try {
      setCompleting(true);
      const result = await tailoringApi.completeSession(session.id);
      setCompletedResult(result);
      setSession((prev: any) => ({ ...prev, status: 'COMPLETED' }));
    } catch (err: any) {
      alert(
        err.response?.data?.error?.message || 'Failed to complete session.',
      );
    } finally {
      setCompleting(false);
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
          <div
            className="spinner-border text-primary mb-3"
            role="status"
            style={{ width: '3rem', height: '3rem' }}
          />
          <h5 className="fw-bold">Resumind AI Tailoring Studio</h5>
          <p className="text-secondary small">
            Aligning candidate evidence with Job DNA & auditing with Evidence
            Guard…
          </p>
        </div>
      </div>
    );
  }

  const verifiedCount = suggestions.filter(
    (s) => s.guardStatus === 'VERIFIED',
  ).length;
  const needsReviewCount = suggestions.filter(
    (s) => s.guardStatus === 'NEEDS_REVIEW',
  ).length;
  const unsupportedCount = suggestions.filter(
    (s) => s.guardStatus === 'UNSUPPORTED',
  ).length;
  const acceptedCount = suggestions.filter(
    (s) => s.status === 'ACCEPTED',
  ).length;

  const filteredSuggestions = suggestions.filter((s) => {
    if (filter === 'VERIFIED') return s.guardStatus === 'VERIFIED';
    if (filter === 'NEEDS_REVIEW') return s.guardStatus === 'NEEDS_REVIEW';
    if (filter === 'UNSUPPORTED') return s.guardStatus === 'UNSUPPORTED';
    if (filter === 'ACCEPTED') return s.status === 'ACCEPTED';
    return true;
  });

  return (
    <div className="min-vh-100 bg-dark text-light py-5">
      <div className="container" style={{ maxWidth: '1100px' }}>
        {/* Navigation Breadcrumb */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <Link
            to={resumeId ? `/resumes/${resumeId}` : '/resumes'}
            className="btn btn-sm btn-outline-secondary text-decoration-none"
          >
            ← Back to Resume
          </Link>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => initTailoring(true)}
              className="btn btn-sm btn-outline-info"
              disabled={loading || completing}
            >
              🔄 Regenerate Suggestions
            </button>
            <button
              onClick={handleCompleteSession}
              className="btn btn-sm btn-success fw-bold px-3"
              disabled={
                completing ||
                session?.status === 'COMPLETED' ||
                acceptedCount === 0
              }
            >
              {completing ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  />
                  Applying Changes…
                </>
              ) : session?.status === 'COMPLETED' ? (
                '✓ Tailoring Completed'
              ) : (
                `Apply ${acceptedCount} Accepted Changes`
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mb-4 d-flex justify-content-between align-items-center">
            <span>{error}</span>
            <button
              onClick={() => initTailoring()}
              className="btn btn-sm btn-danger ms-3"
            >
              Retry
            </button>
          </div>
        )}

        {/* Completion Success Banner */}
        {completedResult && (
          <div className="card bg-success text-white border-0 shadow-lg mb-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="fw-bold mb-1">
                    🎉 New Tailored Resume Version Created!
                  </h4>
                  <p className="mb-0 text-white-50">
                    Version {completedResult.newVersion?.versionNumber} has been
                    generated and scored. Original baseline version was
                    preserved.
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <Link
                    to={`/resumes/${resumeId}`}
                    className="btn btn-light fw-bold"
                  >
                    View New Resume Version
                  </Link>
                  <Link to={`/jobs/${jobId}`} className="btn btn-outline-light">
                    Back to Job
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Target Header Card */}
        <div className="card bg-dark text-white border-secondary mb-4 shadow">
          <div className="card-body p-4">
            <div className="row g-4 align-items-center">
              <div className="col-md-6 border-end border-secondary">
                <span className="badge bg-primary-subtle text-primary mb-2">
                  TARGET JOB
                </span>
                <h3 className="fw-bold mb-1">{job?.title}</h3>
                <p className="text-secondary mb-2">
                  {job?.company} {job?.location && `• ${job.location}`}
                </p>
                <div className="d-flex gap-2 flex-wrap">
                  {job?.requirements?.slice(0, 4).map((r: any) => (
                    <span
                      key={r.id}
                      className="badge bg-secondary-subtle text-secondary small"
                    >
                      {r.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-md-6 ps-md-4">
                <span className="badge bg-info-subtle text-info mb-2">
                  BASE RESUME
                </span>
                <h4 className="fw-bold mb-1">{resume?.title}</h4>
                <p className="text-secondary mb-2 small">
                  Tailoring against Version{' '}
                  {resume?.latestVersion?.versionNumber || 1} • Original
                  preserved
                </p>
                <div className="d-flex align-items-center gap-3">
                  <span className="small text-muted">
                    Session ID: {session?.id?.slice(0, 8)}…
                  </span>
                  <span
                    className={`badge ${
                      session?.status === 'COMPLETED'
                        ? 'bg-success'
                        : 'bg-warning text-dark'
                    }`}
                  >
                    {session?.status || 'REVIEWING'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Guard Audit Summary */}
        <div className="card bg-black border-secondary mb-4">
          <div className="card-body p-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="fs-5">🛡️</span>
                <div>
                  <h6 className="fw-bold mb-0 text-white">
                    Evidence Guard Audit
                  </h6>
                  <small className="text-secondary">
                    Anti-hallucination gate grounded in verified Career Twin &
                    resume evidence
                  </small>
                </div>
              </div>
              <div className="d-flex gap-2">
                <span className="badge bg-success-subtle text-success px-3 py-2">
                  ✓ {verifiedCount} Verified
                </span>
                <span className="badge bg-warning-subtle text-warning px-3 py-2">
                  ⚠️ {needsReviewCount} Needs Review
                </span>
                <span className="badge bg-danger-subtle text-danger px-3 py-2">
                  ✕ {unsupportedCount} Unsupported
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div className="btn-group btn-group-sm">
            <button
              onClick={() => setFilter('ALL')}
              className={`btn ${filter === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'}`}
            >
              All ({suggestions.length})
            </button>
            <button
              onClick={() => setFilter('VERIFIED')}
              className={`btn ${filter === 'VERIFIED' ? 'btn-success' : 'btn-outline-secondary'}`}
            >
              Verified ({verifiedCount})
            </button>
            <button
              onClick={() => setFilter('NEEDS_REVIEW')}
              className={`btn ${filter === 'NEEDS_REVIEW' ? 'btn-warning' : 'btn-outline-secondary'}`}
            >
              Needs Review ({needsReviewCount})
            </button>
            {unsupportedCount > 0 && (
              <button
                onClick={() => setFilter('UNSUPPORTED')}
                className={`btn ${filter === 'UNSUPPORTED' ? 'btn-danger' : 'btn-outline-secondary'}`}
              >
                Unsupported ({unsupportedCount})
              </button>
            )}
            <button
              onClick={() => setFilter('ACCEPTED')}
              className={`btn ${filter === 'ACCEPTED' ? 'btn-info' : 'btn-outline-secondary'}`}
            >
              Accepted ({acceptedCount})
            </button>
          </div>

          <div className="text-secondary small">
            {acceptedCount} of {suggestions.length} suggestions accepted
          </div>
        </div>

        {/* Suggestions List */}
        {filteredSuggestions.length === 0 ? (
          <div className="card bg-dark border-secondary p-5 text-center text-muted">
            <p className="mb-0">No suggestions match the selected filter.</p>
          </div>
        ) : (
          <div className="d-flex flex-col gap-4">
            {filteredSuggestions.map((sug, index) => {
              const isAccepted = sug.status === 'ACCEPTED';
              const isRejected = sug.status === 'REJECTED';
              const isVerified = sug.guardStatus === 'VERIFIED';
              const isUnsupported = sug.guardStatus === 'UNSUPPORTED';

              return (
                <div
                  key={sug.id || index}
                  className={`card bg-dark text-white border shadow-sm transition-all ${
                    isAccepted
                      ? 'border-success'
                      : isRejected
                        ? 'border-secondary opacity-75'
                        : isUnsupported
                          ? 'border-danger'
                          : 'border-secondary'
                  }`}
                >
                  <div className="card-body p-4">
                    {/* Header Row: Suggestion Type & Guard Status */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-secondary text-light font-monospace small">
                          {sug.type}
                        </span>
                        {isVerified && (
                          <span className="badge bg-success text-white">
                            ✓ VERIFIED EVIDENCE
                          </span>
                        )}
                        {sug.guardStatus === 'NEEDS_REVIEW' && (
                          <span className="badge bg-warning text-dark">
                            ⚠️ NEEDS REVIEW
                          </span>
                        )}
                        {isUnsupported && (
                          <span className="badge bg-danger text-white">
                            ✕ UNSUPPORTED CLAIM
                          </span>
                        )}
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        {isAccepted && (
                          <span className="badge bg-success-subtle text-success border border-success">
                            ✓ ACCEPTED
                          </span>
                        )}
                        {isRejected && (
                          <span className="badge bg-secondary text-muted">
                            ✕ REJECTED
                          </span>
                        )}
                        {sug.status === 'PENDING' && (
                          <span className="badge bg-secondary-subtle text-secondary">
                            PENDING APPROVAL
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Diff: Original vs Proposed */}
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label text-secondary small fw-bold">
                          ORIGINAL RESUME CONTENT
                        </label>
                        <div className="p-3 bg-black rounded border border-secondary font-monospace small text-muted">
                          {sug.originalText || <em>(New addition)</em>}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-info small fw-bold">
                          AI TAILORED PROPOSAL
                        </label>
                        <div className="p-3 bg-black rounded border border-info font-monospace small text-white">
                          {sug.proposedText}
                        </div>
                      </div>
                    </div>

                    {/* Rationale & Evidence Sources */}
                    <div className="mb-3">
                      <p className="mb-1 text-secondary small">
                        <strong className="text-light">Why:</strong>{' '}
                        {sug.reason}
                      </p>
                      {sug.evidenceReferences &&
                        sug.evidenceReferences.length > 0 && (
                          <div className="d-flex align-items-center gap-1 flex-wrap mt-2">
                            <span className="text-muted small me-1">
                              Evidence Source:
                            </span>
                            {sug.evidenceReferences.map(
                              (ref: string, rIdx: number) => (
                                <span
                                  key={rIdx}
                                  className="badge bg-dark border border-secondary text-info small"
                                >
                                  {ref}
                                </span>
                              ),
                            )}
                          </div>
                        )}
                    </div>

                    {/* Accept / Reject Action Buttons */}
                    <div className="d-flex justify-content-end gap-2 pt-2 border-top border-secondary">
                      <button
                        onClick={() => handleReject(sug.id)}
                        disabled={
                          actionLoading === sug.id ||
                          isRejected ||
                          session?.status === 'COMPLETED'
                        }
                        className={`btn btn-sm ${
                          isRejected
                            ? 'btn-secondary text-muted'
                            : 'btn-outline-danger'
                        }`}
                      >
                        {actionLoading === sug.id ? '…' : '✕ Reject'}
                      </button>
                      <button
                        onClick={() => handleAccept(sug.id)}
                        disabled={
                          actionLoading === sug.id ||
                          isAccepted ||
                          session?.status === 'COMPLETED'
                        }
                        className={`btn btn-sm ${
                          isAccepted ? 'btn-success' : 'btn-outline-success'
                        }`}
                      >
                        {actionLoading === sug.id ? '…' : '✓ Accept Proposal'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
