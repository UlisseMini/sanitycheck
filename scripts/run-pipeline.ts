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
