import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { jobApi } from '../lib/api.js';

const SAMPLE_JD = `About the Role:
We are looking for a Senior Full Stack Engineer to join our Core Platform team. In this role, you will architect, build, and maintain scalable cloud services and modern user interfaces handling millions of requests daily.

Responsibilities:
- Architect and develop high-throughput RESTful APIs and backend microservices using Node.js, TypeScript, and PostgreSQL.
- Build clean, responsive, and accessible user interfaces using React, Next.js, and TypeScript.
- Design database schemas, write optimized SQL queries, and implement Redis caching strategies.
- Collaborate with cross-functional teams in an Agile environment to deliver production features.
- Write robust unit, integration, and end-to-end tests using Vitest, Jest, or Playwright.
- Maintain CI/CD pipelines, containerize applications using Docker, and deploy to AWS cloud infrastructure.

Minimum Requirements:
- 3+ years of professional full-stack or backend engineering experience.
- Strong proficiency in TypeScript, JavaScript, Node.js, and React.
- Solid experience with relational databases, specifically PostgreSQL or MySQL.
- Practical experience with REST APIs, Git, and automated testing frameworks.
- Bachelor's degree in Computer Science, Software Engineering, or equivalent practical experience.

Preferred Qualifications:
- Experience with Docker, Kubernetes, AWS, or cloud infrastructure.
- Familiarity with Redis, GraphQL, and microservice architectures.
- Experience with Agile development, system design, and CI/CD pipelines.`;

export default function JobNewPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [sourceUrl, setSourceUrl] = useState('');
  const [description, setDescription] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!initialized || !user) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  function handleLoadSample() {
    setTitle('Senior Full Stack Engineer');
    setCompany('CloudScale Systems');
    setLocation('San Francisco, CA (Hybrid / Remote)');
    setEmploymentType('Full-time');
    setSourceUrl('https://example.com/careers/senior-fullstack');
    setDescription(SAMPLE_JD);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !description.trim()) {
      setError('Please provide Job Title, Company, and a Job Description.');
      return;
    }

    if (description.trim().length < 20) {
      setError('Job description must be at least 20 characters.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const newJob = await jobApi.createJob({
        title: title.trim(),
        company: company.trim(),
        location: location.trim() || null,
        employmentType: employmentType.trim() || null,
        sourceUrl: sourceUrl.trim() || null,
        description: description.trim(),
      });

      // Automatically trigger initial Job DNA analysis
      try {
        await jobApi.analyzeJob(newJob.id);
      } catch {
        // If auto-analysis fails, user can trigger from UI
      }

      navigate(`/jobs/${newJob.id}`);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Failed to save job description.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/jobs" className="navbar-brand fw-bold text-primary mb-0">
            ← Jobs
          </Link>
          <span className="text-secondary small">/</span>
          <span className="text-white small fw-semibold">
            Add New Target Job
          </span>
        </div>
        <div className="d-flex align-items-center gap-3">
          <Link to="/resumes" className="btn btn-outline-secondary btn-sm">
            Resumes
          </Link>
          <Link to="/dashboard" className="btn btn-outline-secondary btn-sm">
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="container py-5" style={{ maxWidth: '850px' }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
          <div>
            <h1 className="display-6 fw-bold mb-1">Add Target Job</h1>
            <p className="text-secondary small mb-0">
              Paste a Job Description to extract its Job DNA, requirements, and
              match against your resumes.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={handleLoadSample}
            id="load-sample-jd-btn"
          >
            📋 Load Sample Tech JD
          </button>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small mb-4" role="alert">
            {error}
          </div>
        )}

        <div className="card bg-dark border-secondary shadow-sm p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6">
                <label className="form-label text-secondary small fw-semibold">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Software Engineer"
                  className="form-control bg-dark border-secondary text-white"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  id="job-title-input"
                  disabled={saving}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label text-secondary small fw-semibold">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe, Acme Corp"
                  className="form-control bg-dark border-secondary text-white"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  id="job-company-input"
                  disabled={saving}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label text-secondary small fw-semibold">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Remote / New York, NY"
                  className="form-control bg-dark border-secondary text-white"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  id="job-location-input"
                  disabled={saving}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label text-secondary small fw-semibold">
                  Employment Type
                </label>
                <select
                  className="form-select bg-dark border-secondary text-white"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  id="job-type-select"
                  disabled={saving}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label text-secondary small fw-semibold">
                  Job Posting URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://company.com/job/123"
                  className="form-control bg-dark border-secondary text-white"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  id="job-url-input"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-secondary small fw-semibold">
                Job Description Text *
              </label>
              <textarea
                required
                rows={12}
                placeholder="Paste the complete job description text here, including requirements, qualifications, and responsibilities..."
                className="form-control bg-dark border-secondary text-white font-monospace small"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                id="job-description-input"
                disabled={saving}
              />
              <div className="form-text text-secondary small">
                Paste the original JD text. Our deterministic parser will
                automatically extract required skills, preferred qualifications,
                experience, and responsibilities.
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-end gap-3">
              <Link to="/jobs" className="btn btn-outline-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary px-4 d-flex align-items-center gap-2"
                disabled={
                  saving ||
                  !title.trim() ||
                  !company.trim() ||
                  !description.trim()
                }
                id="save-job-submit"
              >
                {saving ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                    />
                    <span>Analyzing Job DNA…</span>
                  </>
                ) : (
                  <>
                    <span>Save & Extract Job DNA</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
