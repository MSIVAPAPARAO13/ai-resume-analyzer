import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { githubApi } from '../lib/api.js';

interface RepositoryDetail {
  id: string;
  githubRepositoryId: string;
  name: string;
  fullName: string;
  description?: string | null;
  htmlUrl: string;
  defaultBranch?: string | null;
  language?: string | null;
  stars: number;
  forks: number;
  isPrivate: boolean;
  topics: string[];
  lastPushedAt?: string | null;
  createdAt: string;
  languages?: Record<string, number> | null;
}

export default function GitHubRepositoryDetailPage() {
  const { user, initialized } = useAuthStore();
  const { id } = useParams();
  const navigate = useNavigate();

  const [repo, setRepo] = useState<RepositoryDetail | null>(null);
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [readme, setReadme] = useState<string>('');
  const [detectedTech, setDetectedTech] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Import Modal State
  const [showImport, setShowImport] = useState(false);
  const [importName, setImportName] = useState('');
  const [importDesc, setImportDesc] = useState('');
  const [importTech, setImportTech] = useState('');
  const [importRepoUrl, setImportRepoUrl] = useState('');
  const [importProjectUrl, setImportProjectUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && user && id) {
      loadRepoDetails();
    }
  }, [initialized, user, id]);

  async function loadRepoDetails() {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [repoData, langData, readmeData] = await Promise.all([
        githubApi.getRepository(id),
        githubApi.getLanguages(id).catch(() => ({})),
        githubApi
          .getReadme(id)
          .catch(() => ({ readme: '', detectedTechnologies: [] })),
      ]);

      setRepo(repoData);
      setLanguages(langData || {});
      setReadme(readmeData.readme || '');
      setDetectedTech(readmeData.detectedTechnologies || []);

      // Pre-fill import form
      setImportName(repoData.name);
      setImportDesc(
        repoData.description || `Open source project: ${repoData.fullName}`,
      );
      const allTech = Array.from(
        new Set([
          ...(repoData.language ? [repoData.language] : []),
          ...(repoData.topics || []),
          ...(readmeData.detectedTechnologies || []),
        ]),
      );
      setImportTech(allTech.join(', '));
      setImportRepoUrl(repoData.htmlUrl);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to load repository details from GitHub.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !repo) return;
    try {
      setImporting(true);
      const technologies = importTech
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await githubApi.importProject(id, {
        name: importName.trim(),
        description: importDesc.trim(),
        technologies,
        repoUrl: importRepoUrl.trim() || undefined,
        projectUrl: importProjectUrl.trim() || undefined,
      });

      setImportSuccess(
        `"${importName}" was successfully imported into your Career Twin!`,
      );
      setTimeout(() => {
        setShowImport(false);
        setImportSuccess(null);
        navigate('/career');
      }, 1600);
    } catch (err: any) {
      alert(
        err.response?.data?.error?.message ||
          'Failed to import project to Career Twin.',
      );
    } finally {
      setImporting(false);
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

  if (error || !repo) {
    return (
      <div className="min-vh-100 bg-dark text-white py-5">
        <div className="container" style={{ maxWidth: 600 }}>
          <div className="alert alert-danger mb-4">
            {error || 'Repository not found.'}
          </div>
          <Link to="/github/repositories" className="btn btn-primary btn-sm">
            ← Back to Repositories
          </Link>
        </div>
      </div>
    );
  }

  // Calculate language percentages
  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link
            to="/github/repositories"
            className="btn btn-outline-secondary btn-sm"
          >
            ← Repositories
          </Link>
          <span className="navbar-brand fw-bold text-primary mb-0">
            {repo.name}
          </span>
          <span className="text-secondary small">{repo.fullName}</span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-secondary btn-sm"
          >
            Open on GitHub ↗
          </a>
          <button
            onClick={() => setShowImport(true)}
            className="btn btn-primary btn-sm"
            id="detail-import-btn"
          >
            Import to Career Twin
          </button>
        </div>
      </nav>

      <div className="container py-4">
        {/* Repo Header Card */}
        <div className="card bg-dark border-secondary p-4 mb-4 shadow-sm">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h3 className="fw-bold text-white mb-0">{repo.name}</h3>
                <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary">
                  {repo.defaultBranch || 'main'}
                </span>
                {repo.isPrivate && (
                  <span className="badge bg-warning bg-opacity-25 text-warning border border-warning">
                    Private
                  </span>
                )}
              </div>
              <p className="text-secondary small mb-2">
                {repo.description || 'No description provided.'}
              </p>
              <div className="d-flex align-items-center gap-3 text-secondary small">
                <span>⭐ {repo.stars} stars</span>
                <span>🍴 {repo.forks} forks</span>
                {repo.lastPushedAt && (
                  <span>
                    🕒 Last pushed{' '}
                    {new Date(repo.lastPushedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div>
              <button
                onClick={() => setShowImport(true)}
                className="btn btn-primary btn-sm px-4"
              >
                + Import to Career Twin
              </button>
            </div>
          </div>

          {/* Languages Breakdown */}
          {totalBytes > 0 && (
            <div className="mt-4 pt-3 border-top border-secondary">
              <span className="text-secondary small fw-semibold d-block mb-2">
                Languages Breakdown
              </span>
              <div className="progress mb-2" style={{ height: 10 }}>
                {Object.entries(languages).map(([lang, bytes], idx) => {
                  const pct = Math.round((bytes / totalBytes) * 100);
                  const colors = [
                    'bg-primary',
                    'bg-info',
                    'bg-warning',
                    'bg-success',
                    'bg-danger',
                  ];
                  return (
                    <div
                      key={lang}
                      className={`progress-bar ${colors[idx % colors.length]}`}
                      style={{ width: `${pct}%` }}
                      title={`${lang}: ${pct}%`}
                    />
                  );
                })}
              </div>
              <div className="d-flex flex-wrap gap-3">
                {Object.entries(languages).map(([lang, bytes]) => {
                  const pct = Math.round((bytes / totalBytes) * 100);
                  return (
                    <div key={lang} className="small text-secondary">
                      <strong className="text-white">{lang}</strong>: {pct}%
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detected Technologies */}
          {detectedTech.length > 0 && (
            <div className="mt-3 pt-3 border-top border-secondary">
              <span className="text-secondary small fw-semibold d-block mb-2">
                Detected Technologies & Evidence
              </span>
              <div className="d-flex flex-wrap gap-1">
                {detectedTech.map((tech) => (
                  <span
                    key={tech}
                    className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-50"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* README Card (XSS Sanitized) */}
        <div className="card bg-dark border-secondary p-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-white mb-0">README.md</h5>
            <span className="badge bg-secondary bg-opacity-25 text-secondary">
              Sanitized Markdown
            </span>
          </div>

          {readme ? (
            <div
              className="p-3 bg-dark border border-secondary rounded overflow-auto text-light small"
              style={{
                maxHeight: '60vh',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
              }}
            >
              {readme}
            </div>
          ) : (
            <div className="text-secondary small text-center py-4">
              No README found in this repository.
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-dark border-secondary text-white shadow-lg">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">
                  Import Project to Career Twin
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowImport(false)}
                />
              </div>

              <form onSubmit={handleImportSubmit}>
                <div className="modal-body">
                  {importSuccess ? (
                    <div className="alert alert-success py-3 text-center mb-0">
                      ✅ {importSuccess}
                    </div>
                  ) : (
                    <>
                      <div className="alert alert-info border-info py-2 px-3 small mb-3">
                        ℹ️ Customize this project before saving it to your
                        Career Twin.
                      </div>

                      <div className="mb-3">
                        <label className="form-label text-secondary small fw-semibold">
                          Project Name
                        </label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          value={importName}
                          onChange={(e) => setImportName(e.target.value)}
                          required
                          id="detail-modal-name"
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label text-secondary small fw-semibold">
                          Description
                        </label>
                        <textarea
                          className="form-control bg-dark text-white border-secondary"
                          rows={3}
                          value={importDesc}
                          onChange={(e) => setImportDesc(e.target.value)}
                          required
                          id="detail-modal-desc"
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label text-secondary small fw-semibold">
                          Technologies (comma separated)
                        </label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          value={importTech}
                          onChange={(e) => setImportTech(e.target.value)}
                          placeholder="TypeScript, React, Node.js"
                          id="detail-modal-tech"
                        />
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label text-secondary small fw-semibold">
                            Repository URL
                          </label>
                          <input
                            type="url"
                            className="form-control bg-dark text-white border-secondary"
                            value={importRepoUrl}
                            onChange={(e) => setImportRepoUrl(e.target.value)}
                            id="detail-modal-repourl"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label text-secondary small fw-semibold">
                            Live Demo URL (optional)
                          </label>
                          <input
                            type="url"
                            className="form-control bg-dark text-white border-secondary"
                            value={importProjectUrl}
                            onChange={(e) =>
                              setImportProjectUrl(e.target.value)
                            }
                            id="detail-modal-projecturl"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {!importSuccess && (
                  <div className="modal-footer border-secondary">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setShowImport(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={importing}
                      className="btn btn-primary btn-sm px-4"
                      id="detail-confirm-import-btn"
                    >
                      {importing ? 'Importing…' : 'Add to Career Twin'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
