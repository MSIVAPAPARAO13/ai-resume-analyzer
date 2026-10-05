import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { interviewApi } from '../lib/api.js';

export default function InterviewMockPage() {
  const { user, initialized } = useAuthStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [completed, setCompleted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    if (id) {
      loadMockInterview();
    }
  }, [id]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && !completed) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, completed]);

  async function loadMockInterview() {
    try {
      setLoading(true);
      setError(null);
      const sess = await interviewApi.getSession(id!);
      setSession(sess);

      const qs = await interviewApi.listQuestions(id!);
      setQuestions(qs);

      // Find first unanswered question
      const firstUnanswered = qs.findIndex(
        (q: any) => !q.answers || q.answers.length === 0,
      );
      if (firstUnanswered >= 0) {
        setCurrentIndex(firstUnanswered);
      } else if (qs.length > 0) {
        setCompleted(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load mock interview.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitCurrent() {
    if (!currentQuestion || !answerText.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      // Submit and evaluate
      const ans = await interviewApi.submitAnswer(id!, currentQuestion.id, {
        answerText,
        isDraft: false,
      });

      const evalRes = await interviewApi.evaluateAnswer(
        id!,
        currentQuestion.id,
        ans.id,
      );

      setFeedback(evalRes.evaluation);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate answer.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNextQuestion() {
    setFeedback(null);
    setAnswerText('');

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Completed all questions!
      setCompleted(true);
      setIsTimerRunning(false);
      try {
        await interviewApi.completeSession(id!);
      } catch {
        // Safe ignore
      }
    }
  }

  const currentQuestion = questions[currentIndex];

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="spinner-border text-warning" role="status" />
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      {/* Top Bar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link
            to={`/interviews/${id}`}
            className="btn btn-outline-secondary btn-sm"
          >
            ✕ Exit Mock Mode
          </Link>
          <span className="navbar-brand fw-bold text-danger mb-0">
            🔴 Live Mock Interview: {session?.title || 'Simulation'}
          </span>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="badge bg-dark border border-secondary text-warning fs-6 px-3 py-2 font-monospace">
            ⏱ {formatTimer(timerSeconds)}
          </div>
          <span className="badge bg-secondary">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </nav>

      <div className="container py-5" style={{ maxWidth: 850 }}>
        {error && <div className="alert alert-danger mb-4">{error}</div>}

        {completed ? (
          <div className="card bg-secondary bg-opacity-10 border-success p-5 text-center">
            <h2 className="fw-bold text-success mb-2">
              🎉 Mock Interview Completed!
            </h2>
            <p className="text-secondary mb-4">
              All questions answered in {formatTimer(timerSeconds)}. Review your
              readiness score and final report.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Link
                to={`/interviews/${id}/report`}
                className="btn btn-success fw-semibold px-4"
              >
                View Final Readiness Report 📊
              </Link>
              <Link
                to={`/interviews/${id}`}
                className="btn btn-outline-secondary px-4"
              >
                Back to Session Overview
              </Link>
            </div>
          </div>
        ) : (
          <div className="card bg-secondary bg-opacity-10 border-secondary p-4">
            {/* Progress Bar */}
            <div className="progress bg-dark mb-4" style={{ height: '6px' }}>
              <div
                className="progress-bar bg-warning"
                role="progressbar"
                style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>

            {/* Question Details */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="badge bg-warning bg-opacity-25 text-warning border border-warning">
                Question {currentIndex + 1} of {questions.length} •{' '}
                {currentQuestion?.category}
              </span>
              <span className="text-secondary small">
                {currentQuestion?.difficulty} Difficulty
              </span>
            </div>

            <h3 className="fw-bold mb-3">{currentQuestion?.question}</h3>

            <div className="p-3 bg-dark border border-secondary rounded mb-3">
              <span className="text-secondary small">
                <strong>Interviewer Focus:</strong> {currentQuestion?.whyAsked}
              </span>
            </div>

            {/* Answer Text Area */}
            {!feedback ? (
              <>
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold">
                    YOUR VERBAL RESPONSE / NOTES
                  </label>
                  <textarea
                    rows={8}
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="Speak your answer or write out key talking points in STAR format..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    id="mock-answer-textarea"
                  />
                </div>

                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-warning fw-semibold px-4"
                    onClick={handleSubmitCurrent}
                    disabled={submitting || !answerText.trim()}
                    id="mock-submit-btn"
                  >
                    {submitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        />
                        Evaluating Answer…
                      </>
                    ) : (
                      'Submit Answer →'
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Feedback display after submit */
              <div className="card bg-dark border-secondary p-4 mt-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-warning mb-0">AI Feedback</h5>
                  <span className="badge bg-success bg-opacity-25 text-success border border-success fs-6">
                    Score: {feedback.score} / 100
                  </span>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <div className="p-2 border border-success border-opacity-25 rounded">
                      <span className="text-success small fw-bold">
                        ✓ STRENGTHS:
                      </span>
                      <ul className="text-secondary small mb-0 ps-3 mt-1">
                        {feedback.strengths?.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-2 border border-warning border-opacity-25 rounded">
                      <span className="text-warning small fw-bold">
                        ⚠ IMPROVEMENTS:
                      </span>
                      <ul className="text-secondary small mb-0 ps-3 mt-1">
                        {feedback.missingPoints?.map((m: string, i: number) => (
                          <li key={i}>{m}</li>
                        ))}
                        {feedback.improvementSuggestions?.map(
                          (s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-2">
                  <button
                    className="btn btn-warning fw-semibold px-4"
                    onClick={handleNextQuestion}
                    id="mock-next-btn"
                  >
                    {currentIndex < questions.length - 1
                      ? 'Next Question →'
                      : 'Finish Mock Interview 🎉'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
