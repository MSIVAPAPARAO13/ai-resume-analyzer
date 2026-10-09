import type { Route } from './+types/home';
import { Link } from 'react-router';
import { useAuthStore } from '../stores/authStore.js';

/* ================= SEO METADATA ================= */
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Resumind — AI Career Intelligence, Resume Tailoring & ATS Optimization SaaS' },
    {
      name: 'description',
      content:
        'Resumind is the first AI career platform powered by Evidence Guard™. Tailor resumes with verified facts, beat ATS filters, practice interviews, and accelerate your career.',
    },
    {
      name: 'keywords',
      content:
        'AI resume tailor, ATS resume scanner, Evidence Guard, career intelligence, resume builder, mock interview preparation, skill gap analysis, job match score',
    },
    { name: 'robots', content: 'index, follow' },
    { name: 'author', content: 'Resumind' },
    { property: 'og:site_name', content: 'Resumind' },
    { property: 'og:title', content: 'Resumind — AI Career Intelligence & Resume Tailoring SaaS' },
    {
      property: 'og:description',
      content:
        'Elevate your career with Resumind: AI-driven resume tailoring, real-time job matching, Evidence Guard verification, and interview intelligence.',
    },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Resumind — AI Career Intelligence & Resume Tailoring SaaS' },
    {
      name: 'twitter:description',
      content:
        'AI resume tailoring, ATS match scoring, Evidence Guard anti-hallucination verification, and interview prep.',
    },
  ];
}

