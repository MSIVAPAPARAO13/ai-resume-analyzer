import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { jobApi } from '../lib/api.js';

interface JobSummary {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  employmentType?: string | null;
  status: 'SAVED' | 'ANALYZED' | 'ARCHIVED';
  createdAt: string;
  latestAnalysis?: {
    id: string;
    role: string;
    level?: string | null;
  } | null;
  latestMatch?: {
    id: string;
    overallScore: number;
    createdAt: string;
  } | null;
}

export default function JobsDashboardPage() {
  const { user, initialized, logout } = useAuthStore();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && user) {
      loadJobs();
    }
  }, [initialized, user]);

  async function loadJobs() {
    try {
      setLoading(true);
      setError(null);
      const data = await jobApi.listJobs();
      setJobs(data);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Failed to load target jobs.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (
      !confirm(
        'Are you sure you want to delete this job and its match analyses?',
      )
    )
      return;
    try {
      await jobApi.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch {
      alert('Failed to delete job.');
    }
  }

  if (!initialized || !user) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  const analyzedCount = jobs.filter((j) => j.status === 'ANALYZED').length;
  const matchedCount = jobs.filter((j) => !!j.latestMatch).length;

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4">
        <div className="d-flex align-items-center gap-3">
          <Link
            to="/dashboard"
            className="navbar-brand fw-bold text-primary mb-0"
          >
            Resumind
          </Link>
          <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25">
            Phase 4: Job Intelligence
          </span>
        </div>
        <div className="d-flex align-items-center gap-3">
          <Link to="/resumes" className="btn btn-outline-secondary btn-sm">
            Resumes
          </Link>
          <Link to="/career" className="btn btn-outline-secondary btn-sm">
            Career Twin
          </Link>
          <Link to="/dashboard" className="btn btn-outline-secondary btn-sm">
            Dashboard
          </Link>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="container py-5">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="display-6 fw-bold mb-1">
              Job Intelligence & Matching
            </h1>
            <p className="text-secondary lead fs-6 mb-0">
              Manage target Job Descriptions, inspect extracted Job DNA, and
              evaluate resume match alignment with explainable scores.
            </p>
          </div>
          <Link
            to="/jobs/new"
            className="btn btn-primary d-flex align-items-center gap-2"
            id="add-job-btn"
          >
            <span>+</span> Add Target Job
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="row g-3 mb-5">
          <div className="col-12 col-sm-4">
            <div className="card bg-dark border-secondary p-3">
              <span className="text-secondary small">Target Jobs Saved</span>
              <div className="fs-3 fw-bold text-white mt-1">{jobs.length}</div>
            </div>
          </div>
          <div className="col-12 col-sm-4">
            <div className="card bg-dark border-secondary p-3">
              <span className="text-secondary small">Job DNA Extracted</span>
              <div className="fs-3 fw-bold text-primary mt-1">
                {analyzedCount}
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-4">
            <div className="card bg-dark border-secondary p-3">
              <span className="text-secondary small">Evaluated Matches</span>
              <div className="fs-3 fw-bold text-success mt-1">
                {matchedCount}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small mb-4" role="alert">
            {error}
          </div>
        )}

        {/* Jobs List */}
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="fw-bold mb-0">Your Target Jobs ({jobs.length})</h5>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="text-secondary mt-2 small">Loading target jobs…</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="card bg-dark border-secondary p-5 text-center">
              <div className="display-6 mb-3">🎯</div>
              <h5 className="fw-bold mb-2">No Target Jobs Added Yet</h5>
              <p
                className="text-secondary small mb-4"
                style={{ maxWidth: '480px', margin: '0 auto' }}
              >
                Add your first job posting to extract its required skills,
                experience thresholds, responsibilities, and generate a
                multi-category match score against your resumes.
              </p>
              <div>
                <Link to="/jobs/new" className="btn btn-primary px-4">
                  Add Your First Job Description →
                </Link>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {jobs.map((job) => {
                const isAnalyzed = job.status === 'ANALYZED';
                const matchScore = job.latestMatch?.overallScore;
                const matchBadgeClass =
                  matchScore !== undefined
                    ? matchScore >= 80
                      ? 'bg-success bg-opacity-25 text-success border-success'
                      : matchScore >= 60
                        ? 'bg-warning bg-opacity-25 text-warning border-warning'
                        : 'bg-danger bg-opacity-25 text-danger border-danger'
                    : '';

                return (
                  <div
                    key={job.id}
                    className="card bg-dark border-secondary shadow-sm hover-border transition p-3"
                    id={`job-card-${job.id}`}
                  >
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded p-3 fs-4 d-flex align-items-center justify-content-center"
                          style={{ width: '48px', height: '48px' }}
                        >
                          💼
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <h6 className="fw-bold text-white mb-0">
                              {job.title}
                            </h6>
                            <span
                              className={`badge ${
                                isAnalyzed
                                  ? 'bg-success bg-opacity-25 text-success border border-success border-opacity-25'
                                  : 'bg-secondary bg-opacity-25 text-secondary'
                              } small`}
                            >
                              {job.status}
                            </span>
                            {job.latestAnalysis?.level && (
                              <span className="badge bg-secondary bg-opacity-50 small">
                                {job.latestAnalysis.level}
                              </span>
                            )}
                          </div>
                          <p className="text-secondary small mb-0 mt-1">
                            <span className="text-white fw-semibold">
                              {job.company}
                            </span>
                            {job.location ? ` · ${job.location}` : ''}
                            {job.employmentType
                              ? ` · ${job.employmentType}`
                              : ''}
                            {` · Added ${new Date(job.createdAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-3">
                        {matchScore !== undefined ? (
                          <div className="text-end me-2">
                            <div className="d-flex align-items-center gap-2 justify-content-end">
                              <span className="text-secondary small">
                                Match Score
                              </span>
                              <span
                                className={`badge border ${matchBadgeClass} fs-6 px-2 py-1`}
                              >
                                {matchScore}%
                              </span>
                            </div>
                            <span className="text-secondary small">
                              {matchScore >= 80
                                ? 'Strong Match'
                                : matchScore >= 60
                                  ? 'Competitive'
                                  : 'Gap Alignment Needed'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-secondary small me-2">
                            No resume matched
                          </span>
                        )}

                        <Link
                          to={`/jobs/${job.id}/analysis`}
                          className="btn btn-outline-primary btn-sm px-3"
                          id={`view-dna-${job.id}`}
                        >
                          {isAnalyzed ? 'View Job DNA' : 'Analyze DNA ⚡'}
                        </Link>

                        <Link
                          to={`/jobs/${job.id}`}
                          className="btn btn-primary btn-sm px-3"
                          id={`match-resume-${job.id}`}
                        >
                          Match Resume ⚡
                        </Link>

                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={(e) => handleDelete(job.id, e)}
                          id={`delete-job-${job.id}`}
                          title="Delete Job"
                        >
                          🗑
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
    </div>
  );
}
