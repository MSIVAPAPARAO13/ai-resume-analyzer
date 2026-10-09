import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { analyticsApi } from '../lib/api.js';

export default function AnalyticsEvidencePage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evidenceData, setEvidenceData] = useState<any>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    loadEvidenceCoverage();
  }, []);

  async function loadEvidenceCoverage() {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getEvidence();
      setEvidenceData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load evidence coverage');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading evidence coverage...</span>
        </div>
      </div>
    );
  }

  const statusBreakdown = evidenceData?.statusBreakdown || {
    VERIFIED_USER_DATA: 0,
    EXTERNAL_SOURCE: 0,
    NEEDS_REVIEW: 0,
    UNSUPPORTED: 0,
  };

  const sourceBreakdown = evidenceData?.sourceBreakdown || {
    CAREER_TWIN: 0,
    RESUME: 0,
    GITHUB: 0,
    PROJECTS: 0,
  };

  const skills = evidenceData?.skills || [];

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link to="/analytics" className="btn btn-outline-secondary btn-sm">
            ← Analytics Overview
          </Link>
          <span className="navbar-brand fw-bold text-primary mb-0">
            🛡️ Evidence Coverage & Verification Matrix
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link to="/career" className="btn btn-outline-light btn-sm">
            Career Twin →
          </Link>
        </div>
      </nav>

      <div className="container py-4">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="alert alert-secondary py-2 small mb-4" role="alert">
          🛡️ <strong>Evidence Guard Hierarchy:</strong> Resumind enforces strict
          anti-hallucination. Only candidate-entered data and approved imports
          qualify as <code>VERIFIED_USER_DATA</code>. Unverified resume mentions
          require review before being treated as verified proof.
        </div>

        {/* Verification Status Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-success p-3 h-100">
              <span className="text-success small fw-semibold">
                VERIFIED USER DATA
              </span>
              <h2 className="text-success mt-2 mb-0 fw-bold">
                {statusBreakdown.VERIFIED_USER_DATA || 0}
              </h2>
              <span className="text-secondary small mt-1">
                Confirmed in Career Twin
              </span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-info p-3 h-100">
              <span className="text-info small fw-semibold">
                EXTERNAL SOURCE
              </span>
              <h2 className="text-info mt-2 mb-0 fw-bold">
                {statusBreakdown.EXTERNAL_SOURCE || 0}
              </h2>
              <span className="text-secondary small mt-1">
                Approved GitHub repositories
              </span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-warning p-3 h-100">
              <span className="text-warning small fw-semibold">
                NEEDS REVIEW
              </span>
              <h2 className="text-warning mt-2 mb-0 fw-bold">
                {statusBreakdown.NEEDS_REVIEW || 0}
              </h2>
              <span className="text-secondary small mt-1">
                Mentioned in resumes only
              </span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                TOTAL EVIDENCE PIECES
              </span>
              <h2 className="text-white mt-2 mb-0 fw-bold">
                {evidenceData?.totalEvidencePieces || 0}
              </h2>
              <span className="text-secondary small mt-1">
                Across all profile entities
              </span>
            </div>
          </div>
        </div>

        {/* Source Breakdown Pill Summary */}
        <div className="card bg-secondary bg-opacity-10 border-secondary p-4 mb-4">
          <h5 className="fw-semibold text-white mb-3">
            Evidence Sources In Resumind
          </h5>
          <div className="row g-3 text-center">
            <div className="col-6 col-md-3">
              <div className="p-3 bg-dark rounded border border-secondary">
                <span className="text-secondary small d-block">
                  CAREER TWIN
                </span>
                <span className="fs-4 fw-bold text-white">
                  {sourceBreakdown.CAREER_TWIN || 0}
                </span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-dark rounded border border-secondary">
                <span className="text-secondary small d-block">PROJECTS</span>
                <span className="fs-4 fw-bold text-white">
                  {sourceBreakdown.PROJECTS || 0}
                </span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-dark rounded border border-secondary">
                <span className="text-secondary small d-block">
                  GITHUB IMPORTS
                </span>
                <span className="fs-4 fw-bold text-white">
                  {sourceBreakdown.GITHUB || 0}
                </span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-dark rounded border border-secondary">
                <span className="text-secondary small d-block">
                  RESUME MENTIONS
                </span>
                <span className="fs-4 fw-bold text-white">
                  {sourceBreakdown.RESUME || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table of Skills & Evidence */}
        <div className="card bg-secondary bg-opacity-10 border-secondary p-4">
          <h5 className="fw-semibold text-white mb-3">
            Skill Evidence Verification Matrix
          </h5>
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle">
              <thead>
                <tr className="text-secondary small">
                  <th>SKILL</th>
                  <th>VERIFICATION STATUS</th>
                  <th>EVIDENCE COUNT</th>
                  <th>VERIFIED SOURCES</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((sk: any, idx: number) => (
                  <tr key={idx}>
                    <td className="fw-bold text-white">{sk.skill}</td>
                    <td>
                      <span
                        className={`badge ${
                          sk.status === 'VERIFIED_USER_DATA'
                            ? 'bg-success'
                            : sk.status === 'EXTERNAL_SOURCE'
                              ? 'bg-info text-dark'
                              : 'bg-warning text-dark'
                        }`}
                      >
                        {sk.status}
                      </span>
                    </td>
                    <td>{sk.evidenceCount} proof items</td>
                    <td className="small text-secondary">
                      {sk.sources?.join(', ') || 'None'}
                    </td>
                    <td>
                      {sk.status === 'NEEDS_REVIEW' ? (
                        <Link
                          to="/career"
                          className="btn btn-outline-warning btn-sm py-0"
                        >
                          Verify in Twin
                        </Link>
                      ) : (
                        <span className="text-success small">✓ Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
