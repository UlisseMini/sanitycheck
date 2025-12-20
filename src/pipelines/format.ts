// ABOUTME: Formats free-form analysis text into structured JSON for the extension.
// ABOUTME: Uses haiku to convert analysis text to the expected schema.

import { claude } from './utils';

export interface AnalysisIssue {
  importance: 'critical' | 'significant' | 'minor';
  quote: string;
  gap: string;
}

export interface StructuredAnalysis {
  central_argument_analysis: {
    main_conclusion: string;
    central_logical_gap: string | null;
  };
  issues: AnalysisIssue[];
  severity: 'none' | 'minor' | 'moderate' | 'significant';
}

const FORMAT_PROMPT = `Convert the following analysis into structured JSON format.

Output ONLY valid JSON matching this schema:
{
  "central_argument_analysis": {
    "main_conclusion": "1 sentence summary of the article's main claim",
    "central_logical_gap": "1-2 sentences on the main weakness, or null if none"
  },
  "issues": [
    {
      "importance": "critical|significant|minor",
      "quote": "exact quote from article (20-60 words)",
      "gap": "brief explanation (<15 words)"
    }
  ],
  "severity": "none|minor|moderate|significant"
}

Analysis to format:
`;

/**
 * Format free-form analysis text into structured JSON.
 * Uses Claude haiku for fast, cheap conversion.
 */
export async function formatForExtension(analysisText: string): Promise<StructuredAnalysis> {
  // If the analysis is already JSON, try to parse it directly
  try {
    const parsed = JSON.parse(analysisText);
    if (parsed.issues && parsed.severity) {
      return parsed as StructuredAnalysis;
    }
  } catch {
    // Not JSON, need to format it
  }

  const result = await claude(
    [{ role: 'user', content: FORMAT_PROMPT + analysisText }],
    {
      model: 'claude-haiku-3-5-sonnet-20241022', // Fast and cheap
      temperature: 0.1,
      maxTokens: 2000
    }
  );

  // Extract JSON from response (may be wrapped in markdown)
  const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch?.[1]?.trim() ?? result.trim();

  return JSON.parse(jsonStr) as StructuredAnalysis;
}