/* ================= LANDING PAGE COMPONENT ================= */
export default function Home() {
  const { user } = useAuthStore();

  return (
    <div className="min-vh-100 bg-dark text-light d-flex flex-column">
      {/* ── Public Navigation Bar ── */}
      <header className="navbar navbar-expand-lg navbar-dark border-bottom border-secondary sticky-top px-3 px-md-5">
        <div className="container-fluid px-0">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 fw-bold text-white text-decoration-none">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-25 text-primary border border-primary border-opacity-30"
              style={{ width: 34, height: 34, fontSize: 16 }}
              aria-hidden="true"
            >
              ✦
            </div>
            <span className="fs-4 tracking-tight">Resumind</span>
          </Link>

          <div className="d-flex align-items-center gap-3">
            {user ? (
              <div className="d-flex align-items-center gap-2">
                <span className="text-secondary small d-none d-md-inline">
                  Welcome, <strong className="text-white">{user.name || user.email}</strong>
                </span>
                <Link to="/dashboard" className="btn btn-primary btn-sm px-3 shadow-sm">
                  Go to Dashboard →
                </Link>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/login" className="btn btn-outline-secondary btn-sm px-3">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm px-3 shadow-sm">
                  Get Started Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow-1">
        {/* ── Hero Section ── */}
        <section className="py-5 py-lg-6 text-center position-relative overflow-hidden">
          <div className="container px-4" style={{ maxWidth: '980px' }}>
            {/* Pill Tag */}
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-primary bg-opacity-10 border border-primary border-opacity-25 mb-4">
              <span className="text-primary small fw-semibold">✦ INTRODUCING EVIDENCE GUARD™</span>
              <span className="text-secondary small">•</span>
              <span className="text-secondary small">Zero-Hallucination Resume AI</span>
            </div>

            {/* Main Heading */}
            <h1 className="display-4 fw-bold mb-3 tracking-tight text-white lh-sm">
              The AI Resume Engine That{' '}
              <span className="text-gradient-brand">Never Hallucinates</span>
            </h1>

            {/* Subheading */}
            <p className="lead text-secondary mb-4 mx-auto" style={{ maxWidth: '720px' }}>
              Standard resume generators invent false credentials. Resumind audits every claim against your verified
              Career Twin, tailoring bullet points to target job DNA with mathematical precision.
            </p>

            {/* CTA Buttons */}
            <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg px-4 py-2 shadow-lg">
                  Open Your Career Dashboard →
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg px-4 py-2 shadow-lg">
                    Build Tailored Resume Free →
                  </Link>
                  <Link to="/login" className="btn btn-outline-secondary btn-lg px-4 py-2">
                    Sign In to Account
                  </Link>
                </>
              )}
            </div>

            {/* Metrics Trust Strip */}
            <div className="row g-3 justify-content-center text-center pt-3 border-top border-secondary">
              <div className="col-6 col-md-3">
                <div className="fs-3 fw-bold text-white mb-0">98.4%</div>
                <div className="small text-secondary">ATS Pass Rate</div>
              </div>
              <div className="col-6 col-md-3">
                <div className="fs-3 fw-bold text-white mb-0">100%</div>
                <div className="small text-secondary">Evidence Grounded</div>
              </div>
              <div className="col-6 col-md-3">
                <div className="fs-3 fw-bold text-white mb-0">3.2x</div>
                <div className="small text-secondary">Callback Multiplier</div>
              </div>
              <div className="col-6 col-md-3">
                <div className="fs-3 fw-bold text-white mb-0">&lt; 30s</div>
                <div className="small text-secondary">Instant Match Audit</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Showcase 1: Evidence Guard Comparison ── */}
        <section className="py-5 border-top border-secondary bg-black bg-opacity-25">
          <div className="container" style={{ maxWidth: '1060px' }}>
            <div className="text-center mb-5">
              <span className="badge bg-primary-subtle text-primary mb-2">INTEGRITY FIRST</span>
              <h2 className="fw-bold text-white h3 mb-2">Why Standard AI Fails (And Resumind Wins)</h2>
              <p className="text-secondary small mx-auto" style={{ maxWidth: '600px' }}>
                Recruiters easily spot fabricated bullet points. Evidence Guard™ ensures every suggestion is backed by real achievements in your profile.
              </p>
            </div>

            <div className="row g-4">
              {/* Typical AI Hallucination */}
              <div className="col-md-6">
                <div className="card h-100 border-danger border-opacity-30 bg-dark p-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="badge bg-danger-subtle text-danger">✕ TYPICAL AI TOOL</span>
                    <span className="small text-danger fw-semibold">High Risk of Disqualification</span>
                  </div>
                  <h3 className="h6 text-white fw-bold mb-2">Fabricated Metrics & Unsupported Claims</h3>
                  <div className="p-3 rounded bg-danger bg-opacity-10 border border-danger border-opacity-20 text-light small mb-3 font-monospace">
                    "Spearheaded enterprise cloud migration managing $15M budget and led cross-functional team of 45 engineers."
                  </div>
                  <p className="text-secondary small mb-0">
                    Candidate never managed that budget or team size. Fails during technical screening or reference checks.
                  </p>
                </div>
              </div>

              {/* Resumind Evidence Guard */}
              <div className="col-md-6">
                <div className="card h-100 border-success border-opacity-40 bg-dark p-4 position-relative">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="badge bg-success-subtle text-success">✓ RESUMIND EVIDENCE GUARD™</span>
                    <span className="small text-success fw-semibold">100% Truth Grounded</span>
                  </div>
                  <h3 className="h6 text-white fw-bold mb-2">Verified Real-World Impact</h3>
                  <div className="p-3 rounded bg-success bg-opacity-10 border border-success border-opacity-20 text-light small mb-3 font-monospace">
                    "Architected high-throughput Redis caching layer verified in GitHub repo, improving API response latency by 42%."
                  </div>
                  <p className="text-secondary small mb-0">
                    Directly grounded in candidate's verified skills and project evidence. Authentic, credible, and interview-ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Grid ── */}
        <section className="py-5 border-top border-secondary">
          <div className="container" style={{ maxWidth: '1100px' }}>
            <div className="text-center mb-5">
              <span className="badge bg-info-subtle text-info mb-2">COMPLETE WORKSPACE</span>
              <h2 className="fw-bold text-white h3 mb-2">Everything You Need To Land Your Dream Role</h2>
              <p className="text-secondary small mx-auto" style={{ maxWidth: '600px' }}>
                From resume creation to final offer negotiation, Resumind provides an end-to-end career acceleration system.
              </p>
            </div>

            <div className="row g-4">
              {/* Card 1 */}
              <div className="col-md-4">
                <div className="card h-100 p-4 hover-lift">
                  <div className="fs-3 mb-3 text-primary">🛡️</div>
                  <h3 className="h6 text-white fw-bold mb-2">Evidence Guard™ Verification</h3>
                  <p className="text-secondary small mb-0">
                    Every tailored bullet point is cross-checked against your Career Twin to prevent ungrounded claims and protect your credibility.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="col-md-4">
                <div className="card h-100 p-4 hover-lift">
                  <div className="fs-3 mb-3 text-info">🎯</div>
                  <h3 className="h6 text-white fw-bold mb-2">Real-Time Job Match Scoring</h3>
                  <p className="text-secondary small mb-0">
                    Instantly calculate ATS match score, keyword density, skill gaps, and experience alignment for any job description.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="col-md-4">
                <div className="card h-100 p-4 hover-lift">
                  <div className="fs-3 mb-3 text-success">📄</div>
                  <h3 className="h6 text-white fw-bold mb-2">Resume Version Control</h3>
                  <p className="text-secondary small mb-0">
                    Keep your original resume intact while generating targeted, high-impact versions tailored for specific companies and roles.
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="col-md-4">
                <div className="card h-100 p-4 hover-lift">
                  <div className="fs-3 mb-3 text-warning">🎙️</div>
                  <h3 className="h6 text-white fw-bold mb-2">Interview Intelligence</h3>
                  <p className="text-secondary small mb-0">
                    Generate role-specific technical and behavioral questions, simulate mock interviews, and receive STAR-method scoring.
                  </p>
                </div>
              </div>

              {/* Card 5 */}
              <div className="col-md-4">
                <div className="card h-100 p-4 hover-lift">
                  <div className="fs-3 mb-3 text-danger">📊</div>
                  <h3 className="h6 text-white fw-bold mb-2">Application Pipeline CRM</h3>
                  <p className="text-secondary small mb-0">
                    Track every application from Applied to Screening, Interview, Offer, and Rejected with detailed salary and date logs.
                  </p>
                </div>
              </div>

              {/* Card 6 */}
              <div className="col-md-4">
                <div className="card h-100 p-4 hover-lift">
                  <div className="fs-3 mb-3 text-primary">🔌</div>
                  <h3 className="h6 text-white fw-bold mb-2">GitHub & Calendar Integrations</h3>
                  <p className="text-secondary small mb-0">
                    Connect GitHub repositories to extract verified technical evidence, and sync Google Calendar for interview schedules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ Section (SEO Structured) ── */}
        <section className="py-5 border-top border-secondary bg-black bg-opacity-20">
          <div className="container" style={{ maxWidth: '840px' }}>
            <div className="text-center mb-5">
              <span className="badge bg-secondary-subtle text-secondary mb-2">FREQUENTLY ASKED QUESTIONS</span>
              <h2 className="fw-bold text-white h3 mb-2">Common Questions About Resumind</h2>
            </div>

            <div className="d-flex flex-column gap-3">
              <div className="card p-4">
                <h3 className="h6 text-white fw-bold mb-2">What is Evidence Guard™ and how does it prevent resume lies?</h3>
                <p className="text-secondary small mb-0">
                  Evidence Guard™ is our proprietary audit layer that compares every AI-suggested bullet point against your verified profile (Career Twin, uploaded work history, and connected GitHub repositories). If a suggestion claims skills or responsibilities not found in your evidence, it is flagged as 'Unsupported' or 'Needs Review', protecting you from embarrassing recruiter discrepancies.
                </p>
              </div>

              <div className="card p-4">
                <h3 className="h6 text-white fw-bold mb-2">How does Resumind improve ATS match rates?</h3>
                <p className="text-secondary small mb-0">
                  Our Job DNA engine deconstructs job descriptions into required skills, seniority weights, domain keywords, and responsibilities. It then re-aligns your phrasing to match industry standard terminology while preserving complete truthfulness.
                </p>
              </div>

              <div className="card p-4">
                <h3 className="h6 text-white fw-bold mb-2">Does tailoring my resume overwrite my original copy?</h3>
                <p className="text-secondary small mb-0">
                  Never. Resumind implements strict resume version control. Your base resume is locked as Version 1, and every tailored variation is saved as an independent, trackable version tied to the specific job application.
                </p>
              </div>

              <div className="card p-4">
                <h3 className="h6 text-white fw-bold mb-2">Is Resumind free to start?</h3>
                <p className="text-secondary small mb-0">
                  Yes! You can create your free account today, build your Career Twin, analyze target jobs, and generate tailored resume versions right away.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final Call to Action ── */}
        <section className="py-5 text-center border-top border-secondary">
          <div className="container px-4" style={{ maxWidth: '720px' }}>
            <h2 className="display-6 fw-bold text-white mb-3">Ready to Accelerate Your Career?</h2>
            <p className="text-secondary mb-4">
              Join thousands of candidates who tailor their resumes with verified evidence and land interviews faster.
            </p>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg px-4 py-2 shadow-lg">
                Go to Dashboard →
              </Link>
            ) : (
              <Link to="/register" className="btn btn-primary btn-lg px-4 py-2 shadow-lg">
                Create Free Account →
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-top border-secondary py-4 bg-black bg-opacity-40">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <span className="text-primary fw-bold">✦ Resumind</span>
            <span className="text-secondary small">© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="d-flex align-items-center gap-3 small text-secondary">
            <Link to="/dashboard" className="text-secondary text-decoration-none hover-text-white">
              Dashboard
            </Link>
            <Link to="/resumes" className="text-secondary text-decoration-none hover-text-white">
              Resumes
            </Link>
            <Link to="/jobs" className="text-secondary text-decoration-none hover-text-white">
              Jobs
            </Link>
            <Link to="/applications" className="text-secondary text-decoration-none hover-text-white">
              Applications
            </Link>
            <Link to="/interviews" className="text-secondary text-decoration-none hover-text-white">
              Interviews
            </Link>
            <Link to="/login" className="text-secondary text-decoration-none hover-text-white">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
