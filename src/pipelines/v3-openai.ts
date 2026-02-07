// ABOUTME: Analysis pipeline using the v3 prompt with structured argument analysis.
// ABOUTME: Uses OpenAI API with reconstruction/implication checking methodology.

import * as fs from 'fs';
import * as path from 'path';
import { Pipeline } from './types';
import { openai } from './utils';

// Load prompt from file
const promptPath = path.join(__dirname, '../../prompts/analysis-v3.md');
const ANALYSIS_PROMPT = fs.readFileSync(promptPath, 'utf-8');

export const pipeline: Pipeline = {
  name: 'v3-openai',
  description: 'Structured argument reconstruction with implication checks (OpenAI)',

  analyze: async (text, onProgress) => {
    onProgress?.(0);

    const result = await openai(
      [{ role: 'user', content: text }],
      { system: ANALYSIS_PROMPT }
    );

    onProgress?.(100);
    return result;
  }
};
