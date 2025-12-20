// ABOUTME: Pipeline loading and discovery utilities.
// ABOUTME: Provides loadPipeline() and listPipelines() functions.

import { Pipeline } from './types';
import * as fs from 'fs';
import * as path from 'path';

// Cache loaded pipelines
const pipelineCache = new Map<string, Pipeline>();

// Directory containing pipeline files
const pipelinesDir = path.dirname(__filename);

/**
 * Load a pipeline by name.
 * @param name - Pipeline name (e.g., "default", "critique-steelman")
 * @returns The loaded Pipeline object
 * @throws Error if pipeline not found
 */
export async function loadPipeline(name: string): Promise<Pipeline> {
  // Check cache
  if (pipelineCache.has(name)) {
    return pipelineCache.get(name)!;
  }

  const modulePath = path.join(pipelinesDir, `${name}.ts`);
  const jsModulePath = path.join(pipelinesDir, `${name}.js`);

  // Check if file exists (either .ts or .js)
  const exists = fs.existsSync(modulePath) || fs.existsSync(jsModulePath);
  if (!exists) {
    const available = await listPipelines();
    throw new Error(
      `Pipeline "${name}" not found. Available: ${available.join(', ')}`
    );
  }

  // Dynamic import
  const module = await import(`./${name}`);

  if (!module.pipeline) {
    throw new Error(`Pipeline "${name}" does not export a 'pipeline' object`);
  }

  const pipeline: Pipeline = module.pipeline;
  pipelineCache.set(name, pipeline);

  return pipeline;
}

/**
 * List all available pipeline names.
 * @returns Array of pipeline names
 */
export async function listPipelines(): Promise<string[]> {
  const files = fs.readdirSync(pipelinesDir);

  return files
    .filter(f => (f.endsWith('.ts') || f.endsWith('.js')))
    .filter(f => !f.startsWith('index'))
    .filter(f => !f.startsWith('types'))
    .filter(f => !f.startsWith('utils'))
    .filter(f => !f.startsWith('format'))
    .filter(f => !f.endsWith('.test.ts'))
    .map(f => f.replace(/\.(ts|js)$/, ''));
}

// Re-export types
export type { Pipeline, AnalyzeFn, OnProgress } from './types';
