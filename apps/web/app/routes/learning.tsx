import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { learningApi } from '../lib/api.js';
import AppNavbar from '../components/AppNavbar.js';

export default function LearningPlansPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      setLoading(true);
      setError(null);
      const data = await learningApi.listPlans();
      setPlans(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load learning plans');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading learning plans...</span>
        </div>
      </div>
    );
  }

  const activePlans = plans.filter(
    (p) => p.status === 'ACTIVE' || p.status === 'DRAFT',
  );
  const completedPlans = plans.filter((p) => p.status === 'COMPLETED');

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      <AppNavbar />

      <div className="container py-4">
        {/* Header & Action */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">
              Evidence-Building Learning Plans
            </h1>
            <p className="text-secondary small mb-0">
              Transform skill gaps into structured learning goals with
              actionable tasks and verifiable artifacts.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link
              to="/learning/new"
              className="btn btn-success btn-sm fw-semibold"
              id="new-learning-plan-btn"
            >
              + New Learning Plan
            </Link>
          </div>
        </div>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="alert alert-info py-2 small mb-4" role="alert">
          💡 <strong>Evidence-Building Philosophy:</strong> Learning plans in
          Resumind are designed to build tangible proof-of-work (repositories,
          architecture documentation, modules) to strengthen your Career Twin.
        </div>

        {/* Overview Stats */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                TOTAL PLANS
              </span>
              <h2 className="text-white mt-2 mb-0 fw-bold">{plans.length}</h2>
              <span className="text-secondary small mt-1">
                Structured career roadmaps
              </span>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                ACTIVE PLANS
              </span>
              <h2 className="text-warning mt-2 mb-0 fw-bold">
                {activePlans.length}
              </h2>
              <span className="text-secondary small mt-1">
                In progress or draft
              </span>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <span className="text-secondary small fw-semibold">
                COMPLETED PLANS
              </span>
              <h2 className="text-success mt-2 mb-0 fw-bold">
                {completedPlans.length}
              </h2>
              <span className="text-secondary small mt-1">
                Objectives fulfilled
              </span>
            </div>
          </div>
        </div>

        {/* Active Plans List */}
        <h5 className="fw-semibold text-white mb-3">
          Active Learning Roadmaps
        </h5>
        {activePlans.length === 0 ? (
          <div className="card bg-secondary bg-opacity-10 border-secondary p-5 text-center mb-4">
            <h5 className="text-secondary mb-2">No Active Learning Plans</h5>
            <p className="text-secondary small mb-3">
              Generate a personalized roadmap to close critical skill gaps
              identified in your profile.
            </p>
            <Link
              to="/learning/new"
              className="btn btn-success btn-sm align-self-center"
            >
              Create Your First Plan →
            </Link>
          </div>
        ) : (
          <div className="row g-3 mb-4">
            {activePlans.map((plan) => {
              const goalsCount = plan.goals?.length || 0;
              const completedGoalsCount =
                plan.goals?.filter((g: any) => g.status === 'COMPLETED')
                  .length || 0;
              const progressPct =
                goalsCount > 0
                  ? Math.round((completedGoalsCount / goalsCount) * 100)
                  : 0;

              return (
                <div key={plan.id} className="col-lg-6">
                  <div className="card bg-secondary bg-opacity-10 border-secondary p-4 h-100 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h5 className="fw-bold text-white mb-0">
                          {plan.title}
                        </h5>
                        <small className="text-info fw-semibold">
                          Target Role: {plan.targetRole || 'General'}
                        </small>
                      </div>
                      <span
                        className={`badge ${
                          plan.status === 'ACTIVE'
                            ? 'bg-warning text-dark'
                            : 'bg-secondary'
                        }`}
                      >
                        {plan.status}
                      </span>
                    </div>

                    <p className="text-light small mb-3 flex-grow-1">
                      {plan.description ||
                        'Structured roadmap focused on evidence-backed skills.'}
                    </p>

                    <div className="mb-3">
                      <div className="d-flex justify-content-between small text-secondary mb-1">
                        <span>Progress: {progressPct}%</span>
                        <span>
                          {completedGoalsCount} of {goalsCount} goals completed
                        </span>
                      </div>
                      <div
                        className="progress bg-dark"
                        style={{ height: '6px' }}
                      >
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary">
                      <small className="text-secondary">
                        Target:{' '}
                        {plan.targetDate
                          ? new Date(plan.targetDate).toLocaleDateString()
                          : 'Self-paced'}
                      </small>
                      <Link
                        to={`/learning/${plan.id}`}
                        className="btn btn-primary btn-sm fw-semibold"
                      >
                        View Plan Details →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed Plans List */}
        {completedPlans.length > 0 && (
          <div>
            <h5 className="fw-semibold text-white mb-3">Completed Roadmaps</h5>
            <div className="row g-3">
              {completedPlans.map((plan) => (
                <div key={plan.id} className="col-md-6">
                  <div className="card bg-secondary bg-opacity-10 border-success p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-bold text-white mb-0">
                          {plan.title}
                        </h6>
                        <small className="text-secondary">
                          {plan.targetRole}
                        </small>
                      </div>
                      <span className="badge bg-success">COMPLETED</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
