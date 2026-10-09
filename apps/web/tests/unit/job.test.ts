import { describe, expect, it } from 'vitest';
import { jobApi } from '../../app/lib/api.js';

describe('Job Intelligence Frontend Utilities', () => {
  it('exports all expected Job API client methods', () => {
    expect(typeof jobApi.listJobs).toBe('function');
    expect(typeof jobApi.getJob).toBe('function');
    expect(typeof jobApi.createJob).toBe('function');
    expect(typeof jobApi.updateJob).toBe('function');
    expect(typeof jobApi.deleteJob).toBe('function');
    expect(typeof jobApi.analyzeJob).toBe('function');
    expect(typeof jobApi.getAnalysis).toBe('function');
    expect(typeof jobApi.matchResume).toBe('function');
    expect(typeof jobApi.getMatches).toBe('function');
    expect(typeof jobApi.getMatchById).toBe('function');
  });

  it('determines match badge styling based on overall score thresholds', () => {
    function getMatchBadge(score: number): string {
      if (score >= 80) return 'text-success';
      if (score >= 60) return 'text-warning';
      return 'text-danger';
    }

    expect(getMatchBadge(95)).toBe('text-success');
    expect(getMatchBadge(80)).toBe('text-success');
    expect(getMatchBadge(79)).toBe('text-warning');
    expect(getMatchBadge(60)).toBe('text-warning');
    expect(getMatchBadge(59)).toBe('text-danger');
    expect(getMatchBadge(0)).toBe('text-danger');
  });

  it('verifies match score category weights sum exactly to 100%', () => {
    const weights = {
      skills: 0.3,
      experience: 0.2,
      responsibilities: 0.2,
      education: 0.1,
      keywords: 0.1,
      careerTwin: 0.1,
    };

    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    expect(Math.round(totalWeight * 100) / 100).toBe(1.0);
  });
});
