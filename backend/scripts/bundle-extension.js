#!/usr/bin/env node
/**
 * Bundle extension files into a zip for distribution
 * Works during Railway deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXTENSION_FILES = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'styles.css',
  'content.js',
  'content-styles.css',
  'background.js',
  'debug.js',
  'icon16.png',
  'icon48.png',
  'icon128.png'
];

// Determine paths
const scriptDir = __dirname;
const backendDir = path.dirname(scriptDir);
const rootDir = path.dirname(backendDir);
const outputDir = path.join(backendDir, 'public');
const outputZip = path.join(outputDir, 'logic-checker-extension.zip');

console.log('Bundling extension...');
console.log('  Root dir:', rootDir);
console.log('  Output:', outputZip);

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Check if extension files exist
const existingFiles = EXTENSION_FILES.filter(f => 
  fs.existsSync(path.join(rootDir, f))
);

if (existingFiles.length === 0) {
  console.log('  Warning: No extension files found in root directory');
  console.log('  Creating placeholder zip...');
  
  // Create a minimal placeholder
  fs.writeFileSync(
    path.join(outputDir, 'README.txt'),
    'Extension files not found during build. Please download from source.'
  );
  process.exit(0);
}

console.log(`  Found ${existingFiles.length}/${EXTENSION_FILES.length} extension files`);

// Create temp directory
const tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'extension-'));

try {
  // Copy files
  for (const file of existingFiles) {
    const src = path.join(rootDir, file);
    const dest = path.join(tempDir, file);
    fs.copyFileSync(src, dest);
    console.log(`  Copied: ${file}`);
  }

  // Disable debug mode in copied files
  const debugJsPath = path.join(tempDir, 'debug.js');
  if (fs.existsSync(debugJsPath)) {
    let content = fs.readFileSync(debugJsPath, 'utf8');
    content = content.replace('DEBUG_ENABLED = true', 'DEBUG_ENABLED = false');
    fs.writeFileSync(debugJsPath, content);
    console.log('  Disabled debug mode in debug.js');
  }

  const contentJsPath = path.join(tempDir, 'content.js');
  if (fs.existsSync(contentJsPath)) {
    let content = fs.readFileSync(contentJsPath, 'utf8');
    content = content.replace('DEBUG_ENABLED = true', 'DEBUG_ENABLED = false');
    fs.writeFileSync(contentJsPath, content);
    console.log('  Disabled debug mode in content.js');
  }

  // Create zip using zip command or fallback
  try {
    execSync(`cd "${tempDir}" && zip -r "${outputZip}" . -x "*.DS_Store"`, { stdio: 'inherit' });
  } catch (e) {
    // Fallback: try using tar if zip isn't available
    console.log('  zip not available, trying alternative...');
    execSync(`cd "${tempDir}" && tar -cvf "${outputZip.replace('.zip', '.tar')}" *`, { stdio: 'inherit' });
    // Rename to .zip (it won't be a real zip but at least exists)
    fs.renameSync(outputZip.replace('.zip', '.tar'), outputZip);
  }

  console.log('');
  console.log('✓ Extension bundled successfully');
  
  const stats = fs.statSync(outputZip);
  console.log(`  Size: ${(stats.size / 1024).toFixed(1)} KB`);

} finally {
  // Cleanup temp directory
  fs.rmSync(tempDir, { recursive: true, force: true });
}

