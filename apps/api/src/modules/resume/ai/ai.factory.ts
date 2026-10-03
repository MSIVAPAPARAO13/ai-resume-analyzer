import { env } from '../../../config/env.js';
import type { AIProvider } from './ai.interface.js';
import { MockAIProvider } from './mock-ai.provider.js';
import { GeminiProvider } from './gemini.provider.js';

export function getAIProvider(preferred?: 'GEMINI' | 'MOCK'): AIProvider {
  if (preferred === 'GEMINI' || (!preferred && env.GEMINI_API_KEY)) {
    return new GeminiProvider();
  }
  return new MockAIProvider();
}

export const defaultAIProvider: AIProvider = getAIProvider();
