import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { analyticsApi } from '../lib/api.js';

export default function AnalyticsRolesPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleData, setRoleData] = useState<any>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    loadRoleAnalytics();
  }, []);

  async function loadRoleAnalytics() {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getRoles();
      setRoleData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load role alignment');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading role alignment...</span>
        </div>
      </div>
    );
  }

  const role = roleData?.targetRole || 'Software Engineer';
  const level = roleData?.targetLevel || 'Mid-Level';
  const strongSkills = roleData?.strongSkills || [];
  const partialSkills = roleData?.partialSkills || [];
  const missingSkills = roleData?.missingSkills || [];
  const whyItMatters =
    roleData?.whyItMatters ||
    'Aligned with target job requirements in your saved portfolio.';

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link to="/analytics" className="btn btn-outline-secondary btn-sm">
            ← Analytics Overview
          </Link>
          <span className="navbar-brand fw-bold text-primary mb-0">
            🎯 Target Role Alignment
          </span>
        </div>
      </nav>

      <div className="container py-4">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Role Header Banner */}
        <div className="card bg-secondary bg-opacity-10 border-secondary p-4 mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center">
            <div>
              <span className="text-secondary small fw-bold">
                ACTIVE TARGET ROLE
              </span>
              <h2 className="text-white fw-bold mb-1">{role}</h2>
              <span className="badge bg-primary fs-6">{level}</span>
            </div>
            <div className="mt-3 mt-md-0">
              <Link to="/career" className="btn btn-outline-secondary btn-sm">
                Edit Target Role in Career Twin →
              </Link>
            </div>
          </div>

          <div className="mt-4 p-3 bg-dark rounded border border-secondary">
            <h6 className="text-warning fw-semibold mb-1">
              💡 Why This Matters For Your Career
            </h6>
            <p className="text-light small mb-0">{whyItMatters}</p>
          </div>
        </div>

        {/* Three Columns of Skills */}
        <div className="row g-4">
          {/* Strong Skills */}
          <div className="col-lg-4">
            <div className="card bg-secondary bg-opacity-10 border-success p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-success mb-0">✅ Strong Skills</h5>
                <span className="badge bg-success">{strongSkills.length}</span>
              </div>
              <p className="text-secondary small mb-3">
                Skills with multi-source verified proof, projects, and Career
                Twin presence.
              </p>
              {strongSkills.length === 0 ? (
                <p className="text-secondary small">
                  No skills classified as strong yet.
                </p>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {strongSkills.map((sk: string, idx: number) => (
                    <span
                      key={idx}
                      className="badge bg-success bg-opacity-25 text-success border border-success p-2"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Partial Skills */}
          <div className="col-lg-4">
            <div className="card bg-secondary bg-opacity-10 border-warning p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-warning mb-0">⚠️ Partial Skills</h5>
                <span className="badge bg-warning text-dark">
                  {partialSkills.length}
                </span>
              </div>
              <p className="text-secondary small mb-3">
                Skills mentioned in resumes or single sources that need verified
                proof-of-work.
              </p>
              {partialSkills.length === 0 ? (
                <p className="text-secondary small">
                  No partial skills detected.
                </p>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {partialSkills.map((sk: string, idx: number) => (
                    <span
                      key={idx}
                      className="badge bg-warning bg-opacity-25 text-warning border border-warning p-2"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Missing Skills */}
          <div className="col-lg-4">
            <div className="card bg-secondary bg-opacity-10 border-danger p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-danger mb-0">❌ Missing Skills</h5>
                <span className="badge bg-danger">{missingSkills.length}</span>
              </div>
              <p className="text-secondary small mb-3">
                Frequently required by target jobs but absent from your
                candidate profile.
              </p>
              {missingSkills.length === 0 ? (
                <p className="text-secondary small">
                  No missing skills detected for this role.
                </p>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {missingSkills.map((sk: string, idx: number) => (
                    <span
                      key={idx}
                      className="badge bg-danger bg-opacity-25 text-danger border border-danger p-2"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
