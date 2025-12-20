// ABOUTME: Formats free-form analysis text into structured JSON for the extension.
// ABOUTME: Uses Haiku with structured output (tool use) to convert analysis text to the expected schema.

import Anthropic from '@anthropic-ai/sdk';

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

const FORMAT_TOOL: Anthropic.Tool = {
  name: 'format_analysis',
  description: 'Format the analysis into structured JSON for display in the extension.',
  input_schema: {
    type: 'object' as const,
    properties: {
      central_argument_analysis: {
        type: 'object',
        properties: {
          main_conclusion: {
            type: 'string',
            description: '1 sentence summary of the article\'s main claim'
          },
          central_logical_gap: {
            type: ['string', 'null'],
            description: '1-2 sentences on the main structural weakness. null if no significant issues found.'
          }
        },
        required: ['main_conclusion', 'central_logical_gap']
      },
      issues: {
        type: 'array',
        description: 'List of specific issues found. Empty array if no issues.',
        items: {
          type: 'object',
          properties: {
            importance: {
              type: 'string',
              enum: ['critical', 'significant', 'minor']
            },
            quote: {
              type: 'string',
              description: 'Exact quote from the article (20-60 words)'
            },
            gap: {
              type: 'string',
              description: 'Brief explanation of the logical gap (<15 words)'
            }
          },
          required: ['importance', 'quote', 'gap']
        }
      },
      severity: {
        type: 'string',
        enum: ['none', 'minor', 'moderate', 'significant'],
        description: 'Overall severity. Use "none" if no real issues found.'
      }
    },
    required: ['central_argument_analysis', 'issues', 'severity']
  }
};

const FORMAT_PROMPT = `Convert the following analysis into structured format using the format_analysis tool.

Important:
- If the analysis found no issues, set central_logical_gap to null, issues to an empty array, and severity to "none"
- Extract exact quotes from the original article text mentioned in the analysis
- Keep gap explanations brief and punchy

Analysis to format:
`;

/**
 * Format free-form analysis text into structured JSON.
 * Uses Claude Haiku with tool use for guaranteed schema compliance.
 */
export async function formatForExtension(analysisText: string, originalText: string): Promise<StructuredAnalysis> {
  // If the analysis is already JSON, try to parse it directly
  try {
    const parsed = JSON.parse(analysisText);
    if (parsed.issues && parsed.severity) {
      return parsed as StructuredAnalysis;
    }
  } catch {
    // Not JSON, need to format it
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    tools: [FORMAT_TOOL],
    tool_choice: { type: 'tool', name: 'format_analysis' },
    messages: [
      { role: 'user', content: FORMAT_PROMPT + analysisText + '\n\nORIGINAL ARTICLE:\n' + originalText }
    ]
  });

  // Extract the tool use block
  const toolUseBlock = response.content.find(block => block.type === 'tool_use');
  if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
    throw new Error('No tool use in response');
  }

  return toolUseBlock.input as StructuredAnalysis;
}
