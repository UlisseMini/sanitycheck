#!/usr/bin/env node
/**
 * Prompt testing script for iterating on analysis prompts
 * 
 * Usage:
 *   node scripts/test-prompt.js                    # Run default prompt on all samples
 *   node scripts/test-prompt.js --prompt my.txt    # Use custom prompt file
 *   node scripts/test-prompt.js --sample crime     # Run on specific sample (partial match)
 *   node scripts/test-prompt.js --sample all       # Run on all samples
 *   node scripts/test-prompt.js --text "..."       # Run on inline text
 *   node scripts/test-prompt.js --interactive      # Interactive mode
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.MODEL || 'claude-sonnet-4-20250514';

const promptsDir = path.join(__dirname, '..', 'prompts');
const samplesDir = path.join(promptsDir, 'samples');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function c(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

async function callClaude(prompt, articleText) {
  const fullPrompt = prompt + articleText;
  
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
      messages: [{ role: 'user', content: fullPrompt }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function parseJSON(text) {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

function formatResult(result, sampleName) {
  console.log('\n' + c('bright', '═'.repeat(60)));
  console.log(c('cyan', `Sample: ${sampleName}`));
  console.log(c('bright', '═'.repeat(60)));
  
  const parsed = parseJSON(result);
  
  if (!parsed) {
    console.log(c('yellow', '\n⚠️  Could not parse JSON. Raw response:'));
    console.log(result);
    return;
  }
  
  // Central argument
  if (parsed.central_argument_analysis) {
    const ca = parsed.central_argument_analysis;
    console.log(c('bright', '\n📌 Central Argument'));
    console.log(c('dim', '   Main conclusion: ') + (ca.main_conclusion || 'N/A'));
    if (ca.central_logical_gap) {
      console.log(c('yellow', '   Central gap: ') + ca.central_logical_gap);
    }
  }
  
  // Severity
  const severityColors = {
    none: 'green',
    minor: 'dim',
    moderate: 'yellow',
    significant: 'red'
  };
  const severity = parsed.severity || 'unknown';
  console.log(c('bright', '\n📊 Severity: ') + c(severityColors[severity] || 'dim', severity.toUpperCase()));
  
  // Issues
  console.log(c('bright', `\n🔍 Issues (${parsed.issues?.length || 0}):`));
  
  if (!parsed.issues || parsed.issues.length === 0) {
    console.log(c('green', '   ✓ No issues found'));
  } else {
    parsed.issues.forEach((issue, i) => {
      const impColors = { critical: 'red', significant: 'yellow', minor: 'dim' };
      const impColor = impColors[issue.importance] || 'dim';
      
      console.log(`\n   ${c(impColor, `[${issue.importance?.toUpperCase() || 'ISSUE'}]`)}`);
      if (issue.quote) {
        console.log(c('dim', `   "${issue.quote.substring(0, 80)}${issue.quote.length > 80 ? '...' : ''}"`));
      }
      console.log(`   → ${issue.gap || issue.why_it_doesnt_follow || issue.explanation || 'No explanation'}`);
    });
  }
  
  console.log('');
}

function loadPrompt(promptPath) {
  const fullPath = promptPath.includes('/') 
    ? promptPath 
    : path.join(promptsDir, promptPath.endsWith('.txt') ? promptPath : `${promptPath}.txt`);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Prompt file not found: ${fullPath}`);
  }
  
  return fs.readFileSync(fullPath, 'utf8');
}

function loadSamples(filter = 'all') {
  if (!fs.existsSync(samplesDir)) {
    throw new Error(`Samples directory not found: ${samplesDir}`);
  }
  
  const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.txt'));
  
  if (filter !== 'all') {
    const filtered = files.filter(f => f.toLowerCase().includes(filter.toLowerCase()));
    if (filtered.length === 0) {
      throw new Error(`No samples matching "${filter}". Available: ${files.join(', ')}`);
    }
    return filtered;
  }
  
  return files;
}

async function runTest(prompt, sampleFile) {
  const samplePath = path.join(samplesDir, sampleFile);
  const articleText = fs.readFileSync(samplePath, 'utf8');
  
  console.log(c('dim', `\nAnalyzing ${sampleFile}...`));
  const startTime = Date.now();
  
  const result = await callClaude(prompt, articleText);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(c('dim', `Completed in ${duration}s`));
  
  formatResult(result, sampleFile);
  
  return { sample: sampleFile, result, parsed: parseJSON(result) };
}

async function runInteractive(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(c('cyan', '\n📝 Interactive Mode'));
  console.log(c('dim', 'Enter text to analyze (press Enter twice to submit, Ctrl+C to exit)\n'));
  
  let buffer = '';
  let emptyLines = 0;
  
  const question = () => {
    rl.question('> ', async (line) => {
      if (line === '') {
        emptyLines++;
        if (emptyLines >= 1 && buffer.trim()) {
          // Process the buffer
          console.log(c('dim', '\nAnalyzing...'));
          try {
            const result = await callClaude(prompt, buffer);
            formatResult(result, 'interactive input');
          } catch (e) {
            console.log(c('red', `Error: ${e.message}`));
          }
          buffer = '';
          emptyLines = 0;
          console.log(c('dim', '\nEnter more text to analyze:\n'));
        }
      } else {
        emptyLines = 0;
        buffer += line + '\n';
      }
      question();
    });
  };

  question();
}

async function main() {
  if (!ANTHROPIC_API_KEY) {
    console.error(c('red', 'Error: ANTHROPIC_API_KEY not set. Add it to .env file.'));
    process.exit(1);
  }

  const args = process.argv.slice(2);
  
  // Parse arguments
  let promptFile = 'default.txt';
  let sampleFilter = 'all';
  let inlineText = null;
  let interactive = false;
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--prompt':
      case '-p':
        promptFile = args[++i];
        break;
      case '--sample':
      case '-s':
        sampleFilter = args[++i];
        break;
      case '--text':
      case '-t':
        inlineText = args[++i];
        break;
      case '--interactive':
      case '-i':
        interactive = true;
        break;
      case '--help':
      case '-h':
        console.log(`
${c('bright', 'Prompt Testing Script')}

${c('cyan', 'Usage:')}
  node scripts/test-prompt.js [options]

${c('cyan', 'Options:')}
  --prompt, -p <file>    Prompt file to use (default: default.txt)
  --sample, -s <filter>  Sample to test (partial match, or "all")
  --text, -t "<text>"    Test inline text instead of sample files
  --interactive, -i      Interactive mode - enter text to analyze
  --help, -h             Show this help

${c('cyan', 'Examples:')}
  node scripts/test-prompt.js                     # All samples with default prompt
  node scripts/test-prompt.js -s crime            # Just the crime sample
  node scripts/test-prompt.js -p v2.txt -s all    # All samples with v2 prompt
  node scripts/test-prompt.js -t "Some text..."   # Test inline text
  node scripts/test-prompt.js -i                  # Interactive mode

${c('cyan', 'Files:')}
  prompts/default.txt           Default prompt
  prompts/samples/*.txt         Sample texts to test

${c('dim', 'Tip: Create prompts/v2.txt etc. to iterate on different versions')}
        `);
        process.exit(0);
    }
  }

  // Load prompt
  console.log(c('bright', '\n🧪 Prompt Tester\n'));
  console.log(c('dim', `Model: ${MODEL}`));
  
  let prompt;
  try {
    prompt = loadPrompt(promptFile);
    console.log(c('dim', `Prompt: ${promptFile} (${prompt.length} chars)`));
  } catch (e) {
    console.error(c('red', e.message));
    process.exit(1);
  }

  // Run based on mode
  if (interactive) {
    await runInteractive(prompt);
    return;
  }

  if (inlineText) {
    console.log(c('dim', `\nAnalyzing inline text (${inlineText.length} chars)...`));
    const result = await callClaude(prompt, inlineText);
    formatResult(result, 'inline text');
    return;
  }

  // Run on samples
  try {
    const samples = loadSamples(sampleFilter);
    console.log(c('dim', `Samples: ${samples.length} file(s)`));
    
    const results = [];
    for (const sample of samples) {
      const result = await runTest(prompt, sample);
      results.push(result);
    }
    
    // Summary
    console.log('\n' + c('bright', '═'.repeat(60)));
    console.log(c('bright', 'Summary'));
    console.log(c('bright', '═'.repeat(60)));
    
    for (const r of results) {
      const issues = r.parsed?.issues?.length || 0;
      const severity = r.parsed?.severity || 'unknown';
      const icon = severity === 'none' ? '✓' : 
                   severity === 'significant' ? '⚠️' : '•';
      console.log(`${icon} ${r.sample}: ${issues} issues, ${severity} severity`);
    }
    
  } catch (e) {
    console.error(c('red', e.message));
    process.exit(1);
  }
}

main().catch(e => {
  console.error(c('red', `Error: ${e.message}`));
  process.exit(1);
});
