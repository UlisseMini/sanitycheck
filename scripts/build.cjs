#!/usr/bin/env node
/**
 * Unified build script for SanityCheck
 *
 * Builds:
 * - Extension: TypeScript to build/extension/ (bundled with esbuild)
 * - Extension zip: build/extension.zip
 * - Shared assets: kawaii.js for backend pages
 *
 * Note: Backend runs directly with Bun (no build step needed)
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const rootDir = path.dirname(__dirname);
const srcDir = path.join(rootDir, 'src');
const extensionSrcDir = path.join(srcDir, 'extension');
const staticDir = path.join(extensionSrcDir, 'static');
const buildDir = path.join(rootDir, 'build');
const extensionOutDir = path.join(buildDir, 'extension');

const PROD_BACKEND_URL = 'https://sanitycheck-production.up.railway.app';
const DEV_BACKEND_URL = 'http://localhost:3000';

async function buildSharedAssets() {
  console.log('📦 Building shared assets...');

  // Ensure public directory exists
  const publicDir = path.join(buildDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Build kawaii.js as IIFE for browser use
  const kawaiiSrc = path.join(srcDir, 'shared', 'kawaii.ts');
  if (fs.existsSync(kawaiiSrc)) {
    await esbuild.build({
      entryPoints: [kawaiiSrc],
      outfile: path.join(publicDir, 'kawaii.js'),
      bundle: true,
      format: 'iife',
      globalName: 'KawaiiModule',
      target: 'es2020',
      minify: false,
      footer: {
        js: '// Expose makeKawaii globally for inline scripts\nif (typeof window !== "undefined") { window.makeKawaii = KawaiiModule.makeKawaii; }'
      }
    });
    console.log('  ✓ kawaii.js built to public/');
  }
}

async function buildExtension({ isDev = false } = {}) {
  const backendUrl = isDev ? DEV_BACKEND_URL : PROD_BACKEND_URL;
  console.log(`📦 Building extension (${isDev ? 'dev' : 'prod'}: ${backendUrl})...`);

  // Ensure output directory exists
  if (!fs.existsSync(extensionOutDir)) {
    fs.mkdirSync(extensionOutDir, { recursive: true });
  }

  // Extension entry points
  const entryPoints = {
    background: path.join(extensionSrcDir, 'background.ts'),
    content: path.join(extensionSrcDir, 'content.ts'),
    popup: path.join(extensionSrcDir, 'popup.ts'),
    debug: path.join(extensionSrcDir, 'debug.ts'),
    welcome: path.join(extensionSrcDir, 'welcome.ts'),
  };

  // Filter to only existing files
  const existingEntryPoints = {};
  for (const [name, filePath] of Object.entries(entryPoints)) {
    if (fs.existsSync(filePath)) {
      existingEntryPoints[name] = filePath;
    } else {
      console.log(`  Skipping ${name}.ts (not found)`);
    }
  }

  if (Object.keys(existingEntryPoints).length > 0) {
    console.log(`  Building ${Object.keys(existingEntryPoints).length} TypeScript entry points...`);

    await esbuild.build({
      entryPoints: existingEntryPoints,
      outdir: extensionOutDir,
      bundle: true,
      format: 'iife',
      target: 'chrome100',
      minify: false, // Keep readable for debugging
      sourcemap: false,
      define: {
        '__BACKEND_URL__': JSON.stringify(backendUrl),
      },
    });

    console.log('  ✓ Extension TypeScript built');
  }

  // Copy static files
  if (fs.existsSync(staticDir)) {
    console.log('  Copying static files...');

    const copyRecursive = (src, dest) => {
      if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        for (const file of fs.readdirSync(src)) {
          copyRecursive(path.join(src, file), path.join(dest, file));
        }
      } else {
        fs.copyFileSync(src, dest);
      }
    };

    // Copy all static files
    for (const file of fs.readdirSync(staticDir)) {
      const src = path.join(staticDir, file);
      const dest = path.join(extensionOutDir, file);
      copyRecursive(src, dest);
    }

    // Flatten icons directory
    const iconsDir = path.join(extensionOutDir, 'icons');
    if (fs.existsSync(iconsDir)) {
      for (const icon of fs.readdirSync(iconsDir)) {
        fs.copyFileSync(
          path.join(iconsDir, icon),
          path.join(extensionOutDir, icon)
        );
      }
      fs.rmSync(iconsDir, { recursive: true });
    }

    console.log('  ✓ Static files copied');

    // Strip dev-only permissions for prod builds
    if (!isDev) {
      const manifestPath = path.join(extensionOutDir, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.host_permissions = manifest.host_permissions.filter(
        p => !p.includes('localhost')
      );
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log('  ✓ Dev permissions stripped from manifest');
    }
  }

  console.log('  ✓ Extension built to build/extension/');
}

async function bundleExtensionZip() {
  console.log('📦 Bundling extension zip...');

  // Create public directory for static files served by backend
  const publicDir = path.join(buildDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Copy icon/image files to public directory for favicon and backgrounds
  const iconsDir = path.join(staticDir, 'icons');
  if (fs.existsSync(iconsDir)) {
    for (const file of fs.readdirSync(iconsDir)) {
      if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
        fs.copyFileSync(
          path.join(iconsDir, file),
          path.join(publicDir, file)
        );
      }
    }
    console.log('  ✓ Icons and images copied to public/');
  }

  const outputZip = path.join(publicDir, 'sanitycheck-extension.zip');

  // Create temp directory for production build
  const tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'extension-'));

  try {
    // Copy all extension files
    const copyRecursive = (src, dest) => {
      if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        for (const file of fs.readdirSync(src)) {
          if (file === '.DS_Store') continue;
          copyRecursive(path.join(src, file), path.join(dest, file));
        }
      } else {
        fs.copyFileSync(src, dest);
      }
    };

    copyRecursive(extensionOutDir, tempDir);

    // Create zip using Node.js (cross-platform)
    const archiver = require('archiver');
    const output = fs.createWriteStream(outputZip);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(tempDir, false);
      archive.finalize();
    });

    if (fs.existsSync(outputZip)) {
      const stats = fs.statSync(outputZip);
      console.log(`  ✓ Extension bundled: ${(stats.size / 1024).toFixed(1)} KB`);
    } else {
      throw new Error('Failed to create extension zip');
    }

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
    const isDev = args.includes('--dev');

    // Clean build directory
    if (fs.existsSync(buildDir)) {
      fs.rmSync(buildDir, { recursive: true });
    }
    fs.mkdirSync(buildDir, { recursive: true });

    // Build shared assets (needed by backend HTML pages)
    await buildSharedAssets();

    // Build extension
    await buildExtension({ isDev });
    if (!isDev) {
      await bundleExtensionZip();
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Build complete in ${duration}s`);
    console.log('\nTo start the server: bun run start');

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();
