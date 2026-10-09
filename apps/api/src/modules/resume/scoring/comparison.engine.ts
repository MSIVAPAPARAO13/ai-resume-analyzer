import type { ParsedResumeData } from '../parser/section.parser.js';

export interface CareerTwinComparisonResult {
  hasTwin: boolean;
  skills: {
    presentInBoth: string[];
    inTwinOnly: string[];
    inResumeOnly: string[];
  };
  experiences: {
    presentInBoth: Array<{ company: string; title: string }>;
    inTwinOnly: Array<{ company: string; title: string }>;
    inResumeOnly: Array<{ company: string; title: string }>;
  };
  projects: {
    presentInBoth: string[];
    inTwinOnly: string[];
    inResumeOnly: string[];
  };
  education: {
    presentInBoth: string[];
    inTwinOnly: string[];
    inResumeOnly: string[];
  };
  summary: {
    matchRate: number; // percentage of twin skills found in resume
    twinSkillsCount: number;
    resumeSkillsCount: number;
    missingHighValueSkillsCount: number;
  };
}

export class ComparisonEngine {
  compare(
    parsed: ParsedResumeData,
    careerTwin: any,
  ): CareerTwinComparisonResult {
    const parsedSkills = Array.isArray(parsed?.skills) ? parsed.skills : [];
    const parsedExp = Array.isArray(parsed?.experience) ? parsed.experience : [];
    const parsedProjects = Array.isArray(parsed?.projects) ? parsed.projects : [];
    const parsedEdu = Array.isArray(parsed?.education) ? parsed.education : [];

    if (!careerTwin) {
      return {
        hasTwin: false,
        skills: {
          presentInBoth: [],
          inTwinOnly: [],
          inResumeOnly: parsedSkills.map((s: any) => (typeof s === 'string' ? s : s?.name || '')),
        },
        experiences: {
          presentInBoth: [],
          inTwinOnly: [],
          inResumeOnly: parsedExp.map((e: any) => ({
            company: e?.company || '',
            title: e?.title || '',
          })),
        },
        projects: {
          presentInBoth: [],
          inTwinOnly: [],
          inResumeOnly: parsedProjects.map((p: any) => (typeof p === 'string' ? p : p?.name || '')),
        },
        education: {
          presentInBoth: [],
          inTwinOnly: [],
          inResumeOnly: parsedEdu.map((e: any) => (typeof e === 'string' ? e : e?.institution || '')),
        },
        summary: {
          matchRate: 0,
          twinSkillsCount: 0,
          resumeSkillsCount: parsedSkills.length,
          missingHighValueSkillsCount: 0,
        },
      };
    }

    // ─── 1. Skills Comparison ───────────────────────────────────────────────────
    const twinSkills: string[] = (careerTwin.skills || []).map((s: any) =>
      (typeof s === 'string' ? s : s?.name || '').trim(),
    );
    const resumeSkills: string[] = parsedSkills.map((s: any) =>
      (typeof s === 'string' ? s : s?.name || '').trim(),
    );

    const twinSkillsLower = twinSkills.map((s) => s.toLowerCase());
    const resumeSkillsLower = resumeSkills.map((s) => s.toLowerCase());

    const skillsInBoth: string[] = [];
    const skillsInTwinOnly: string[] = [];
    const skillsInResumeOnly: string[] = [];

    for (let i = 0; i < twinSkills.length; i++) {
      const lower = twinSkillsLower[i];
      if (resumeSkillsLower.includes(lower)) {
        skillsInBoth.push(twinSkills[i]);
      } else {
        skillsInTwinOnly.push(twinSkills[i]);
      }
    }

    for (let i = 0; i < resumeSkills.length; i++) {
      const lower = resumeSkillsLower[i];
      if (!twinSkillsLower.includes(lower)) {
        skillsInResumeOnly.push(resumeSkills[i]);
      }
    }

    // ─── 2. Experiences Comparison ──────────────────────────────────────────────
    const twinExp = (careerTwin.experiences || []).map((e: any) => ({
      company: (e?.company || '').trim(),
      title: (e?.title || '').trim(),
    }));
    const resumeExp = parsedExp.map((e: any) => ({
      company: (e?.company || '').trim(),
      title: (e?.title || '').trim(),
    }));

    const expInBoth: Array<{ company: string; title: string }> = [];
    const expInTwinOnly: Array<{ company: string; title: string }> = [];
    const expInResumeOnly: Array<{ company: string; title: string }> = [];

    for (const te of twinExp) {
      const match = resumeExp.find(
        (re) =>
          re.company.toLowerCase().includes(te.company.toLowerCase()) ||
          te.company.toLowerCase().includes(re.company.toLowerCase()),
      );
      if (match) {
        expInBoth.push(te);
      } else {
        expInTwinOnly.push(te);
      }
    }

    for (const re of resumeExp) {
      const match = twinExp.find(
        (te: any) =>
          te.company.toLowerCase().includes(re.company.toLowerCase()) ||
          re.company.toLowerCase().includes(te.company.toLowerCase()),
      );
      if (!match) {
        expInResumeOnly.push(re);
      }
    }

    // ─── 3. Projects Comparison ─────────────────────────────────────────────────
    const twinProjects: string[] = (careerTwin.projects || []).map((p: any) =>
      (typeof p === 'string' ? p : p?.name || '').trim(),
    );
    const resumeProjects: string[] = parsedProjects.map((p: any) =>
      (typeof p === 'string' ? p : p?.name || '').trim(),
    );

    const projInBoth: string[] = [];
    const projInTwinOnly: string[] = [];
    const projInResumeOnly: string[] = [];

    for (const tp of twinProjects) {
      const match = resumeProjects.find(
        (rp) =>
          rp.toLowerCase().includes(tp.toLowerCase()) ||
          tp.toLowerCase().includes(rp.toLowerCase()),
      );
      if (match) {
        projInBoth.push(tp);
      } else {
        projInTwinOnly.push(tp);
      }
    }

    for (const rp of resumeProjects) {
      const match = twinProjects.find(
        (tp) =>
          tp.toLowerCase().includes(rp.toLowerCase()) ||
          rp.toLowerCase().includes(tp.toLowerCase()),
      );
      if (!match) {
        projInResumeOnly.push(rp);
      }
    }

    // ─── 4. Education Comparison ────────────────────────────────────────────────
    const twinEdu: string[] = (careerTwin.education || []).map((e: any) =>
      (typeof e === 'string' ? e : e?.institution || '').trim(),
    );
    const resumeEdu: string[] = parsedEdu.map((e: any) =>
      (typeof e === 'string' ? e : e?.institution || '').trim(),
    );

    const eduInBoth: string[] = [];
    const eduInTwinOnly: string[] = [];
    const eduInResumeOnly: string[] = [];

    for (const te of twinEdu) {
      const match = resumeEdu.find(
        (re) =>
          re.toLowerCase().includes(te.toLowerCase()) ||
          te.toLowerCase().includes(re.toLowerCase()),
      );
      if (match) {
        eduInBoth.push(te);
      } else {
        eduInTwinOnly.push(te);
      }
    }

    for (const re of resumeEdu) {
      const match = twinEdu.find(
        (te) =>
          te.toLowerCase().includes(re.toLowerCase()) ||
          re.toLowerCase().includes(te.toLowerCase()),
      );
      if (!match) {
        eduInResumeOnly.push(re);
      }
    }

    // Summary calculations
    const matchRate =
      twinSkills.length > 0
        ? Math.round((skillsInBoth.length / twinSkills.length) * 100)
        : 100;

    return {
      hasTwin: true,
      skills: {
        presentInBoth: skillsInBoth,
        inTwinOnly: skillsInTwinOnly,
        inResumeOnly: skillsInResumeOnly,
      },
      experiences: {
        presentInBoth: expInBoth,
        inTwinOnly: expInTwinOnly,
        inResumeOnly: expInResumeOnly,
      },
      projects: {
        presentInBoth: projInBoth,
        inTwinOnly: projInTwinOnly,
        inResumeOnly: projInResumeOnly,
      },
      education: {
        presentInBoth: eduInBoth,
        inTwinOnly: eduInTwinOnly,
        inResumeOnly: eduInResumeOnly,
      },
      summary: {
        matchRate,
        twinSkillsCount: twinSkills.length,
        resumeSkillsCount: resumeSkills.length,
        missingHighValueSkillsCount: skillsInTwinOnly.length,
      },
    };
  }
}

export const comparisonEngine = new ComparisonEngine();
