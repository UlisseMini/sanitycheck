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

// Determine paths - now running from project root
const scriptDir = __dirname;
const rootDir = path.dirname(scriptDir);
const extensionDir = path.join(rootDir, 'extension');
const outputDir = path.join(rootDir, 'public');
const outputZip = path.join(outputDir, 'logic-checker-extension.zip');

console.log('Bundling extension...');
console.log('  Extension dir:', extensionDir);
console.log('  Output:', outputZip);

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Check if extension files exist
const existingFiles = EXTENSION_FILES.filter(f => 
  fs.existsSync(path.join(extensionDir, f))
);

if (existingFiles.length === 0) {
  console.error('  ERROR: No extension files found');
  console.error('  Extension dir:', extensionDir);
  console.error('  Looking for files:', EXTENSION_FILES);
  console.error('  Current working dir:', process.cwd());
  console.error('  Files in extension dir:', fs.existsSync(extensionDir) ? fs.readdirSync(extensionDir) : 'DIR NOT FOUND');
  
  // Fail loudly
  console.error('  FATAL: Cannot bundle extension without source files');
  process.exit(1);
}

console.log(`  Found ${existingFiles.length}/${EXTENSION_FILES.length} extension files`);

// Create temp directory
const tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'extension-'));

try {
  // Copy files
  for (const file of existingFiles) {
    const src = path.join(extensionDir, file);
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
    execSync(`cd "${tempDir}" && zip -r "${outputZip}" . -x "*.DS_Store"`, { 
      stdio: 'inherit',
      cwd: tempDir
    });
  } catch (e) {
    console.error('  ERROR: Failed to create zip:', e.message);
    // Fallback: try using tar if zip isn't available
    console.log('  Trying tar as fallback...');
    try {
      execSync(`tar -czf "${outputZip}" *`, { 
        stdio: 'inherit',
        cwd: tempDir
      });
      console.log('  Created tar.gz instead of zip');
    } catch (tarError) {
      console.error('  FATAL: Both zip and tar failed');
      console.error('  Zip error:', e.message);
      console.error('  Tar error:', tarError.message);
      throw new Error('Failed to create extension archive');
    }
  }

  console.log('');
  console.log('✓ Extension bundled successfully');
  
  const stats = fs.statSync(outputZip);
  console.log(`  Size: ${(stats.size / 1024).toFixed(1)} KB`);

} finally {
  // Cleanup temp directory
  fs.rmSync(tempDir, { recursive: true, force: true });
}

