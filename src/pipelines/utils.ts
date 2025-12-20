// ABOUTME: Utility functions for pipelines.
// ABOUTME: Provides claude() helper for calling the Anthropic API.

import Anthropic from '@anthropic-ai/sdk';

/**
 * Message format for Claude conversations.
 */
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Options for claude() calls.
 */
export interface ClaudeOptions {
  /** System prompt */
  system?: string;
  /** Model to use (defaults to claude-sonnet-4-20250514) */
  model?: string;
  /** Temperature (defaults to 0.3) */
  temperature?: number;
  /** Max tokens (defaults to 8192) */
  maxTokens?: number;
  /** Extended thinking configuration */
  thinking?: {
    enabled: boolean;
    budgetTokens?: number;
  };
}

/**
 * Call Claude with messages and options.
 * Returns the text response.
 */
export async function claude(
  messages: ClaudeMessage[],
  options: ClaudeOptions = {}
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const client = new Anthropic({ apiKey });

  const {
    system,
    model = 'claude-sonnet-4-20250514',
    temperature = 0.3,
    maxTokens = 8192,
    thinking,
  } = options;

  // Build request params
  const params: Anthropic.MessageCreateParams = {
    model,
    max_tokens: maxTokens,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  };

  // Add system prompt if provided
  if (system) {
    params.system = system;
  }

  // Handle thinking vs temperature (mutually exclusive in API)
  if (thinking?.enabled) {
    // Extended thinking requires specific setup
    params.thinking = {
      type: 'enabled',
      budget_tokens: thinking.budgetTokens || 4096,
    };
  } else {
    params.temperature = temperature;
  }

  const response = await client.messages.create(params);

  // Extract text from response
  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text;
}
