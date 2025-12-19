# 3-Stage Analysis Pipeline

This directory contains the prompts for the 3-stage article analysis pipeline.

## Pipeline Overview

The analysis happens in 3 sequential stages:

1. **Stage 1 - Extract** (`stage1-extract.txt`): Liberally identifies potential reasoning problems
2. **Stage 2 - Critique** (`stage2-critique.txt`): Harshly filters out weak critiques
3. **Stage 3 - Format** (`stage3-format.txt`): Formats surviving issues for the UI

## Prompt Files

- `stage1-extract.txt` - First pass to find potential issues (liberal)
- `stage2-critique.txt` - Second pass to filter weak critiques (conservative)
- `stage3-format.txt` - Final formatting for output
- `default.txt` - Legacy single-stage prompt (kept for reference)

## Sample Articles

The `samples/` directory contains test articles for iterating on prompts:

- `correlation-crime.txt`
- `diet-study.txt`
- `exponential-resources.txt`
- `productivity-remote.txt`
- `sound-argument.txt`

Add your own `.txt` files here to test against different article types.

## Testing Your Prompts

### 1. Start the backend server

```bash
npm run dev
```

### 2. Run the test script

```bash
# Test with first available sample
node scripts/test-3stage.js

# Test with specific sample
node scripts/test-3stage.js correlation-crime.txt

# Test with custom article file
node scripts/test-3stage.js /path/to/article.txt
```

### 3. Review the output

The script will:
- Show pipeline statistics (timing, issue counts at each stage)
- Display the final output
- Save detailed results to `output/[sample-name]-[timestamp].json`

### 4. Iterate on prompts

1. Edit the prompt files (`stage1-extract.txt`, etc.)
2. Restart the backend server to reload prompts
3. Run the test script again
4. Compare outputs

## Adding Examples and Metacognitive Guidance

You mentioned wanting to add:
- General example cases for how to annotate articles
- Metacognitive pointers on estimating argument quality
- Guidance on distinguishing "definitely an error" vs "good chance of error"

Add these to the prompt files in the designated sections:

**In `stage1-extract.txt`:**
- Add examples under "## Examples and Metacognitive Guidance"

**In `stage2-critique.txt`:**
- Add examples of good/bad critiques to help with filtering

**In `stage3-format.txt`:**
- Add examples of well-formatted gap explanations

## Prompt Reloading

The prompts are loaded when the server starts. To reload prompts:

```bash
# Stop the dev server (Ctrl+C)
# Restart it
npm run dev
```

For production, prompts are bundled at build time.
