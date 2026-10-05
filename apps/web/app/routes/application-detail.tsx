import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { applicationApi } from '../lib/api.js';

interface ApplicationDetail {
  id: string;
  company: string;
  role: string;
  status:
    | 'SAVED'
    | 'APPLIED'
    | 'ASSESSMENT'
    | 'INTERVIEW'
    | 'OFFER'
    | 'REJECTED'
    | 'WITHDRAWN';
  jobUrl?: string | null;
  appliedAt?: string | null;
  followUpAt?: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: string;
    title: string;
    company: string;
    location?: string | null;
    source?: string | null;
    sourceUrl?: string | null;
    requirements?: Array<{ id: string; name: string; type: string }>;
    analyses?: Array<{ id: string; role: string; level?: string | null }>;
    matches?: Array<{
      id: string;
      overallScore: number;
      result: any;
      createdAt: string;
    }>;
  } | null;
  resumeVersion?: {
    id: string;
    versionNumber: number;
    resume?: {
      id: string;
      title: string;
      originalFileName: string;
    } | null;
    analyses?: Array<{
      id: string;
      overallScore: number;
      atsScore: number;
    }>;
  } | null;
  tailoringSession?: {
    id: string;
    status: string;
    suggestions?: Array<{
      id: string;
      status: string;
      type: string;
    }>;
  } | null;
  events?: Array<{
    id: string;
    type: string;
    description: string;
    eventDate: string;
    createdAt: string;
  }>;
}

const STATUS_OPTIONS = [
  { value: 'SAVED', label: '📌 Saved', color: 'secondary' },
  { value: 'APPLIED', label: '📨 Applied', color: 'primary' },
  { value: 'ASSESSMENT', label: '📝 Assessment', color: 'info' },
  { value: 'INTERVIEW', label: '🎙️ Interview', color: 'warning' },
  { value: 'OFFER', label: '🎉 Offer', color: 'success' },
  { value: 'REJECTED', label: '❌ Rejected', color: 'danger' },
  { value: 'WITHDRAWN', label: 'Withdrawn', color: 'secondary' },
];

