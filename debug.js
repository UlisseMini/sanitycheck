// Debug logging utility for Logic Checker extension

const DEBUG_SERVER_URL = 'http://localhost:3000/debug/log';
const DEBUG_ENABLED = true; // Set to false to disable logging

// Queue for logs when server is unavailable
let logQueue = [];
const MAX_QUEUE_SIZE = 100;

// Send log to debug server
async function sendLog(level, message, data = {}, source = 'unknown') {
  if (!DEBUG_ENABLED) return;

  const logData = {
    level,
    message,
    data: sanitizeData(data),
    source,
    timestamp: new Date().toISOString(),
    url: window.location?.href || 'popup',
    userAgent: navigator.userAgent
  };

  // Try to send immediately
  try {
    const response = await fetch(DEBUG_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
      // Don't wait too long
      signal: AbortSignal.timeout(2000)
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    // Send queued logs if any
    if (logQueue.length > 0) {
      await flushLogQueue();
    }
  } catch (error) {
    // Queue the log if server is unavailable
    logQueue.push(logData);
    if (logQueue.length > MAX_QUEUE_SIZE) {
      logQueue.shift(); // Remove oldest
    }
    
    // Also log to console as fallback
    console[level === 'error' ? 'error' : 'log'](`[${level}] [${source}]`, message, data);
  }
}

// Flush queued logs
async function flushLogQueue() {
  if (logQueue.length === 0) return;

  const logsToSend = [...logQueue];
  logQueue = [];

  for (const logData of logsToSend) {
    try {
      await fetch(DEBUG_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
        signal: AbortSignal.timeout(2000)
      });
    } catch (error) {
      // Re-queue if still failing
      logQueue.push(logData);
      if (logQueue.length > MAX_QUEUE_SIZE) {
        logQueue.shift();
      }
      break; // Stop trying if server is down
    }
  }
}

// Sanitize data for logging (remove circular references, limit size)
function sanitizeData(data) {
  if (!data) return null;
  
  try {
    const seen = new WeakSet();
    const sanitized = JSON.parse(JSON.stringify(data, (key, value) => {
      // Skip functions
      if (typeof value === 'function') {
        return '[Function]';
      }
      
      // Limit string length
      if (typeof value === 'string' && value.length > 1000) {
        return value.substring(0, 1000) + '...[truncated]';
      }
      
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      
      return value;
    }));
    
    // Limit total size
    const jsonStr = JSON.stringify(sanitized);
    if (jsonStr.length > 50000) {
      return { error: 'Data too large to log', size: jsonStr.length };
    }
    
    return sanitized;
  } catch (error) {
    return { error: 'Failed to sanitize data', errorMessage: error.message };
  }
}

// Log error with stack trace
function logError(message, error, source = 'unknown', additionalData = {}) {
  const errorData = {
    ...additionalData,
    error: {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      toString: error?.toString()
    }
  };
  
  sendLog('error', message, errorData, source);
}

// Public API
const debug = {
  log: (message, data = {}, source = 'popup') => sendLog('info', message, data, source),
  warn: (message, data = {}, source = 'popup') => sendLog('warn', message, data, source),
  error: (message, error, source = 'popup', additionalData = {}) => logError(message, error, source, additionalData),
  debug: (message, data = {}, source = 'popup') => sendLog('debug', message, data, source),
  
  // Flush queue manually
  flush: () => flushLogQueue()
};

// Set up global error handlers
if (typeof window !== 'undefined') {
  // Window errors
  window.addEventListener('error', (event) => {
    debug.error('Window error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    }, 'window-error');
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    debug.error('Unhandled promise rejection', event.reason, 'promise-rejection', {
      promise: event.promise?.toString()
    });
  });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = debug;
} else {
  window.debug = debug;
}

