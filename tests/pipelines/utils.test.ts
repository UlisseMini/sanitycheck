// ABOUTME: Tests for pipeline utilities.
// ABOUTME: Tests claude() helper with mocked Anthropic client.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mock before any imports
const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
      constructor(_options: { apiKey: string }) {}
    }
  };
});

// Set env var before importing
process.env.ANTHROPIC_API_KEY = 'test-key';

import { claude, ClaudeMessage } from '../../src/pipelines/utils';

describe('claude()', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Mock response' }]
    });
  });

  it('calls Anthropic API with messages', async () => {
    const messages: ClaudeMessage[] = [{ role: 'user', content: 'Hello' }];
    const result = await claude(messages);

    expect(result).toBe('Mock response');
    expect(mockCreate).toHaveBeenCalled();
  });

  it('passes system prompt when provided', async () => {
    const messages: ClaudeMessage[] = [{ role: 'user', content: 'Hello' }];
    await claude(messages, { system: 'You are helpful' });

    const createCall = mockCreate.mock.calls[0][0];
    expect(createCall.system).toBe('You are helpful');
  });

  it('uses default model and temperature', async () => {
    const messages: ClaudeMessage[] = [{ role: 'user', content: 'Hello' }];
    await claude(messages);

    const createCall = mockCreate.mock.calls[0][0];
    expect(createCall.model).toBe('claude-sonnet-4-20250514');
    expect(createCall.temperature).toBe(0.3);
    expect(createCall.max_tokens).toBe(8192);
  });

  it('accepts custom options', async () => {
    const messages: ClaudeMessage[] = [{ role: 'user', content: 'Hello' }];
    await claude(messages, {
      model: 'claude-haiku-3',
      temperature: 0.7,
      maxTokens: 1000
    });

    const createCall = mockCreate.mock.calls[0][0];
    expect(createCall.model).toBe('claude-haiku-3');
    expect(createCall.temperature).toBe(0.7);
    expect(createCall.max_tokens).toBe(1000);
  });

  it('enables thinking when configured', async () => {
    const messages: ClaudeMessage[] = [{ role: 'user', content: 'Hello' }];
    await claude(messages, {
      thinking: { enabled: true, budgetTokens: 8000 }
    });

    const createCall = mockCreate.mock.calls[0][0];
    expect(createCall.thinking).toEqual({
      type: 'enabled',
      budget_tokens: 8000
    });
    expect(createCall.temperature).toBeUndefined();
  });
});

describe('claude() error handling', () => {
  it('throws if no ANTHROPIC_API_KEY', async () => {
    const originalKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    await expect(claude([{ role: 'user', content: 'hi' }]))
      .rejects.toThrow('ANTHROPIC_API_KEY');

    process.env.ANTHROPIC_API_KEY = originalKey;
  });
});
