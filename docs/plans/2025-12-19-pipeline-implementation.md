# Pipeline Abstraction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a modular analysis pipeline system with CLI runner for iterating on analysis strategies.

**Architecture:** Pipelines are self-contained modules exporting an `analyze(text, onProgress?) => Promise<string>` function. A CLI runner executes pipelines in parallel against article directories. The backend uses pipelines instead of raw API calls.

**Tech Stack:** TypeScript, `@anthropic-ai/sdk`, vitest for testing

---

## Task 1: Install Anthropic SDK

**Files:**
- Modify: `package.json`

**Step 1: Install the SDK**

Run:
```bash
npm install @anthropic-ai/sdk
```

**Step 2: Verify installation**

Run:
```bash
npm ls @anthropic-ai/sdk
```
Expected: Shows `@anthropic-ai/sdk@<version>`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add @anthropic-ai/sdk"
```

---

## Task 2: Create Pipeline Types

**Files:**
- Create: `src/pipelines/types.ts`
- Test: `tests/pipelines/types.test.ts`

**Step 1: Write the types file**

```typescript
// ABOUTME: Type definitions for analysis pipelines.
// ABOUTME: Defines the Pipeline interface and AnalyzeFn type.

/**
 * Progress callback for multi-step pipelines.
 * @param percent - Progress percentage (0-100)
 */
export type OnProgress = (percent: number) => void;

/**
 * Core analysis function signature.
 * Takes article text, optionally reports progress, returns analysis text.
 */
export type AnalyzeFn = (
  text: string,
  onProgress?: OnProgress
) => Promise<string>;

/**
 * Pipeline module interface.
 * Each pipeline file exports an object conforming to this interface.
 */
export interface Pipeline {
  /** Unique identifier matching the filename (e.g., "default", "critique-steelman") */
  name: string;
  /** Human-readable description of what this pipeline does */
  description: string;
  /** The analysis function */
  analyze: AnalyzeFn;
}
```

**Step 2: Write a basic type test**

```typescript
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
```

**Step 3: Run test to verify it passes**

Run: `npm test -- tests/pipelines/types.test.ts`
Expected: PASS (3 tests)

**Step 4: Commit**

```bash
git add src/pipelines/types.ts tests/pipelines/types.test.ts
git commit -m "feat(pipelines): add Pipeline and AnalyzeFn types"
```

---

## Task 3: Create Claude Helper Utility

**Files:**
- Create: `src/pipelines/utils.ts`
- Test: `tests/pipelines/utils.test.ts`

**Step 1: Write the claude helper**

```typescript
// ABOUTME: Utility functions for pipelines.
// ABOUTME: Provides claude() helper for calling the Anthropic API.

import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

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
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

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
```

**Step 2: Write tests (mocking the API)**

```typescript
// ABOUTME: Tests for pipeline utilities.
// ABOUTME: Tests claude() helper with mocked Anthropic client.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Anthropic SDK before importing utils
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Mock response' }]
        })
      }
    }))
  };
});

// Set env var before importing
process.env.ANTHROPIC_API_KEY = 'test-key';

import { claude, ClaudeMessage, ClaudeOptions } from '../../src/pipelines/utils';
import Anthropic from '@anthropic-ai/sdk';

