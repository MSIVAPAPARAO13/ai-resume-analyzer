import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { analyticsApi } from '../lib/api.js';

export default function AnalyticsInterviewsPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviewData, setInterviewData] = useState<any>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    loadInterviewAnalytics();
  }, []);

  async function loadInterviewAnalytics() {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getInterviews();
      setInterviewData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load interview analytics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">
            Loading interview analytics...
          </span>
        </div>
      </div>
    );
  }

  const categoryScores = interviewData?.categoryScores || {
    technicalReadiness: 0,
    behavioralReadiness: 0,
    resumeReadiness: 0,
    jobSpecificReadiness: 0,
  };

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link to="/analytics" className="btn btn-outline-secondary btn-sm">
            ← Analytics Overview
          </Link>
          <span className="navbar-brand fw-bold text-primary mb-0">
            🎙️ Interview Readiness Analytics
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link to="/interviews" className="btn btn-warning btn-sm fw-semibold">
            Go to Interview Hub →
          </Link>
        </div>
      </nav>

      <div className="container py-4">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="alert alert-info py-2 small mb-4" role="alert">
          ℹ️ <strong>Interview Preparation Metric:</strong> These scores
          evaluate your practice sessions, mock responses, and AI rubrics. They
          measure preparation readiness, not actual hiring probability.
        </div>

        {/* Metric Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                TOTAL SESSIONS
              </span>
              <h2 className="text-white mt-2 mb-0 fw-bold">
                {interviewData?.totalSessions || 0}
              </h2>
              <span className="text-secondary small mt-1">
                {interviewData?.completedSessions || 0} completed
              </span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                AVG PREPARATION SCORE
              </span>
              <h2 className="text-warning mt-2 mb-0 fw-bold">
                {interviewData?.averageScore
                  ? `${interviewData.averageScore}/100`
                  : 'N/A'}
              </h2>
              <span className="text-secondary small mt-1">
                Across evaluated answers
              </span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                STRONGEST CATEGORY
              </span>
              <h4 className="text-success mt-2 mb-0 fw-bold">
                {interviewData?.strongestCategory || 'Not determined'}
              </h4>
              <span className="text-secondary small mt-1">
                Consistently highest scores
              </span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                WEAKEST CATEGORY
              </span>
              <h4 className="text-danger mt-2 mb-0 fw-bold">
                {interviewData?.weakestCategory || 'Not determined'}
              </h4>
              <span className="text-secondary small mt-1">
                Recommended for more practice
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Progress */}
        <div className="card bg-secondary bg-opacity-10 border-secondary p-4 mb-4">
          <h5 className="fw-semibold text-white mb-4">
            Readiness Breakdown by Dimension
          </h5>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="p-3 bg-dark rounded border border-secondary">
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-light fw-semibold">
                    Technical Readiness
                  </span>
                  <span className="text-warning">
                    {categoryScores.technicalReadiness}/100
                  </span>
                </div>
                <div
                  className="progress bg-secondary"
                  style={{ height: '8px' }}
                >
                  <div
                    className="progress-bar bg-warning"
                    role="progressbar"
                    style={{ width: `${categoryScores.technicalReadiness}%` }}
                  />
                </div>
                <small className="text-secondary d-block mt-2">
                  System architecture, code explanation, and problem-solving
                  depth.
                </small>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 bg-dark rounded border border-secondary">
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-light fw-semibold">
                    Behavioral Readiness
                  </span>
                  <span className="text-info">
                    {categoryScores.behavioralReadiness}/100
                  </span>
                </div>
                <div
                  className="progress bg-secondary"
                  style={{ height: '8px' }}
                >
                  <div
                    className="progress-bar bg-info"
                    role="progressbar"
                    style={{ width: `${categoryScores.behavioralReadiness}%` }}
                  />
                </div>
                <small className="text-secondary d-block mt-2">
                  STAR structure, leadership, team collaboration, and
                  communication clarity.
                </small>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 bg-dark rounded border border-secondary">
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-light fw-semibold">
                    Resume Readiness
                  </span>
                  <span className="text-success">
                    {categoryScores.resumeReadiness}/100
                  </span>
                </div>
                <div
                  className="progress bg-secondary"
                  style={{ height: '8px' }}
                >
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${categoryScores.resumeReadiness}%` }}
                  />
                </div>
                <small className="text-secondary d-block mt-2">
                  Ability to articulate accomplishments and projects on your
                  resume.
                </small>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 bg-dark rounded border border-secondary">
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-light fw-semibold">
                    Job-Specific Readiness
                  </span>
                  <span className="text-primary">
                    {categoryScores.jobSpecificReadiness}/100
                  </span>
                </div>
                <div
                  className="progress bg-secondary"
                  style={{ height: '8px' }}
                >
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{ width: `${categoryScores.jobSpecificReadiness}%` }}
                  />
                </div>
                <small className="text-secondary d-block mt-2">
                  Alignment to specific responsibilities in target job
                  descriptions.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
