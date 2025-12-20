#!/usr/bin/env node
// ABOUTME: Development server with watch mode
// ABOUTME: Rebuilds on src/ changes and restarts server automatically

const { spawn, execSync } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');
const { WebSocketServer } = require('ws');

const rootDir = path.dirname(__dirname);
let serverProcess = null;
let buildTimeout = null;

// Websocket server for extension auto-reload
const RELOAD_PORT = 8890;
const wss = new WebSocketServer({ port: RELOAD_PORT });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('🔌 Extension connected for auto-reload');
  ws.on('close', () => clients.delete(ws));
});

function notifyExtensionReload() {
  for (const client of clients) {
    client.send('reload');
  }
  if (clients.size > 0) {
    console.log('🔄 Notified extension to reload');
  }
}

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
      notifyExtensionReload();
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

console.log('👀 Watching src/ for changes...');
console.log(`🔌 Extension reload server on ws://localhost:${RELOAD_PORT}\n`);

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});
