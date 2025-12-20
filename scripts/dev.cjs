#!/usr/bin/env node
// ABOUTME: Development server with watch mode
// ABOUTME: Rebuilds on src/ changes and restarts server automatically

const { spawn, execSync } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');

const rootDir = path.dirname(__dirname);
let serverProcess = null;
let buildTimeout = null;

function build() {
  console.log('\n🔨 Building...');
  try {
    execSync('node scripts/build.cjs --dev', { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ Build complete\n');
    return true;
  } catch (error) {
    console.error('❌ Build failed\n');
    return false;
  }
}

function startServer() {
  if (serverProcess) {
    serverProcess.kill();
  }

  console.log('🚀 Starting server...\n');
  serverProcess = spawn('bun', ['run', 'src/backend/app.ts'], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  serverProcess.on('error', (err) => {
    console.error('Server error:', err);
  });
}

function rebuild() {
  // Debounce rapid file changes
  if (buildTimeout) {
    clearTimeout(buildTimeout);
  }

  buildTimeout = setTimeout(() => {
    if (build()) {
      startServer();
    }
  }, 100);
}

// Initial build and start
if (build()) {
  startServer();
}

// Watch for changes
const watcher = chokidar.watch('src', {
  cwd: rootDir,
  ignoreInitial: true,
  ignored: /node_modules/,
});

watcher.on('all', (event, filePath) => {
  console.log(`📝 ${event}: ${filePath}`);
  rebuild();
});

console.log('👀 Watching src/ for changes...\n');

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});
