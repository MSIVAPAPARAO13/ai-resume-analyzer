import type { Route } from './+types/home';
import Navbar from '~/components/Navbar';
import ResumeCard, { Resume } from '~/components/ResumeCard';
import { usePuterStore } from '~/lib/puter';
import { Link, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';

/* ================= META ================= */

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Home | Resume Analyzer' },
    { name: 'description', content: 'Track resumes and ATS scores' },
  ];
}

/* ================= COMPONENT ================= */

export default function Home() {
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  /* ================= AUTH CHECK ================= */

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate('/auth?next=/');
    }
  }, [auth.isAuthenticated, navigate]);

  /* ================= LOAD RESUMES ================= */

  useEffect(() => {
    const loadResumes = async () => {
      try {
        setLoadingResumes(true);

        const data = await kv.list('', true);

        console.log('ALL KV:', data);

        const parsed = data
          ?.filter((item: any) => item.key.startsWith('resume:'))
          .map((item: any) => {
            try {
              return JSON.parse(item.value);
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        setResumes(parsed || []);
      } catch (error) {
        console.error('Error loading resumes:', error);
      } finally {
        setLoadingResumes(false);
      }
    };

    loadResumes();
  }, [kv]);

  /* ================= UI ================= */

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />

      <section className="main-section">
        {/* HEADING */}
        <div className="page-heading py-16 text-center">
          <h1 className="text-3xl font-bold">
            Track Your Applications & Resume Ratings
          </h1>

          <h2 className="text-gray-500 mt-2">
            Review your submissions and check AI-powered feedback.
          </h2>

          {!loadingResumes && resumes.length === 0 && (
            <p className="mt-4 text-gray-600">
              No resumes found. Upload your first resume 🚀
            </p>
          )}
        </div>

        {/* LOADING */}
        {loadingResumes && (
          <div className="flex justify-center items-center">
            <img
              src="/images/resume-scan-2.gif"
              className="w-[200px]"
              alt="loading"
            />
          </div>
        )}

        {/* RESUME LIST */}
        {!loadingResumes && resumes.length > 0 && (
          <div className="grid grid-cols-3 gap-6 px-6">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loadingResumes && resumes.length === 0 && (
          <div className="flex flex-col items-center mt-10 gap-4">
            <Link
              to="/upload"
              className="primary-button text-lg font-semibold px-6 py-2"
            >
              Upload Resume
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
