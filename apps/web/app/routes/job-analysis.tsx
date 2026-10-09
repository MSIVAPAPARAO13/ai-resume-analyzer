import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { jobApi } from '../lib/api.js';

export default function JobAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const { user, initialized } = useAuthStore();

  const [job, setJob] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
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
      const jobData = await jobApi.getJob(id!);
      setJob(jobData);

      if (jobData.latestAnalysis) {
        setAnalysis(jobData.latestAnalysis);
      } else {
        // Trigger initial analysis
        await handleRunAnalysis();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to load Job DNA analysis.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRunAnalysis() {
    try {
      setAnalyzing(true);
      setError(null);
      const updatedJob = await jobApi.analyzeJob(id!);
      setJob(updatedJob);
      setAnalysis(updatedJob.latestAnalysis);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Failed to analyze Job DNA.',
      );
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
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark text-white">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="text-secondary small">
            Extracting structured Job DNA requirements…
          </p>
        </div>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div className="min-vh-100 bg-dark text-white container py-5">
        <div className="alert alert-danger">{error}</div>
        <Link to={`/jobs/${id}`} className="btn btn-outline-secondary">
          ← Back to Job
        </Link>
      </div>
    );
  }

  const jobDna = analysis?.jobDna || {};
  const requiredSkills = jobDna.requiredSkills || [];
  const preferredSkills = jobDna.preferredSkills || [];
  const responsibilities = jobDna.responsibilities || [];
  const keywords = jobDna.keywords || [];
  const exp = jobDna.experienceRequirement || {};
  const edu = jobDna.educationRequirement || {};

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
          <span className="text-secondary small">/</span>
          <span className="text-secondary small">Job DNA</span>
        </div>
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handleRunAnalysis}
            disabled={analyzing}
            id="re-analyze-dna-btn"
          >
            {analyzing ? 'Analyzing…' : '↻ Re-Extract DNA'}
          </button>
          <Link
            to={`/jobs/${id}`}
            className="btn btn-primary btn-sm px-3"
            id="match-resume-nav-btn"
          >
            Match Resume ⚡
          </Link>
        </div>
      </nav>

      <div className="container py-5">
        {/* Header Hero */}
        <div className="card bg-dark border-secondary p-4 mb-4 shadow-sm">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25 fs-6">
                  {jobDna.roleFamily || 'Software Engineering'}
                </span>
                <span className="badge bg-secondary fs-6">
                  {jobDna.level || 'Mid-Level'}
                </span>
              </div>
              <h2 className="fw-bold mb-1" id="job-dna-role-heading">
                {jobDna.role || job?.title}
              </h2>
              <p className="text-secondary small mb-0">
                <span className="text-white fw-semibold">{job?.company}</span>
                {job?.location ? ` · ${job.location}` : ''}
              </p>
            </div>
            <div>
              <Link to={`/jobs/${id}`} className="btn btn-primary px-4">
                Evaluate Resume Match ⚡
              </Link>
            </div>
          </div>

          <hr className="border-secondary my-3" />

          <div>
            <h6 className="text-secondary small text-uppercase fw-bold letter-spacing-1 mb-1">
              Role Overview & Summary
            </h6>
            <p className="text-white small mb-0 lead fs-6">
              {jobDna.summary || job?.description.substring(0, 200)}
            </p>
          </div>
        </div>

        {/* Skills Section Grid */}
        <div className="row g-4 mb-4">
          {/* Required Skills */}
          <div className="col-12 col-md-6">
            <div
              className="card bg-dark border-danger border-opacity-50 h-100 p-4 shadow-sm"
              id="required-skills-card"
            >
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="fw-bold text-danger mb-0 d-flex align-items-center gap-2">
                  <span>★</span> Required Skills ({requiredSkills.length})
                </h5>
                <span className="badge bg-danger bg-opacity-25 text-danger small">
                  Must Have
                </span>
              </div>
              <p className="text-secondary small mb-3">
                Explicit skills that carry heavy weight in the matching
                algorithm.
              </p>
              {requiredSkills.length === 0 ? (
                <span className="text-secondary small">
                  No explicit required skills isolated.
                </span>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {requiredSkills.map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="badge bg-danger bg-opacity-15 text-danger border border-danger border-opacity-25 px-3 py-2 fs-6"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preferred Skills */}
          <div className="col-12 col-md-6">
            <div
              className="card bg-dark border-primary border-opacity-50 h-100 p-4 shadow-sm"
              id="preferred-skills-card"
            >
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                  <span>✦</span> Preferred Skills ({preferredSkills.length})
                </h5>
                <span className="badge bg-primary bg-opacity-25 text-primary small">
                  Nice to Have
                </span>
              </div>
              <p className="text-secondary small mb-3">
                Valued qualifications and bonus technologies.
              </p>
              {preferredSkills.length === 0 ? (
                <span className="text-secondary small">
                  No separate preferred skills isolated.
                </span>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {preferredSkills.map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="badge bg-primary bg-opacity-15 text-primary border border-primary border-opacity-25 px-3 py-2 fs-6"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Experience & Education Cards */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-md-6">
            <div
              className="card bg-dark border-secondary p-4 h-100 shadow-sm"
              id="experience-requirement-card"
            >
              <h5 className="fw-bold mb-2 d-flex align-items-center gap-2">
                <span>💼</span> Experience Expectations
              </h5>
              <div className="fs-5 fw-bold text-warning mb-2">
                {exp.years !== null
                  ? `${exp.years}+ Years Experience`
                  : exp.raw || 'Flexible Experience'}
              </div>
              <p className="text-secondary small mb-0">
                {exp.details ||
                  exp.raw ||
                  'No rigid minimum year threshold stated.'}
              </p>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div
              className="card bg-dark border-secondary p-4 h-100 shadow-sm"
              id="education-requirement-card"
            >
              <h5 className="fw-bold mb-2 d-flex align-items-center gap-2">
                <span>🎓</span> Education Requirements
              </h5>
              <div className="fs-5 fw-bold text-info mb-2">
                {edu.degree || 'Degree or Practical Equivalent'}
              </div>
              <p className="text-secondary small mb-0">
                {edu.raw ||
                  'Degree in Computer Science or equivalent practical engineering background.'}
              </p>
            </div>
          </div>
        </div>

        {/* Core Responsibilities */}
        <div
          className="card bg-dark border-secondary p-4 mb-4 shadow-sm"
          id="responsibilities-card"
        >
          <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <span>📋</span> Key Responsibilities & Duties (
            {responsibilities.length})
          </h5>
          {responsibilities.length === 0 ? (
            <span className="text-secondary small">
              No explicit duty list found.
            </span>
          ) : (
            <div className="d-flex flex-column gap-2">
              {responsibilities.map((resp: string, i: number) => (
                <div
                  key={i}
                  className="d-flex align-items-start gap-2 p-2 bg-secondary bg-opacity-10 rounded text-white small"
                >
                  <span className="text-primary fw-bold">→</span>
                  <span>{resp}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Keywords & Technology Stack */}
        <div
          className="card bg-dark border-secondary p-4 shadow-sm"
          id="keywords-card"
        >
          <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <span>🏷</span> Technical & Domain Keywords ({keywords.length})
          </h5>
          <div className="d-flex flex-wrap gap-2">
            {keywords.map((kw: string, i: number) => (
              <span
                key={i}
                className="badge bg-secondary bg-opacity-30 text-white px-2 py-1 small"
              >
                #{kw}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
