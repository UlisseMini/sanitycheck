#!/usr/bin/env node
/**
 * Unified build script for SanityCheck
 * 
 * Builds:
 * - Backend: TypeScript to dist/
 * - Extension: TypeScript to extension/ (bundled with esbuild)
 * - Extension zip: public/sanitycheck-extension.zip
 */

const esbuild = require('esbuild');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.dirname(__dirname);
const srcDir = path.join(rootDir, 'src');
const extensionSrcDir = path.join(srcDir, 'extension');
const extensionOutDir = path.join(rootDir, 'extension');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

async function buildBackend() {
  console.log('📦 Building backend...');
  
  try {
    execSync('npx tsc', { cwd: rootDir, stdio: 'inherit' });
    console.log('  ✓ Backend built to dist/');
  } catch (error) {
    console.error('  ✗ Backend build failed');
    throw error;
  }
}

async function buildExtension() {
  console.log('📦 Building extension...');
  
  // Check if we have TypeScript extension sources
  const backgroundTsPath = path.join(extensionSrcDir, 'background.ts');
  
  if (fs.existsSync(backgroundTsPath)) {
    // Build background.ts
    console.log('  Building background.js from TypeScript...');
    await esbuild.build({
      entryPoints: [backgroundTsPath],
      outfile: path.join(extensionOutDir, 'background.js'),
      bundle: true,
      format: 'iife',
      target: 'chrome100',
      minify: false, // Keep readable for debugging
      sourcemap: false,
    });
    console.log('  ✓ background.js built');
  }
  
  // Build content.src.js with Readability (existing approach)
  const contentSrcPath = path.join(extensionOutDir, 'content.src.js');
  if (fs.existsSync(contentSrcPath)) {
    console.log('  Building content.js with Readability...');
    await esbuild.build({
      entryPoints: [contentSrcPath],
      outfile: path.join(extensionOutDir, 'content.js'),
      bundle: true,
      format: 'iife',
      target: 'chrome100',
      minify: false,
      sourcemap: false,
    });
    console.log('  ✓ content.js built');
  }
  
  console.log('  ✓ Extension built');
}

async function bundleExtensionZip() {
  console.log('📦 Bundling extension zip...');
  
  // Create public directory if needed
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const outputZip = path.join(publicDir, 'sanitycheck-extension.zip');
  
  // Files to include in the zip
  const files = [
    'manifest.json',
    'popup.html',
    'popup.js',
    'settings.html',
    'settings.js',
    'welcome.html',
    'styles.css',
    'content-styles.css',
    'background.js',
    'content.js',
    'debug.js',
    'icon16.png',
    'icon48.png',
    'icon128.png'
  ];
  
  // Create temp directory
  const tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'extension-'));
  
  try {
    // Copy files
    for (const file of files) {
      const src = path.join(extensionOutDir, file);
      const dest = path.join(tempDir, file);
      
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      } else {
        console.log(`  Warning: ${file} not found`);
      }
    }
    
    // Disable debug mode in production
    const debugJsPath = path.join(tempDir, 'debug.js');
    if (fs.existsSync(debugJsPath)) {
      let content = fs.readFileSync(debugJsPath, 'utf8');
      content = content.replace('DEBUG_ENABLED = true', 'DEBUG_ENABLED = false');
      fs.writeFileSync(debugJsPath, content);
    }
    
    const contentJsPath = path.join(tempDir, 'content.js');
    if (fs.existsSync(contentJsPath)) {
      let content = fs.readFileSync(contentJsPath, 'utf8');
      content = content.replace(/DEBUG_ENABLED\s*=\s*true/g, 'DEBUG_ENABLED=false');
      fs.writeFileSync(contentJsPath, content);
    }
    
    // Create zip
    try {
      execSync(`cd "${tempDir}" && zip -r "${outputZip}" . -x "*.DS_Store"`, { 
        stdio: 'pipe'
      });
    } catch (e) {
      // Fallback to tar if zip not available
      execSync(`tar -czf "${outputZip}" -C "${tempDir}" .`, { stdio: 'pipe' });
    }
    
    const stats = fs.statSync(outputZip);
    console.log(`  ✓ Extension bundled: ${(stats.size / 1024).toFixed(1)} KB`);
    
  } finally {
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  const startTime = Date.now();
  console.log('🔨 SanityCheck Build\n');
  
  try {
    // Parse arguments
    const args = process.argv.slice(2);
    const skipBackend = args.includes('--extension-only');
    const skipExtension = args.includes('--backend-only');
    
    if (!skipBackend) {
      await buildBackend();
    }
    
    if (!skipExtension) {
      await buildExtension();
      await bundleExtensionZip();
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Build complete in ${duration}s`);
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();
