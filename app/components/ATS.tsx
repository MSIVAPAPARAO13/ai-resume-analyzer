import React from 'react';

// 1. Suggestion Type
interface Suggestion {
  type: 'good' | 'improve';
  tip: string;
}

// 2. Props for ATS Component
interface ATSProps {
  score: number;
  suggestions: Suggestion[];
}

// 3. ATS Component
const ATS: React.FC<ATSProps> = ({ score, suggestions }) => {
  // Gradient based on score
  const gradientClass =
    score > 69
      ? 'from-green-100'
      : score > 49
        ? 'from-yellow-100'
        : 'from-red-100';

  // Icon based on score
  const iconSrc =
    score > 69
      ? '/icons/ats-good.svg'
      : score > 49
        ? '/icons/ats-warning.svg'
        : '/icons/ats-bad.svg';

  // Subtitle based on score
  const subtitle =
    score > 69 ? 'Great Job!' : score > 49 ? 'Good Start' : 'Needs Improvement';

  return (
    <div
      className={`bg-gradient-to-b ${gradientClass} to-white rounded-2xl shadow-md w-full p-6`}
    >
      {/* Top section */}
      <div className="flex items-center gap-4 mb-6">
        <img src={iconSrc} alt="ATS Score Icon" className="w-12 h-12" />
        <h2 className="text-2xl font-bold">ATS Score - {score}/100</h2>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">{subtitle}</h3>

        <p className="text-gray-600 mb-4">
          This score represents how well your resume performs in ATS systems.
        </p>

        {/* Suggestions */}
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-3">
              <img
                src={
                  suggestion.type === 'good'
                    ? '/icons/check.svg'
                    : '/icons/warning.svg'
                }
                alt="icon"
                className="w-5 h-5 mt-1"
              />

              <p
                className={
                  suggestion.type === 'good'
                    ? 'text-green-700'
                    : 'text-amber-700'
                }
              >
                {suggestion.tip}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-gray-700 italic">
        Keep improving your resume to pass ATS filters.
      </p>
    </div>
  );
};

export default ATS;