describe('claude()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls Anthropic API with messages', async () => {
    const messages: ClaudeMessage[] = [{ role: 'user', content: 'Hello' }];
    const result = await claude(messages);

    expect(result).toBe('Mock response');
    expect(Anthropic).toHaveBeenCalledWith({ apiKey: 'test-key' });
  });

  it('passes system prompt when provided', async () => {
    const messages: ClaudeMessage[] = [{ role: 'user', content: 'Hello' }];
    await claude(messages, { system: 'You are helpful' });

    const mockInstance = (Anthropic as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
    const createCall = mockInstance.messages.create.mock.calls[0][0];

    expect(createCall.system).toBe('You are helpful');
  });

  it('uses default model and temperature', async () => {
    const messages: ClaudeMessage[] = [{ role: 'user', content: 'Hello' }];
    await claude(messages);

    const mockInstance = (Anthropic as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
    const createCall = mockInstance.messages.create.mock.calls[0][0];

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

    const mockInstance = (Anthropic as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
    const createCall = mockInstance.messages.create.mock.calls[0][0];

    expect(createCall.model).toBe('claude-haiku-3');
    expect(createCall.temperature).toBe(0.7);
    expect(createCall.max_tokens).toBe(1000);
  });

  it('enables thinking when configured', async () => {
    const messages: ClaudeMessage[] = [{ role: 'user', content: 'Hello' }];
    await claude(messages, {
      thinking: { enabled: true, budgetTokens: 8000 }
    });

    const mockInstance = (Anthropic as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
    const createCall = mockInstance.messages.create.mock.calls[0][0];

    expect(createCall.thinking).toEqual({
      type: 'enabled',
      budget_tokens: 8000
    });
    expect(createCall.temperature).toBeUndefined();
  });
});

describe('claude() error handling', () => {
  it('throws if no ANTHROPIC_API_KEY', async () => {
    // Temporarily remove the key
    const originalKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    // Re-import to get fresh module
    vi.resetModules();
    vi.mock('@anthropic-ai/sdk', () => ({
      default: vi.fn()
    }));

    const { claude: freshClaude } = await import('../../src/pipelines/utils');

    await expect(freshClaude([{ role: 'user', content: 'hi' }]))
      .rejects.toThrow('ANTHROPIC_API_KEY');

    // Restore
    process.env.ANTHROPIC_API_KEY = originalKey;
  });
});
```

**Step 3: Run tests**

Run: `npm test -- tests/pipelines/utils.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/pipelines/utils.ts tests/pipelines/utils.test.ts
git commit -m "feat(pipelines): add claude() helper using Anthropic SDK"
```

---

## Task 4: Create Default Pipeline

**Files:**
- Create: `src/pipelines/default.ts`
- Test: `tests/pipelines/default.test.ts`

**Step 1: Write the default pipeline**

```typescript
// ABOUTME: Default analysis pipeline using single-prompt approach.
// ABOUTME: This is the current production analysis method.

import { Pipeline } from './types';
import { claude } from './utils';
import { DEFAULT_ANALYSIS_PROMPT } from '../shared/constants';

export const pipeline: Pipeline = {
  name: 'default',
  description: 'Single-prompt analysis (current production approach)',

  analyze: async (text, onProgress) => {
    onProgress?.(0);

    const result = await claude(
      [{ role: 'user', content: text }],
      { system: DEFAULT_ANALYSIS_PROMPT }
    );

    onProgress?.(100);
    return result;
  }
};
```

**Step 2: Write tests (mocking claude)**

```typescript
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
```

**Step 3: Run tests**

Run: `npm test -- tests/pipelines/default.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/pipelines/default.ts tests/pipelines/default.test.ts
git commit -m "feat(pipelines): add default single-prompt pipeline"
```

---

## Task 5: Create Pipeline Loader

**Files:**
- Create: `src/pipelines/index.ts`
- Test: `tests/pipelines/index.test.ts`

**Step 1: Write the pipeline loader**

```typescript
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
```

**Step 2: Write tests**

```typescript
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
```

**Step 3: Run tests**

Run: `npm test -- tests/pipelines/index.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/pipelines/index.ts tests/pipelines/index.test.ts
git commit -m "feat(pipelines): add loadPipeline() and listPipelines()"
```

---

## Task 6: Create CLI Runner Script

**Files:**
- Create: `scripts/run-pipeline.ts`
- Modify: `package.json` (add script)

**Step 1: Write the CLI runner**

```typescript
#!/usr/bin/env npx tsx
// ABOUTME: CLI runner for testing analysis pipelines on article directories.
// ABOUTME: Usage: npm run pipeline <name> <articles-dir> [--output-dir=<path>] [--parallel=<N>]

import * as fs from 'fs';
import * as path from 'path';
import { loadPipeline, listPipelines } from '../src/pipelines/index';

// Parse command line arguments
function parseArgs(args: string[]): {
  pipelineName: string;
  articlesDir: string;
  outputDir?: string;
  parallel: number;
} {
  const positional: string[] = [];
  let outputDir: string | undefined;
  let parallel = 5;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--output-dir=')) {
      outputDir = arg.split('=')[1];
    } else if (arg === '--output-dir') {
      outputDir = args[++i];
    } else if (arg.startsWith('--parallel=')) {
      parallel = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--parallel') {
      parallel = parseInt(args[++i], 10);
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }

  if (positional.length < 2) {
    return { pipelineName: '', articlesDir: '', parallel };
  }

  return {
    pipelineName: positional[0],
    articlesDir: positional[1],
    outputDir,
    parallel
  };
}

// Log to stderr
function log(msg: string): void {
  process.stderr.write(msg + '\n');
}

// Print result to stdout
function output(msg: string): void {
  process.stdout.write(msg + '\n');
}

// Read all article files from directory
function readArticles(dir: string): { name: string; text: string }[] {
  const absDir = path.resolve(dir);

  if (!fs.existsSync(absDir)) {
    throw new Error(`Directory not found: ${absDir}`);
  }

  const files = fs.readdirSync(absDir)
    .filter(f => f.endsWith('.md') || f.endsWith('.txt'))
    .sort();

  return files.map(f => ({
    name: f,
    text: fs.readFileSync(path.join(absDir, f), 'utf-8')
  }));
}

// Format duration
function formatDuration(ms: number): string {
  return (ms / 1000).toFixed(1) + 's';
}

// Main runner
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Show usage if missing args
  if (!args.pipelineName || !args.articlesDir) {
    const available = await listPipelines();
    log('Usage: npm run pipeline <pipeline-name> <articles-dir> [--output-dir=<path>] [--parallel=<N>]');
    log('');
    log('Available pipelines:');
    for (const name of available) {
      log(`  - ${name}`);
    }
    process.exit(1);
  }

  // Load pipeline
  const pipeline = await loadPipeline(args.pipelineName);
  log(`Pipeline: ${pipeline.name} - ${pipeline.description}`);

  // Read articles
  const articles = readArticles(args.articlesDir);
  log(`Articles: ${articles.length} file(s)`);
  log(`Parallel: ${args.parallel}`);
  log('');

  // Create output dir if needed
  if (args.outputDir) {
    fs.mkdirSync(args.outputDir, { recursive: true });
  }

  // Track results in order
  const results: Map<number, { name: string; analysis: string; duration: number }> = new Map();
  let nextToPrint = 0;

  // Print buffered results in order
  function flushResults(): void {
    while (results.has(nextToPrint)) {
      const r = results.get(nextToPrint)!;
      output('════════════════════════════════════════════════════════════');
      output(r.name);
      output('════════════════════════════════════════════════════════════');
      output(r.analysis);
      output('');

      // Write to file if output dir specified
      if (args.outputDir) {
        const baseName = r.name.replace(/\.(md|txt)$/, '');
        const outPath = path.join(args.outputDir, `${baseName}.analysis.md`);
        fs.writeFileSync(outPath, r.analysis);
      }

      nextToPrint++;
    }
  }

  // Process articles with controlled parallelism
  const total = articles.length;
  let completed = 0;
  let running = 0;
  let nextIndex = 0;

  await new Promise<void>((resolve, reject) => {
    function startNext(): void {
      while (running < args.parallel && nextIndex < total) {
        const idx = nextIndex++;
        const article = articles[idx];
        running++;

        log(`[${idx + 1}/${total}] analyzing ${article.name}...`);
        const startTime = Date.now();

        pipeline.analyze(article.text)
          .then(analysis => {
            const duration = Date.now() - startTime;
            log(`[${idx + 1}/${total}] ${article.name} done (${formatDuration(duration)})`);

            results.set(idx, { name: article.name, analysis, duration });
            flushResults();

            completed++;
            running--;

            if (completed === total) {
              resolve();
            } else {
              startNext();
            }
          })
          .catch(err => {
            log(`[${idx + 1}/${total}] ${article.name} FAILED: ${err.message}`);
            running--;
            reject(err);
          });
      }
    }

    startNext();

    // Handle empty array
    if (total === 0) {
      resolve();
    }
  });

  log('');
  log(`Done. ${completed}/${total} articles analyzed.`);

  if (args.outputDir) {
    log(`Results written to: ${args.outputDir}`);
  }
}

