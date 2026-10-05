import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { learningApi } from '../lib/api.js';

export default function LearningDetailPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<any>(null);

  // New Goal Modal state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [newCurrentLevel, setNewCurrentLevel] = useState('WEAK');
  const [newTargetLevel, setNewTargetLevel] = useState('STRONG');
  const [newRationale, setNewRationale] = useState('');

  // New Task Modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskType, setNewTaskType] = useState('EVIDENCE');

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    if (id) {
      loadPlan();
    }
  }, [id]);

  async function loadPlan() {
    try {
      setLoading(true);
      setError(null);
      const data = await learningApi.getPlan(id!);
      setPlan(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load learning plan');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateTaskStatus(taskId: string, status: string) {
    try {
      await learningApi.updateTask(taskId, { status });
      await loadPlan();
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
    }
  }

  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newSkill.trim()) return;
    try {
      await learningApi.addGoal(id!, {
        skill: newSkill,
        priority: newPriority,
        currentLevel: newCurrentLevel,
        targetLevel: newTargetLevel,
        rationale: newRationale || undefined,
      });
      setShowGoalModal(false);
      setNewSkill('');
      setNewRationale('');
      await loadPlan();
    } catch (err: any) {
      setError(err.message || 'Failed to add goal');
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGoalId || !newTaskTitle.trim()) return;
    try {
      await learningApi.addTask({
        goalId: selectedGoalId,
        title: newTaskTitle,
        description: newTaskDesc || undefined,
        type: newTaskType,
      });
      setShowTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      await loadPlan();
    } catch (err: any) {
      setError(err.message || 'Failed to add task');
    }
  }

  async function handleCompletePlan() {
    if (!confirm('Mark this entire learning plan as completed?')) return;
    try {
      await learningApi.completePlan(id!);
      await loadPlan();
    } catch (err: any) {
      setError(err.message || 'Failed to complete plan');
    }
  }

  async function handleDeletePlan() {
    if (!confirm('Are you sure you want to delete this learning plan?')) return;
    try {
      await learningApi.deletePlan(id!);
      navigate('/learning');
    } catch (err: any) {
      setError(err.message || 'Failed to delete plan');
    }
  }

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading plan...</span>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="text-center">
          <h4>Learning plan not found</h4>
          <Link to="/learning" className="btn btn-outline-secondary mt-2">
            Back to Learning Plans
          </Link>
        </div>
      </div>
    );
  }

  const allGoals: any[] = plan.goals || [];
  let totalTasks = 0;
  let completedTasks = 0;

  for (const g of allGoals) {
    for (const t of g.tasks || []) {
      totalTasks++;
      if (t.status === 'COMPLETED') completedTasks++;
    }
  }

  const progressPct =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="badge bg-danger">CRITICAL</span>;
      case 'HIGH':
        return <span className="badge bg-warning text-dark">HIGH</span>;
      case 'MEDIUM':
        return <span className="badge bg-info text-dark">MEDIUM</span>;
      default:
        return <span className="badge bg-secondary">LOW</span>;
    }
  };

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link to="/learning" className="btn btn-outline-secondary btn-sm">
            ← All Plans
          </Link>
          <span className="navbar-brand fw-bold text-success mb-0 text-truncate">
            🎯 {plan.title}
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          {plan.status !== 'COMPLETED' && (
            <button
              onClick={handleCompletePlan}
              className="btn btn-outline-success btn-sm fw-semibold"
              id="complete-plan-btn"
            >
              ✓ Complete Plan
            </button>
          )}
          <button
            onClick={handleDeletePlan}
            className="btn btn-outline-danger btn-sm"
          >
            Delete
          </button>
        </div>
      </nav>

      <div className="container py-4">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Plan Header Card */}
        <div className="card bg-secondary bg-opacity-10 border-secondary p-4 mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <span className="badge bg-primary mb-2">
                {plan.targetRole || 'General Engineering'}
              </span>
              <h2 className="fw-bold text-white mb-1">{plan.title}</h2>
              <p className="text-secondary small mb-0">
                {plan.description || 'No description provided.'}
              </p>
            </div>
            <div className="text-end">
              <span
                className={`badge fs-6 ${
                  plan.status === 'COMPLETED'
                    ? 'bg-success'
                    : plan.status === 'ACTIVE'
                      ? 'bg-warning text-dark'
                      : 'bg-secondary'
                }`}
              >
                {plan.status}
              </span>
              <small className="text-secondary d-block mt-1">
                Target Date:{' '}
                {plan.targetDate
                  ? new Date(plan.targetDate).toLocaleDateString()
                  : 'Self-paced'}
              </small>
            </div>
          </div>

          <div className="mt-4">
            <div className="d-flex justify-content-between small text-secondary mb-1">
              <span>Overall Tasks Progress: {progressPct}%</span>
              <span>
                {completedTasks} of {totalTasks} tasks completed
              </span>
            </div>
            <div className="progress bg-dark" style={{ height: '8px' }}>
              <div
                className="progress-bar bg-success"
                role="progressbar"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Evidence Verification Notice */}
        <div className="alert alert-secondary py-2 small mb-4" role="alert">
          🛡️ <strong>Evidence Guard Protocol:</strong> Completing tasks in this
          roadmap builds practical proof. To elevate your verified score in
          Career Twin, link or import your completed project/repository into
          Career Twin. Resumind never silently invents verified credentials.
        </div>

        {/* Goals & Tasks Section */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold text-white mb-0">
            Learning Goals & Proof-of-Work Tasks
          </h4>
          <button
            onClick={() => setShowGoalModal(true)}
            className="btn btn-outline-success btn-sm fw-semibold"
            id="add-goal-btn"
          >
            + Add Custom Goal
          </button>
        </div>

        {allGoals.length === 0 ? (
          <div className="card bg-secondary bg-opacity-10 border-secondary p-5 text-center">
            <h5 className="text-secondary mb-2">No Goals In This Roadmap</h5>
            <p className="text-secondary small mb-3">
              Add goals manually or regenerate from candidate skill gaps.
            </p>
            <button
              onClick={() => setShowGoalModal(true)}
              className="btn btn-primary btn-sm align-self-center"
            >
              + Add First Goal
            </button>
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {allGoals.map((goal: any) => {
              const goalTasks: any[] = goal.tasks || [];
              return (
                <div
                  key={goal.id}
                  className="card bg-secondary bg-opacity-10 border-secondary p-4"
                >
                  {/* Goal Header */}
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <h5 className="fw-bold text-white mb-0">
                          {goal.skill}
                        </h5>
                        {getPriorityBadge(goal.priority)}
                        <span
                          className={`badge ${
                            goal.status === 'COMPLETED'
                              ? 'bg-success'
                              : goal.status === 'IN_PROGRESS'
                                ? 'bg-primary'
                                : 'bg-secondary'
                          }`}
                        >
                          {goal.status}
                        </span>
                      </div>
                      <small className="text-secondary">
                        Current:{' '}
                        <strong className="text-light">
                          {goal.currentLevel}
                        </strong>{' '}
                        → Target:{' '}
                        <strong className="text-light">
                          {goal.targetLevel}
                        </strong>
                      </small>
                      {goal.rationale && (
                        <p className="text-light small mt-1 mb-0">
                          {goal.rationale}
                        </p>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          setSelectedGoalId(goal.id);
                          setShowTaskModal(true);
                        }}
                        className="btn btn-outline-primary btn-sm py-1"
                        id={`add-task-btn-${goal.id}`}
                      >
                        + Add Task
                      </button>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="d-flex flex-column gap-2">
                    {goalTasks.length === 0 ? (
                      <p className="text-secondary small mb-0">
                        No tasks added to this goal yet.
                      </p>
                    ) : (
                      goalTasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="p-3 bg-dark rounded border border-secondary d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2"
                        >
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span
                                className={`badge ${
                                  task.type === 'EVIDENCE'
                                    ? 'bg-info text-dark'
                                    : task.type === 'PROJECT'
                                      ? 'bg-success'
                                      : 'bg-secondary'
                                }`}
                              >
                                {task.type}
                              </span>
                              <span
                                className={`fw-semibold ${
                                  task.status === 'COMPLETED'
                                    ? 'text-decoration-line-through text-secondary'
                                    : 'text-white'
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-secondary small mb-0">
                                {task.description}
                              </p>
                            )}
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            {task.status !== 'COMPLETED' && (
                              <button
                                onClick={() =>
                                  handleUpdateTaskStatus(task.id, 'COMPLETED')
                                }
                                className="btn btn-success btn-sm py-0 fw-semibold"
                                id={`complete-task-${task.id}`}
                              >
                                ✓ Complete
                              </button>
                            )}
                            {task.status === 'TODO' && (
                              <button
                                onClick={() =>
                                  handleUpdateTaskStatus(task.id, 'IN_PROGRESS')
                                }
                                className="btn btn-outline-warning btn-sm py-0"
                              >
                                Start
                              </button>
                            )}
                            {task.status !== 'SKIPPED' &&
                              task.status !== 'COMPLETED' && (
                                <button
                                  onClick={() =>
                                    handleUpdateTaskStatus(task.id, 'SKIPPED')
                                  }
                                  className="btn btn-outline-secondary btn-sm py-0"
                                >
                                  Skip
                                </button>
                              )}
                            {task.status === 'COMPLETED' && (
                              <span className="badge bg-success bg-opacity-25 text-success border border-success">
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Add Goal */}
        {showGoalModal && (
          <div
            className="modal d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content bg-dark border-secondary text-white">
                <div className="modal-header border-secondary">
                  <h5 className="modal-title">Add Learning Goal</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowGoalModal(false)}
                  />
                </div>
                <form onSubmit={handleAddGoal}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        SKILL NAME *
                      </label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="e.g. Docker, Kubernetes, GraphQL"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        required
                        id="new-goal-skill-input"
                      />
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-4">
                        <label className="form-label small fw-semibold">
                          PRIORITY
                        </label>
                        <select
                          className="form-select bg-dark text-white border-secondary"
                          value={newPriority}
                          onChange={(e) => setNewPriority(e.target.value)}
                        >
                          <option value="CRITICAL">Critical</option>
                          <option value="HIGH">High</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                        </select>
                      </div>
                      <div className="col-4">
                        <label className="form-label small fw-semibold">
                          CURRENT
                        </label>
                        <select
                          className="form-select bg-dark text-white border-secondary"
                          value={newCurrentLevel}
                          onChange={(e) => setNewCurrentLevel(e.target.value)}
                        >
                          <option value="UNKNOWN">Unknown</option>
                          <option value="WEAK">Weak</option>
                          <option value="MODERATE">Moderate</option>
                        </select>
                      </div>
                      <div className="col-4">
                        <label className="form-label small fw-semibold">
                          TARGET
                        </label>
                        <select
                          className="form-select bg-dark text-white border-secondary"
                          value={newTargetLevel}
                          onChange={(e) => setNewTargetLevel(e.target.value)}
                        >
                          <option value="MODERATE">Moderate</option>
                          <option value="STRONG">Strong</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        RATIONALE
                      </label>
                      <textarea
                        className="form-control bg-dark text-white border-secondary"
                        rows={2}
                        placeholder="Why is this skill important for your target role?"
                        value={newRationale}
                        onChange={(e) => setNewRationale(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-secondary">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowGoalModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success btn-sm fw-semibold"
                      id="save-goal-btn"
                    >
                      Save Goal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Task */}
        {showTaskModal && (
          <div
            className="modal d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content bg-dark border-secondary text-white">
                <div className="modal-header border-secondary">
                  <h5 className="modal-title">Add Evidence-Building Task</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowTaskModal(false)}
                  />
                </div>
                <form onSubmit={handleAddTask}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        TASK TITLE *
                      </label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="e.g. Containerize microservice with multi-stage Dockerfile"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        required
                        id="new-task-title-input"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        TASK TYPE
                      </label>
                      <select
                        className="form-select bg-dark text-white border-secondary"
                        value={newTaskType}
                        onChange={(e) => setNewTaskType(e.target.value)}
                      >
                        <option value="EVIDENCE">
                          Evidence (Proof of work)
                        </option>
                        <option value="PROJECT">Project Implementation</option>
                        <option value="PRACTICE">Hands-on Practice</option>
                        <option value="COURSE">Conceptual Study</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        DESCRIPTION / PROOF CRITERIA
                      </label>
                      <textarea
                        className="form-control bg-dark text-white border-secondary"
                        rows={2}
                        placeholder="Specify the repository, architecture diagram, or code proof expected."
                        value={newTaskDesc}
                        onChange={(e) => setNewTaskDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-secondary">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowTaskModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm fw-semibold"
                      id="save-task-btn"
                    >
                      Save Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
