import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { interviewApi } from '../lib/api.js';

export default function InterviewQuestionsPage() {
  const { user, initialized } = useAuthStore();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    if (id) {
      loadSessionAndQuestions();
    }
  }, [id]);

  async function loadSessionAndQuestions() {
    try {
      setLoading(true);
      setError(null);
      const sess = await interviewApi.getSession(id!);
      setSession(sess);

      const qs = await interviewApi.listQuestions(id!);
      setQuestions(qs);

      const requestedQid = searchParams.get('selected');
      if (requestedQid) {
        const foundIdx = qs.findIndex((q: any) => q.id === requestedQid);
        if (foundIdx >= 0) {
          setSelectedIndex(foundIdx);
          populateCurrentQuestion(qs[foundIdx]);
          return;
        }
      }

      if (qs.length > 0) {
        populateCurrentQuestion(qs[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  }

  function populateCurrentQuestion(q: any) {
    if (q.answers && q.answers.length > 0) {
      const latest = q.answers[0];
      setAnswerText(latest.answerText || '');
      if (latest.score !== null && latest.score !== undefined) {
        setFeedback({
          score: latest.score,
          strengths: latest.strengths,
          weaknesses: latest.weaknesses,
          missingPoints: latest.missingPoints,
          improvementSuggestions: latest.improvementSuggestions,
          evidenceAlignment: latest.evidenceAlignment,
        });
      } else {
        setFeedback(null);
      }
    } else {
      setAnswerText('');
      setFeedback(null);
    }
  }

  function handleSelectQuestion(idx: number) {
    setSelectedIndex(idx);
    const q = questions[idx];
    if (q) {
      setSearchParams({ selected: q.id });
      populateCurrentQuestion(q);
    }
  }

  async function handleSaveDraft() {
    if (!currentQuestion) return;
    try {
      setSubmitting(true);
      setError(null);
      await interviewApi.submitAnswer(id!, currentQuestion.id, {
        answerText,
        isDraft: true,
      });
      await reloadCurrentQuestion();
    } catch (err: any) {
      setError(err.message || 'Failed to save draft.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitAndEvaluate() {
    if (!currentQuestion || !answerText.trim()) return;
    try {
      setEvaluating(true);
      setError(null);

      // Submit answer
      const ans = await interviewApi.submitAnswer(id!, currentQuestion.id, {
        answerText,
        isDraft: false,
      });

      // Request AI evaluation
      const evalRes = await interviewApi.evaluateAnswer(
        id!,
        currentQuestion.id,
        ans.id,
      );

      setFeedback(evalRes.evaluation);
      await reloadCurrentQuestion();
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate answer.');
    } finally {
      setEvaluating(false);
    }
  }

  async function reloadCurrentQuestion() {
    const qs = await interviewApi.listQuestions(id!);
    setQuestions(qs);
    if (qs[selectedIndex]) {
      populateCurrentQuestion(qs[selectedIndex]);
    }
  }

  const currentQuestion = questions[selectedIndex];

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="spinner-border text-warning" role="status" />
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      {/* Top Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link
            to={`/interviews/${id}`}
            className="btn btn-outline-secondary btn-sm"
          >
            ← Overview
          </Link>
          <span className="navbar-brand fw-bold text-warning mb-0">
            {session?.title || 'Practice Questions'}
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link
            to={`/interviews/${id}/mock`}
            className="btn btn-outline-light btn-sm"
          >
            Switch to Mock Mode
          </Link>
          <Link
            to={`/interviews/${id}/report`}
            className="btn btn-outline-success btn-sm"
          >
            Final Report
          </Link>
        </div>
      </nav>

      <div className="container-fluid px-4 py-4">
        {error && <div className="alert alert-danger mb-4">{error}</div>}

        <div className="row g-4">
          {/* Question Index Navigation Drawer */}
          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-secondary p-3 h-100">
              <h6 className="fw-bold text-white mb-3">
                Questions ({questions.length})
              </h6>
              <div
                className="nav flex-column nav-pills gap-1"
                style={{ maxHeight: '70vh', overflowY: 'auto' }}
              >
                {questions.map((q, idx) => {
                  const hasAnswer = q.answers && q.answers.length > 0;
                  const isAnswered = hasAnswer && q.answers[0].score !== null;

                  return (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuestion(idx)}
                      className={`btn text-start p-2 rounded d-flex justify-content-between align-items-center ${
                        selectedIndex === idx
                          ? 'btn-warning text-dark fw-bold'
                          : 'btn-dark border-secondary text-white'
                      }`}
                      style={{ fontSize: '0.85rem' }}
                      id={`question-nav-btn-${idx}`}
                    >
                      <span className="text-truncate me-2">
                        #{idx + 1}. {q.category}
                      </span>
                      {isAnswered ? (
                        <span className="badge bg-success bg-opacity-75">
                          {q.answers[0].score}
                        </span>
                      ) : hasAnswer ? (
                        <span className="badge bg-info text-dark">Draft</span>
                      ) : (
                        <span className="badge bg-secondary">New</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Question & Answer Editor */}
          <div className="col-md-9">
            {currentQuestion ? (
              <div className="card bg-secondary bg-opacity-10 border-secondary p-4">
                {/* Question Header */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-warning bg-opacity-25 text-warning border border-warning fs-6">
                      Question #{selectedIndex + 1} of {questions.length}
                    </span>
                    <span className="badge bg-secondary">
                      {currentQuestion.category}
                    </span>
                    <span className="badge bg-dark border border-secondary text-secondary">
                      {currentQuestion.difficulty}
                    </span>
                  </div>
                  <div className="btn-group btn-group-sm">
                    <button
                      className="btn btn-outline-secondary"
                      disabled={selectedIndex === 0}
                      onClick={() => handleSelectQuestion(selectedIndex - 1)}
                    >
                      ← Prev
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      disabled={selectedIndex === questions.length - 1}
                      onClick={() => handleSelectQuestion(selectedIndex + 1)}
                    >
                      Next →
                    </button>
                  </div>
                </div>

                {/* Prompt Question */}
                <h4 className="fw-bold mb-3">{currentQuestion.question}</h4>

                {/* Why Asked & Evidence Reference Accordion */}
                <div className="card bg-dark border-secondary p-3 mb-3">
                  <div className="mb-2">
                    <span className="text-warning small fw-bold">
                      🎯 WHY YOU MAY BE ASKED THIS:
                    </span>
                    <p className="text-secondary small mb-0 mt-1">
                      {currentQuestion.whyAsked}
                    </p>
                  </div>

                  {currentQuestion.evidenceReferences?.length > 0 && (
                    <div className="mt-2 pt-2 border-top border-secondary">
                      <span className="text-info small fw-bold">
                        🛡️ EVIDENCE GUARD GROUNDING:
                      </span>
                      <div className="d-flex flex-wrap gap-2 mt-1">
                        {currentQuestion.evidenceReferences.map(
                          (ref: any, i: number) => (
                            <span
                              key={i}
                              className="badge bg-secondary bg-opacity-25 text-white border border-secondary small"
                            >
                              [{ref.source}] {ref.label}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {currentQuestion.preparationTips?.length > 0 && (
                    <div className="mt-2 pt-2 border-top border-secondary">
                      <span className="text-success small fw-bold">
                        💡 PREPARATION TIPS:
                      </span>
                      <ul className="text-secondary small mb-0 ps-3 mt-1">
                        {currentQuestion.preparationTips.map(
                          (tip: string, i: number) => (
                            <li key={i}>{tip}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Answer Box */}
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold">
                    YOUR ANSWER (Structure with STAR or technical rationale)
                  </label>
                  <textarea
                    rows={8}
                    className="form-control bg-dark text-white border-secondary font-monospace"
                    placeholder="Structure your answer clearly. Avoid inventing unverified claims or false metrics..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    id="answer-textarea"
                  />
                  <div className="d-flex justify-content-between text-secondary small mt-1">
                    <span>
                      Words:{' '}
                      {answerText.trim()
                        ? answerText.trim().split(/\s+/).length
                        : 0}
                    </span>
                    <span>
                      AI evaluates structure, depth, and evidence alignment
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleSaveDraft}
                    disabled={submitting || evaluating || !answerText.trim()}
                    id="save-draft-btn"
                  >
                    {submitting ? 'Saving Draft…' : 'Save Draft'}
                  </button>
                  <button
                    className="btn btn-warning fw-semibold px-4"
                    onClick={handleSubmitAndEvaluate}
                    disabled={evaluating || !answerText.trim()}
                    id="submit-evaluate-btn"
                  >
                    {evaluating ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        />
                        Evaluating Answer…
                      </>
                    ) : (
                      'Submit & Evaluate Answer'
                    )}
                  </button>
                </div>

                {/* AI Evaluation Feedback Card */}
                {feedback && (
                  <div className="card bg-dark border-secondary p-4 mt-2">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold text-warning mb-0">
                        AI Answer Evaluation
                      </h5>
                      <span className="badge bg-success bg-opacity-25 text-success border border-success fs-6">
                        Score: {feedback.score} / 100
                      </span>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <div className="p-3 bg-secondary bg-opacity-10 border border-success border-opacity-25 rounded h-100">
                          <h6 className="text-success fw-bold small mb-2">
                            ✓ STRENGTHS
                          </h6>
                          <ul className="text-secondary small mb-0 ps-3">
                            {feedback.strengths?.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 bg-secondary bg-opacity-10 border border-warning border-opacity-25 rounded h-100">
                          <h6 className="text-warning fw-bold small mb-2">
                            ⚠ MISSING POINTS / WEAKNESSES
                          </h6>
                          <ul className="text-secondary small mb-0 ps-3">
                            {feedback.missingPoints?.map(
                              (m: string, i: number) => (
                                <li key={i}>{m}</li>
                              ),
                            )}
                            {feedback.weaknesses?.map(
                              (w: string, i: number) => (
                                <li key={i}>{w}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-secondary bg-opacity-10 border border-info border-opacity-25 rounded mb-3">
                      <h6 className="text-info fw-bold small mb-2">
                        💡 IMPROVEMENT SUGGESTIONS
                      </h6>
                      <ul className="text-secondary small mb-0 ps-3">
                        {feedback.improvementSuggestions?.map(
                          (s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ),
                        )}
                      </ul>
                    </div>

                    {feedback.evidenceAlignment && (
                      <div className="small text-secondary">
                        <strong>Evidence Alignment:</strong>{' '}
                        {feedback.evidenceAlignment}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="card bg-secondary bg-opacity-10 border-secondary p-5 text-center text-secondary">
                <h5>No questions available in this session.</h5>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
