import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { interviewApi } from '../lib/api.js';

interface InterviewSessionItem {
  id: string;
  title: string;
  mode: 'PREPARATION' | 'MOCK_INTERVIEW';
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  overallScore?: number | null;
  startedAt: string;
  completedAt?: string | null;
  application?: {
    id: string;
    company: string;
    role: string;
    status: string;
  } | null;
  job?: {
    id: string;
    title: string;
    company: string;
  } | null;
  _count?: {
    questions: number;
  };
}

export default function InterviewsPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<InterviewSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setLoading(true);
      setError(null);
      const data = await interviewApi.listSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load interview sessions');
    } finally {
      setLoading(false);
    }
  }

  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
  const activeSessions = sessions.filter(
    (s) => s.status === 'IN_PROGRESS' || s.status === 'DRAFT',
  );

  const avgScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce(
            (acc, curr) => acc + (curr.overallScore || 0),
            0,
          ) / completedSessions.length,
        )
      : null;

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      {/* Top Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link to="/dashboard" className="btn btn-outline-secondary btn-sm">
            ← Dashboard
          </Link>
          <span className="navbar-brand fw-bold text-warning mb-0">
            🎙️ Interview Intelligence
          </span>
        </div>
        <div className="d-flex align-items-center gap-3">
          <Link
            to="/integrations/google-calendar"
            className="btn btn-outline-info btn-sm"
          >
            📅 Google Calendar
          </Link>
          <Link
            to="/interviews/new"
            className="btn btn-warning btn-sm fw-semibold"
            id="new-interview-btn"
          >
            + New Preparation Session
          </Link>
        </div>
      </nav>

      <div className="container py-4">
        {/* Metric Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary h-100 p-3">
              <span className="text-secondary small fw-semibold">
                TOTAL SESSIONS
              </span>
              <h2 className="text-white mt-2 mb-0 fw-bold">
                {sessions.length}
              </h2>
              <span className="text-secondary small mt-1">
                Preparation & Mock
              </span>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary h-100 p-3">
              <span className="text-secondary small fw-semibold">
                ACTIVE PREPARATION
              </span>
              <h2 className="text-warning mt-2 mb-0 fw-bold">
                {activeSessions.length}
              </h2>
              <span className="text-secondary small mt-1">
                In progress or draft
              </span>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary h-100 p-3">
              <span className="text-secondary small fw-semibold">
                COMPLETED SESSIONS
              </span>
              <h2 className="text-success mt-2 mb-0 fw-bold">
                {completedSessions.length}
              </h2>
              <span className="text-secondary small mt-1">
                Evaluated & ready
              </span>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary h-100 p-3">
              <span className="text-secondary small fw-semibold">
                AVERAGE READINESS
              </span>
              <h2 className="text-info mt-2 mb-0 fw-bold">
                {avgScore !== null ? `${avgScore} / 100` : '—'}
              </h2>
              <span className="text-secondary small mt-1">
                Preparation score
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4">
            <span>{error}</span>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={loadSessions}
            >
              Retry
            </button>
          </div>
        )}

        {/* Sessions List */}
        <div className="card bg-secondary bg-opacity-10 border-secondary p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">Interview Preparation Sessions</h5>
            <span className="badge bg-dark border border-secondary text-secondary">
              {sessions.length} sessions
            </span>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <p className="fs-1 mb-2">🎙️</p>
              <h6 className="text-white">
                No interview preparation sessions yet
              </h6>
              <p className="small mb-3">
                Create a personalized interview session grounded in your Career
                Twin, Job DNA, and tailored resume.
              </p>
              <Link to="/interviews/new" className="btn btn-warning btn-sm">
                Start Preparing Now
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr className="text-secondary small">
                    <th>SESSION TITLE</th>
                    <th>TARGET ROLE & COMPANY</th>
                    <th>MODE</th>
                    <th>DIFFICULTY</th>
                    <th>QUESTIONS</th>
                    <th>SCORE</th>
                    <th>STATUS</th>
                    <th className="text-end">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => {
                    const statusColor =
                      s.status === 'COMPLETED'
                        ? 'success'
                        : s.status === 'IN_PROGRESS'
                          ? 'warning'
                          : 'secondary';

                    return (
                      <tr key={s.id} id={`interview-row-${s.id}`}>
                        <td>
                          <Link
                            to={`/interviews/${s.id}`}
                            className="text-white text-decoration-none fw-semibold"
                          >
                            {s.title}
                          </Link>
                        </td>
                        <td>
                          {s.application ? (
                            <div>
                              <span className="text-white">
                                {s.application.role}
                              </span>
                              <span className="text-secondary small d-block">
                                {s.application.company}
                              </span>
                            </div>
                          ) : s.job ? (
                            <div>
                              <span className="text-white">{s.job.title}</span>
                              <span className="text-secondary small d-block">
                                {s.job.company}
                              </span>
                            </div>
                          ) : (
                            <span className="text-secondary small">
                              General Practice
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              s.mode === 'MOCK_INTERVIEW'
                                ? 'bg-danger bg-opacity-25 text-danger border border-danger'
                                : 'bg-primary bg-opacity-25 text-primary border border-primary'
                            } small`}
                          >
                            {s.mode === 'MOCK_INTERVIEW'
                              ? 'Mock Interview'
                              : 'Preparation'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              s.difficulty === 'HARD'
                                ? 'bg-danger text-white'
                                : s.difficulty === 'MEDIUM'
                                  ? 'bg-warning text-dark'
                                  : 'bg-info text-dark'
                            } small`}
                          >
                            {s.difficulty}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-secondary text-white">
                            {s._count?.questions || 0} questions
                          </span>
                        </td>
                        <td>
                          {s.overallScore !== null &&
                          s.overallScore !== undefined ? (
                            <span className="badge bg-success bg-opacity-25 text-success border border-success fw-bold">
                              {s.overallScore} / 100
                            </span>
                          ) : (
                            <span className="text-secondary small">—</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge bg-${statusColor} small`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <Link
                              to={`/interviews/${s.id}`}
                              className="btn btn-outline-secondary"
                              title="View Overview"
                            >
                              Overview
                            </Link>
                            {s.mode === 'MOCK_INTERVIEW' ? (
                              <Link
                                to={`/interviews/${s.id}/mock`}
                                className="btn btn-outline-warning"
                                title="Interactive Mock"
                              >
                                Mock
                              </Link>
                            ) : (
                              <Link
                                to={`/interviews/${s.id}/questions`}
                                className="btn btn-outline-warning"
                                title="Practice Questions"
                              >
                                Questions
                              </Link>
                            )}
                            {s.status === 'COMPLETED' && (
                              <Link
                                to={`/interviews/${s.id}/report`}
                                className="btn btn-outline-success"
                                title="Final Report"
                              >
                                Report
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
