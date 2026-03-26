import type { Route } from './+types/home';
import type { Resume } from '~/components/ResumeCard';

import Navbar from '~/components/Navbar';
import ResumeCard from '~/components/ResumeCard';

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
  const { auth, kv, fs } = usePuterStore(); // ✅ ADD fs
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

        console.log('KV RAW:', data);

        // 🔥 FIX: convert imagePath → usable URL
        const parsed = await Promise.all(
          data
            ?.filter((item: any) => item.key.startsWith('resume:'))
            .map(async (item: any) => {
              try {
                const res = JSON.parse(item.value);

                // 🔥 READ IMAGE FROM STORAGE
                const imageBlob = await fs.read(res.imagePath);

                if (imageBlob) {
                  res.imagePath = URL.createObjectURL(new Blob([imageBlob]));
                }

                return res;
              } catch (err) {
                console.error('Parse error:', err);
                return null;
              }
            }),
        );

        const cleanData = parsed.filter(Boolean);
        setResumes(cleanData);
      } catch (error) {
        console.error('Error loading resumes:', error);
      } finally {
        setLoadingResumes(false);
      }
    };

    loadResumes();
  }, [kv, fs]);

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
          <div className="flex justify-center">
            <img
              src="/images/resume-scan-2.gif"
              className="w-[200px]"
              alt="loading"
            />
          </div>
        )}

        {/* RESUME GRID */}
        {!loadingResumes && resumes.length > 0 && (
          <div className="grid grid-cols-3 gap-6 px-6">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}

        {/* EMPTY */}
        {!loadingResumes && resumes.length === 0 && (
          <div className="flex flex-col items-center mt-10">
            <Link to="/upload" className="primary-button px-6 py-2">
              Upload Resume
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
