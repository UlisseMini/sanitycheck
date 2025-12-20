// ABOUTME: Type tests for pipeline interfaces.
// ABOUTME: Verifies the Pipeline type works as expected.

import { describe, it, expect } from 'vitest';
import type { Pipeline, AnalyzeFn, OnProgress } from '../../src/pipelines/types';

describe('Pipeline types', () => {
  it('Pipeline interface accepts valid implementation', () => {
    const mockPipeline: Pipeline = {
      name: 'test',
      description: 'A test pipeline',
      analyze: async (text: string, onProgress?: OnProgress) => {
        onProgress?.(50);
        return `Analyzed: ${text.slice(0, 10)}`;
      }
    };

    expect(mockPipeline.name).toBe('test');
    expect(mockPipeline.description).toBe('A test pipeline');
    expect(typeof mockPipeline.analyze).toBe('function');
  });

  it('AnalyzeFn works without onProgress', async () => {
    const fn: AnalyzeFn = async (text) => `Result: ${text}`;
    const result = await fn('hello');
    expect(result).toBe('Result: hello');
  });

  it('AnalyzeFn works with onProgress', async () => {
    const progressValues: number[] = [];
    const fn: AnalyzeFn = async (text, onProgress) => {
      onProgress?.(0);
      onProgress?.(100);
      return text;
    };

    await fn('test', (p) => progressValues.push(p));
    expect(progressValues).toEqual([0, 100]);
  });
});
