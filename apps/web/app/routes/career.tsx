import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';
import { careerApi } from '../lib/api.js';
import AppNavbar from '../components/AppNavbar.js';

type Section =
  | 'profile'
  | 'experience'
  | 'education'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'achievements';

export default function CareerPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [form, setForm] = useState<any>({});
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  async function loadAll() {
    setLoading(true);
    try {
      const [p, exp, edu, proj, sk, cert, ach] = await Promise.all([
        careerApi.getProfile(),
        careerApi.getExperiences(),
        careerApi.getEducation(),
        careerApi.getProjects(),
        careerApi.getSkills(),
        careerApi.getCertifications(),
        careerApi.getAchievements(),
      ]);
      setProfile(p.profile);
      setExperiences(exp.experiences);
      setEducation(edu.education);
      setProjects(proj.projects);
      setSkills(sk.skills);
      setCertifications(cert.certifications);
      setAchievements(ach.achievements);
    } catch {
      setError('Failed to load career data');
    } finally {
      setLoading(false);
    }
  }

  function showAlert(msg: string, type: 'error' | 'success') {
    if (type === 'error') {
      setError(msg);
      setSuccess('');
    } else {
      setSuccess(msg);
      setError('');
    }
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await careerApi.updateProfile(form);
      showAlert('Profile updated!', 'success');
      loadAll();
    } catch {
      showAlert('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateItem(activeSection, editingId, form);
      } else {
        await createItem(activeSection, form);
      }
      showAlert('Saved!', 'success');
      setShowForm(false);
      setEditingId(null);
      setForm({});
      loadAll();
    } catch (err: any) {
      showAlert(err?.response?.data?.error?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(section: Section, id: string) {
    if (!confirm('Delete this item?')) return;
    try {
      await deleteItem(section, id);
      showAlert('Deleted', 'success');
      loadAll();
    } catch {
      showAlert('Delete failed', 'error');
    }
  }

  async function createItem(section: Section, data: any) {
    switch (section) {
      case 'experience':
        return careerApi.createExperience(data);
      case 'education':
        return careerApi.createEducation(data);
      case 'projects':
        return careerApi.createProject(data);
      case 'skills':
        return careerApi.createSkill(data);
      case 'certifications':
        return careerApi.createCertification(data);
      case 'achievements':
        return careerApi.createAchievement(data);
    }
  }

  async function updateItem(section: Section, id: string, data: any) {
    switch (section) {
      case 'experience':
        return careerApi.updateExperience(id, data);
      case 'education':
        return careerApi.updateEducation(id, data);
      case 'projects':
        return careerApi.updateProject(id, data);
      case 'skills':
        return careerApi.updateSkill(id, data);
      case 'certifications':
        return careerApi.updateCertification(id, data);
      case 'achievements':
        return careerApi.updateAchievement(id, data);
    }
  }

  async function deleteItem(section: Section, id: string) {
    switch (section) {
      case 'experience':
        return careerApi.deleteExperience(id);
      case 'education':
        return careerApi.deleteEducation(id);
      case 'projects':
        return careerApi.deleteProject(id);
      case 'skills':
        return careerApi.deleteSkill(id);
      case 'certifications':
        return careerApi.deleteCertification(id);
      case 'achievements':
        return careerApi.deleteAchievement(id);
    }
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0].toUpperCase() || 'U';

  const navItems: { key: Section; label: string; icon: string }[] = [
    { key: 'profile', label: 'Profile', icon: '👤' },
    { key: 'experience', label: 'Experience', icon: '💼' },
    { key: 'education', label: 'Education', icon: '🎓' },
    { key: 'projects', label: 'Projects', icon: '🚀' },
    { key: 'skills', label: 'Skills', icon: '⚡' },
    { key: 'certifications', label: 'Certifications', icon: '🏅' },
    { key: 'achievements', label: 'Achievements', icon: '🏆' },
  ];

  if (!initialized || !user)
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );

  return (
    <div className="min-vh-100 bg-dark text-white">
      <AppNavbar />

      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <div
            className="col-12 col-md-3 col-lg-2 border-end border-secondary py-4"
            style={{ minHeight: 'calc(100vh - 56px)' }}
          >
            <div className="text-center mb-4">
              <div
                className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold mx-auto mb-2"
                style={{ width: 48, height: 48, fontSize: 16 }}
              >
                {initials}
              </div>
              <div className="small text-white fw-semibold">
                {user.name || 'Your Name'}
              </div>
              <div className="text-secondary" style={{ fontSize: 11 }}>
                {user.email}
              </div>
            </div>
            <nav className="nav flex-column gap-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  className={`btn text-start btn-sm ${activeSection === item.key ? 'btn-primary' : 'btn-dark text-secondary border-0'}`}
                  onClick={() => {
                    setActiveSection(item.key);
                    setShowForm(false);
                    setForm({});
                    setEditingId(null);
                  }}
                >
                  <span className="me-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="col-12 col-md-9 col-lg-10 py-4 px-4">
            {/* Alerts */}
            {error && (
              <div className="alert alert-danger py-2 small">{error}</div>
            )}
            {success && (
              <div className="alert alert-success py-2 small">{success}</div>
            )}

            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-primary" role="status" />
              </div>
            ) : (
              <>
                {/* ─── Profile Section ─────────────────────────────── */}
                {activeSection === 'profile' && (
                  <div>
                    <h5 className="fw-bold mb-4">Personal Profile</h5>
                    <form onSubmit={handleSaveProfile}>
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Full Name
                          </label>
                          <input
                            className="form-control bg-dark border-secondary text-white"
                            defaultValue={user.name || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Headline
                          </label>
                          <input
                            className="form-control bg-dark border-secondary text-white"
                            defaultValue={profile?.headline || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                headline: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Target Role
                          </label>
                          <input
                            className="form-control bg-dark border-secondary text-white"
                            defaultValue={profile?.targetRole || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                targetRole: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Target Level
                          </label>
                          <select
                            className="form-select bg-dark border-secondary text-white"
                            defaultValue={profile?.targetLevel || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                targetLevel: e.target.value,
                              }))
                            }
                          >
                            <option value="">Select level</option>
                            <option>Junior</option>
                            <option>Mid-level</option>
                            <option>Senior</option>
                            <option>Staff</option>
                            <option>Principal</option>
                            <option>Lead</option>
                            <option>Manager</option>
                          </select>
                        </div>
                        <div className="col-12">
                          <label className="form-label text-secondary small">
                            Professional Summary
                          </label>
                          <textarea
                            rows={4}
                            className="form-control bg-dark border-secondary text-white"
                            defaultValue={profile?.summary || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                summary: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12">
                          <button
                            type="submit"
                            className="btn btn-primary px-4"
                            disabled={saving}
                          >
                            {saving ? (
                              <span className="spinner-border spinner-border-sm me-2" />
                            ) : null}
                            Save Profile
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {/* ─── Experience Section ──────────────────────────── */}
                {activeSection === 'experience' && (
                  <CRUDSection
                    title="Work Experience"
                    items={experiences}
                    renderItem={(e: any) => (
                      <div>
                        <div className="fw-semibold text-white">
                          {e.title} @ {e.company}
                        </div>
                        <div className="text-secondary small">
                          {e.employmentType} · {e.location || 'Remote'}
                        </div>
                        <div className="text-secondary small">
                          {fmtDate(e.startDate)} →{' '}
                          {e.isCurrent ? 'Present' : fmtDate(e.endDate)}
                        </div>
                      </div>
                    )}
                    showForm={showForm}
                    editingId={editingId}
                    form={form}
                    saving={saving}
                    onNew={() => {
                      setShowForm(true);
                      setEditingId(null);
                      setForm({});
                    }}
                    onEdit={(item: any) => {
                      setShowForm(true);
                      setEditingId(item.id);
                      setForm(item);
                    }}
                    onDelete={(id: string) => handleDelete('experience', id)}
                    onSave={handleSaveItem}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setForm({});
                    }}
                    renderForm={() => (
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Company *
                          </label>
                          <input
                            required
                            className="form-control bg-dark border-secondary text-white"
                            value={form.company || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                company: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Job Title *
                          </label>
                          <input
                            required
                            className="form-control bg-dark border-secondary text-white"
                            value={form.title || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                title: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-4">
                          <label className="form-label text-secondary small">
                            Employment Type
                          </label>
                          <select
                            className="form-select bg-dark border-secondary text-white"
                            value={form.employmentType || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                employmentType: e.target.value,
                              }))
                            }
                          >
                            <option value="">Select</option>
                            <option>Full-time</option>
                            <option>Part-time</option>
                            <option>Contract</option>
                            <option>Freelance</option>
                            <option>Internship</option>
                          </select>
                        </div>
                        <div className="col-12 col-md-4">
                          <label className="form-label text-secondary small">
                            Location
                          </label>
                          <input
                            className="form-control bg-dark border-secondary text-white"
                            value={form.location || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                location: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-4">
                          <label className="form-label text-secondary small">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            required
                            className="form-control bg-dark border-secondary text-white"
                            value={
                              form.startDate
                                ? form.startDate.substring(0, 10)
                                : ''
                            }
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                startDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-4">
                          <label className="form-label text-secondary small">
                            End Date
                          </label>
                          <input
                            type="date"
                            className="form-control bg-dark border-secondary text-white"
                            value={
                              form.endDate ? form.endDate.substring(0, 10) : ''
                            }
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                endDate: e.target.value,
                              }))
                            }
                            disabled={form.isCurrent}
                          />
                        </div>
                        <div className="col-12 col-md-4 d-flex align-items-end pb-2">
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="isCurrent"
                              checked={form.isCurrent || false}
                              onChange={(e) =>
                                setForm((f: any) => ({
                                  ...f,
                                  isCurrent: e.target.checked,
                                  endDate: e.target.checked ? null : f.endDate,
                                }))
                              }
                            />
                            <label
                              className="form-check-label text-secondary small"
                              htmlFor="isCurrent"
                            >
                              Currently working here
                            </label>
                          </div>
                        </div>
                        <div className="col-12">
                          <label className="form-label text-secondary small">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            className="form-control bg-dark border-secondary text-white"
                            value={form.description || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  />
                )}

                {/* ─── Education ───────────────────────────────────── */}
                {activeSection === 'education' && (
                  <CRUDSection
                    title="Education"
                    items={education}
                    renderItem={(e: any) => (
                      <div>
                        <div className="fw-semibold text-white">
                          {e.institution}
                        </div>
                        <div className="text-secondary small">
                          {e.degree}{' '}
                          {e.fieldOfStudy ? `· ${e.fieldOfStudy}` : ''}
                        </div>
                        <div className="text-secondary small">
                          {fmtDate(e.startDate)} →{' '}
                          {e.isCurrent ? 'Present' : fmtDate(e.endDate)}
                        </div>
                      </div>
                    )}
                    showForm={showForm}
                    editingId={editingId}
                    form={form}
                    saving={saving}
                    onNew={() => {
                      setShowForm(true);
                      setEditingId(null);
                      setForm({});
                    }}
                    onEdit={(item: any) => {
                      setShowForm(true);
                      setEditingId(item.id);
                      setForm(item);
                    }}
                    onDelete={(id: string) => handleDelete('education', id)}
                    onSave={handleSaveItem}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setForm({});
                    }}
                    renderForm={() => (
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label text-secondary small">
                            Institution *
                          </label>
                          <input
                            required
                            className="form-control bg-dark border-secondary text-white"
                            value={form.institution || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                institution: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Degree
                          </label>
                          <input
                            className="form-control bg-dark border-secondary text-white"
                            value={form.degree || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                degree: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Field of Study
                          </label>
                          <input
                            className="form-control bg-dark border-secondary text-white"
                            value={form.fieldOfStudy || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                fieldOfStudy: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-4">
                          <label className="form-label text-secondary small">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            required
                            className="form-control bg-dark border-secondary text-white"
                            value={
                              form.startDate
                                ? form.startDate.substring(0, 10)
                                : ''
                            }
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                startDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-4">
                          <label className="form-label text-secondary small">
                            End Date
                          </label>
                          <input
                            type="date"
                            className="form-control bg-dark border-secondary text-white"
                            value={
                              form.endDate ? form.endDate.substring(0, 10) : ''
                            }
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                endDate: e.target.value,
                              }))
                            }
                            disabled={form.isCurrent}
                          />
                        </div>
                        <div className="col-12 col-md-4">
                          <label className="form-label text-secondary small">
                            Grade / CGPA
                          </label>
                          <input
                            className="form-control bg-dark border-secondary text-white"
                            value={form.grade || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                grade: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  />
                )}

                {/* ─── Projects ────────────────────────────────────── */}
                {activeSection === 'projects' && (
                  <CRUDSection
                    title="Projects"
                    items={projects}
                    renderItem={(p: any) => (
                      <div>
                        <div className="fw-semibold text-white">{p.name}</div>
                        {p.technologies?.length > 0 && (
                          <div className="d-flex flex-wrap gap-1 mt-1">
                            {p.technologies.map((t: string) => (
                              <span
                                key={t}
                                className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    showForm={showForm}
                    editingId={editingId}
                    form={form}
                    saving={saving}
                    onNew={() => {
                      setShowForm(true);
                      setEditingId(null);
                      setForm({ technologies: [] });
                    }}
                    onEdit={(item: any) => {
                      setShowForm(true);
                      setEditingId(item.id);
                      setForm({
                        ...item,
                        technologies: item.technologies || [],
                      });
                    }}
                    onDelete={(id: string) => handleDelete('projects', id)}
                    onSave={handleSaveItem}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setForm({});
                    }}
                    renderForm={() => (
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label text-secondary small">
                            Project Name *
                          </label>
                          <input
                            required
                            className="form-control bg-dark border-secondary text-white"
                            value={form.name || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label text-secondary small">
                            Technologies (comma-separated)
                          </label>
                          <input
                            className="form-control bg-dark border-secondary text-white"
                            value={(form.technologies || []).join(', ')}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                technologies: e.target.value
                                  .split(',')
                                  .map((t: string) => t.trim())
                                  .filter(Boolean),
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Project URL
                          </label>
                          <input
                            className="form-control bg-dark border-secondary text-white"
                            value={form.projectUrl || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                projectUrl: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Repository URL
                          </label>
                          <input
                            className="form-control bg-dark border-secondary text-white"
                            value={form.repoUrl || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                repoUrl: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label text-secondary small">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            className="form-control bg-dark border-secondary text-white"
                            value={form.description || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  />
                )}

                {/* ─── Skills ──────────────────────────────────────── */}
                {activeSection === 'skills' && (
                  <CRUDSection
                    title="Skills"
                    items={skills}
                    renderItem={(s: any) => (
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="text-white fw-semibold">{s.name}</span>
                        <div className="d-flex gap-2">
                          {s.category && (
                            <span className="badge bg-secondary">
                              {s.category}
                            </span>
                          )}
                          {s.proficiency && (
                            <span className="badge bg-primary bg-opacity-25 text-primary">
                              {s.proficiency}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    showForm={showForm}
                    editingId={editingId}
                    form={form}
                    saving={saving}
                    onNew={() => {
                      setShowForm(true);
                      setEditingId(null);
                      setForm({});
                    }}
                    onEdit={(item: any) => {
                      setShowForm(true);
                      setEditingId(item.id);
                      setForm(item);
                    }}
                    onDelete={(id: string) => handleDelete('skills', id)}
                    onSave={handleSaveItem}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setForm({});
                    }}
                    renderForm={() => (
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label text-secondary small">
                            Skill Name *
                          </label>
                          <input
                            id="skill-name-input"
                            required
                            className="form-control bg-dark border-secondary text-white"
                            value={form.name || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Category
                          </label>
                          <select
                            className="form-select bg-dark border-secondary text-white"
                            value={form.category || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                category: e.target.value,
                              }))
                            }
                          >
                            <option value="">Select</option>
                            <option>Programming</option>
                            <option>Framework</option>
                            <option>Tool</option>
                            <option>Soft Skill</option>
                            <option>Language</option>
                            <option>Database</option>
                            <option>Cloud</option>
                          </select>
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Proficiency
                          </label>
                          <select
                            className="form-select bg-dark border-secondary text-white"
                            value={form.proficiency || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                proficiency: e.target.value,
                              }))
                            }
                          >
                            <option value="">Select</option>
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                            <option>Expert</option>
                          </select>
                        </div>
                      </div>
                    )}
                  />
                )}

                {/* ─── Certifications ──────────────────────────────── */}
                {activeSection === 'certifications' && (
                  <CRUDSection
                    title="Certifications"
                    items={certifications}
                    renderItem={(c: any) => (
                      <div>
                        <div className="fw-semibold text-white">{c.name}</div>
                        <div className="text-secondary small">
                          {c.issuer}{' '}
                          {c.issueDate ? `· ${fmtDate(c.issueDate)}` : ''}
                        </div>
                      </div>
                    )}
                    showForm={showForm}
                    editingId={editingId}
                    form={form}
                    saving={saving}
                    onNew={() => {
                      setShowForm(true);
                      setEditingId(null);
                      setForm({});
                    }}
                    onEdit={(item: any) => {
                      setShowForm(true);
                      setEditingId(item.id);
                      setForm(item);
                    }}
                    onDelete={(id: string) =>
                      handleDelete('certifications', id)
                    }
                    onSave={handleSaveItem}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setForm({});
                    }}
                    renderForm={() => (
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label text-secondary small">
                            Certification Name *
                          </label>
                          <input
                            required
                            className="form-control bg-dark border-secondary text-white"
                            value={form.name || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Issuing Organization
                          </label>
                          <input
                            className="form-control bg-dark border-secondary text-white"
                            value={form.issuer || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                issuer: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-3">
                          <label className="form-label text-secondary small">
                            Issue Date
                          </label>
                          <input
                            type="date"
                            className="form-control bg-dark border-secondary text-white"
                            value={
                              form.issueDate
                                ? form.issueDate.substring(0, 10)
                                : ''
                            }
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                issueDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-3">
                          <label className="form-label text-secondary small">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            className="form-control bg-dark border-secondary text-white"
                            value={
                              form.expiryDate
                                ? form.expiryDate.substring(0, 10)
                                : ''
                            }
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                expiryDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Credential ID
                          </label>
                          <input
                            className="form-control bg-dark border-secondary text-white"
                            value={form.credentialId || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                credentialId: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Credential URL
                          </label>
                          <input
                            className="form-control bg-dark border-secondary text-white"
                            value={form.credentialUrl || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                credentialUrl: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  />
                )}

                {/* ─── Achievements ────────────────────────────────── */}
                {activeSection === 'achievements' && (
                  <CRUDSection
                    title="Achievements"
                    items={achievements}
                    renderItem={(a: any) => (
                      <div>
                        <div className="fw-semibold text-white">{a.title}</div>
                        {a.description && (
                          <div className="text-secondary small">
                            {a.description.substring(0, 80)}…
                          </div>
                        )}
                      </div>
                    )}
                    showForm={showForm}
                    editingId={editingId}
                    form={form}
                    saving={saving}
                    onNew={() => {
                      setShowForm(true);
                      setEditingId(null);
                      setForm({});
                    }}
                    onEdit={(item: any) => {
                      setShowForm(true);
                      setEditingId(item.id);
                      setForm(item);
                    }}
                    onDelete={(id: string) => handleDelete('achievements', id)}
                    onSave={handleSaveItem}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setForm({});
                    }}
                    renderForm={() => (
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label text-secondary small">
                            Title *
                          </label>
                          <input
                            required
                            className="form-control bg-dark border-secondary text-white"
                            value={form.title || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                title: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            Date
                          </label>
                          <input
                            type="date"
                            className="form-control bg-dark border-secondary text-white"
                            value={form.date ? form.date.substring(0, 10) : ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                date: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-secondary small">
                            URL
                          </label>
                          <input
                            className="form-control bg-dark border-secondary text-white"
                            value={form.url || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                url: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label text-secondary small">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            className="form-control bg-dark border-secondary text-white"
                            value={form.description || ''}
                            onChange={(e) =>
                              setForm((f: any) => ({
                                ...f,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable CRUD Section ────────────────────────────────────────────────────

function CRUDSection({
  title,
  items,
  renderItem,
  showForm,
  editingId,
  _form,
  saving,
  onNew,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  renderForm,
}: any) {
  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h5 className="fw-bold mb-0">{title}</h5>
        {!showForm && (
          <button
            className="btn btn-primary btn-sm px-3"
            onClick={onNew}
            id={`add-${title.toLowerCase().replace(/\s/g, '-')}`}
          >
            + Add {title.split(' ')[0]}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card bg-dark border-primary mb-4">
          <div className="card-header bg-primary bg-opacity-10 border-primary">
            <span className="small fw-semibold text-primary">
              {editingId ? 'Edit' : 'New'} {title.replace(/s$/, '')}
            </span>
          </div>
          <div className="card-body">
            <form onSubmit={onSave}>
              {renderForm()}
              <div className="d-flex gap-2 mt-3">
                <button
                  type="submit"
                  className="btn btn-primary btn-sm px-4"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="spinner-border spinner-border-sm me-2" />
                  ) : null}
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm ? (
        <div className="text-center py-5 text-secondary">
          <div className="fs-4 mb-2">📭</div>
          <p className="mb-3">No {title.toLowerCase()} added yet</p>
          <button className="btn btn-outline-primary btn-sm" onClick={onNew}>
            Add your first
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {items.map((item: any) => (
            <div key={item.id} className="card bg-dark border-secondary">
              <div className="card-body d-flex align-items-start justify-content-between gap-3 p-3">
                <div className="flex-grow-1">{renderItem(item)}</div>
                <div className="d-flex gap-1 flex-shrink-0">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => onEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => onDelete(item.id)}
                  >
                    Del
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}
