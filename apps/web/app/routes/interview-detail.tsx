import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { interviewApi } from '../lib/api.js';

export default function InterviewDetailPage() {
  const { user, initialized } = useAuthStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [prepPlan, setPrepPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calendar Event Scheduling Modal State
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarStartTime, setCalendarStartTime] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  );
  const [calendarEndTime, setCalendarEndTime] = useState(
    new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString().slice(0, 16),
  );
  const [calendarSummary, setCalendarSummary] = useState('');
  const [schedulingCalendar, setSchedulingCalendar] = useState(false);
  const [calendarSuccess, setCalendarSuccess] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    if (id) {
      loadSession();
    }
  }, [id]);

  async function loadSession() {
    try {
      setLoading(true);
      setError(null);
      const data = await interviewApi.getSession(id!);
      setSession(data);
      setCalendarSummary(
        `Interview Preparation / Interview — ${data.application?.company || data.job?.company || 'Company'} — ${data.application?.role || data.job?.title || 'Engineering Role'}`,
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load interview session.');
    } finally {
      setLoading(false);
    }
  }

  async function loadPrepPlan() {
    try {
      setPlanLoading(true);
      const plan = await interviewApi.getPrepPlan(id!);
      setPrepPlan(plan);
    } catch (err: any) {
      setError(err.message || 'Failed to generate preparation plan.');
    } finally {
      setPlanLoading(false);
    }
  }

  async function handleScheduleCalendar(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSchedulingCalendar(true);
      setCalendarError(null);
      setCalendarSuccess(null);

      const res = await interviewApi.scheduleCalendarEvent(id!, {
        summary: calendarSummary,
        startTime: new Date(calendarStartTime).toISOString(),
        endTime: new Date(calendarEndTime).toISOString(),
        includeNotes: true,
      });

      setCalendarSuccess(res.message || 'Calendar event created!');
      setTimeout(() => setShowCalendarModal(false), 2000);
    } catch (err: any) {
      setCalendarError(
        err.message ||
          'Failed to schedule calendar event. Is Google Calendar connected?',
      );
    } finally {
      setSchedulingCalendar(false);
    }
  }

  if (loading || !session) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="spinner-border text-warning" role="status" />
      </div>
    );
  }

  const answeredCount =
    session.questions?.filter((q: any) => q.answers && q.answers.length > 0)
      .length || 0;

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      {/* Top Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link to="/interviews" className="btn btn-outline-secondary btn-sm">
            ← Interviews
          </Link>
          <span className="navbar-brand fw-bold text-warning mb-0">
            {session.title}
          </span>
          <span className="badge bg-secondary">{session.status}</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-info btn-sm"
            onClick={() => setShowCalendarModal(true)}
            id="open-calendar-modal-btn"
          >
            📅 Add to Calendar
          </button>
          {session.mode === 'MOCK_INTERVIEW' ? (
            <Link
              to={`/interviews/${session.id}/mock`}
              className="btn btn-warning btn-sm fw-semibold"
            >
              Start Mock Interview ⚡
            </Link>
          ) : (
            <Link
              to={`/interviews/${session.id}/questions`}
              className="btn btn-warning btn-sm fw-semibold"
            >
              Practice Questions 📝
            </Link>
          )}
          {session.status === 'COMPLETED' && (
            <Link
              to={`/interviews/${session.id}/report`}
              className="btn btn-success btn-sm"
            >
              Final Report 📊
            </Link>
          )}
        </div>
      </nav>

      <div className="container py-4">
        {error && <div className="alert alert-danger mb-4">{error}</div>}

        {/* Overview Header Card */}
        <div className="card bg-secondary bg-opacity-10 border-secondary p-4 mb-4">
          <div className="row g-4 align-items-center">
            <div className="col-md-8">
              <span className="badge bg-warning bg-opacity-25 text-warning border border-warning mb-2">
                {session.mode} • {session.difficulty} DIFFICULTY
              </span>
              <h3 className="fw-bold mb-2">{session.title}</h3>
              <p className="text-secondary small mb-3">
                {session.application
                  ? `Linked to Application: ${session.application.role} at ${session.application.company}`
                  : session.job
                    ? `Target Job: ${session.job.title} at ${session.job.company}`
                    : 'Generic preparation session'}
              </p>
              <div className="d-flex gap-3 text-secondary small">
                <span>
                  <strong>Questions:</strong> {session.questions?.length || 0}{' '}
                  total
                </span>
                <span>•</span>
                <span>
                  <strong>Answered:</strong> {answeredCount} /{' '}
                  {session.questions?.length || 0}
                </span>
                <span>•</span>
                <span>
                  <strong>Score:</strong>{' '}
                  {session.overallScore
                    ? `${session.overallScore} / 100`
                    : 'Not evaluated yet'}
                </span>
              </div>
            </div>
            <div className="col-md-4 text-md-end">
              <div className="btn-group-vertical w-100">
                <Link
                  to={`/interviews/${session.id}/questions`}
                  className="btn btn-warning fw-semibold mb-2"
                >
                  Go to Question Viewer ({session.questions?.length || 0})
                </Link>
                <Link
                  to={`/interviews/${session.id}/mock`}
                  className="btn btn-outline-light mb-2"
                >
                  Interactive Mock Mode
                </Link>
                <button
                  className="btn btn-outline-info"
                  onClick={loadPrepPlan}
                  disabled={planLoading}
                >
                  {planLoading
                    ? 'Generating Plan…'
                    : '📅 5-Day Preparation Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Prep Checklist & 5-Day Plan (If loaded) */}
        {prepPlan && (
          <div className="card bg-secondary bg-opacity-10 border-secondary p-4 mb-4">
            <h5 className="fw-bold text-info mb-3">
              📋 Personalized 5-Day Preparation Plan
            </h5>

            <div className="row g-3 mb-4">
              {prepPlan.dailyPlans?.map((day: any) => (
                <div key={day.day} className="col-md">
                  <div className="card bg-dark border-secondary h-100 p-3">
                    <span className="badge bg-secondary mb-2 align-self-start">
                      Day {day.day}
                    </span>
                    <h6 className="fw-bold text-white small mb-1">
                      {day.title}
                    </h6>
                    <p
                      className="text-secondary"
                      style={{ fontSize: '0.8rem' }}
                    >
                      {day.focus}
                    </p>
                    <ul
                      className="text-secondary ps-3 mb-0"
                      style={{ fontSize: '0.75rem' }}
                    >
                      {day.tasks?.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <h6 className="fw-bold text-white mb-2">
              Technical Competency Checklist
            </h6>
            <div className="table-responsive">
              <table className="table table-dark table-sm align-middle">
                <thead>
                  <tr className="text-secondary small">
                    <th>SKILL / TOPIC</th>
                    <th>CLASSIFICATION</th>
                    <th>CANDIDATE EVIDENCE</th>
                    <th>RECOMMENDED PREPARATION TOPICS</th>
                  </tr>
                </thead>
                <tbody>
                  {prepPlan.technicalChecklist?.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="fw-semibold text-white">{item.skill}</td>
                      <td>
                        <span
                          className={`badge ${
                            item.classification === 'STRONG'
                              ? 'bg-success'
                              : item.classification === 'REVIEW'
                                ? 'bg-warning text-dark'
                                : 'bg-danger'
                          }`}
                        >
                          {item.classification}
                        </span>
                      </td>
                      <td className="text-secondary small">
                        {item.candidateEvidence}
                      </td>
                      <td className="text-secondary small">
                        {item.recommendedTopics?.join(' • ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Question Outline */}
        <div className="card bg-secondary bg-opacity-10 border-secondary p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">Questions in this Session</h5>
            <span className="badge bg-secondary">
              {session.questions?.length || 0} questions
            </span>
          </div>

          <div className="list-group list-group-flush bg-transparent">
            {session.questions?.map((q: any, idx: number) => {
              const hasAnswer = q.answers && q.answers.length > 0;
              const latestAns = hasAnswer ? q.answers[0] : null;

              return (
                <div
                  key={q.id}
                  className="list-group-item bg-dark border-secondary text-white p-3 mb-2 rounded"
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-secondary">#{idx + 1}</span>
                      <span className="badge bg-warning bg-opacity-25 text-warning border border-warning small">
                        {q.category}
                      </span>
                      <span className="badge bg-dark border border-secondary text-secondary small">
                        {q.difficulty}
                      </span>
                    </div>
                    {hasAnswer &&
                    latestAns?.score !== null &&
                    latestAns?.score !== undefined ? (
                      <span className="badge bg-success bg-opacity-25 text-success border border-success">
                        Score: {latestAns.score} / 100
                      </span>
                    ) : hasAnswer ? (
                      <span className="badge bg-info text-dark">
                        Draft / Submitted
                      </span>
                    ) : (
                      <span className="badge bg-secondary text-white">
                        Unanswered
                      </span>
                    )}
                  </div>
                  <h6 className="fw-bold mb-1">{q.question}</h6>
                  <p className="text-secondary small mb-2">
                    <strong>Why asked:</strong> {q.whyAsked}
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <span
                      className="text-secondary"
                      style={{ fontSize: '0.8rem' }}
                    >
                      {q.evidenceReferences?.length || 0} evidence reference(s)
                    </span>
                    <Link
                      to={`/interviews/${session.id}/questions?selected=${q.id}`}
                      className="btn btn-outline-warning btn-sm"
                    >
                      {hasAnswer ? 'View / Edit Answer' : 'Answer Question →'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calendar Scheduling Modal */}
      {showCalendarModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">
                  📅 Add to Google Calendar
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCalendarModal(false)}
                />
              </div>
              <form onSubmit={handleScheduleCalendar}>
                <div className="modal-body">
                  {calendarSuccess && (
                    <div className="alert alert-success py-2">
                      {calendarSuccess}
                    </div>
                  )}
                  {calendarError && (
                    <div className="alert alert-danger py-2">
                      {calendarError}
                      <div className="mt-2">
                        <Link
                          to="/integrations/google-calendar"
                          className="btn btn-sm btn-outline-light"
                        >
                          Connect Google Calendar →
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-semibold">
                      EVENT TITLE
                    </label>
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-secondary"
                      value={calendarSummary}
                      onChange={(e) => setCalendarSummary(e.target.value)}
                      required
                      id="calendar-summary-input"
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label text-secondary small fw-semibold">
                        START TIME
                      </label>
                      <input
                        type="datetime-local"
                        className="form-control bg-dark text-white border-secondary"
                        value={calendarStartTime}
                        onChange={(e) => setCalendarStartTime(e.target.value)}
                        required
                        id="calendar-start-input"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-secondary small fw-semibold">
                        END TIME
                      </label>
                      <input
                        type="datetime-local"
                        className="form-control bg-dark text-white border-secondary"
                        value={calendarEndTime}
                        onChange={(e) => setCalendarEndTime(e.target.value)}
                        required
                        id="calendar-end-input"
                      />
                    </div>
                  </div>
                  <span className="text-secondary small">
                    Resumind schedules the event with narrow scopes and
                    automatically sets up a 24-hour reminder email.
                  </span>
                </div>
                <div className="modal-footer border-secondary">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setShowCalendarModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-info btn-sm fw-semibold"
                    disabled={schedulingCalendar}
                    id="confirm-calendar-schedule-btn"
                  >
                    {schedulingCalendar
                      ? 'Scheduling…'
                      : 'Confirm & Add to Calendar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