export default function ApplicationDetailPage() {
  const { user, initialized } = useAuthStore();
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState<ApplicationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick event form
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventType, setNewEventType] = useState('NOTE');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [eventSaving, setEventSaving] = useState(false);

  // Status notes update modal
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (initialized && user && id) {
      loadApplication();
    }
  }, [initialized, user, id]);

  async function loadApplication() {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await applicationApi.getApplication(id);
      setApplication(data);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to load application details.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!id || !application) return;
    try {
      setUpdatingStatus(true);
      const notes = prompt(
        `Update status to "${newStatus}"? Add optional event notes:`,
        '',
      );
      if (notes === null) {
        setUpdatingStatus(false);
        return; // cancelled
      }
      await applicationApi.updateStatus(id, newStatus, notes);
      await loadApplication();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !newEventDesc.trim()) return;
    try {
      setEventSaving(true);
      await applicationApi.createEvent(id, {
        type: newEventType,
        description: newEventDesc.trim(),
        eventDate: newEventDate ? new Date(newEventDate).toISOString() : null,
      });
      setNewEventDesc('');
      setShowAddEvent(false);
      await loadApplication();
    } catch (err: any) {
      alert(
        err.response?.data?.error?.message || 'Failed to add timeline event.',
      );
    } finally {
      setEventSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || !application) return;
    if (
      !confirm(
        `Are you sure you want to delete application for ${application.role} at ${application.company}?`,
      )
    )
      return;
    try {
      await applicationApi.deleteApplication(id);
      navigate('/applications');
    } catch (err: any) {
      alert(
        err.response?.data?.error?.message || 'Failed to delete application.',
      );
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
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-vh-100 bg-dark text-white py-5">
        <div className="container" style={{ maxWidth: 600 }}>
          <div className="alert alert-danger mb-4">
            {error || 'Application not found.'}
          </div>
          <Link to="/applications" className="btn btn-primary btn-sm">
            ← Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  const latestMatch = application.job?.matches?.[0];
  const resumeScore = application.resumeVersion?.analyses?.[0]?.overallScore;
  const matchResult = latestMatch?.result as any;
  const strongMatchesCount = matchResult?.strongMatches?.length || 0;
  const missingReqsCount = matchResult?.missing?.length || 0;

  const currentStatusObj =
    STATUS_OPTIONS.find((s) => s.value === application.status) ||
    STATUS_OPTIONS[0];

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      {/* Top Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link to="/applications" className="btn btn-outline-secondary btn-sm">
            ← Applications
          </Link>
          <span className="navbar-brand fw-bold text-primary mb-0">
            {application.role}
          </span>
          <span className="text-secondary small">at</span>
          <span className="fw-semibold text-white">{application.company}</span>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Quick Status Select */}
          <select
            className={`form-select form-select-sm bg-dark text-white border-${currentStatusObj.color}`}
            style={{ width: 'auto' }}
            value={application.status}
            disabled={updatingStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            id="status-changer-select"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Prepare for Interview button */}
          <Link
            to={`/interviews/new?applicationId=${application.id}&jobId=${application.job?.id || ''}&resumeVersionId=${application.resumeVersion?.id || ''}&company=${encodeURIComponent(application.company)}&role=${encodeURIComponent(application.role)}`}
            className={`btn btn-sm ${application.status === 'INTERVIEW' ? 'btn-warning fw-bold' : 'btn-outline-warning'}`}
            id="prepare-interview-btn"
          >
            🎙️ Prepare for Interview
          </Link>

          <button
            onClick={handleDelete}
            className="btn btn-outline-danger btn-sm"
            title="Delete Application"
          >
            🗑️ Delete
          </button>
        </div>
      </nav>

      <div className="container py-4">
        {/* Banner with Follow-Up Reminder */}
        {application.followUpAt && (
          <div className="alert alert-info border-info d-flex justify-content-between align-items-center mb-4 py-2 px-3">
            <div className="d-flex align-items-center gap-2">
              <span className="fs-5">⏰</span>
              <span>
                <strong>Follow up:</strong>{' '}
                {new Date(application.followUpAt).toLocaleDateString(
                  undefined,
                  {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  },
                )}
              </span>
            </div>
            <span className="badge bg-info text-dark">Reminder active</span>
          </div>
        )}

        <div className="row g-4">
          {/* Left Column: Context Cards (Job, Resume, Match, Tailoring) */}
          <div className="col-lg-7">
            {/* 1. Job Details Card */}
            <div className="card bg-dark border-secondary p-4 mb-4 shadow-sm">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <span className="text-secondary small fw-semibold text-uppercase">
                    Target Job
                  </span>
                  <h4 className="fw-bold text-white mb-1 mt-1">
                    {application.role}
                  </h4>
                  <div className="text-secondary small">
                    🏢 <strong>{application.company}</strong>
                    {application.job?.location
                      ? ` • 📍 ${application.job.location}`
                      : ''}
                  </div>
                </div>

                {application.job && (
                  <Link
                    to={`/jobs/${application.job.id}`}
                    className="btn btn-outline-primary btn-sm"
                  >
                    View Job DNA →
                  </Link>
                )}
              </div>

              {application.jobUrl && (
                <div className="mb-3">
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary small text-break"
                  >
                    🔗 {application.jobUrl}
                  </a>
                </div>
              )}

              {application.job?.requirements &&
                application.job.requirements.length > 0 && (
                  <div className="pt-2 border-top border-secondary">
                    <span className="text-secondary small d-block mb-2">
                      Key Requirements ({application.job.requirements.length}{' '}
                      detected):
                    </span>
                    <div className="d-flex flex-wrap gap-1">
                      {application.job.requirements.slice(0, 8).map((req) => (
                        <span
                          key={req.id}
                          className="badge bg-secondary bg-opacity-25 text-light border border-secondary"
                          style={{ fontSize: 11 }}
                        >
                          {req.name}
                        </span>
                      ))}
                      {application.job.requirements.length > 8 && (
                        <span
                          className="badge bg-dark text-secondary"
                          style={{ fontSize: 11 }}
                        >
                          +{application.job.requirements.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* 2. Resume & Match Analysis Card */}
            <div className="card bg-dark border-secondary p-4 mb-4 shadow-sm">
              <h5 className="fw-bold text-white mb-3">Linked Resume & Match</h5>

              <div className="row g-3">
                {/* Resume Version Box */}
                <div className="col-md-6">
                  <div className="card bg-dark border-secondary p-3 h-100">
                    <span className="text-secondary small">
                      Resume Deployed
                    </span>
                    {application.resumeVersion ? (
                      <>
                        <h6 className="fw-bold text-white mt-1 mb-1">
                          📄{' '}
                          {application.resumeVersion.resume?.title || 'Resume'}
                        </h6>
                        <span
                          className="badge bg-secondary bg-opacity-50 text-light w-fit mb-2"
                          style={{ width: 'fit-content' }}
                        >
                          Version {application.resumeVersion.versionNumber}
                        </span>
                        {typeof resumeScore === 'number' && (
                          <div className="small text-secondary">
                            Resume Quality Score:{' '}
                            <strong className="text-primary">
                              {resumeScore}/100
                            </strong>
                          </div>
                        )}
                        <div className="mt-2">
                          <Link
                            to={`/resumes/${application.resumeVersion.resume?.id}`}
                            className="btn btn-link text-primary p-0 small text-decoration-none"
                          >
                            Inspect Resume →
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="text-secondary small mt-2">
                        No specific resume version linked to this application.
                      </div>
                    )}
                  </div>
                </div>

                {/* Match Score Box */}
                <div className="col-md-6">
                  <div className="card bg-dark border-secondary p-3 h-100">
                    <span className="text-secondary small">
                      Latest Match Score
                    </span>
                    {latestMatch ? (
                      <>
                        <div className="d-flex align-items-baseline gap-2 mt-1 mb-1">
                          <span className="display-6 fw-bold text-success">
                            {latestMatch.overallScore}%
                          </span>
                          <span className="text-secondary small">
                            alignment
                          </span>
                        </div>
                        <div className="small text-secondary mb-2">
                          ✅ {strongMatchesCount} strong matches • ⚠️{' '}
                          {missingReqsCount} missing
                        </div>
                        {application.job && (
                          <Link
                            to={`/jobs/${application.job.id}/match/${latestMatch.id}`}
                            className="btn btn-link text-success p-0 small text-decoration-none"
                          >
                            Full Match Report →
                          </Link>
                        )}
                      </>
                    ) : (
                      <div className="text-secondary small mt-2">
                        No match analysis performed yet for this job and resume
                        version.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tailoring Session info if available */}
              {application.tailoringSession && (
                <div className="mt-3 p-3 border border-secondary rounded bg-dark bg-opacity-50 d-flex justify-content-between align-items-center">
                  <div>
                    <span className="badge bg-info bg-opacity-25 text-info mb-1">
                      AI Tailored Application
                    </span>
                    <div className="text-secondary small">
                      {application.tailoringSession.suggestions?.filter(
                        (s) => s.status === 'ACCEPTED',
                      ).length || 0}{' '}
                      suggestions accepted and merged.
                    </div>
                  </div>
                  {application.job && application.resumeVersion?.resume && (
                    <Link
                      to={`/resumes/${application.resumeVersion.resume.id}/tailor/${application.job.id}`}
                      className="btn btn-outline-info btn-sm"
                    >
                      View Tailoring →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* 3. Recruiter & Internal Notes Card */}
            <div className="card bg-dark border-secondary p-4 shadow-sm">
              <h5 className="fw-bold text-white mb-3">
                Recruiter & Application Notes
              </h5>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="text-secondary small d-block">
                    Recruiter Contact
                  </label>
                  <span className="text-white fw-semibold">
                    {application.recruiterName || 'Not specified'}
                  </span>
                </div>
                <div className="col-md-6">
                  <label className="text-secondary small d-block">
                    Recruiter Email
                  </label>
                  {application.recruiterEmail ? (
                    <a
                      href={`mailto:${application.recruiterEmail}`}
                      className="text-primary"
                    >
                      {application.recruiterEmail}
                    </a>
                  ) : (
                    <span className="text-secondary">Not specified</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-secondary small d-block mb-1">
                  Internal Notes
                </label>
                <div
                  className="p-3 bg-dark border border-secondary rounded text-light small"
                  style={{ minHeight: 80, whiteSpace: 'pre-wrap' }}
                >
                  {application.notes ||
                    'No notes added yet for this application.'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Application Events Timeline */}
          <div className="col-lg-5">
            <div className="card bg-dark border-secondary p-4 shadow-sm h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold text-white mb-0">
                    Application Timeline
                  </h5>
                  <span className="text-secondary small">
                    Chronological event log
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setShowAddEvent(!showAddEvent)}
                  id="add-event-toggle-btn"
                >
                  {showAddEvent ? 'Cancel' : '+ Add Event'}
                </button>
              </div>

              {/* Add Event Form Modal/Drawer */}
              {showAddEvent && (
                <form
                  onSubmit={handleAddEvent}
                  className="p-3 border border-secondary rounded bg-dark bg-opacity-75 mb-4"
                >
                  <h6 className="fw-bold text-white mb-2">Log New Activity</h6>

                  <div className="mb-2">
                    <label className="form-label text-secondary small">
                      Event Type
                    </label>
                    <select
                      className="form-select form-select-sm bg-dark text-white border-secondary"
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value)}
                      id="new-event-type"
                    >
                      <option value="NOTE">📝 Note / Log</option>
                      <option value="APPLIED">📨 Applied</option>
                      <option value="ASSESSMENT">📝 Online Assessment</option>
                      <option value="INTERVIEW">🎙️ Interview Round</option>
                      <option value="FOLLOW_UP">⏰ Follow-up Sent</option>
                      <option value="OFFER">🎉 Offer</option>
                      <option value="REJECTED">❌ Rejection</option>
                      <option value="WITHDRAWN">Withdrawn</option>
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="form-label text-secondary small">
                      Date
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm bg-dark text-white border-secondary"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      id="new-event-date"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary small">
                      Description
                    </label>
                    <textarea
                      className="form-control form-control-sm bg-dark text-white border-secondary"
                      rows={2}
                      placeholder="e.g. Completed technical round with VP of Engineering..."
                      value={newEventDesc}
                      onChange={(e) => setNewEventDesc(e.target.value)}
                      required
                      id="new-event-desc"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={eventSaving}
                    className="btn btn-primary btn-sm w-100"
                    id="save-event-btn"
                  >
                    {eventSaving ? 'Saving…' : 'Record Event'}
                  </button>
                </form>
              )}

              {/* Timeline List */}
              <div
                className="timeline-container d-flex flex-column gap-3 mt-2 overflow-auto"
                style={{ maxHeight: '68vh' }}
              >
                {!application.events || application.events.length === 0 ? (
                  <div className="text-secondary small text-center py-4">
                    No timeline events recorded yet.
                  </div>
                ) : (
                  application.events.map((ev, idx) => (
                    <div
                      key={ev.id || idx}
                      className="timeline-item d-flex gap-3 align-items-start pb-2 border-bottom border-secondary border-opacity-50"
                    >
                      <div
                        className="timeline-icon bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 32, height: 32, fontSize: 14 }}
                      >
                        {ev.type === 'CREATED'
                          ? '✨'
                          : ev.type === 'APPLIED'
                            ? '📨'
                            : ev.type === 'ASSESSMENT'
                              ? '📝'
                              : ev.type === 'INTERVIEW'
                                ? '🎙️'
                                : ev.type === 'OFFER'
                                  ? '🎉'
                                  : ev.type === 'REJECTED'
                                    ? '❌'
                                    : ev.type === 'FOLLOW_UP'
                                      ? '⏰'
                                      : '📌'}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-baseline mb-1">
                          <span className="fw-semibold text-white small">
                            {ev.type}
                          </span>
                          <span
                            className="text-secondary small"
                            style={{ fontSize: 11 }}
                          >
                            {new Date(ev.eventDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p
                          className="text-secondary small mb-0"
                          style={{ whiteSpace: 'pre-wrap' }}
                        >
                          {ev.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
