import { Link } from 'react-router';
import ScoreCircle from '~/components/ScoreCircle';

/* ================= TYPES ================= */

export interface Resume {
  id: string;
  companyName?: string;
  jobTitle?: string;
  imagePath: string;
  feedback: {
    overallScore: number;
  };
}

/* ================= COMPONENT ================= */

const ResumeCard = ({
  resume: { id, companyName, jobTitle, feedback, imagePath },
}: {
  resume: Resume;
}) => {
  return (
    <Link to={`/resume/${id}`} className="resume-card">
      {/* HEADER */}
      <div className="flex justify-between">
        <div>
          <h2 className="font-bold">{companyName || 'Resume'}</h2>

          {jobTitle && <p className="text-gray-500">{jobTitle}</p>}
        </div>

        {/* SCORE */}
        <ScoreCircle score={feedback?.overallScore || 0} />
      </div>

      {/* IMAGE */}
      <div className="mt-2">
        <img
          src={imagePath}
          className="w-full h-[250px] object-cover rounded"
        />
      </div>
    </Link>
  );
};

export default ResumeCard;
