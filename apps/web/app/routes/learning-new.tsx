import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { learningApi, analyticsApi } from '../lib/api.js';

export default function NewLearningPlanPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const prefillSkill = searchParams.get('skill') || '';
  const prefillRole = searchParams.get('role') || '';

  const [title, setTitle] = useState(
    prefillSkill
      ? `Master & Build Evidence for ${prefillSkill}`
      : 'Quarterly Career Progression Roadmap',
  );
  const [targetRole, setTargetRole] = useState(prefillRole);
  const [description, setDescription] = useState(
    prefillSkill
      ? `Focused evidence-building plan for ${prefillSkill} to close candidate skill gap.`
      : '',
  );
  const [targetDate, setTargetDate] = useState('');
  const [autoGenerateGoals, setAutoGenerateGoals] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    if (!prefillRole) {
      analyticsApi
        .getRoles()
        .then((data) => {
          if (data?.targetRole && !targetRole) {
            setTargetRole(data.targetRole);
          }
        })
        .catch(() => {});
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Plan title is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 1. Create the plan
      const plan = await learningApi.createPlan({
        title,
        targetRole: targetRole || undefined,
        description: description || undefined,
        targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
      });

      // 2. If autoGenerateGoals is checked, call generate endpoint
      if (autoGenerateGoals) {
        try {
          await learningApi.generatePlan(plan.id);
        } catch (genErr) {
          // If auto generation fails, we still navigate to the created plan
          console.warn(
            'Auto generation had an issue, plan still created:',
            genErr,
          );
        }
      } else if (prefillSkill) {
        // Add single goal for the prefilled skill
        await learningApi.addGoal(plan.id, {
          skill: prefillSkill,
          priority: 'HIGH',
          currentLevel: 'WEAK',
          targetLevel: 'MODERATE',
          rationale: `Targeted goal to build verified evidence for ${prefillSkill}.`,
        });
      }

      navigate(`/learning/${plan.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create learning plan');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link to="/learning" className="btn btn-outline-secondary btn-sm">
            ← Learning Plans
          </Link>
          <span className="navbar-brand fw-bold text-success mb-0">
            🎯 Create Evidence-Building Learning Plan
          </span>
        </div>
      </nav>

      <div className="container py-4" style={{ maxWidth: '720px' }}>
        <div className="card bg-secondary bg-opacity-10 border-secondary p-4">
          <h4 className="fw-bold text-white mb-2">
            Configure Your Learning Roadmap
          </h4>
          <p className="text-secondary small mb-4">
            Resumind builds actionable goals and proof-of-work tasks designed to
            produce tangible evidence for your Career Twin.
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-light small fw-semibold">
                PLAN TITLE *
              </label>
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary"
                placeholder="e.g. Master Docker & Cloud Architecture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                id="plan-title-input"
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-light small fw-semibold">
                TARGET ROLE
              </label>
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary"
                placeholder="e.g. Senior Backend Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                id="plan-role-input"
              />
              <small className="text-secondary">
                Used to tailor evidence tasks to specific job market
                requirements.
              </small>
            </div>

            <div className="mb-3">
              <label className="form-label text-light small fw-semibold">
                DESCRIPTION
              </label>
              <textarea
                className="form-control bg-dark text-white border-secondary"
                rows={3}
                placeholder="Optional notes or personal learning objectives..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-light small fw-semibold">
                TARGET COMPLETION DATE
              </label>
              <input
                type="date"
                className="form-control bg-dark text-white border-secondary"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                id="plan-date-input"
              />
            </div>

            <div className="form-check form-switch mb-4 p-3 bg-dark rounded border border-secondary">
              <input
                className="form-check-input ms-0 me-3"
                type="checkbox"
                id="autoGenerateSwitch"
                checked={autoGenerateGoals}
                onChange={(e) => setAutoGenerateGoals(e.target.checked)}
              />
              <label
                className="form-check-label text-light fw-semibold"
                htmlFor="autoGenerateSwitch"
              >
                ⚡ Automatically Generate Goals from Profile Skill Gaps
              </label>
              <small className="text-secondary d-block mt-1">
                Analyzes your current skill gaps and automatically creates
                evidence-backed goals and practice tasks.
              </small>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <Link to="/learning" className="btn btn-outline-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-success fw-semibold"
                id="create-plan-submit-btn"
              >
                {submitting
                  ? 'Generating Plan...'
                  : 'Create & Generate Roadmap →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
