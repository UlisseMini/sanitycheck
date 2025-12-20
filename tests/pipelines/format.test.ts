// ABOUTME: Tests for the format helper.
// ABOUTME: Verifies formatForExtension() handles various input formats.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Anthropic SDK
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

import { formatForExtension } from '../../src/pipelines/format';

describe('formatForExtension()', () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  it('passes through valid JSON directly without calling API', async () => {
    const validJson = JSON.stringify({
      central_argument_analysis: {
        main_conclusion: 'Test',
        central_logical_gap: null
      },
      issues: [],
      severity: 'none'
    });

    const result = await formatForExtension(validJson);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(result.severity).toBe('none');
    expect(result.issues).toEqual([]);
  });

  it('calls Haiku with tool use for free-form text', async () => {
    mockCreate.mockResolvedValue({
      content: [{
        type: 'tool_use',
        id: 'test-id',
        name: 'format_analysis',
        input: {
          central_argument_analysis: {
            main_conclusion: 'Formatted conclusion',
            central_logical_gap: 'Some gap'
          },
          issues: [{
            importance: 'significant',
            quote: 'Test quote',
            gap: 'Test gap'
          }],
          severity: 'moderate'
        }
      }]
    });

    const result = await formatForExtension('This is a free-form analysis...');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-haiku-4-5-20251001',
        tools: expect.any(Array),
        tool_choice: { type: 'tool', name: 'format_analysis' }
      })
    );
    expect(result.severity).toBe('moderate');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].quote).toBe('Test quote');
  });

  it('handles analysis with no issues', async () => {
    mockCreate.mockResolvedValue({
      content: [{
        type: 'tool_use',
        id: 'test-id',
        name: 'format_analysis',
        input: {
          central_argument_analysis: {
            main_conclusion: 'Article claims X',
            central_logical_gap: null
          },
          issues: [],
          severity: 'none'
        }
      }]
    });

    const result = await formatForExtension('This article has no logical issues...');

    expect(result.severity).toBe('none');
    expect(result.issues).toEqual([]);
    expect(result.central_argument_analysis.central_logical_gap).toBeNull();
  });

  it('throws if no tool use in response', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Some text response' }]
    });

    await expect(formatForExtension('Some analysis'))
      .rejects.toThrow('No tool use in response');
  });
});
