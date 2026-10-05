import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { githubApi } from '../lib/api.js';

interface RepositoryItem {
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
}

export default function GitHubRepositoriesPage() {
  const { user, initialized } = useAuthStore();

  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Import Modal State
  const [selectedRepo, setSelectedRepo] = useState<RepositoryItem | null>(null);
  const [importName, setImportName] = useState('');
  const [importDesc, setImportDesc] = useState('');
  const [importTech, setImportTech] = useState('');
  const [importRepoUrl, setImportRepoUrl] = useState('');
  const [importProjectUrl, setImportProjectUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && user) {
      loadRepositories();
    }
  }, [initialized, user]);

  async function loadRepositories(refresh = false) {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await githubApi.listRepositories(refresh);
      setRepositories(data || []);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to load GitHub repositories. Please ensure your account is connected.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function openImportModal(repo: RepositoryItem) {
    setSelectedRepo(repo);
    setImportName(repo.name);
    setImportDesc(repo.description || `Open source project: ${repo.fullName}`);
    const techArray = [
      ...(repo.language ? [repo.language] : []),
      ...(repo.topics || []),
    ];
    setImportTech(Array.from(new Set(techArray)).join(', '));
    setImportRepoUrl(repo.htmlUrl);
    setImportProjectUrl('');
    setImportSuccess(null);
  }

  async function handleConfirmImport(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRepo) return;
    try {
      setImporting(true);
      const technologies = importTech
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await githubApi.importProject(selectedRepo.id, {
        name: importName.trim(),
        description: importDesc.trim(),
        technologies,
        repoUrl: importRepoUrl.trim() || undefined,
        projectUrl: importProjectUrl.trim() || undefined,
      });

      setImportSuccess(
        `"${importName}" was successfully added to your Career Twin!`,
      );
      setTimeout(() => {
        setSelectedRepo(null);
        setImportSuccess(null);
      }, 1800);
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

  const filteredRepos = repositories.filter((r) => {
    if (!search) return true;
    const query = search.toLowerCase();
    const nameMatch = r.name.toLowerCase().includes(query);
    const descMatch = (r.description || '').toLowerCase().includes(query);
    const langMatch = (r.language || '').toLowerCase().includes(query);
    const topicMatch = r.topics.some((t) => t.toLowerCase().includes(query));
    return nameMatch || descMatch || langMatch || topicMatch;
  });

  return (
    <div className="min-vh-100 bg-dark text-white pb-5">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link to="/integrations" className="btn btn-outline-secondary btn-sm">
            ← Integrations
          </Link>
          <span className="navbar-brand fw-bold text-primary mb-0">
            GitHub Career Evidence
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => loadRepositories(true)}
            disabled={refreshing}
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
            id="refresh-github-btn"
          >
            <span>🔄</span>
            {refreshing ? 'Refreshing…' : 'Refresh GitHub Data'}
          </button>
          <Link to="/career" className="btn btn-outline-secondary btn-sm">
            View Career Twin
          </Link>
        </div>
      </nav>

      <div className="container py-4">
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">Synced Repositories</h1>
            <p className="text-secondary small mb-0">
              Select verified projects from GitHub to import directly into your
              Career Twin.
            </p>
          </div>

          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-dark border-secondary text-secondary">
                🔍
              </span>
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary"
                placeholder="Filter by name, language, or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="search-repos"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mb-4">
            {error}{' '}
            <Link to="/integrations" className="text-primary fw-semibold">
              Go to Integrations
            </Link>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-secondary mt-2 small">Loading repositories…</p>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="card bg-dark border-secondary text-center py-5 px-3">
            <div className="display-5 mb-3">🐙</div>
            <h4 className="fw-bold">No Repositories Found</h4>
            <p className="text-secondary col-md-6 mx-auto mb-4 small">
              {search
                ? `No repositories matched "${search}".`
                : 'No repositories were returned from your connected GitHub account.'}
            </p>
            <div>
              <button
                onClick={() => loadRepositories(true)}
                className="btn btn-primary btn-sm"
              >
                🔄 Refresh From GitHub
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {filteredRepos.map((repo) => (
              <div key={repo.id} className="col-md-6 col-lg-4">
                <div className="card bg-dark border-secondary p-4 h-100 shadow-sm d-flex flex-column justify-content-between repo-card">
                  <div>
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <h5 className="fw-bold text-white mb-0 text-truncate">
                        {repo.name}
                      </h5>
                      <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary small">
                        ⭐ {repo.stars}
                      </span>
                    </div>

                    <p
                      className="text-secondary small mb-3 text-truncate-3"
                      style={{ minHeight: 40 }}
                    >
                      {repo.description || 'No description provided.'}
                    </p>

                    {/* Language and Topics */}
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {repo.language && (
                        <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-50">
                          {repo.language}
                        </span>
                      )}
                      {repo.topics.slice(0, 4).map((top) => (
                        <span
                          key={top}
                          className="badge bg-secondary bg-opacity-25 text-light border border-secondary"
                          style={{ fontSize: 11 }}
                        >
                          #{top}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer / Actions */}
                  <div className="pt-3 border-top border-secondary d-flex justify-content-between align-items-center">
                    <span
                      className="text-secondary small"
                      style={{ fontSize: 11 }}
                    >
                      {repo.lastPushedAt
                        ? `Updated ${new Date(repo.lastPushedAt).toLocaleDateString()}`
                        : 'Updated recently'}
                    </span>

                    <div className="d-flex gap-2">
                      <Link
                        to={`/github/repositories/${repo.id}`}
                        className="btn btn-outline-secondary btn-sm"
                        id={`view-repo-${repo.name}`}
                      >
                        View
                      </Link>
                      <button
                        onClick={() => openImportModal(repo)}
                        className="btn btn-primary btn-sm"
                        id={`import-repo-${repo.name}`}
                      >
                        Import to Career Twin
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import Review Modal */}
      {selectedRepo && (
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
                  onClick={() => setSelectedRepo(null)}
                />
              </div>

              <form onSubmit={handleConfirmImport}>
                <div className="modal-body">
                  {importSuccess ? (
                    <div className="alert alert-success py-3 text-center mb-0">
                      ✅ {importSuccess}
                    </div>
                  ) : (
                    <>
                      <div className="alert alert-info border-info py-2 px-3 small mb-3">
                        ℹ️ Review and customize your project details before
                        adding to your Career Twin.
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
                          id="import-modal-name"
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
                          id="import-modal-desc"
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
                          placeholder="TypeScript, React, Node.js, Redis"
                          id="import-modal-tech"
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
                            id="import-modal-repourl"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label text-secondary small fw-semibold">
                            Live Demo / Project URL (optional)
                          </label>
                          <input
                            type="url"
                            className="form-control bg-dark text-white border-secondary"
                            value={importProjectUrl}
                            onChange={(e) =>
                              setImportProjectUrl(e.target.value)
                            }
                            placeholder="https://tradeflow.io"
                            id="import-modal-projecturl"
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
                      onClick={() => setSelectedRepo(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={importing}
                      className="btn btn-primary btn-sm px-4"
                      id="confirm-import-btn"
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
