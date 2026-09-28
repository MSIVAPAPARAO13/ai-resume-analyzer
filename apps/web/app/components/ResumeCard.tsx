import { Link, useNavigate } from 'react-router';
import { usePuterStore } from '~/lib/puter';
import ScoreCircle from './ScoreCircle';

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

/* ================= COMPONENT ================= */
const ResumeCard = ({ resume }: { resume: Resume }) => {
  const { kv, fs } = usePuterStore();
  const navigate = useNavigate();

  // 🗑 DELETE
  const handleDelete = async (e: any) => {
    e.preventDefault();

    const confirmDelete = confirm('Delete this resume?');
    if (!confirmDelete) return;

    await kv.delete(`resume:${resume.id}`);

    if (resume.resumePath) {
      await fs.delete(resume.resumePath);
    }

    window.dispatchEvent(new Event('resumeUpdated'));
  };

  // 📥 DOWNLOAD
  const handleDownload = async (e: any) => {
    e.preventDefault();

    if (!resume.resumePath) return;

    const blob = await fs.read(resume.resumePath);
    if (!blob) return;

    const url = URL.createObjectURL(new Blob([blob]));

    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.pdf';
    a.click();
  };

  return (
    <Link
      to={`/resume/${resume.id}`}
      className="relative border p-4 rounded shadow"
    >
      {/* ACTION BUTTONS */}
      <div className="absolute top-2 right-2 flex gap-2 text-sm">
        <button onClick={handleDelete} className="text-red-500">
          Delete
        </button>

        <button onClick={handleDownload} className="text-blue-500">
          Download
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            navigate(`/edit/${resume.id}`);
          }}
          className="text-green-500"
        >
          Edit
        </button>
      </div>

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold">{resume.companyName || 'Resume'}</h2>

          {resume.jobTitle && (
            <p className="text-gray-500">{resume.jobTitle}</p>
          )}
        </div>

        <ScoreCircle score={resume.feedback.overallScore} />
      </div>

      {/* IMAGE */}
      <img
        src={resume.imagePath}
        alt="resume"
        className="mt-3 w-full h-[200px] object-cover rounded"
      />
    </Link>
  );
};

export default ResumeCard;