main().catch(err => {
  log(`Error: ${err.message}`);
  process.exit(1);
});
```

**Step 2: Add npm script to package.json**

Add to `scripts` section:
```json
"pipeline": "npx tsx scripts/run-pipeline.ts"
```

**Step 3: Test the script runs (help output)**

Run: `npm run pipeline`
Expected: Shows usage and lists "default" as available pipeline

**Step 4: Commit**

```bash
git add scripts/run-pipeline.ts package.json
git commit -m "feat(pipelines): add CLI runner for pipeline testing"
```

---

## Task 7: Clean Up Old Files

**Files:**
- Delete: `prompts/default.txt`
- Delete: `scripts/test-prompt.js`

**Step 1: Remove duplicate prompt file**

Run: `rm prompts/default.txt`

**Step 2: Remove old test script**

Run: `rm scripts/test-prompt.js`

**Step 3: Commit**

```bash
git add -u prompts/default.txt scripts/test-prompt.js
git commit -m "chore: remove duplicate prompt files (replaced by pipeline system)"
```

---

## Task 8: Update Backend to Use Pipeline System

**Files:**
- Modify: `src/backend/routes/analyze.ts`
- Create: `src/pipelines/format.ts`
- Test: `tests/pipelines/format.test.ts`

**Step 1: Create the format helper**

```typescript
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
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : result.trim();

  return JSON.parse(jsonStr) as StructuredAnalysis;
}
```

**Step 2: Write tests for format helper**

```typescript
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
```

**Step 3: Run format tests**

Run: `npm test -- tests/pipelines/format.test.ts`
Expected: PASS

**Step 4: Update analyze.ts route**

Replace contents of `src/backend/routes/analyze.ts`:

```typescript
// ABOUTME: Analysis endpoint using the pipeline system.
// ABOUTME: Loads pipeline, runs analysis, formats output for extension.

