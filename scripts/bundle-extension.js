#!/usr/bin/env node
/**
 * Bundle extension files into a zip for distribution
 * Now includes esbuild step to bundle content.js with Readability
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files that don't need bundling (just copy)
const STATIC_FILES = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'settings.html',
  'settings.js',
  'welcome.html',
  'styles.css',
  'content-styles.css',
  'background.js',
  'debug.js',
  'icon16.png',
  'icon48.png',
  'icon128.png'
];

// Determine paths
const scriptDir = __dirname;
const rootDir = path.dirname(scriptDir);
const extensionDir = path.join(rootDir, 'extension');
const outputDir = path.join(rootDir, 'public');
const outputZip = path.join(outputDir, 'sanitycheck-extension.zip');

console.log('Bundling extension...');
console.log('  Extension dir:', extensionDir);
console.log('  Output:', outputZip);

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create temp directory
const tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'extension-'));

try {
  // Step 1: Bundle content.js with Readability using esbuild
  const contentSrcPath = path.join(extensionDir, 'content.src.js');
  const contentOutPath = path.join(tempDir, 'content.js');
  
  if (fs.existsSync(contentSrcPath)) {
    console.log('  Bundling content.js with Readability...');
    try {
      execSync(`npx esbuild "${contentSrcPath}" --bundle --outfile="${contentOutPath}" --format=iife --target=chrome100 --minify`, {
        cwd: rootDir,
        stdio: 'pipe'
      });
      console.log('  ✓ content.js bundled with Readability');
      
      // Disable debug mode in bundled content.js
      let content = fs.readFileSync(contentOutPath, 'utf8');
      content = content.replace(/DEBUG_ENABLED\s*=\s*true/g, 'DEBUG_ENABLED=false');
      fs.writeFileSync(contentOutPath, content);
      console.log('  ✓ Disabled debug mode in content.js');
    } catch (e) {
      console.error('  ERROR bundling content.js:', e.message);
      // Fallback: try copying content.js if it exists
      const fallbackContentPath = path.join(extensionDir, 'content.js');
      if (fs.existsSync(fallbackContentPath)) {
        console.log('  Using fallback content.js (no Readability)');
        fs.copyFileSync(fallbackContentPath, contentOutPath);
      } else {
        throw new Error('Cannot bundle content.js and no fallback exists');
      }
    }
  } else {
    // No source file, copy content.js directly if it exists
    const fallbackContentPath = path.join(extensionDir, 'content.js');
    if (fs.existsSync(fallbackContentPath)) {
      console.log('  No content.src.js found, copying content.js directly');
      fs.copyFileSync(fallbackContentPath, contentOutPath);
    }
  }

  // Step 2: Copy static files
  for (const file of STATIC_FILES) {
    const src = path.join(extensionDir, file);
    const dest = path.join(tempDir, file);
    
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  Copied: ${file}`);
    } else {
      console.log(`  Warning: ${file} not found`);
    }
  }

  // Step 3: Disable debug mode in debug.js
  const debugJsPath = path.join(tempDir, 'debug.js');
  if (fs.existsSync(debugJsPath)) {
    let content = fs.readFileSync(debugJsPath, 'utf8');
    content = content.replace('DEBUG_ENABLED = true', 'DEBUG_ENABLED = false');
    fs.writeFileSync(debugJsPath, content);
    console.log('  ✓ Disabled debug mode in debug.js');
  }

  // Step 4: Create zip
  try {
    execSync(`cd "${tempDir}" && zip -r "${outputZip}" . -x "*.DS_Store"`, { 
      stdio: 'inherit',
      cwd: tempDir
    });
  } catch (e) {
    console.error('  ERROR: Failed to create zip:', e.message);
    console.log('  Trying tar as fallback...');
    try {
      execSync(`tar -czf "${outputZip}" *`, { 
        stdio: 'inherit',
        cwd: tempDir
      });
      console.log('  Created tar.gz instead of zip');
    } catch (tarError) {
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
