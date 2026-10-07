import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { resumeApi } from '../lib/api.js';
import AppNavbar from '../components/AppNavbar.js';

export default function ResumesPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();

  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const [customTitle, setCustomTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    if (user) {
      loadResumes();
    }
  }, [user]);

  async function loadResumes() {
    try {
      setLoading(true);
      const data = await resumeApi.listResumes();
      setResumes(data.resumes || []);
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) {
      setUploadError('Only PDF and DOCX files are supported');
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds maximum size of 10MB');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (!customTitle) {
      setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please choose a PDF or DOCX file to upload');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      if (customTitle.trim()) {
        formData.append('title', customTitle.trim());
      }

      const res = await resumeApi.uploadResume(formData);
      setUploadSuccess('Resume uploaded and parsed successfully!');
      setSelectedFile(null);
      setCustomTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload list
      await loadResumes();

      // Automatically navigate to analysis or detail
      if (res.resume?.id) {
        navigate(`/resumes/${res.resume.id}`);
      }
    } catch (err: any) {
      setUploadError(
        err.response?.data?.error?.message ||
          'Failed to upload and parse resume',
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(resumeId: string) {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeApi.deleteResume(resumeId);
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
    } catch {
      alert('Failed to delete resume');
    }
  }

  if (!initialized || !user) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-dark text-white">
      <AppNavbar />

      <div className="container py-5">
        {/* Header */}
        <div className="mb-5">
          <h1 className="display-6 fw-bold mb-2">Resume Intelligence</h1>
          <p className="text-secondary lead fs-6">
            Upload and analyze your resumes. Extract verified structured
            sections, calculate ATS scores, and compare directly with your
            Career Twin.
          </p>
        </div>

        {/* Upload Card */}
        <div className="card bg-dark border-secondary mb-5 shadow-sm">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <span>📤</span> Upload New Resume
            </h5>

            {uploadError && (
              <div className="alert alert-danger py-2 small" role="alert">
                {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div className="alert alert-success py-2 small" role="alert">
                {uploadSuccess}
              </div>
            )}

            <form onSubmit={handleUpload}>
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-5">
                  <label className="form-label text-secondary small">
                    Resume Document (PDF or DOCX, max 10MB) *
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="form-control bg-dark border-secondary text-white"
                    onChange={handleFileChange}
                    id="resume-file-input"
                    disabled={uploading}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label text-secondary small">
                    Custom Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Backend Resume 2026"
                    className="form-control bg-dark border-secondary text-white"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    id="resume-title-input"
                    disabled={uploading}
                  />
                </div>
                <div className="col-12 col-md-3">
                  <button
                    type="submit"
                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                    disabled={uploading || !selectedFile}
                    id="resume-upload-submit"
                  >
                    {uploading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                        />
                        <span>Extracting & Parsing…</span>
                      </>
                    ) : (
                      <>
                        <span>Upload & Parse</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Resumes List */}
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="fw-bold mb-0">
              Your Uploaded Resumes ({resumes.length})
            </h5>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : resumes.length === 0 ? (
            <div className="card bg-dark border-secondary text-center py-5">
              <div className="card-body">
                <div className="fs-1 mb-3">📄</div>
                <h5 className="fw-bold">No resumes uploaded yet</h5>
                <p className="text-secondary small mb-0">
                  Upload your first resume in PDF or DOCX format above to
                  generate an explainable score and Career Twin comparison.
                </p>
              </div>
            </div>
          ) : (
            <div className="row g-3">
              {resumes.map((resume) => {
                const score = resume.latestAnalysis?.overallScore;
                const scoreBadgeClass =
                  score >= 80
                    ? 'bg-success'
                    : score >= 60
                      ? 'bg-warning text-dark'
                      : 'bg-danger';

                return (
                  <div key={resume.id} className="col-12">
                    <div className="card bg-dark border-secondary hover-lift">
                      <div className="card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded bg-secondary bg-opacity-25 d-flex align-items-center justify-content-center text-primary fs-3"
                            style={{ width: 48, height: 48 }}
                          >
                            {resume.fileType?.includes('pdf') ? '📕' : '📘'}
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <h6 className="fw-bold text-white mb-0">
                                {resume.title}
                              </h6>
                              <span
                                className={`badge ${
                                  resume.status === 'READY'
                                    ? 'bg-success bg-opacity-25 text-success border border-success border-opacity-25'
                                    : resume.status === 'PROCESSING'
                                      ? 'bg-warning bg-opacity-25 text-warning'
                                      : 'bg-danger bg-opacity-25 text-danger'
                                } small`}
                              >
                                {resume.status}
                              </span>
                            </div>
                            <p className="text-secondary small mb-0 mt-1">
                              {resume.originalFileName} ·{' '}
                              {(resume.fileSize / 1024).toFixed(1)} KB ·
                              Uploaded{' '}
                              {new Date(resume.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                          {score !== undefined && score !== null ? (
                            <div className="text-end me-2">
                              <div className="d-flex align-items-center gap-2 justify-content-end">
                                <span className="text-secondary small">
                                  Overall Score
                                </span>
                                <span
                                  className={`badge ${scoreBadgeClass} fs-6 px-2 py-1`}
                                >
                                  {score}/100
                                </span>
                              </div>
                              <span className="text-secondary small">
                                ATS: {resume.latestAnalysis?.atsScore || 0}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-secondary small me-2">
                              Not analyzed yet
                            </span>
                          )}

                          <Link
                            to={`/resumes/${resume.id}/analysis`}
                            className="btn btn-primary btn-sm px-3"
                            id={`analyze-${resume.id}`}
                          >
                            {score ? 'View Analysis' : 'Run Analysis ⚡'}
                          </Link>

                          <Link
                            to={`/resumes/${resume.id}`}
                            className="btn btn-outline-secondary btn-sm px-3"
                            id={`inspect-${resume.id}`}
                          >
                            Inspect Sections
                          </Link>

                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(resume.id)}
                            id={`delete-${resume.id}`}
                            title="Delete resume"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
