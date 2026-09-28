import { describe, expect, it } from 'vitest';
import { formatSize, generateUUID } from '../../app/lib/utils';
import { prepareInstructions } from '../../app/constants';

describe('Frontend Foundation Smoke Test', () => {
  it('formats file sizes accurately', () => {
    expect(formatSize(1024)).toBe('1 KB');
    expect(formatSize(1024 * 1024)).toBe('1 MB');
  });

  it('generates valid UUIDs', () => {
    const uuid = generateUUID();
    expect(uuid).toBeDefined();
    expect(typeof uuid).toBe('string');
    expect(uuid.length).toBeGreaterThan(10);
  });

  it('prepares structured AI instructions containing job details', () => {
    const prompt = prepareInstructions({
      jobTitle: 'Senior Full Stack Engineer',
      jobDescription: 'Expertise in TypeScript and React required',
    });
    expect(prompt).toContain('Senior Full Stack Engineer');
    expect(prompt).toContain('Expertise in TypeScript and React required');
    expect(prompt).toContain('overallScore');
  });
});
