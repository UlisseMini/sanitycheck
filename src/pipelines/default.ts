// ABOUTME: Default analysis pipeline using single-prompt approach.
// ABOUTME: This is the current production analysis method.

import { Pipeline } from './types';
import { claude } from './utils';
import { DEFAULT_ANALYSIS_PROMPT } from '../shared/constants';

export const pipeline: Pipeline = {
  name: 'default',
  description: 'Single-prompt analysis (current production approach)',

  analyze: async (text, onProgress) => {
    onProgress?.(0);

    const result = await claude(
      [{ role: 'user', content: text }],
      { system: DEFAULT_ANALYSIS_PROMPT }
    );

    onProgress?.(100);
    return result;
  }
};
