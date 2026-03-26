import type { Route } from './+types/home';
import Navbar from '~/components/Navbar';
import ResumeCard from '~/components/ResumeCard';
import ScoreChart from '~/components/ScoreChart';

import { usePuterStore } from '~/lib/puter';
import { Link, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';

/* ================= TYPES ================= */
interface Resume {
    id: string;
    companyName?: string;
    jobTitle?: string;
    imagePath: string;
    resumePath?: string;
    feedback: {
        overallScore: number;
    };
}

/* ================= META ================= */
export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Home | Resume Analyzer' },
        { name: 'description', content: 'Track resumes and ATS scores' },
    ];
}

/* ================= COMPONENT ================= */
export default function Home() {
    const { auth, kv, fs } = usePuterStore();
    const navigate = useNavigate();

    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loadingResumes, setLoadingResumes] = useState(false);

    // 🔥 FEATURES
    const [search, setSearch] = useState('');
    const [sortOrder, setSortOrder] = useState<'high' | 'low'>('high');
    const [filterCompany, setFilterCompany] = useState('');

    /* ================= AUTH ================= */
    useEffect(() => {
        if (!auth.isAuthenticated) {
            navigate('/auth?next=/');
        }
    }, [auth.isAuthenticated, navigate]);

    /* ================= LOAD RESUMES ================= */
    const loadResumes = async () => {
        try {
            setLoadingResumes(true);

            const data = await kv.list('', true);

            console.log("KV DATA:", data);

            if (!data || data.length === 0) {
                setResumes([]);
                return;
            }

            const parsed = await Promise.all(
                data.map(async (item: any) => {
                    try {
                        if (!item.value) return null;

                        const res = JSON.parse(item.value);

                        // 🔥 Fix image path
                        if (res.imagePath) {
                            const blob = await fs.read(res.imagePath);

                            if (blob) {
                                res.imagePath = URL.createObjectURL(
                                    new Blob([blob])
                                );
                            }
                        }

                        return res;

                    } catch (err) {
                        console.error("Parse error:", err);
                        return null;
                    }
                })
            );

            const clean = parsed.filter(Boolean);

            console.log("FINAL RESUMES:", clean);

            setResumes(clean);

        } catch (err) {
            console.error("LOAD ERROR:", err);
        } finally {
            setLoadingResumes(false);
        }
    };

    useEffect(() => {
        loadResumes();

        // 🔥 REAL-TIME UPDATE
        const handler = () => loadResumes();
        window.addEventListener('resumeUpdated', handler);

        return () => window.removeEventListener('resumeUpdated', handler);
    }, []);

    /* ================= FILTER ================= */
    const filtered = resumes
        .filter((r) =>
            r.companyName?.toLowerCase().includes(search.toLowerCase())
        )
        .filter((r) =>
            filterCompany ? r.companyName === filterCompany : true
        )
        .sort((a, b) =>
            sortOrder === 'high'
                ? b.feedback?.overallScore - a.feedback?.overallScore
                : a.feedback?.overallScore - b.feedback?.overallScore
        );

    /* ================= UI ================= */
    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">

            <Navbar />

            {/* 🔍 SEARCH + FILTER */}
            <div className="flex gap-4 p-6">
                <input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border p-2 rounded"
                />

                <select
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="border p-2 rounded"
                >
                    <option value="high">High → Low</option>
                    <option value="low">Low → High</option>
                </select>

                <input
                    placeholder="Filter company"
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                    className="border p-2 rounded"
                />
            </div>

            {/* 📈 GRAPH */}
            <div className="px-6 mb-6">
                <ScoreChart
                    data={resumes.map((r) => ({
                        name: r.companyName || "Unknown",
                        score: r.feedback?.overallScore || 0,
                    }))}
                />
            </div>

            {/* 📦 RESUME LIST */}
            <div className="grid grid-cols-3 gap-6 p-6">
                {filtered.map((resume) => (
                    <ResumeCard key={resume.id} resume={resume} />
                ))}
            </div>

            {/* EMPTY STATE */}
            {!loadingResumes && filtered.length === 0 && (
                <div className="text-center mt-10">
                    <p className="mb-4 text-gray-500">
                        No resumes found 🚀
                    </p>

                    <Link to="/upload" className="primary-button">
                        Upload Resume
                    </Link>
                </div>
            )}

            {/* LOADING */}
            {loadingResumes && (
                <div className="text-center mt-10">
                    Loading resumes...
                </div>
            )}

        </main>
    );
}