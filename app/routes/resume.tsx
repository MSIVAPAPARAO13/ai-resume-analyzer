import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";

import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";

export const meta = () => ([
  { title: 'Resumind | Review' },
  { name: 'description', content: 'Detailed overview of your resume' },
]);

const Resume = () => {

  // 🔹 Get APIs from store
  const { auth, isLoading, fs, kv } = usePuterStore();

  // 🔹 Get ID from URL (/resume/:id)
  const { id } = useParams();

  // 🔹 State variables
  const [imageUrl, setImageUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [feedback, setFeedback] = useState<any>(null);

  const navigate = useNavigate();

  // ============================
  // 🔐 AUTH CHECK
  // ============================
  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate(`/auth?next=/resume/${id}`);
    }
  }, [isLoading]);

  // ============================
  // 📦 LOAD DATA
  // ============================
  useEffect(() => {
    const loadResume = async () => {

      // 1️⃣ Get data from KV storage
      const resume = await kv.get(`resume:${id}`);
      if (!resume) return;

      const data = JSON.parse(resume);

      // 2️⃣ Load PDF
      const resumeBlob = await fs.read(data.resumePath);
      if (!resumeBlob) return;

      const pdfBlob = new Blob([resumeBlob], {
        type: 'application/pdf'
      });

      const resumeUrl = URL.createObjectURL(pdfBlob);
      setResumeUrl(resumeUrl);

      // 3️⃣ Load Image
      const imageBlob = await fs.read(data.imagePath);
      if (!imageBlob) return;

      const imageUrl = URL.createObjectURL(imageBlob);
      setImageUrl(imageUrl);

      // 4️⃣ Set feedback
      setFeedback(data.feedback);

      console.log("📄 Loaded Data:", {
        resumeUrl,
        imageUrl,
        feedback: data.feedback
      });
    };

    loadResume();
  }, [id]);

  // ============================
  // 🎨 UI
  // ============================
  return (
    <main className="!pt-0">

      {/* 🔙 Back Button */}
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" className="w-2.5 h-2.5" />
          <span className="text-sm font-semibold">
            Back to Homepage
          </span>
        </Link>
      </nav>

      <div className="flex flex-row w-full max-lg:flex-col-reverse">

        {/* 📄 LEFT: Resume Preview */}
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 flex items-center justify-center">

          {imageUrl && resumeUrl && (
            <div className="gradient-border h-[90%] w-fit">

              {/* Click → open PDF */}
              <a href={resumeUrl} target="_blank">

                <img
                  src={imageUrl}
                  className="w-full h-full object-contain rounded-2xl"
                  alt="resume"
                />

              </a>
            </div>
          )}

        </section>

        {/* 📊 RIGHT: Feedback */}
        <section className="feedback-section">

          <h2 className="text-4xl font-bold">Resume Review</h2>

          {feedback ? (
            <div className="flex flex-col gap-8">

              {/* Summary */}
              <Summary feedback={feedback} />

              {/* ATS Score */}
              <ATS
                score={feedback.ATS?.score || 0}
                suggestions={feedback.ATS?.tips || []}
              />

              {/* Full Details */}
              <Details feedback={feedback} />

            </div>
          ) : (

            // Loading animation
            <img src="/images/resume-scan-2.gif" className="w-full" />

          )}

        </section>

      </div>
    </main>
  );
};

export default Resume;