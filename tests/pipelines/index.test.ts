// ABOUTME: Tests for pipeline loading and discovery.
// ABOUTME: Verifies loadPipeline() and listPipelines() work correctly.

import { describe, it, expect } from 'vitest';
import { loadPipeline, listPipelines } from '../../src/pipelines/index';

describe('listPipelines()', () => {
  it('returns array of pipeline names', async () => {
    const pipelines = await listPipelines();

    expect(Array.isArray(pipelines)).toBe(true);
    expect(pipelines).toContain('default');
  });

  it('excludes non-pipeline files', async () => {
    const pipelines = await listPipelines();

    expect(pipelines).not.toContain('index');
    expect(pipelines).not.toContain('types');
    expect(pipelines).not.toContain('utils');
  });
});

describe('loadPipeline()', () => {
  it('loads default pipeline', async () => {
    const pipeline = await loadPipeline('default');

    expect(pipeline.name).toBe('default');
    expect(typeof pipeline.analyze).toBe('function');
  });

  it('throws for unknown pipeline', async () => {
    await expect(loadPipeline('nonexistent'))
      .rejects.toThrow('Pipeline "nonexistent" not found');
  });

  it('error message includes available pipelines', async () => {
    await expect(loadPipeline('nonexistent'))
      .rejects.toThrow('Available:');
  });

  it('caches loaded pipelines', async () => {
    const p1 = await loadPipeline('default');
    const p2 = await loadPipeline('default');

    expect(p1).toBe(p2);
  });
});
