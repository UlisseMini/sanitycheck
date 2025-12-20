# Pipeline Abstraction Design

## Problem

The current analysis system is tightly coupled: the extension owns prompt construction, the backend is a raw API proxy, and there's no clean way to iterate on different analysis approaches. We need a modular pipeline system that lets devs iterate on analysis strategies via CLI without touching extension code.

## Core Interface

```typescript
// src/pipelines/types.ts

export type AnalyzeFn = (
  text: string,
  onProgress?: (percent: number) => void
) => Promise<string>;

export interface Pipeline {
  name: string;
  description: string;
  analyze: AnalyzeFn;
}
```

Each pipeline file exports a `Pipeline` object. The `analyze` function takes article text and returns free-form analysis text. Progress reporting is optional.

## Claude Helper

```typescript
// src/pipelines/utils.ts

import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeOptions {
  system?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  thinking?: {
    enabled: boolean;
    budgetTokens?: number;
  };
}

export async function claude(
  messages: ClaudeMessage[],
  options?: ClaudeOptions
): Promise<string>;
```

Uses `@anthropic-ai/sdk` for full type safety. Pipeline authors use this helper instead of raw API calls.

## CLI Runner

```bash
npm run pipeline <pipeline-name> <articles-dir> [--output-dir=<path>] [--parallel=<N>]
```

Examples:
```bash
npm run pipeline default ./prompts/samples
npm run pipeline critique-steelman ./articles/eval_set --output-dir=./results --parallel=3
```

Behavior:
- Loads pipeline from `src/pipelines/<pipeline-name>.ts`
- Reads all `.md` and `.txt` files from `<articles-dir>`
- Runs analysis in parallel (default 5 concurrent)
- Logs progress to stderr: `[1/5] analyzing foo.md...` → `[1/5] foo.md done (3.2s)`
- Prints results to stdout in filename order, as soon as preceding articles complete
- If `--output-dir` specified, writes `foo.analysis.md` for each `foo.md`

Output format (stdout):
```
════════════════════════════════════════
foo.md
════════════════════════════════════════
[analysis text here]

════════════════════════════════════════
bar.md
════════════════════════════════════════
[analysis text here]
```

## Backend Integration

The `/analyze` route changes from raw proxy to pipeline executor:

```typescript
// src/backend/routes/analyze.ts

router.post('/', async (req, res) => {
  const { text, pipeline: pipelineName = 'default' } = req.body;

  const pipeline = loadPipeline(pipelineName);
  const analysisText = await pipeline.analyze(text);
  const structured = await formatForExtension(analysisText);

  res.json(structured);
});
```

The `formatForExtension` function uses haiku to convert free-form analysis into the `{ issues: [...], severity: ... }` JSON the extension expects.

## File Structure

**New files:**
```
src/
  pipelines/
    types.ts              # AnalyzeFn, Pipeline interface
    utils.ts              # claude() helper using @anthropic-ai/sdk
    index.ts              # loadPipeline(name), listPipelines()
    default.ts            # current single-prompt approach
    format.ts             # formatForExtension() - haiku JSON conversion

scripts/
  run-pipeline.ts         # CLI runner
```

**Changes:**
- `src/backend/routes/analyze.ts` - use pipeline system
- `package.json` - add `"pipeline": "npx tsx scripts/run-pipeline.ts"`

**Deleted:**
- `prompts/default.txt` - duplicate of constants.ts
- `scripts/test-prompt.js` - replaced by run-pipeline.ts
