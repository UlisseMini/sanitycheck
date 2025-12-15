#!/usr/bin/env node

/**
 * Preview server for extension HTML files with live reload
 * Serves extension files and automatically reloads browser on changes
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const PORT = 3002;
const EXTENSION_DIR = path.join(__dirname, '..', 'src', 'extension', 'static');

const app = express();

// Custom handler for HTML files to inject live reload script
app.get('*.html', (req, res, next) => {
  const filePath = path.join(EXTENSION_DIR, req.path);
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return next(err);
    }
    
    // Inject live reload script before </body>
    const reloadScript = `
      <script>
        (function() {
          const eventSource = new EventSource('/__reload');
          eventSource.onmessage = function(event) {
            if (event.data === 'reload') {
              window.location.reload();
            }
          };
          eventSource.onerror = function() {
            // Reconnect on error
            setTimeout(() => {
              eventSource.close();
              const newSource = new EventSource('/__reload');
              newSource.onmessage = function(e) {
                if (e.data === 'reload') window.location.reload();
              };
            }, 1000);
          };
        })();
      </script>
    `;
    
    const modifiedData = data.replace('</body>', reloadScript + '</body>');
    res.setHeader('Content-Type', 'text/html');
    res.send(modifiedData);
  });
});

// Serve other static files normally
app.use(express.static(EXTENSION_DIR));

// SSE endpoint for live reload
const clients = new Set();
app.get('/__reload', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  clients.add(res);
  
  req.on('close', () => {
    clients.delete(res);
  });
  
  // Send initial connection message
  res.write('data: connected\n\n');
});

function notifyClients() {
  clients.forEach(client => {
    client.write('data: reload\n\n');
  });
}

// Watch for file changes
function watchFiles() {
  const watchExtensions = ['.html', '.css', '.js'];
  
  function shouldWatch(file) {
    return watchExtensions.some(ext => file.endsWith(ext));
  }
  
  fs.watch(EXTENSION_DIR, { recursive: true }, (eventType, filename) => {
    if (filename && shouldWatch(filename)) {
      console.log(`\n📝 File changed: ${filename}`);
      console.log('🔄 Reloading browser...\n');
      notifyClients();
    }
  });
  
  console.log('👀 Watching for changes in:', EXTENSION_DIR);
}

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Extension Preview Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Server running at http://localhost:${PORT}`);
  console.log(`\n📄 Available pages:`);
  console.log(`   • Popup:      http://localhost:${PORT}/popup.html`);
  console.log(`   • Welcome:    http://localhost:${PORT}/welcome.html`);
  console.log(`   • Settings:   http://localhost:${PORT}/settings.html`);
  console.log('\n💡 Changes will auto-reload in the browser');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  watchFiles();
  
  // Open browser automatically (macOS)
  const url = `http://localhost:${PORT}/popup.html`;
  exec(`open "${url}"`, (error) => {
    if (error) {
      console.log(`⚠️  Could not open browser automatically. Please visit: ${url}\n`);
    }
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down preview server...');
  clients.forEach(client => client.end());
  process.exit(0);
});

