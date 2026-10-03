import React, { useState } from 'react';
import { Link } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { jobSearchApi } from '../lib/api.js';

export default function JobSearchPage() {
  const { user, initialized } = useAuthStore();

  const [query, setQuery] = useState('Software Engineer');
  const [location, setLocation] = useState('India');
  const [country, setCountry] = useState('in');
  const [category] = useState('it-jobs');
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [fullTime, setFullTime] = useState(true);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedMap, setImportedMap] = useState<
    Record<string, { jobId: string; already: boolean }>
  >({});

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSearched(true);

      const data = await jobSearchApi.searchJobs({
        q: query.trim(),
        location: location.trim() || undefined,
        country,
        category: category || undefined,
        salaryMin: salaryMin ? parseInt(salaryMin, 10) : undefined,
        fullTime,
        resultsPerPage: 15,
      });

      setResults(data.results || []);
      setTotal(data.total || (data.results ? data.results.length : 0));
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to search jobs via Adzuna.',
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(job: any) {
    try {
      setImportingId(job.id);
      const res = await jobSearchApi.importJob({
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        sourceUrl: job.sourceUrl,
        employmentType: fullTime ? 'Full-time' : undefined,
      });

      setImportedMap((prev) => ({
        ...prev,
        [job.id]: { jobId: res.id, already: res.alreadyImported || false },
      }));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to import job.');
    } finally {
      setImportingId(null);
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
    <div className="min-vh-100 bg-dark text-light py-5">
      <div className="container" style={{ maxWidth: '1100px' }}>
        {/* Navigation & Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <Link to="/jobs" className="btn btn-sm btn-outline-secondary mb-2">
              ← Back to My Saved Jobs
            </Link>
            <h2 className="fw-bold mb-1">Discover Real-Time Jobs</h2>
            <p className="text-secondary small mb-0">
              Live market job discovery powered by Adzuna • Import jobs with one
              click to generate Job DNA & match resumes
            </p>
          </div>
          <Link to="/jobs" className="btn btn-outline-info btn-sm">
            View Saved Jobs
          </Link>
        </div>

        {/* Search Filter Form */}
        <div className="card bg-black text-white border-secondary mb-4 shadow">
          <div className="card-body p-4">
            <form onSubmit={handleSearch}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label text-secondary small fw-bold">
                    ROLE / KEYWORDS
                  </label>
                  <input
                    type="text"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="e.g. Software Engineer, React Developer"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label text-secondary small fw-bold">
                    LOCATION
                  </label>
                  <input
                    type="text"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="e.g. Bangalore, Mumbai, Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label text-secondary small fw-bold">
                    COUNTRY
                  </label>
                  <select
                    className="form-select bg-dark text-white border-secondary"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="in">India (IN)</option>
                    <option value="us">United States (US)</option>
                    <option value="gb">United Kingdom (GB)</option>
                    <option value="ca">Canada (CA)</option>
                    <option value="au">Australia (AU)</option>
                    <option value="de">Germany (DE)</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label text-secondary small fw-bold">
                    MIN SALARY (ANNUAL)
                  </label>
                  <input
                    type="number"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="Optional, e.g. 800000"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="fullTimeCheck"
                    checked={fullTime}
                    onChange={(e) => setFullTime(e.target.checked)}
                  />
                  <label
                    className="form-check-label text-secondary small"
                    htmlFor="fullTimeCheck"
                  >
                    Full-time positions only
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="btn btn-primary fw-bold px-4"
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      />
                      Searching Adzuna…
                    </>
                  ) : (
                    '🔍 Search Jobs'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mb-4">
            <strong>Search Notice:</strong> {error}
          </div>
        )}

        {/* Results Section */}
        {searched && (
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">
                {loading
                  ? 'Searching…'
                  : `Results: ${total !== null ? `${total} positions found` : ''}`}
              </h5>
              <span className="badge bg-secondary-subtle text-secondary">
                Source: Adzuna Job Discovery
              </span>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                />
                <p className="text-secondary small">
                  Querying Adzuna live job index…
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="card bg-dark border-secondary p-5 text-center text-muted">
                <p className="mb-1">
                  No positions found matching your criteria.
                </p>
                <small>Try broadening your keyword or location search.</small>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {results.map((job) => {
                  const importState = importedMap[job.id];
                  const isImporting = importingId === job.id;

                  return (
                    <div
                      key={job.id}
                      className="card bg-dark text-white border-secondary shadow-sm hover-shadow transition-all"
                    >
                      <div className="card-body p-4">
                        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                          <div>
                            <h4 className="fw-bold text-white mb-1">
                              {job.title}
                            </h4>
                            <div className="d-flex align-items-center gap-2 text-secondary small flex-wrap">
                              <span className="text-info fw-semibold">
                                {job.company}
                              </span>
                              <span>•</span>
                              <span>📍 {job.location}</span>
                              <span>•</span>
                              <span className="text-success fw-semibold">
                                💰 {job.salary}
                              </span>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-info-subtle text-info border border-info small">
                              ADZUNA
                            </span>
                            {importState ? (
                              <Link
                                to={`/jobs/${importState.jobId}`}
                                className="btn btn-sm btn-success fw-bold"
                              >
                                ✓{' '}
                                {importState.already
                                  ? 'Already in Resumind'
                                  : 'Imported! View Job'}
                              </Link>
                            ) : (
                              <button
                                onClick={() => handleImport(job)}
                                disabled={isImporting}
                                className="btn btn-sm btn-outline-success fw-bold"
                              >
                                {isImporting ? (
                                  <>
                                    <span
                                      className="spinner-border spinner-border-sm me-1"
                                      role="status"
                                    />
                                    Importing…
                                  </>
                                ) : (
                                  '⬇ Import to Resumind'
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-secondary small mb-3 line-clamp-3">
                          {job.description}
                        </p>

                        <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary small text-muted">
                          <span>
                            Posted:{' '}
                            {new Date(job.postedAt).toLocaleDateString()}
                          </span>
                          {job.sourceUrl && (
                            <a
                              href={job.sourceUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-info text-decoration-none"
                            >
                              View Original Listing ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
