import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { applicationApi, jobApi, resumeApi } from '../lib/api.js';

interface JobOption {
  id: string;
  title: string;
  company: string;
  sourceUrl?: string | null;
}

interface ResumeVersionOption {
  id: string;
  versionNumber: number;
  resumeId: string;
  resumeTitle: string;
  createdAt: string;
}

export default function NewApplicationPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedJobId = searchParams.get('jobId') || '';
  const preselectedResumeVersionId = searchParams.get('resumeVersionId') || '';
  const preselectedTailoringSessionId =
    searchParams.get('tailoringSessionId') || '';

  const [mode, setMode] = useState<'job' | 'manual'>(
    preselectedJobId ? 'job' : 'manual',
  );
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [resumeVersions, setResumeVersions] = useState<ResumeVersionOption[]>(
    [],
  );

  // Form State
  const [jobId, setJobId] = useState(preselectedJobId);
  const [resumeVersionId, setResumeVersionId] = useState(
    preselectedResumeVersionId,
  );
  const [tailoringSessionId, _setTailoringSessionId] = useState(
    preselectedTailoringSessionId,
  );
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [status, setStatus] = useState('APPLIED');
  const [appliedAt, setAppliedAt] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [followUpAt, setFollowUpAt] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && user) {
      loadDependencies();
    }
  }, [initialized, user]);

  async function loadDependencies() {
    try {
      const [jobsData, resumesData] = await Promise.all([
        jobApi.listJobs(),
        resumeApi.listResumes(),
      ]);
      setJobs(jobsData || []);

      // If preselectedJobId exists, populate company and role
      if (preselectedJobId && jobsData) {
        const matchingJob = jobsData.find(
          (j: any) => j.id === preselectedJobId,
        );
        if (matchingJob) {
          setCompany(matchingJob.company);
          setRole(matchingJob.title);
          setJobUrl(matchingJob.sourceUrl || '');
          setJobId(matchingJob.id);
          setMode('job');
        }
      }

      // Collect versions from all user resumes
      const versionsList: ResumeVersionOption[] = [];
      for (const res of resumesData || []) {
        if (res.versions && res.versions.length > 0) {
          for (const v of res.versions) {
            versionsList.push({
              id: v.id,
              versionNumber: v.versionNumber,
              resumeId: res.id,
              resumeTitle: res.title || res.originalFileName,
              createdAt: v.createdAt,
            });
          }
        }
      }
      setResumeVersions(versionsList);

      if (!resumeVersionId && versionsList.length > 0) {
        setResumeVersionId(versionsList[0].id);
      }
    } catch (err: any) {
      console.warn(
        'Failed to load dependency data for application creation:',
        err,
      );
    }
  }

  function handleSelectJob(selectedId: string) {
    setJobId(selectedId);
    const selected = jobs.find((j) => j.id === selectedId);
    if (selected) {
      setCompany(selected.company);
      setRole(selected.title);
      setJobUrl(selected.sourceUrl || '');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) {
      setError('Company name is required.');
      return;
    }
    if (!role.trim()) {
      setError('Role / job title is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        jobId: mode === 'job' && jobId ? jobId : null,
        resumeVersionId: resumeVersionId || null,
        tailoringSessionId: tailoringSessionId || null,
        company: company.trim(),
        role: role.trim(),
        jobUrl: jobUrl.trim() || null,
        status,
        appliedAt: appliedAt ? new Date(appliedAt).toISOString() : null,
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : null,
        recruiterName: recruiterName.trim() || null,
        recruiterEmail: recruiterEmail.trim() || null,
        notes: notes.trim() || null,
      };

      const created = await applicationApi.createApplication(payload);
      navigate(`/applications/${created.id}`);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to create application. Please check your inputs.',
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

  return (
    <div className="min-vh-100 bg-dark text-white">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/applications" className="btn btn-outline-secondary btn-sm">
            ← Applications CRM
          </Link>
          <span className="navbar-brand fw-bold text-primary mb-0">
            Track New Job Application
          </span>
        </div>
      </nav>

      <div className="container py-4" style={{ maxWidth: 840 }}>
        <div className="card bg-dark border-secondary p-4 shadow">
          <div className="mb-4">
            <h2 className="h4 fw-bold text-white mb-1">
              Create Job Application
            </h2>
            <p className="text-secondary small mb-0">
              Record an active job application, link the specific resume version
              you submitted, and set follow-up reminders.
            </p>
          </div>

          {error && (
            <div
              className="alert alert-danger alert-dismissible fade show"
              role="alert"
            >
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError(null)}
              />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Mode selection: Existing Job vs Manual */}
            <div className="mb-4">
              <label className="form-label text-secondary small fw-semibold">
                Application Source
              </label>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${mode === 'job' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setMode('job')}
                  id="mode-existing-job"
                >
                  🎯 Select from Resumind Jobs ({jobs.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${mode === 'manual' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => {
                    setMode('manual');
                    setJobId('');
                  }}
                  id="mode-manual-job"
                >
                  ✍️ Enter Details Manually
                </button>
              </div>
            </div>

            {/* If selecting from existing jobs */}
            {mode === 'job' && (
              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold">
                  Select Existing Job
                </label>
                <select
                  className="form-select bg-dark text-white border-secondary"
                  value={jobId}
                  onChange={(e) => handleSelectJob(e.target.value)}
                  id="select-job-dropdown"
                >
                  <option value="">-- Choose a Saved Job --</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} at {j.company}
                    </option>
                  ))}
                </select>
                <div className="form-text text-secondary">
                  Selecting a job automatically populates role, company, and
                  links Job DNA & Match scores.
                </div>
              </div>
            )}

            {/* Role & Company fields */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label text-secondary small fw-semibold">
                  Company Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="e.g. Stripe, Google, Datadog"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  id="app-company-input"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label text-secondary small fw-semibold">
                  Role / Job Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="e.g. Senior Software Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  id="app-role-input"
                />
              </div>
            </div>

            {/* Job URL */}
            <div className="mb-3">
              <label className="form-label text-secondary small fw-semibold">
                Job Posting URL
              </label>
              <input
                type="url"
                className="form-control bg-dark text-white border-secondary"
                placeholder="https://company.com/careers/job-123"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                id="app-joburl-input"
              />
            </div>

            {/* Resume Version Linking */}
            <div className="mb-4 p-3 border border-secondary rounded bg-dark bg-opacity-50">
              <label className="form-label text-primary small fw-bold d-block mb-1">
                📄 Link Resume Version Used
              </label>
              <p className="text-secondary small mb-2">
                Identify precisely which resume version was sent for this
                application to track performance.
              </p>
              {resumeVersions.length === 0 ? (
                <div className="text-secondary small">
                  No resume versions uploaded yet.{' '}
                  <Link to="/upload" className="text-primary">
                    Upload a resume
                  </Link>{' '}
                  first or save this application as manual.
                </div>
              ) : (
                <select
                  className="form-select bg-dark text-white border-secondary"
                  value={resumeVersionId}
                  onChange={(e) => setResumeVersionId(e.target.value)}
                  id="select-resume-version"
                >
                  <option value="">-- No Resume Version Linked --</option>
                  {resumeVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.resumeTitle} (Version {v.versionNumber}) — created{' '}
                      {new Date(v.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Status and Applied Date */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label text-secondary small fw-semibold">
                  Initial Status
                </label>
                <select
                  className="form-select bg-dark text-white border-secondary"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  id="app-status-select"
                >
                  <option value="SAVED">📌 Saved (Wishlist)</option>
                  <option value="APPLIED">📨 Applied</option>
                  <option value="ASSESSMENT">📝 Online Assessment</option>
                  <option value="INTERVIEW">🎙️ Interview Scheduled</option>
                  <option value="OFFER">🎉 Offer Received</option>
                  <option value="REJECTED">❌ Rejected</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label text-secondary small fw-semibold">
                  Date Applied
                </label>
                <input
                  type="date"
                  className="form-control bg-dark text-white border-secondary"
                  value={appliedAt}
                  onChange={(e) => setAppliedAt(e.target.value)}
                  id="app-appliedat-input"
                />
              </div>
            </div>

            {/* Follow-up date reminder */}
            <div className="mb-3">
              <label className="form-label text-info small fw-semibold">
                ⏰ Follow-up Reminder Date
              </label>
              <input
                type="date"
                className="form-control bg-dark text-white border-secondary"
                value={followUpAt}
                onChange={(e) => setFollowUpAt(e.target.value)}
                id="app-followup-input"
              />
              <div className="form-text text-secondary">
                Set a follow-up date (e.g. 1-2 weeks from now) to check in with
                the recruiter.
              </div>
            </div>

            {/* Recruiter contact */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label text-secondary small fw-semibold">
                  Recruiter / Hiring Contact Name
                </label>
                <input
                  type="text"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="e.g. Jane Doe"
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                  id="app-recruiter-name"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label text-secondary small fw-semibold">
                  Recruiter Email
                </label>
                <input
                  type="email"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="jane.doe@company.com"
                  value={recruiterEmail}
                  onChange={(e) => setRecruiterEmail(e.target.value)}
                  id="app-recruiter-email"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="form-label text-secondary small fw-semibold">
                Application Notes
              </label>
              <textarea
                className="form-control bg-dark text-white border-secondary"
                rows={3}
                placeholder="Key details, interview stages, referrals, or compensation discussed..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                id="app-notes-input"
              />
            </div>

            {/* Submit Buttons */}
            <div className="d-flex justify-content-end gap-2">
              <Link
                to="/applications"
                className="btn btn-outline-secondary btn-sm"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-sm px-4"
                id="save-application-btn"
              >
                {loading ? 'Saving…' : 'Save Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
