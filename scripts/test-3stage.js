#!/usr/bin/env node

/**
 * Test script for the 3-stage analysis pipeline
 * Usage: node scripts/test-3stage.js [sample-file]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const SAMPLES_DIR = path.join(__dirname, '../prompts/samples');

async function testPipeline(articleText, sampleName) {
  console.log('\n' + '='.repeat(80));
  console.log(`Testing 3-Stage Pipeline: ${sampleName}`);
  console.log('='.repeat(80) + '\n');

  console.log('Article text length:', articleText.length, 'characters\n');

  const startTime = Date.now();

  try {
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleText: articleText,
        maxTokens: 8192,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const totalTime = Date.now() - startTime;

    // Display pipeline statistics
    console.log('Pipeline Statistics:');
    console.log('-'.repeat(80));
    if (result.pipeline) {
      const p = result.pipeline;
      console.log(`Stage 1: ${p.stage1.duration}ms - Found ${p.stage1.potentialIssues} potential issues`);
      console.log(`Stage 2: ${p.stage2.duration}ms - ${p.stage2.surviving} survived, ${p.stage2.rejected} rejected`);
      console.log(`Stage 3: ${p.stage3.duration}ms - ${p.stage3.finalIssues} final issues`);
      console.log(`Total:   ${result.duration}ms (wall clock: ${totalTime}ms)`);
    }
    console.log('-'.repeat(80) + '\n');

    // Parse and display final output
    let finalOutput;
    try {
      finalOutput = JSON.parse(result.text);
    } catch (e) {
      console.error('Failed to parse final output as JSON');
      console.log('Raw output:', result.text);
      return;
    }

    // Display central argument analysis
    console.log('Central Argument Analysis:');
    console.log('-'.repeat(80));
    console.log('Main Conclusion:', finalOutput.central_argument_analysis?.main_conclusion || 'N/A');
    console.log('Central Gap:', finalOutput.central_argument_analysis?.central_logical_gap || 'N/A');
    console.log();

    // Display issues
    console.log(`Issues Found (${finalOutput.issues?.length || 0}):` );
    console.log('-'.repeat(80));

    if (finalOutput.issues && finalOutput.issues.length > 0) {
      finalOutput.issues.forEach((issue, idx) => {
        console.log(`\n[${idx + 1}] ${issue.importance?.toUpperCase()}`);
        console.log(`Quote: "${issue.quote}"`);
        console.log(`Gap: ${issue.gap}`);
      });
    } else {
      console.log('No issues identified.');
    }
    console.log();

    // Display severity
    console.log('Overall Severity:', (finalOutput.severity || 'none').toUpperCase());
    console.log('='.repeat(80) + '\n');

    // Save detailed output to file
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const outputFile = path.join(outputDir, `${sampleName}-${timestamp}.json`);

    fs.writeFileSync(outputFile, JSON.stringify({
      sample: sampleName,
      timestamp: new Date().toISOString(),
      articleLength: articleText.length,
      pipeline: result.pipeline,
      output: finalOutput
    }, null, 2));

    console.log(`✓ Detailed output saved to: ${outputFile}\n`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);

  // Get sample file
  let sampleFile;
  let sampleName;

  if (args.length > 0) {
    // Use provided sample file
    sampleFile = args[0];
    if (!path.isAbsolute(sampleFile)) {
      sampleFile = path.join(SAMPLES_DIR, sampleFile);
    }
    sampleName = path.basename(sampleFile, '.txt');
  } else {
    // List available samples and use first one
    const samples = fs.readdirSync(SAMPLES_DIR).filter(f => f.endsWith('.txt'));

    if (samples.length === 0) {
      console.error('No sample files found in', SAMPLES_DIR);
      console.error('Create a .txt file in prompts/samples/ with article text to test.');
      process.exit(1);
    }

    console.log('Available samples:');
    samples.forEach((s, idx) => console.log(`  ${idx + 1}. ${s}`));
    console.log();

    sampleFile = path.join(SAMPLES_DIR, samples[0]);
    sampleName = path.basename(samples[0], '.txt');
    console.log(`Using: ${samples[0]}\n`);
  }

  // Read sample
  if (!fs.existsSync(sampleFile)) {
    console.error(`Sample file not found: ${sampleFile}`);
    process.exit(1);
  }

  const articleText = fs.readFileSync(sampleFile, 'utf-8').trim();

  if (!articleText) {
    console.error('Sample file is empty');
    process.exit(1);
  }

  // Test pipeline
  await testPipeline(articleText, sampleName);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
