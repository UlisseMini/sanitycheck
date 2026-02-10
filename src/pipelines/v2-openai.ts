// ABOUTME: Analysis pipeline using the v2 prompt with OpenAI.
// ABOUTME: Temporary pipeline while Anthropic API is unavailable.

import * as fs from 'fs';
import * as path from 'path';
import { Pipeline } from './types';
import { openai } from './utils';

// Load prompt from file
const promptPath = path.join(__dirname, '../../prompts/analysis-v2.md');
const ANALYSIS_PROMPT = fs.readFileSync(promptPath, 'utf-8');

export const pipeline: Pipeline = {
  name: 'v2-openai',
  description: 'Error taxonomy prompt with genre awareness (OpenAI)',

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
