import React from 'react';
import ScoreGauge from '~/components/ScoreGauge';
import ScoreBadge from '~/components/ScoreBadge';

/* ================= TYPES ================= */

type CategoryType = {
  score: number;
};

export interface Feedback {
  overallScore: number;
  toneAndStyle: CategoryType;
  content: CategoryType;
  structure: CategoryType;
  skills: CategoryType;
}

/* ================= CATEGORY ================= */

const Category = ({ title, score }: { title: string; score: number }) => {
  const textColor =
    score > 70
      ? 'text-green-600'
      : score > 49
        ? 'text-yellow-600'
        : 'text-red-600';

  return (
    <div className="flex justify-between items-center border-t p-4">
      <div className="flex items-center gap-2">
        <p className="text-lg font-medium">{title}</p>
        <ScoreBadge score={score} />
      </div>

      <p className="text-lg font-semibold">
        <span className={textColor}>{score}</span>/100
      </p>
    </div>
  );
};

/* ================= SUMMARY ================= */

const Summary = ({ feedback }: { feedback: Feedback }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md w-full">
      {/* Top Section */}
      <div className="flex items-center p-4 gap-6">
        <ScoreGauge score={feedback.overallScore} />

        <div>
          <h2 className="text-2xl font-bold">Your Resume Score</h2>
          <p className="text-sm text-gray-500">
            This score is calculated based on the categories below.
          </p>
        </div>
      </div>

      {/* Categories */}
      <Category title="Tone & Style" score={feedback.toneAndStyle.score} />
      <Category title="Content" score={feedback.content.score} />
      <Category title="Structure" score={feedback.structure.score} />
      <Category title="Skills" score={feedback.skills.score} />
    </div>
  );
};

export default Summary;
