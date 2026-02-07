// ABOUTME: Analysis pipeline using the v2 prompt with error taxonomy.
// ABOUTME: Reads prompt from prompts/analysis-v2.md.

import * as fs from 'fs';
import * as path from 'path';
import { Pipeline } from './types';
import { claude } from './utils';

// Load prompt from file
const promptPath = path.join(__dirname, '../../prompts/analysis-v2.md');
const ANALYSIS_PROMPT = fs.readFileSync(promptPath, 'utf-8');

export const pipeline: Pipeline = {
  name: 'v2',
  description: 'Error taxonomy prompt with genre awareness',

  analyze: async (text, onProgress) => {
    onProgress?.(0);

    const result = await claude(
      [{ role: 'user', content: text }],
      { system: ANALYSIS_PROMPT }
    );

    onProgress?.(100);
    return result;
  }
};
