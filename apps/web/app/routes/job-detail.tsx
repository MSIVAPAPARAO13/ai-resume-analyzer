import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { jobApi, resumeApi } from '../lib/api.js';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();

  const [job, setJob] = useState<any>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && initialized && user) {
      loadData();
    }
  }, [id, initialized, user]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [jobData, resumeList] = await Promise.all([
        jobApi.getJob(id!),
        resumeApi.listResumes(),
      ]);

      setJob(jobData);
      const list = Array.isArray(resumeList)
        ? resumeList
        : resumeList?.resumes || [];
      setResumes(list);

      if (list.length > 0) {
        setSelectedResumeId(list[0].id);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Failed to load job details.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRunMatch(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedResumeId) {
      alert('Please select a resume to match.');
      return;
    }

    try {
      setMatching(true);
      setError(null);
      const matchRecord = await jobApi.matchResume(id!, selectedResumeId);
      navigate(`/jobs/${id}/match/${matchRecord.id}`);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to generate resume match.',
      );
    } finally {
      setMatching(false);
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
            Loading job requirements and candidate resumes…
          </p>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-vh-100 bg-dark text-white container py-5">
        <div className="alert alert-danger">{error}</div>
        <Link to="/jobs" className="btn btn-outline-secondary">
          ← Back to Jobs
        </Link>
      </div>
    );
  }

  const matches = job?.matches || [];

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/jobs" className="navbar-brand fw-bold text-primary mb-0">
            ← Jobs
          </Link>
          <span className="text-secondary small">/</span>
          <span className="text-white small fw-semibold">{job?.title}</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link
            to={`/applications/new?jobId=${id}`}
            className="btn btn-primary btn-sm"
            id="apply-job-btn"
          >
            📋 Track Application
          </Link>
          <Link
            to={`/jobs/${id}/analysis`}
            className="btn btn-outline-primary btn-sm"
            id="goto-job-dna"
          >
            View Job DNA ⚡
          </Link>
        </div>
      </nav>

      <div className="container py-5">
        {/* Document Header Card */}
        <div className="card bg-dark border-secondary mb-4 p-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h3 className="fw-bold mb-0">{job?.title}</h3>
                <span className="badge bg-success bg-opacity-25 text-success small">
                  {job?.status}
                </span>
                {job?.latestAnalysis?.level && (
                  <span className="badge bg-secondary small">
                    {job.latestAnalysis.level}
                  </span>
                )}
              </div>
              <p className="text-secondary small mb-0">
                <span className="text-white fw-semibold">{job?.company}</span>
                {job?.location ? ` · ${job.location}` : ''}
                {job?.employmentType ? ` · ${job.employmentType}` : ''}
                {` · Added ${new Date(job?.createdAt).toLocaleDateString()}`}
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Link
                to={`/jobs/${id}/analysis`}
                className="btn btn-primary btn-sm px-3"
              >
                Inspect Job DNA →
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small mb-4" role="alert">
            {error}
          </div>
        )}

        <div className="row g-4">
          {/* Left Column: Match Resume Form & Past Matches */}
          <div className="col-12 col-lg-6">
            {/* Match Resume Card */}
            <div className="card bg-dark border-secondary p-4 mb-4 shadow-sm">
              <h5 className="fw-bold mb-2 d-flex align-items-center gap-2">
                <span>⚡</span> Match Against Your Resume
              </h5>
              <p className="text-secondary small mb-4">
                Select one of your uploaded resumes to evaluate its alignment
                against this Job's DNA and required skills.
              </p>

              {resumes.length === 0 ? (
                <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded text-center">
                  <p className="text-secondary small mb-2">
                    No resumes uploaded yet.
                  </p>
                  <Link
                    to="/resumes"
                    className="btn btn-outline-primary btn-sm"
                  >
                    Upload a Resume First →
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleRunMatch}>
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-semibold">
                      Select Resume Document *
                    </label>
                    <select
                      className="form-select bg-dark border-secondary text-white"
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      id="select-resume-for-match"
                      disabled={matching}
                    >
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.originalFileName} · {r.status})
                        </option>
                      ))}
                    </select>
                    <div className="form-text text-secondary small mt-1">
                      The matching engine compares verified Career Twin facts
                      and resume sections with Job DNA.
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                    disabled={matching || !selectedResumeId}
                    id="run-match-btn"
                  >
                    {matching ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                        />
                        <span>Evaluating Match Alignment…</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Explainable Match Report</span>
                        <span>⚡</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Previous Matches Card */}
            <div className="card bg-dark border-secondary p-4 shadow-sm">
              <h5 className="fw-bold mb-3 d-flex align-items-center justify-content-between">
                <span>Evaluated Matches ({matches.length})</span>
              </h5>

              {matches.length === 0 ? (
                <p className="text-secondary small mb-0">
                  No resume matches generated yet for this job posting.
                </p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {matches.map((m: any) => {
                    const score = m.overallScore;
                    const badgeClass =
                      score >= 80
                        ? 'text-success border-success'
                        : score >= 60
                          ? 'text-warning border-warning'
                          : 'text-danger border-danger';

                    return (
                      <div
                        key={m.id}
                        className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded d-flex align-items-center justify-content-between flex-wrap gap-2"
                      >
                        <div>
                          <div className="fw-semibold text-white small">
                            {m.resumeVersion?.resume?.title || 'Resume'}
                          </div>
                          <span className="text-secondary small">
                            Evaluated on{' '}
                            {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <span
                            className={`badge border ${badgeClass} fs-6 px-2 py-1`}
                          >
                            {score}% Match
                          </span>
                          <Link
                            to={`/jobs/${id}/match/${m.id}`}
                            className="btn btn-outline-secondary btn-sm"
                            id={`view-match-${m.id}`}
                          >
                            View Report →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Original Job Description */}
          <div className="col-12 col-lg-6">
            <div className="card bg-dark border-secondary p-4 shadow-sm h-100">
              <h5 className="fw-bold mb-3">Original Job Description</h5>
              <div
                className="bg-black bg-opacity-40 p-3 rounded border border-secondary text-secondary small font-monospace"
                style={{
                  maxHeight: '550px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {job?.description}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
