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
    <Link
      to={`/resume/${id}`}
      className="resume-card animate-in fade-in duration-1000"
    >
      {/* HEADER */}
      <div className="resume-card-header flex justify-between items-start">
        <div className="flex flex-col gap-2">
          {/* COMPANY NAME */}
          {companyName ? (
            <h2 className="text-black font-bold break-words">{companyName}</h2>
          ) : (
            <h2 className="text-black font-bold">Resume</h2>
          )}

          {/* JOB TITLE */}
          {jobTitle && (
            <h3 className="text-lg text-gray-500 break-words">{jobTitle}</h3>
          )}
        </div>

        {/* SCORE */}
        <div className="flex-shrink-0">
          <ScoreCircle score={feedback?.overallScore || 0} />
        </div>
      </div>

      {/* IMAGE */}
      <div className="gradient-border mt-2">
        <div className="w-full h-full">
          <img
            src={imagePath}
            alt="resume"
            className="w-full h-[350px] max-sm:h-[200px] object-cover object-top rounded-lg"
          />
        </div>
      </div>
    </Link>
  );
};

export default ResumeCard;
