// ABOUTME: Tests for the format helper.
// ABOUTME: Verifies formatForExtension() handles various input formats.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/pipelines/utils', () => ({
  claude: vi.fn()
}));

import { formatForExtension } from '../../src/pipelines/format';
import { claude } from '../../src/pipelines/utils';

describe('formatForExtension()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes through valid JSON directly', async () => {
    const validJson = JSON.stringify({
      central_argument_analysis: {
        main_conclusion: 'Test',
        central_logical_gap: null
      },
      issues: [],
      severity: 'none'
    });

    const result = await formatForExtension(validJson);

    expect(claude).not.toHaveBeenCalled();
    expect(result.severity).toBe('none');
  });

  it('calls haiku for free-form text', async () => {
    (claude as ReturnType<typeof vi.fn>).mockResolvedValue(JSON.stringify({
      central_argument_analysis: {
        main_conclusion: 'Formatted',
        central_logical_gap: null
      },
      issues: [],
      severity: 'minor'
    }));

    const result = await formatForExtension('This is a free-form analysis...');

    expect(claude).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ model: expect.stringContaining('haiku') })
    );
    expect(result.severity).toBe('minor');
  });

  it('extracts JSON from markdown code blocks', async () => {
    (claude as ReturnType<typeof vi.fn>).mockResolvedValue('```json\n{"issues":[],"severity":"none","central_argument_analysis":{"main_conclusion":"x","central_logical_gap":null}}\n```');

    const result = await formatForExtension('Some analysis');

    expect(result.severity).toBe('none');
  });
});
