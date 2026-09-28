import React from 'react';
import { cn } from '~/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
} from './Accordion';

/* ================= TYPES ================= */

type Tip = {
  type: 'good' | 'improve';
  tip: string;
  explanation: string;
};

type Category = {
  score: number;
  tips: Tip[];
};

export interface Feedback {
  toneAndStyle: Category;
  content: Category;
  structure: Category;
  skills: Category;
}

/* ================= SCORE BADGE ================= */

const ScoreBadge = ({ score }: { score: number }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded-full',
        score > 69
          ? 'bg-green-100'
          : score > 39
            ? 'bg-yellow-100'
            : 'bg-red-100',
      )}
    >
      <img
        src={score > 69 ? '/icons/check.svg' : '/icons/warning.svg'}
        className="w-4 h-4"
      />

      <p
        className={cn(
          'text-sm font-medium',
          score > 69
            ? 'text-green-700'
            : score > 39
              ? 'text-yellow-700'
              : 'text-red-700',
        )}
      >
        {score}/100
      </p>
    </div>
  );
};

/* ================= HEADER ================= */

const CategoryHeader = ({
  title,
  categoryScore,
}: {
  title: string;
  categoryScore: number;
}) => {
  return (
    <div className="flex items-center gap-4 py-2">
      <p className="text-xl font-semibold">{title}</p>
      <ScoreBadge score={categoryScore} />
    </div>
  );
};

/* ================= CONTENT ================= */

const CategoryContent = ({ tips }: { tips: Tip[] }) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Quick Tips */}
      <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3">
        {tips.map((tip, index) => (
          <div key={index} className="flex items-center gap-2">
            <img
              src={
                tip.type === 'good' ? '/icons/check.svg' : '/icons/warning.svg'
              }
              className="w-5 h-5"
            />
            <p className="text-gray-600">{tip.tip}</p>
          </div>
        ))}
      </div>

      {/* Detailed Explanation */}
      <div className="flex flex-col gap-3">
        {tips.map((tip, index) => (
          <div
            key={index}
            className={cn(
              'p-4 rounded-xl border',
              tip.type === 'good'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-yellow-50 border-yellow-200 text-yellow-700',
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <img
                src={
                  tip.type === 'good'
                    ? '/icons/check.svg'
                    : '/icons/warning.svg'
                }
                className="w-5 h-5"
              />
              <p className="font-semibold">{tip.tip}</p>
            </div>

            <p className="text-sm">{tip.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */

const Details = ({ feedback }: { feedback: Feedback }) => {
  return (
    <div className="w-full flex flex-col gap-4">
      <Accordion>
        <AccordionItem id="tone">
          <AccordionHeader itemId="tone">
            <CategoryHeader
              title="Tone & Style"
              categoryScore={feedback.toneAndStyle.score}
            />
          </AccordionHeader>

          <AccordionContent itemId="tone">
            <CategoryContent tips={feedback.toneAndStyle.tips} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem id="content">
          <AccordionHeader itemId="content">
            <CategoryHeader
              title="Content"
              categoryScore={feedback.content.score}
            />
          </AccordionHeader>

          <AccordionContent itemId="content">
            <CategoryContent tips={feedback.content.tips} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem id="structure">
          <AccordionHeader itemId="structure">
            <CategoryHeader
              title="Structure"
              categoryScore={feedback.structure.score}
            />
          </AccordionHeader>

          <AccordionContent itemId="structure">
            <CategoryContent tips={feedback.structure.tips} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem id="skills">
          <AccordionHeader itemId="skills">
            <CategoryHeader
              title="Skills"
              categoryScore={feedback.skills.score}
            />
          </AccordionHeader>

          <AccordionContent itemId="skills">
            <CategoryContent tips={feedback.skills.tips} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Details;
