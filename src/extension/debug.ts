/**
 * Debug logging utility for SanityCheck extension
 */

import { BACKEND_URL } from './config';

const DEBUG_ENABLED = true;
const EXTENSION_VERSION = '1.2.0';
const DEBUG_SERVER_URL = `${BACKEND_URL}/debug/log`;

interface LogData {
  [key: string]: unknown;
}

interface LogEntry {
  level: string;
  message: string;
  data: LogData | null;
  source: string;
  version: string;
  timestamp: string;
  url: string;
  userAgent: string;
}

let logQueue: LogEntry[] = [];
const MAX_QUEUE_SIZE = 100;

function sanitizeData(data: unknown): LogData | null {
  if (!data) return null;
  
  try {
    const seen = new WeakSet();
    const sanitized = JSON.parse(JSON.stringify(data, (_key, value: unknown) => {
      if (typeof value === 'function') {
        return '[Function]';
      }
      
      if (typeof value === 'string' && value.length > 1000) {
        return value.substring(0, 1000) + '...[truncated]';
      }
      
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      
      return value;
    })) as LogData;
    
    const jsonStr = JSON.stringify(sanitized);
    if (jsonStr.length > 50000) {
      return { error: 'Data too large to log', size: jsonStr.length };
    }
    
    return sanitized;
  } catch (error) {
    const err = error as Error;
    return { error: 'Failed to sanitize data', errorMessage: err.message };
  }
}

async function sendLog(level: string, message: string, data: LogData = {}, source = 'unknown'): Promise<void> {
  if (!DEBUG_ENABLED) return;

  const logData: LogEntry = {
    level,
    message,
    data: sanitizeData(data),
    source,
    version: EXTENSION_VERSION,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location?.href ?? 'background' : 'background',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };

  try {
    const response = await fetch(DEBUG_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
      signal: AbortSignal.timeout(2000)
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    if (logQueue.length > 0) {
      await flushLogQueue();
    }
  } catch (_error) {
    logQueue.push(logData);
    if (logQueue.length > MAX_QUEUE_SIZE) {
      logQueue.shift();
    }
    
    console[level === 'error' ? 'error' : 'log'](`[${level}] [${source}]`, message, data);
  }
}

async function flushLogQueue(): Promise<void> {
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
    } catch (_error) {
      logQueue.push(logData);
      if (logQueue.length > MAX_QUEUE_SIZE) {
        logQueue.shift();
      }
      break;
    }
  }
}

function logError(message: string, error: unknown, source = 'unknown', additionalData: LogData = {}): void {
  const err = error as Error | undefined;
  const errorData: LogData = {
    ...additionalData,
    error: {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    }
  };
  
  void sendLog('error', message, errorData, source);
}

export const debug = {
  ENABLED: DEBUG_ENABLED,
  log: (message: string, data: LogData = {}, source = 'popup'): void => { void sendLog('info', message, data, source); },
  warn: (message: string, data: LogData = {}, source = 'popup'): void => { void sendLog('warn', message, data, source); },
  error: (message: string, error: unknown, source = 'popup', additionalData: LogData = {}): void => { logError(message, error, source, additionalData); },
  debug: (message: string, data: LogData = {}, source = 'popup'): void => { void sendLog('debug', message, data, source); },
  flush: (): Promise<void> => flushLogQueue()
};

export function createContentDebugger() {
  return {
    log: (message: string, data: LogData = {}, source = 'content'): void => {
      void sendLog('log', message, { ...data, url: window.location.href }, source);
    },
    warn: (message: string, data: LogData = {}, source = 'content'): void => {
      void sendLog('warn', message, { ...data, url: window.location.href }, source);
    },
    error: (message: string, error: unknown, source = 'content', additionalData: LogData = {}): void => {
      logError(message, error, source, { ...additionalData, url: window.location.href });
    },
    debug: (message: string, data: LogData = {}, source = 'content'): void => {
      void sendLog('debug', message, { ...data, url: window.location.href }, source);
    }
  };
}

// Set up global error handlers in browser context
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    debug.error('Window error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    }, 'window-error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    debug.error('Unhandled promise rejection', event.reason, 'promise-rejection');
  });
  
  // Export to window for scripts that can't import
  (window as unknown as { debug: typeof debug }).debug = debug;
}

export default debug;
