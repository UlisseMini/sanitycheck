// ABOUTME: Tests for the default pipeline.
// ABOUTME: Verifies single-prompt analysis works correctly.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the utils module
vi.mock('../../src/pipelines/utils', () => ({
  claude: vi.fn().mockResolvedValue('{"issues": [], "severity": "none"}')
}));

import { pipeline } from '../../src/pipelines/default';
import { claude } from '../../src/pipelines/utils';

describe('default pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct metadata', () => {
    expect(pipeline.name).toBe('default');
    expect(pipeline.description).toContain('Single-prompt');
  });

  it('calls claude with article text', async () => {
    await pipeline.analyze('Test article content');

    expect(claude).toHaveBeenCalledWith(
      [{ role: 'user', content: 'Test article content' }],
      expect.objectContaining({ system: expect.any(String) })
    );
  });

  it('returns claude response', async () => {
    const result = await pipeline.analyze('Test');
    expect(result).toBe('{"issues": [], "severity": "none"}');
  });

  it('reports progress at 0 and 100', async () => {
    const progress: number[] = [];
    await pipeline.analyze('Test', (p) => progress.push(p));

    expect(progress).toEqual([0, 100]);
  });
});
