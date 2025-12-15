#!/usr/bin/env node
/**
 * Compare two prompts side-by-side on the same samples
 * 
 * Usage:
 *   node scripts/compare-prompts.js default.txt v2.txt
 *   node scripts/compare-prompts.js default.txt v2.txt --sample crime
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.MODEL || 'claude-sonnet-4-20250514';

const promptsDir = path.join(__dirname, '..', 'prompts');
const samplesDir = path.join(promptsDir, 'samples');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function c(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

async function callClaude(prompt, articleText) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt + articleText }]
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function parseJSON(text) {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

function loadPrompt(name) {
  const fullPath = name.includes('/') ? name : path.join(promptsDir, name.endsWith('.txt') ? name : `${name}.txt`);
  return fs.readFileSync(fullPath, 'utf8');
}

function summarizeResult(parsed, name) {
  if (!parsed) return { name, issues: '?', severity: '?', gap: '?' };
  
  return {
    name,
    issues: parsed.issues?.length || 0,
    severity: parsed.severity || 'none',
    gap: parsed.central_argument_analysis?.central_logical_gap?.substring(0, 60) || '-'
  };
}

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
  
  if (args.length < 2) {
    console.log(`
${c('bright', 'Compare Prompts')}

Usage: node scripts/compare-prompts.js <prompt1> <prompt2> [--sample <filter>]

Example:
  node scripts/compare-prompts.js default.txt v2.txt
  node scripts/compare-prompts.js default v2 --sample crime
    `);
    process.exit(1);
  }

  const [prompt1Name, prompt2Name] = args;
  let sampleFilter = 'all';
  
  const sampleIdx = flags.indexOf('--sample');
  if (sampleIdx !== -1) {
    sampleFilter = process.argv[process.argv.indexOf('--sample') + 1];
  }

  const prompt1 = loadPrompt(prompt1Name);
  const prompt2 = loadPrompt(prompt2Name);
  
  const samples = fs.readdirSync(samplesDir)
    .filter(f => f.endsWith('.txt'))
    .filter(f => sampleFilter === 'all' || f.toLowerCase().includes(sampleFilter.toLowerCase()));

  console.log(c('bright', '\n🔬 Prompt Comparison\n'));
  console.log(c('dim', `Model: ${MODEL}`));
  console.log(c('blue', `Prompt A: ${prompt1Name} (${prompt1.length} chars)`));
  console.log(c('cyan', `Prompt B: ${prompt2Name} (${prompt2.length} chars)`));
  console.log(c('dim', `Samples: ${samples.length}`));

  const results = [];

  for (const sample of samples) {
    const text = fs.readFileSync(path.join(samplesDir, sample), 'utf8');
    
    console.log(c('dim', `\n${'─'.repeat(60)}`));
    console.log(c('bright', `📄 ${sample}`));
    
    // Run both in parallel
    console.log(c('dim', 'Running both prompts...'));
    const [result1, result2] = await Promise.all([
      callClaude(prompt1, text),
      callClaude(prompt2, text)
    ]);
    
    const parsed1 = parseJSON(result1);
    const parsed2 = parseJSON(result2);
    
    const summary1 = summarizeResult(parsed1, prompt1Name);
    const summary2 = summarizeResult(parsed2, prompt2Name);
    
    // Side by side comparison
    console.log(`\n  ${c('blue', 'A: ' + prompt1Name.padEnd(20))} | ${c('cyan', 'B: ' + prompt2Name)}`);
    console.log(`  Issues:   ${String(summary1.issues).padEnd(20)} | ${summary2.issues}`);
    console.log(`  Severity: ${summary1.severity.padEnd(20)} | ${summary2.severity}`);
    
    // Show issues from each
    console.log(c('blue', '\n  A Issues:'));
    if (parsed1?.issues?.length) {
      parsed1.issues.forEach(i => {
        console.log(`    [${i.importance}] ${i.gap || '-'}`);
      });
    } else {
      console.log('    (none)');
    }
    
    console.log(c('cyan', '\n  B Issues:'));
    if (parsed2?.issues?.length) {
      parsed2.issues.forEach(i => {
        console.log(`    [${i.importance}] ${i.gap || '-'}`);
      });
    } else {
      console.log('    (none)');
    }
    
    results.push({ sample, a: summary1, b: summary2 });
  }

  // Final summary table
  console.log(c('dim', `\n${'═'.repeat(60)}`));
  console.log(c('bright', 'Summary Table'));
  console.log(c('dim', '═'.repeat(60)));
  
  console.log(`${'Sample'.padEnd(30)} | A Issues | B Issues | A Sev      | B Sev`);
  console.log('─'.repeat(75));
  
  for (const r of results) {
    console.log(
      `${r.sample.substring(0, 28).padEnd(30)} | ` +
      `${String(r.a.issues).padEnd(8)} | ` +
      `${String(r.b.issues).padEnd(8)} | ` +
      `${r.a.severity.padEnd(10)} | ` +
      `${r.b.severity}`
    );
  }
}

main().catch(e => {
  console.error(c('red', `Error: ${e.message}`));
  process.exit(1);
});
