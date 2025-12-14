const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const LOG_FILE = path.join(__dirname, 'debug.log');

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '');
}

// Helper to write to log file
function writeLog(level, data) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    ...data
  };
  
  const logLine = JSON.stringify(logEntry) + '\n';
  
  try {
    fs.appendFileSync(LOG_FILE, logLine, 'utf8');
    console.log(`[${timestamp}] [${level}]`, data);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Debug logging endpoint
app.post('/debug/log', (req, res) => {
  const { level = 'info', message, data, source, error } = req.body;
  
  writeLog(level, {
    message,
    data,
    source: source || 'unknown',
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined
  });
  
  res.json({ success: true, timestamp: new Date().toISOString() });
});

// Get recent logs endpoint
app.get('/debug/logs', (req, res) => {
  const lines = parseInt(req.query.lines) || 100;
  
  try {
    const logContent = fs.readFileSync(LOG_FILE, 'utf8');
    const logLines = logContent.trim().split('\n').filter(l => l);
    const recentLogs = logLines.slice(-lines).map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return { raw: line };
      }
    });
    
    res.json({ logs: recentLogs, total: logLines.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear logs endpoint
app.delete('/debug/logs', (req, res) => {
  try {
    fs.writeFileSync(LOG_FILE, '');
    res.json({ success: true, message: 'Logs cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/debug/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    logFile: LOG_FILE,
    logFileExists: fs.existsSync(LOG_FILE)
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Debug server running on http://localhost:${PORT}`);
  console.log(`Log file: ${LOG_FILE}`);
  console.log('Endpoints:');
  console.log(`  POST /debug/log - Send debug log`);
  console.log(`  GET  /debug/logs?lines=100 - Get recent logs`);
  console.log(`  DELETE /debug/logs - Clear logs`);
  console.log(`  GET  /debug/health - Health check`);
  
  writeLog('info', { message: 'Debug server started', port: PORT });
});

// Handle server errors
process.on('uncaughtException', (error) => {
  writeLog('error', {
    message: 'Uncaught exception',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });
});

process.on('unhandledRejection', (reason, promise) => {
  writeLog('error', {
    message: 'Unhandled promise rejection',
    reason: reason instanceof Error ? {
      name: reason.name,
      message: reason.message,
      stack: reason.stack
    } : reason
  });
});