import { Router, Request, Response } from 'express';
import { loadPipeline } from '../../pipelines/index';
import { formatForExtension } from '../../pipelines/format';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { text, pipeline: pipelineName = 'default' } = req.body;

    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    console.log(`[analyze] Using pipeline: ${pipelineName}, text length: ${text.length}`);
    const startTime = Date.now();

    // Load and run pipeline
    const pipeline = await loadPipeline(pipelineName);
    const analysisText = await pipeline.analyze(text);

    // Format for extension
    const structured = await formatForExtension(analysisText);

    const duration = Date.now() - startTime;
    console.log(`[analyze] Complete in ${duration}ms`);

    res.json({
      ...structured,
      pipeline: pipelineName,
      duration
    });
  } catch (error) {
    console.error('[analyze] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

export default router;
```

**Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

**Step 6: Commit**

```bash
git add src/pipelines/format.ts tests/pipelines/format.test.ts src/backend/routes/analyze.ts
git commit -m "feat(backend): update /analyze to use pipeline system"
```

---

## Task 9: Run Full Test Suite

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Run lint**

Run: `npm run lint`
Expected: No errors (or fix any that appear)

**Step 4: Commit any fixes**

If lint/typecheck required fixes:
```bash
git add -A
git commit -m "fix: address lint/type errors from pipeline integration"
```

---

## Task 10: Test CLI End-to-End

**Step 1: Test help output**

Run: `npm run pipeline`
Expected: Shows usage, lists "default" pipeline

**Step 2: Test on sample articles (requires API key)**

Run: `ANTHROPIC_API_KEY=your-key npm run pipeline default ./prompts/samples --parallel=2`
Expected: Analyzes all sample articles, prints results to stdout

**Step 3: Test with output directory**

Run: `ANTHROPIC_API_KEY=your-key npm run pipeline default ./prompts/samples --output-dir=./test-output --parallel=2`
Expected: Creates `test-output/` with `.analysis.md` files

---

## Summary

After completing all tasks, you will have:

1. **`src/pipelines/types.ts`** - Core `Pipeline` and `AnalyzeFn` types
2. **`src/pipelines/utils.ts`** - `claude()` helper using Anthropic SDK
3. **`src/pipelines/default.ts`** - Default single-prompt pipeline
4. **`src/pipelines/index.ts`** - `loadPipeline()` and `listPipelines()`
5. **`src/pipelines/format.ts`** - `formatForExtension()` for JSON conversion
6. **`scripts/run-pipeline.ts`** - CLI runner
7. **Updated `src/backend/routes/analyze.ts`** - Uses pipeline system
8. **Deleted `prompts/default.txt` and `scripts/test-prompt.js`**

To add a new pipeline, create `src/pipelines/my-pipeline.ts` exporting a `pipeline` object, then run:
```bash
npm run pipeline my-pipeline ./prompts/samples
```
