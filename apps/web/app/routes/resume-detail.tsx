import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { resumeApi } from '../lib/api.js';

export default function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();

  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    | 'contact'
    | 'summary'
    | 'experience'
    | 'education'
    | 'skills'
    | 'projects'
    | 'raw'
  >('experience');

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    if (id && user) {
      loadResume(id);
    }
  }, [id, user]);

  async function loadResume(resumeId: string) {
    try {
      setLoading(true);
      setError(null);
      const data = await resumeApi.getResume(resumeId);
      setResume(data.resume);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Failed to load resume details',
      );
    } finally {
      setLoading(false);
    }
  }

  if (!initialized || !user) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-vh-100 bg-dark text-white container py-5">
        <div className="alert alert-danger">{error || 'Resume not found'}</div>
        <Link to="/resumes" className="btn btn-outline-secondary">
          ← Back to Resumes
        </Link>
      </div>
    );
  }

  const latestVersion = resume.versions?.[0];
  const parsedData = latestVersion?.parsedData || {};
  const extractedText = latestVersion?.extractedText || '';

  return (
    <div className="min-vh-100 bg-dark text-white">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4">
        <div className="d-flex align-items-center gap-3">
          <Link
            to="/resumes"
            className="navbar-brand fw-bold text-primary mb-0"
          >
            ← Resumes
          </Link>
          <span className="text-secondary small">/</span>
          <span className="fw-semibold small text-white">{resume.title}</span>
        </div>
        <div className="d-flex align-items-center gap-3">
          <Link
            to={`/resumes/${resume.id}/analysis`}
            className="btn btn-primary btn-sm px-3"
            id="goto-analysis"
          >
            View / Run Analysis ⚡
          </Link>
        </div>
      </nav>

      <div className="container py-5">
        {/* Document Header Card */}
        <div className="card bg-dark border-secondary mb-4 p-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h3 className="fw-bold mb-0">{resume.title}</h3>
                <span className="badge bg-success bg-opacity-25 text-success small">
                  {resume.status}
                </span>
                <span className="badge bg-secondary small">
                  Version {latestVersion?.versionNumber || 1}
                </span>
              </div>
              <p className="text-secondary small mb-0">
                Original: {resume.originalFileName} ·{' '}
                {(resume.fileSize / 1024).toFixed(1)} KB · Uploaded{' '}
                {new Date(resume.createdAt).toLocaleString()}
              </p>
            </div>
            <Link
              to={`/resumes/${resume.id}/analysis`}
              className="btn btn-outline-primary btn-sm px-4"
            >
              Open Analysis Scorecard →
            </Link>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <ul className="nav nav-pills gap-2 mb-4 p-2 bg-dark border border-secondary rounded">
          <li className="nav-item">
            <button
              className={`nav-link btn-sm ${activeTab === 'experience' ? 'active bg-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('experience')}
            >
              💼 Experience ({parsedData.experience?.length || 0})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link btn-sm ${activeTab === 'skills' ? 'active bg-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('skills')}
            >
              ⚡ Skills ({parsedData.skills?.length || 0})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link btn-sm ${activeTab === 'education' ? 'active bg-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('education')}
            >
              🎓 Education ({parsedData.education?.length || 0})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link btn-sm ${activeTab === 'projects' ? 'active bg-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('projects')}
            >
              🚀 Projects ({parsedData.projects?.length || 0})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link btn-sm ${activeTab === 'summary' ? 'active bg-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('summary')}
            >
              📝 Summary
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link btn-sm ${activeTab === 'contact' ? 'active bg-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('contact')}
            >
              📫 Contact
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link btn-sm ${activeTab === 'raw' ? 'active bg-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('raw')}
            >
              📄 Raw Text
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        <div className="card bg-dark border-secondary p-4">
          {activeTab === 'experience' && (
            <div>
              <h5 className="fw-bold mb-3">Extracted Work Experience</h5>
              {!parsedData.experience || parsedData.experience.length === 0 ? (
                <p className="text-secondary small">
                  No experience section identified.
                </p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {parsedData.experience.map((exp: any, i: number) => (
                    <div key={i} className="card bg-dark border-secondary p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="fw-bold text-white mb-0">
                            {exp.title}
                          </h6>
                          <div className="text-primary small">
                            {exp.company}
                          </div>
                        </div>
                        {(exp.startDate || exp.endDate) && (
                          <span className="badge bg-secondary small">
                            {exp.startDate || ''}{' '}
                            {exp.endDate ? `– ${exp.endDate}` : ''}
                          </span>
                        )}
                      </div>
                      {exp.bullets && exp.bullets.length > 0 ? (
                        <ul className="mb-0 text-secondary small ps-3">
                          {exp.bullets.map((b: string, bi: number) => (
                            <li key={bi} className="mb-1">
                              {b}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-secondary small mb-0">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'skills' && (
            <div>
              <h5 className="fw-bold mb-3">
                Extracted Skills ({parsedData.skills?.length || 0})
              </h5>
              {!parsedData.skills || parsedData.skills.length === 0 ? (
                <p className="text-secondary small">No skills identified.</p>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {parsedData.skills.map((skill: any, i: number) => (
                    <span
                      key={i}
                      className="badge bg-secondary bg-opacity-50 text-white px-3 py-2 fs-6 border border-secondary"
                    >
                      {skill.name}
                      {skill.category && (
                        <span className="badge bg-primary bg-opacity-25 text-primary ms-2 small">
                          {skill.category}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'education' && (
            <div>
              <h5 className="fw-bold mb-3">Extracted Education</h5>
              {!parsedData.education || parsedData.education.length === 0 ? (
                <p className="text-secondary small">
                  No education entries identified.
                </p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {parsedData.education.map((edu: any, i: number) => (
                    <div key={i} className="card bg-dark border-secondary p-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="fw-bold text-white mb-0">
                            {edu.institution}
                          </h6>
                          <div className="text-secondary small">
                            {edu.degree}{' '}
                            {edu.fieldOfStudy ? `· ${edu.fieldOfStudy}` : ''}
                          </div>
                        </div>
                        {edu.startDate && (
                          <span className="badge bg-secondary small">
                            {edu.startDate} – {edu.endDate || 'Present'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'projects' && (
            <div>
              <h5 className="fw-bold mb-3">Extracted Projects</h5>
              {!parsedData.projects || parsedData.projects.length === 0 ? (
                <p className="text-secondary small">
                  No projects section detected.
                </p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {parsedData.projects.map((proj: any, i: number) => (
                    <div key={i} className="card bg-dark border-secondary p-3">
                      <h6 className="fw-bold text-white mb-1">{proj.name}</h6>
                      <p className="text-secondary small mb-2">
                        {proj.description}
                      </p>
                      {proj.url && (
                        <a
                          href={proj.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary small text-decoration-none"
                        >
                          {proj.url} ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <h5 className="fw-bold mb-3">Professional Summary</h5>
              {parsedData.summary ? (
                <p className="text-secondary leading-relaxed">
                  {parsedData.summary}
                </p>
              ) : (
                <p className="text-secondary small">
                  No summary section detected in document.
                </p>
              )}
            </div>
          )}

          {activeTab === 'contact' && (
            <div>
              <h5 className="fw-bold mb-3">Contact Information</h5>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="card bg-dark border-secondary p-3">
                    <span className="text-secondary small">Name</span>
                    <div className="fw-bold text-white">
                      {parsedData.contact?.name || 'Not detected'}
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="card bg-dark border-secondary p-3">
                    <span className="text-secondary small">Email</span>
                    <div className="fw-bold text-white">
                      {parsedData.contact?.email || 'Not detected'}
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="card bg-dark border-secondary p-3">
                    <span className="text-secondary small">Phone</span>
                    <div className="fw-bold text-white">
                      {parsedData.contact?.phone || 'Not detected'}
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="card bg-dark border-secondary p-3">
                    <span className="text-secondary small">Links</span>
                    {parsedData.contact?.links &&
                    parsedData.contact.links.length > 0 ? (
                      <div className="d-flex flex-column gap-1 mt-1">
                        {parsedData.contact.links.map(
                          (link: string, li: number) => (
                            <a
                              key={li}
                              href={
                                link.startsWith('http')
                                  ? link
                                  : `https://${link}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary small text-decoration-none"
                            >
                              {link}
                            </a>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="text-secondary small">None detected</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <div>
              <h5 className="fw-bold mb-3">Verbatim Extracted Plain Text</h5>
              <pre
                className="bg-black p-3 rounded border border-secondary text-secondary small overflow-auto"
                style={{ maxHeight: 500 }}
              >
                {extractedText}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
