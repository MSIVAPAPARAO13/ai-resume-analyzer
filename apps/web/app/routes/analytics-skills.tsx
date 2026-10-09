import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { analyticsApi } from '../lib/api.js';

export default function AnalyticsSkillsPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillsData, setSkillsData] = useState<any>(null);
  const [gapsData, setGapsData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'gaps' | 'normalized'>('gaps');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [skillsRes, gapsRes] = await Promise.all([
        analyticsApi.getSkills(),
        analyticsApi.getSkillGaps(),
      ]);
      setSkillsData(skillsRes);
      setGapsData(gapsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load skill intelligence data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading skill data...</span>
        </div>
      </div>
    );
  }

  const allGaps = Array.isArray(gapsData)
    ? gapsData
    : gapsData?.gaps || [];
  const filteredGaps = allGaps.filter((g: any) => {
    const matchesSearch = (g.skill || g.name || '')
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPriority =
      priorityFilter === 'ALL' || g.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const allSkills = Array.isArray(skillsData)
    ? skillsData
    : skillsData?.skills || [];
  const filteredSkills = allSkills.filter((s: any) => {
    const canonical = s.canonicalName || s.name || '';
    const original = s.originalName || s.name || '';
    const cat = s.category || '';
    return (
      canonical.toLowerCase().includes(searchQuery.toLowerCase()) ||
      original.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case 'STRONG':
        return <span className="badge bg-success">STRONG</span>;
      case 'MODERATE':
        return <span className="badge bg-primary">MODERATE</span>;
      case 'WEAK':
        return <span className="badge bg-warning text-dark">WEAK</span>;
      default:
        return <span className="badge bg-secondary">UNKNOWN</span>;
    }
  };

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
      {/* Top Navbar */}
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-4 sticky-top">
        <div className="d-flex align-items-center gap-3">
          <Link to="/analytics" className="btn btn-outline-secondary btn-sm">
            ← Analytics Overview
          </Link>
          <span className="navbar-brand fw-bold text-primary mb-0">
            🧠 Skill Intelligence & Gap Analysis
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link
            to="/learning/new"
            className="btn btn-success btn-sm fw-semibold"
          >
            + New Learning Plan
          </Link>
        </div>
      </nav>

      <div className="container py-4">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Tab & Filter Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <ul className="nav nav-pills">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'gaps' ? 'active' : 'text-white'}`}
                onClick={() => setActiveTab('gaps')}
              >
                🚨 Identified Skill Gaps ({allGaps.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'normalized' ? 'active' : 'text-white'}`}
                onClick={() => setActiveTab('normalized')}
              >
                📚 Normalized Skill Profile ({allSkills.length})
              </button>
            </li>
          </ul>

          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control form-control-sm bg-dark text-white border-secondary"
              placeholder="Filter by skill or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ minWidth: '220px' }}
            />
            {activeTab === 'gaps' && (
              <select
                className="form-select form-select-sm bg-dark text-white border-secondary"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            )}
          </div>
        </div>

        {/* TAB 1: SKILL GAPS */}
        {activeTab === 'gaps' && (
          <div className="row g-3">
            {filteredGaps.length === 0 ? (
              <div className="col-12">
                <div className="card bg-secondary bg-opacity-10 border-secondary p-5 text-center">
                  <h5 className="text-secondary mb-1">No Skill Gaps Found</h5>
                  <p className="text-secondary small">
                    {searchQuery
                      ? 'No skill gaps match your current search query.'
                      : 'All key skills required by your target jobs have verified candidate evidence.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredGaps.map((gap: any, idx: number) => (
                <div key={idx} className="col-lg-6">
                  <div className="card bg-secondary bg-opacity-10 border-secondary p-4 h-100 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h5 className="fw-bold text-white mb-0">{gap.skill}</h5>
                        <small className="text-secondary">
                          Status:{' '}
                          <span className="fw-semibold text-light">
                            {gap.status}
                          </span>
                        </small>
                      </div>
                      <div className="text-end">
                        {getPriorityBadge(gap.priority)}
                        <small className="d-block text-secondary mt-1">
                          Importance: {gap.importance}
                        </small>
                      </div>
                    </div>

                    <div className="p-3 bg-dark rounded border border-secondary my-3 flex-grow-1">
                      <div className="mb-2">
                        <small className="text-secondary fw-semibold">
                          CURRENT EVIDENCE:
                        </small>
                        <p className="text-light small mb-0">
                          {gap.currentEvidence ||
                            'No verified evidence present in Career Twin or Projects.'}
                        </p>
                      </div>
                      <div className="mb-2">
                        <small className="text-secondary fw-semibold">
                          WHY IT MATTERS:
                        </small>
                        <p className="text-light small mb-0">{gap.reason}</p>
                      </div>
                      <div>
                        <small className="text-secondary fw-semibold">
                          RECOMMENDED NEXT STEP:
                        </small>
                        <p className="text-warning small mb-0">
                          {gap.recommendedAction}
                        </p>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary">
                      <span className="small text-secondary">
                        Target Role:{' '}
                        {gapsData.targetRole || 'Software Engineer'}
                      </span>
                      <Link
                        to={`/learning/new?skill=${encodeURIComponent(gap.skill)}&role=${encodeURIComponent(
                          gapsData.targetRole || '',
                        )}`}
                        className="btn btn-primary btn-sm fw-semibold"
                      >
                        + Add to Learning Plan
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: NORMALIZED SKILLS */}
        {activeTab === 'normalized' && (
          <div className="card bg-secondary bg-opacity-10 border-secondary p-4">
            <h5 className="fw-semibold text-white mb-3">
              Candidate Skill Profile
            </h5>
            <p className="text-secondary small mb-3">
              Skills are normalized against industry aliases (e.g. React.js →
              React, Postgres → PostgreSQL) and evaluated across Career Twin,
              Projects, and GitHub.
            </p>

            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0 align-middle">
                <thead>
                  <tr className="text-secondary small">
                    <th>CANONICAL SKILL</th>
                    <th>CATEGORY</th>
                    <th>EVALUATED STRENGTH</th>
                    <th>VERIFICATION STATUS</th>
                    <th>EVIDENCE PIECES</th>
                    <th>LAST VERIFIED</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSkills.map((sk: any, idx: number) => (
                    <tr key={idx}>
                      <td>
                        <span className="fw-bold text-white">
                          {sk.canonicalName}
                        </span>
                        {sk.originalName !== sk.canonicalName && (
                          <small className="text-secondary d-block">
                            Alias: {sk.originalName}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-secondary bg-opacity-50 text-light">
                          {sk.category}
                        </span>
                      </td>
                      <td>{getStrengthBadge(sk.strength)}</td>
                      <td>
                        <span
                          className={`badge ${
                            sk.verificationStatus === 'VERIFIED_USER_DATA'
                              ? 'bg-success'
                              : sk.verificationStatus === 'EXTERNAL_SOURCE'
                                ? 'bg-info text-dark'
                                : 'bg-warning text-dark'
                          }`}
                        >
                          {sk.verificationStatus}
                        </span>
                      </td>
                      <td>
                        <span className="text-light">
                          {sk.evidenceCount} sources
                        </span>
                        <div className="small text-secondary">
                          {sk.evidenceItems
                            ?.map((e: any) => e.source)
                            .filter(
                              (v: any, i: any, a: any) => a.indexOf(v) === i,
                            )
                            .join(', ')}
                        </div>
                      </td>
                      <td className="small text-secondary">
                        {sk.lastVerifiedDate
                          ? new Date(sk.lastVerifiedDate).toLocaleDateString()
                          : 'Recorded'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
