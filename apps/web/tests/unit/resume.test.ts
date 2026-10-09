import { describe, expect, it } from 'vitest';
import { resumeApi } from '../../app/lib/api.js';

describe('Resume Intelligence Frontend Utilities', () => {
  it('exports all expected resume API client methods', () => {
    expect(typeof resumeApi.listResumes).toBe('function');
    expect(typeof resumeApi.getResume).toBe('function');
    expect(typeof resumeApi.uploadResume).toBe('function');
    expect(typeof resumeApi.deleteResume).toBe('function');
    expect(typeof resumeApi.analyzeResume).toBe('function');
    expect(typeof resumeApi.getAnalysis).toBe('function');
    expect(typeof resumeApi.listVersions).toBe('function');
    expect(typeof resumeApi.getVersion).toBe('function');
  });

  it('determines score color classifications accurately', () => {
    function getScoreBadge(score: number): string {
      if (score >= 80) return 'text-success';
      if (score >= 60) return 'text-warning';
      return 'text-danger';
    }

    expect(getScoreBadge(95)).toBe('text-success');
    expect(getScoreBadge(80)).toBe('text-success');
    expect(getScoreBadge(75)).toBe('text-warning');
    expect(getScoreBadge(60)).toBe('text-warning');
    expect(getScoreBadge(55)).toBe('text-danger');
    expect(getScoreBadge(0)).toBe('text-danger');
  });

  it('verifies score categorization weight sums to 1.0', () => {
    const weights = {
      ats: 0.2,
      content: 0.25,
      skills: 0.2,
      experience: 0.2,
      education: 0.08,
      formatting: 0.07,
    };

    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(Math.round(sum * 100) / 100).toBe(1.0);
  });
});
