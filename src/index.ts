import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { generateHomepage } from './backend/pages/homepage';

const app = express();

// Hash function for text deduplication
function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
}
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Admin key validation - must be set and not the weak default
const ADMIN_KEY = process.env.ADMIN_KEY;
if (!ADMIN_KEY) {
  console.error('FATAL: ADMIN_KEY environment variable is not set');
  process.exit(1);
}
if (ADMIN_KEY === 'changeme') {
  console.error('FATAL: ADMIN_KEY cannot be "changeme" - please set a strong admin key');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Ensure public directory exists
const publicDir = path.join(__dirname, '../public');
if (!require('fs').existsSync(publicDir)) {
  require('fs').mkdirSync(publicDir, { recursive: true });
  console.log('Created public directory:', publicDir);
}

// Serve static files (extension zip)
app.use('/static', express.static(publicDir));

// Log available static files at startup
const fs = require('fs');
if (fs.existsSync(publicDir)) {
  const files = fs.readdirSync(publicDir);
  console.log('Static files available:', files);
} else {
  console.warn('WARNING: Public directory does not exist:', publicDir);
}

// Admin auth middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const key = authHeader?.replace('Bearer ', '') || req.query.key as string;
  
  if (key !== ADMIN_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =====================================================
// Anthropic API Proxy - for extension to call Claude
// =====================================================
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

app.post('/analyze', async (req: Request, res: Response) => {
  try {
    if (!ANTHROPIC_API_KEY) {
      res.status(500).json({ error: 'Anthropic API key not configured on server' });
      return;
    }

    const { prompt, maxTokens = 8192, temperature = 0.3 } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'prompt is required' });
      return;
    }

    console.log(`[analyze] Calling Anthropic API, prompt length: ${prompt.length}`);
    const startTime = Date.now();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[analyze] Anthropic API error: ${response.status}`, errorData);
      res.status(response.status).json({ 
        error: `Anthropic API error: ${response.status}`,
        details: errorData
      });
      return;
    }

    const data = await response.json() as {
      model: string;
      content: Array<{ type: string; text: string }>;
    };
    console.log(`[analyze] Success in ${duration}ms, model: ${data.model}`);

    // Extract text from response
    const firstContent = data.content[0];
    if (data.content && data.content.length > 0 && firstContent) {
      const text = firstContent.text;
      res.json({ 
        text,
        model: data.model,
        duration
      });
    } else {
      res.status(500).json({ error: 'No content in API response' });
    }
  } catch (error) {
    console.error('[analyze] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// Homepage (generated from shared modules)
// =====================================================

app.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(generateHomepage());
});

// =====================================================
// Admin Page
// =====================================================

const ADMIN_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SanityCheck Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%);
      min-height: 100vh;
      color: #e4e4e7;
    }
    
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    
    .login-box {
      background: rgba(30, 30, 40, 0.8);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    
    .login-title {
      font-size: 24px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #f97316, #fb923c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .login-subtitle {
      text-align: center;
      color: #71717a;
      margin-bottom: 32px;
      font-size: 14px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #a1a1aa;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .form-input {
      width: 100%;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      font-family: 'JetBrains Mono', monospace;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    .form-input:focus {
      outline: none;
      border-color: #f97316;
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2);
    }
    
    .btn {
      width: 100%;
      padding: 14px 20px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(249, 115, 22, 0.3);
    }
    
    .error-msg {
      color: #ef4444;
      font-size: 13px;
      text-align: center;
      margin-top: 16px;
      display: none;
    }
    
    /* Dashboard styles */
    .dashboard { display: none; }
    .dashboard.active { display: block; }
    .login-container.hidden { display: none; }
    
    .header {
      background: rgba(30, 30, 40, 0.9);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 16px 24px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .header-title {
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, #f97316, #fb923c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .logout-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #e4e4e7;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    
    .stat-card {
      background: rgba(30, 30, 40, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
    }
    
    .stat-value {
      font-size: 36px;
      font-weight: 700;
      color: #f97316;
      font-family: 'JetBrains Mono', monospace;
    }
    
    .stat-label {
      font-size: 13px;
      color: #71717a;
      margin-top: 4px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .export-btn {
      background: rgba(34, 197, 94, 0.2);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #22c55e;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s;
    }
    
    .export-btn:hover {
      background: rgba(34, 197, 94, 0.3);
    }
    
    .annotations-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .annotation-card {
      background: rgba(30, 30, 40, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      transition: border-color 0.2s;
    }
    
    .annotation-card:hover {
      border-color: rgba(249, 115, 22, 0.3);
    }
    
    .annotation-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    
    .annotation-type {
      background: rgba(249, 115, 22, 0.2);
      color: #fb923c;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .annotation-date {
      color: #71717a;
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
    }
    
    .annotation-quote {
      background: rgba(0, 0, 0, 0.3);
      border-left: 3px solid #f97316;
      padding: 12px 16px;
      margin-bottom: 12px;
      border-radius: 4px;
      font-style: italic;
      color: #a1a1aa;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .annotation-text {
      font-size: 14px;
      line-height: 1.6;
      color: #e4e4e7;
      margin-bottom: 12px;
    }
    
    .annotation-url {
      font-size: 12px;
      color: #71717a;
      font-family: 'JetBrains Mono', monospace;
      word-break: break-all;
    }
    
    .annotation-url a {
      color: #60a5fa;
      text-decoration: none;
    }
    
    .annotation-url a:hover {
      text-decoration: underline;
    }
    
    .delete-btn {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .delete-btn:hover {
      background: rgba(239, 68, 68, 0.3);
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #71717a;
    }
    
    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 24px;
    }
    
    .page-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #e4e4e7;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .page-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
    }
    
    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: #71717a;
    }
    
    /* Tabs */
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
      background: rgba(30, 30, 40, 0.6);
      padding: 4px;
      border-radius: 10px;
      width: fit-content;
    }
    
    .tab-btn {
      background: transparent;
      border: none;
      color: #71717a;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .tab-btn:hover {
      color: #e4e4e7;
    }
    
    .tab-btn.active {
      background: rgba(249, 115, 22, 0.2);
      color: #fb923c;
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
    }
    
    /* Debug Logs */
    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      align-items: center;
    }
    
    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .filter-label {
      font-size: 12px;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .filter-select, .filter-input {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 8px 12px;
      color: #e4e4e7;
      font-size: 13px;
      min-width: 120px;
    }
    
    .filter-select:focus, .filter-input:focus {
      outline: none;
      border-color: #f97316;
    }
    
    .time-shortcuts {
      display: flex;
      gap: 6px;
    }
    
    .time-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #a1a1aa;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .time-btn:hover, .time-btn.active {
      background: rgba(249, 115, 22, 0.2);
      border-color: rgba(249, 115, 22, 0.3);
      color: #fb923c;
    }
    
    .log-entry {
      background: rgba(30, 30, 40, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
    }
    
    .log-entry.level-error {
      border-left: 3px solid #ef4444;
    }
    
    .log-entry.level-warn {
      border-left: 3px solid #eab308;
    }
    
    .log-entry.level-log {
      border-left: 3px solid #22c55e;
    }
    
    .log-entry.level-debug {
      border-left: 3px solid #6b7280;
    }
    
    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .log-meta {
      display: flex;
      gap: 12px;
      color: #71717a;
      font-size: 11px;
    }
    
    .log-level {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .log-level.error { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .log-level.warn { background: rgba(234, 179, 8, 0.2); color: #eab308; }
    .log-level.log { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .log-level.debug { background: rgba(107, 114, 128, 0.2); color: #9ca3af; }
    
    .log-message {
      color: #e4e4e7;
      margin-bottom: 6px;
      word-break: break-word;
    }
    
    .log-data {
      background: rgba(0, 0, 0, 0.3);
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      color: #a1a1aa;
      white-space: pre-wrap;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .log-source {
      color: #60a5fa;
    }
    
    .log-ip {
      color: #c084fc;
    }
    
    .log-version {
      color: #22c55e;
    }
    
    .clear-logs-btn {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      margin-left: auto;
    }
    
    .clear-logs-btn:hover {
      background: rgba(239, 68, 68, 0.3);
    }
    
    .refresh-btn {
      background: rgba(59, 130, 246, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #60a5fa;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
    }
    
    .refresh-btn:hover {
      background: rgba(59, 130, 246, 0.3);
    }
    
    /* Article Modal */
    .article-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    
    .article-modal-content {
      background: #1a1a2e;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .article-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .article-modal-header h2 {
      font-size: 18px;
      color: #f97316;
      margin: 0;
    }
    
    .article-modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }
    
    .articles-list, .comments-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  </style>
</head>
<body>
  <div class="login-container" id="loginContainer">
    <div class="login-box">
      <h1 class="login-title">SanityCheck</h1>
      <p class="login-subtitle">Admin Dashboard</p>
      
      <form id="loginForm">
        <div class="form-group">
          <label class="form-label">Admin Key</label>
          <input type="password" class="form-input" id="adminKey" placeholder="Enter admin key..." required>
        </div>
        <button type="submit" class="btn">Sign In</button>
        <p class="error-msg" id="errorMsg">Invalid admin key</p>
      </form>
    </div>
  </div>
  
  <div class="dashboard" id="dashboard">
    <header class="header">
      <div class="header-inner">
        <h1 class="header-title">SanityCheck Admin</h1>
        <button class="logout-btn" onclick="logout()">Logout</button>
      </div>
    </header>
    
    <div class="container">
      <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('articles')">Articles</button>
        <button class="tab-btn" onclick="switchTab('comments')">Comments</button>
        <button class="tab-btn" onclick="switchTab('logs')">Debug Logs</button>
      </div>
      
      <!-- Articles Tab -->
      <div class="tab-content active" id="tab-articles">
        <div class="stats-grid" id="statsGrid">
          <div class="stat-card">
            <div class="stat-value" id="articleCount">-</div>
            <div class="stat-label">Total Articles</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="analysisCount">-</div>
            <div class="stat-label">Analyses</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="commentCount">-</div>
            <div class="stat-label">Comments</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="highlightCount">-</div>
            <div class="stat-label">Highlights</div>
          </div>
        </div>
        
        <div class="section-title">
          <span>Recent Articles</span>
        </div>
        
        <div class="articles-list" id="articlesList">
          <div class="loading">Loading articles...</div>
        </div>
        
        <div class="pagination" id="articlesPagination"></div>
      </div>
      
      <!-- Comments Tab -->
      <div class="tab-content" id="tab-comments">
        <div class="section-title">
          <span>User Feedback</span>
        </div>
        
        <div class="comments-list" id="commentsList">
          <div class="loading">Loading comments...</div>
        </div>
        
        <div class="pagination" id="commentsPagination"></div>
      </div>
      
      <!-- Debug Logs Tab -->
      <div class="tab-content" id="tab-logs">
        <div class="filters">
          <div class="filter-group">
            <span class="filter-label">Time:</span>
            <div class="time-shortcuts">
              <button class="time-btn active" data-since="5m">5m</button>
              <button class="time-btn" data-since="15m">15m</button>
              <button class="time-btn" data-since="1h">1h</button>
              <button class="time-btn" data-since="6h">6h</button>
              <button class="time-btn" data-since="24h">24h</button>
              <button class="time-btn" data-since="">All</button>
            </div>
          </div>
          
          <div class="filter-group">
            <span class="filter-label">IP:</span>
            <select class="filter-select" id="ipFilter">
              <option value="">All IPs</option>
            </select>
          </div>
          
          <div class="filter-group">
            <span class="filter-label">Level:</span>
            <select class="filter-select" id="levelFilter">
              <option value="">All Levels</option>
              <option value="error">Error</option>
              <option value="warn">Warn</option>
              <option value="log">Log</option>
              <option value="debug">Debug</option>
            </select>
          </div>
          
          <button class="refresh-btn" onclick="loadDebugLogs()">Refresh</button>
          <button class="clear-logs-btn" onclick="clearOldLogs()">Clear Old</button>
        </div>
        
        <div class="section-title">
          <span>Debug Logs</span>
          <span id="logCount" style="color: #71717a; font-size: 13px;">-</span>
        </div>
        
        <div id="debugLogsList">
          <div class="loading">Loading logs...</div>
        </div>
        
        <div class="pagination" id="logsPagination"></div>
      </div>
    </div>
  </div>

  <script>
    let adminKey = '';
    let currentPage = 0;
    const limit = 20;
    const STORAGE_KEY = 'logicCheckerAdminKey';
    
    // Check for stored admin key on page load
    window.addEventListener('DOMContentLoaded', () => {
      const storedKey = localStorage.getItem(STORAGE_KEY);
      if (storedKey) {
        adminKey = storedKey;
        // Try to verify the stored key
        verifyAndLogin(storedKey);
      }
    });
    
    async function verifyAndLogin(key) {
      try {
        const res = await fetch('/admin/verify', {
          headers: { 'Authorization': 'Bearer ' + key }
        });
        
        if (res.ok) {
          adminKey = key;
          localStorage.setItem(STORAGE_KEY, key);
          document.getElementById('loginContainer').classList.add('hidden');
          document.getElementById('dashboard').classList.add('active');
          loadDashboard();
        } else {
          // Stored key is invalid, clear it
          localStorage.removeItem(STORAGE_KEY);
          adminKey = '';
        }
      } catch (err) {
        // Network error, clear stored key
        localStorage.removeItem(STORAGE_KEY);
        adminKey = '';
      }
    }
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const key = document.getElementById('adminKey').value;
      await verifyAndLogin(key);
      
      if (!adminKey) {
        document.getElementById('errorMsg').style.display = 'block';
      }
    });
    
    function logout() {
      adminKey = '';
      localStorage.removeItem(STORAGE_KEY);
      document.getElementById('loginContainer').classList.remove('hidden');
      document.getElementById('dashboard').classList.remove('active');
      document.getElementById('adminKey').value = '';
      document.getElementById('errorMsg').style.display = 'none';
    }
    
    async function loadDashboard() {
      await loadFeedbackStats();
      await loadArticles();
    }
    
    async function loadFeedbackStats() {
      try {
        const res = await fetch('/admin/feedback-stats', {
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        const data = await res.json();
        
        document.getElementById('articleCount').textContent = data.articles || 0;
        document.getElementById('analysisCount').textContent = data.analyses || 0;
        document.getElementById('commentCount').textContent = data.comments || 0;
        document.getElementById('highlightCount').textContent = data.highlights || 0;
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }
    
    // Articles
    let articlesPage = 0;
    
    async function loadArticles() {
      const list = document.getElementById('articlesList');
      list.innerHTML = '<div class="loading">Loading...</div>';
      
      try {
        const res = await fetch('/admin/articles?limit=' + limit + '&offset=' + (articlesPage * limit), {
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        const data = await res.json();
        
        if (!data.articles || data.articles.length === 0) {
          list.innerHTML = '<div class="empty-state"><p>No articles yet</p></div>';
          return;
        }
        
        list.innerHTML = data.articles.map(article => \`
          <div class="annotation-card" data-id="\${article.id}">
            <div class="annotation-header">
              <span class="annotation-type">\${article.analysisCount} analyses · \${article.commentCount} comments</span>
              <span class="annotation-date">\${new Date(article.createdAt).toLocaleString()}</span>
            </div>
            <div style="font-weight: 600; margin-bottom: 8px;">\${escapeHtml(article.title || 'Untitled')}</div>
            <div class="annotation-quote">\${escapeHtml(article.textPreview)}</div>
            \${article.latestAnalysis ? \`
              <div style="margin-top: 8px; font-size: 12px; color: #71717a;">
                Latest: <span style="color: \${article.latestAnalysis.severity === 'significant' ? '#ef4444' : article.latestAnalysis.severity === 'moderate' ? '#eab308' : '#22c55e'}">\${article.latestAnalysis.severity || 'none'}</span>
                · \${article.latestAnalysis.highlightCount} highlights
              </div>
            \` : ''}
            <div class="annotation-url">
              <a href="\${article.url}" target="_blank">\${article.url}</a>
            </div>
            <div style="margin-top: 12px; text-align: right;">
              <button class="page-btn" onclick="viewArticle('\${article.id}')" style="margin-right: 8px;">View Details</button>
              <button class="delete-btn" onclick="deleteArticle('\${article.id}')">Delete</button>
            </div>
          </div>
        \`).join('');
        
        renderArticlesPagination(data.total);
      } catch (err) {
        list.innerHTML = '<div class="empty-state"><p>Failed to load articles</p></div>';
      }
    }
    
    function renderArticlesPagination(total) {
      const totalPages = Math.ceil(total / limit);
      const pagination = document.getElementById('articlesPagination');
      
      if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
      }
      
      pagination.innerHTML = \`
        <button class="page-btn" onclick="changeArticlesPage(-1)" \${articlesPage === 0 ? 'disabled' : ''}>← Prev</button>
        <span style="padding: 8px 16px; color: #71717a;">Page \${articlesPage + 1} of \${totalPages}</span>
        <button class="page-btn" onclick="changeArticlesPage(1)" \${articlesPage >= totalPages - 1 ? 'disabled' : ''}>Next →</button>
      \`;
    }
    
    function changeArticlesPage(delta) {
      articlesPage += delta;
      loadArticles();
    }
    
    async function deleteArticle(id) {
      if (!confirm('Delete this article and all its analyses/comments?')) return;
      
      try {
        const res = await fetch('/admin/articles/' + id, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        
        if (res.ok) {
          loadFeedbackStats();
          loadArticles();
        } else {
          alert('Failed to delete');
        }
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    }
    
    async function viewArticle(id) {
      try {
        const res = await fetch('/admin/articles/' + id, {
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        const data = await res.json();
        const article = data.article;
        
        // Show in modal or new view
        const modal = document.createElement('div');
        modal.className = 'article-modal';
        modal.innerHTML = \`
          <div class="article-modal-content">
            <div class="article-modal-header">
              <h2>\${escapeHtml(article.title || 'Article Details')}</h2>
              <button onclick="this.closest('.article-modal').remove()" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer;">×</button>
            </div>
            <div class="article-modal-body">
              <div style="margin-bottom: 16px;">
                <a href="\${article.url}" target="_blank" style="color: #60a5fa;">\${article.url}</a>
                <span style="color: #71717a; margin-left: 12px;">\${new Date(article.createdAt).toLocaleString()}</span>
              </div>
              
              <h3 style="margin: 20px 0 12px; color: #f97316;">Article Text</h3>
              <div style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; max-height: 300px; overflow-y: auto; white-space: pre-wrap; font-size: 13px; line-height: 1.6;">\${escapeHtml(article.textContent)}</div>
              
              <h3 style="margin: 20px 0 12px; color: #f97316;">Analyses (\${article.analyses.length})</h3>
              \${article.analyses.map(a => \`
                <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #a1a1aa;">\${a.modelVersion || 'unknown model'}</span>
                    <span style="color: \${a.severity === 'significant' ? '#ef4444' : a.severity === 'moderate' ? '#eab308' : '#22c55e'}">\${a.severity || 'none'}</span>
                  </div>
                  <div style="font-size: 12px; color: #71717a; margin-bottom: 8px;">\${a.highlights.length} highlights</div>
                  \${a.highlights.map(h => \`
                    <div style="background: rgba(249,115,22,0.1); border-left: 3px solid \${h.importance === 'critical' ? '#ef4444' : h.importance === 'significant' ? '#eab308' : '#6b7280'}; padding: 8px 12px; margin: 8px 0; border-radius: 4px;">
                      <div style="font-style: italic; color: #a1a1aa; margin-bottom: 4px;">"\${escapeHtml(h.quote.substring(0, 100))}\${h.quote.length > 100 ? '...' : ''}"</div>
                      <div style="color: #e4e4e7;">\${escapeHtml(h.gap)}</div>
                    </div>
                  \`).join('')}
                </div>
              \`).join('') || '<div style="color: #71717a;">No analyses yet</div>'}
              
              <h3 style="margin: 20px 0 12px; color: #f97316;">Comments (\${article.comments.length})</h3>
              \${article.comments.map(c => \`
                <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                  <div style="font-style: italic; color: #a1a1aa; margin-bottom: 8px;">"\${escapeHtml(c.selectedText.substring(0, 100))}\${c.selectedText.length > 100 ? '...' : ''}"</div>
                  <div style="color: #e4e4e7;">\${escapeHtml(c.commentText)}</div>
                  <div style="font-size: 11px; color: #71717a; margin-top: 8px;">\${new Date(c.createdAt).toLocaleString()} · \${c.ip || 'unknown IP'}</div>
                </div>
              \`).join('') || '<div style="color: #71717a;">No comments yet</div>'}
            </div>
          </div>
        \`;
        document.body.appendChild(modal);
      } catch (err) {
        alert('Failed to load article: ' + err.message);
      }
    }
    
    // Comments
    let commentsPage = 0;
    
    async function loadComments() {
      const list = document.getElementById('commentsList');
      list.innerHTML = '<div class="loading">Loading...</div>';
      
      try {
        const res = await fetch('/admin/comments?limit=' + limit + '&offset=' + (commentsPage * limit), {
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        const data = await res.json();
        
        if (!data.comments || data.comments.length === 0) {
          list.innerHTML = '<div class="empty-state"><p>No comments yet</p></div>';
          return;
        }
        
        list.innerHTML = data.comments.map(comment => \`
          <div class="annotation-card" data-id="\${comment.id}">
            <div class="annotation-header">
              <span class="annotation-type">Feedback</span>
              <span class="annotation-date">\${new Date(comment.createdAt).toLocaleString()}</span>
            </div>
            <div class="annotation-quote">"\${escapeHtml(comment.selectedText)}"</div>
            <div class="annotation-text">\${escapeHtml(comment.commentText)}</div>
            <div class="annotation-url">
              <a href="\${comment.article.url}" target="_blank">\${comment.article.title || comment.article.url}</a>
            </div>
            <div style="margin-top: 12px; text-align: right;">
              <button class="delete-btn" onclick="deleteComment('\${comment.id}')">Delete</button>
            </div>
          </div>
        \`).join('');
        
        renderCommentsPagination(data.total);
      } catch (err) {
        list.innerHTML = '<div class="empty-state"><p>Failed to load comments</p></div>';
      }
    }
    
    function renderCommentsPagination(total) {
      const totalPages = Math.ceil(total / limit);
      const pagination = document.getElementById('commentsPagination');
      
      if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
      }
      
      pagination.innerHTML = \`
        <button class="page-btn" onclick="changeCommentsPage(-1)" \${commentsPage === 0 ? 'disabled' : ''}>← Prev</button>
        <span style="padding: 8px 16px; color: #71717a;">Page \${commentsPage + 1} of \${totalPages}</span>
        <button class="page-btn" onclick="changeCommentsPage(1)" \${commentsPage >= totalPages - 1 ? 'disabled' : ''}>Next →</button>
      \`;
    }
    
    function changeCommentsPage(delta) {
      commentsPage += delta;
      loadComments();
    }
    
    async function deleteComment(id) {
      if (!confirm('Delete this comment?')) return;
      
      try {
        const res = await fetch('/admin/comments/' + id, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        
        if (res.ok) {
          loadFeedbackStats();
          loadComments();
        } else {
          alert('Failed to delete');
        }
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text || '';
      return div.innerHTML;
    }
    
    // Tab switching
    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
      document.querySelector(\`[onclick="switchTab('\${tab}')"]\`).classList.add('active');
      document.getElementById('tab-' + tab).classList.add('active');
      
      if (tab === 'articles') {
        loadArticles();
      } else if (tab === 'comments') {
        loadComments();
      } else if (tab === 'logs') {
        loadDebugLogs();
      }
    }
    
    // Debug Logs
    let logsPage = 0;
    const logsLimit = 50;
    let currentSince = '5m';
    
    // Time shortcuts
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSince = btn.dataset.since;
        logsPage = 0;
        loadDebugLogs();
      });
    });
    
    // Filters
    document.getElementById('ipFilter').addEventListener('change', () => { logsPage = 0; loadDebugLogs(); });
    document.getElementById('levelFilter').addEventListener('change', () => { logsPage = 0; loadDebugLogs(); });
    
    async function loadDebugLogs() {
      const list = document.getElementById('debugLogsList');
      list.innerHTML = '<div class="loading">Loading...</div>';
      
      const ip = document.getElementById('ipFilter').value;
      const level = document.getElementById('levelFilter').value;
      
      let url = '/debug/logs?limit=' + logsLimit + '&offset=' + (logsPage * logsLimit);
      if (currentSince) url += '&since=' + currentSince;
      if (ip) url += '&ip=' + encodeURIComponent(ip);
      if (level) url += '&level=' + level;
      
      try {
        const res = await fetch(url, {
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        
        if (!res.ok) throw new Error('Failed to load logs');
        
        const data = await res.json();
        
        // Update IP filter options
        const ipSelect = document.getElementById('ipFilter');
        const currentIp = ipSelect.value;
        ipSelect.innerHTML = '<option value="">All IPs</option>' + 
          data.availableIps.map(i => \`<option value="\${i.ip}" \${i.ip === currentIp ? 'selected' : ''}>\${i.ip} (\${i.count})</option>\`).join('');
        
        document.getElementById('logCount').textContent = data.total + ' logs';
        
        if (!data.logs || data.logs.length === 0) {
          list.innerHTML = '<div class="empty-state"><p>No logs found</p></div>';
          return;
        }
        
        list.innerHTML = data.logs.map(log => \`
          <div class="log-entry level-\${log.level}">
            <div class="log-header">
              <div>
                <span class="log-level \${log.level}">\${log.level}</span>
                <span class="log-source">\${log.source || '-'}</span>
                \${log.version ? \`<span class="log-version">v\${log.version}</span>\` : ''}
              </div>
              <div class="log-meta">
                <span class="log-ip">\${log.ip || '-'}</span>
                <span>\${new Date(log.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div class="log-message">\${escapeHtml(log.message)}</div>
            \${log.data ? \`<div class="log-data">\${escapeHtml(JSON.stringify(log.data, null, 2))}</div>\` : ''}
          </div>
        \`).join('');
        
        renderLogsPagination(data.total);
      } catch (err) {
        list.innerHTML = '<div class="empty-state"><p>Failed to load logs</p></div>';
      }
    }
    
    function renderLogsPagination(total) {
      const totalPages = Math.ceil(total / logsLimit);
      const pagination = document.getElementById('logsPagination');
      
      if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
      }
      
      pagination.innerHTML = \`
        <button class="page-btn" onclick="changeLogsPage(-1)" \${logsPage === 0 ? 'disabled' : ''}>← Prev</button>
        <span style="padding: 8px 16px; color: #71717a;">Page \${logsPage + 1} of \${totalPages}</span>
        <button class="page-btn" onclick="changeLogsPage(1)" \${logsPage >= totalPages - 1 ? 'disabled' : ''}>Next →</button>
      \`;
    }
    
    function changeLogsPage(delta) {
      logsPage += delta;
      loadDebugLogs();
    }
    
    async function clearOldLogs() {
      const days = prompt('Clear logs older than how many days?', '7');
      if (!days || isNaN(parseInt(days))) return;
      
      if (!confirm(\`Delete all logs older than \${days} days?\`)) return;
      
      try {
        const res = await fetch('/debug/logs?olderThan=' + days + 'd', {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        
        const data = await res.json();
        alert(\`Deleted \${data.deleted} logs\`);
        loadDebugLogs();
      } catch (err) {
        alert('Failed to clear logs');
      }
    }
  </script>
</body>
</html>
`;

// Serve admin page
app.get('/admin', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(ADMIN_HTML);
});

// Verify admin key
app.get('/admin/verify', requireAdmin, (_req: Request, res: Response) => {
  res.json({ success: true });
});

// Delete annotation (admin only)
app.delete('/admin/annotations/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.annotation.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// Public API
// =====================================================

// Submit an annotation
app.post('/annotations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, title, quote, annotation, fallacyType, userId } = req.body;
    
    // Validation
    if (!url || !quote || !annotation) {
      res.status(400).json({ 
        error: 'Missing required fields: url, quote, annotation' 
      });
      return;
    }
    
    const userAgent = req.headers['user-agent'] || null;
    
    const created = await prisma.annotation.create({
      data: {
        url,
        title: title || null,
        quote,
        annotation,
        fallacyType: fallacyType || null,
        userId: userId || null,
        userAgent,
      }
    });
    
    console.log(`New annotation: ${created.id} for ${url}`);
    
    res.status(201).json({ 
      success: true, 
      id: created.id,
      createdAt: created.createdAt
    });
  } catch (error) {
    next(error);
  }
});

// Get all annotations (for later use in prompt engineering)
app.get('/annotations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const fallacyType = req.query.fallacyType as string | undefined;
    
    const where = fallacyType ? { fallacyType } : {};
    
    const [annotations, total] = await Promise.all([
      prisma.annotation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.annotation.count({ where })
    ]);
    
    res.json({
      annotations,
      total,
      limit,
      offset
    });
  } catch (error) {
    next(error);
  }
});

// Get annotations for a specific URL
app.get('/annotations/by-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const url = req.query.url as string;
    
    if (!url) {
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }
    
    const annotations = await prisma.annotation.findMany({
      where: { url },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ annotations });
  } catch (error) {
    next(error);
  }
});

// Get stats
app.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [total, byType, recentCount] = await Promise.all([
      prisma.annotation.count(),
      prisma.annotation.groupBy({
        by: ['fallacyType'],
        _count: true,
        orderBy: { _count: { fallacyType: 'desc' } }
      }),
      prisma.annotation.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // last 24h
          }
        }
      })
    ]);
    
    res.json({
      total,
      last24h: recentCount,
      byFallacyType: byType.map((b: { fallacyType: string | null; _count: number }) => ({
        type: b.fallacyType || 'unspecified',
        count: b._count
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Export annotations as JSONL (for prompt engineering) - requires admin key
app.get('/export', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const annotations = await prisma.annotation.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        url: true,
        quote: true,
        annotation: true,
        fallacyType: true,
        createdAt: true
      }
    });
    
    res.setHeader('Content-Type', 'application/jsonl');
    res.setHeader('Content-Disposition', 'attachment; filename=annotations.jsonl');
    
    for (const ann of annotations) {
      res.write(JSON.stringify(ann) + '\n');
    }
    res.end();
  } catch (error) {
    next(error);
  }
});

// =====================================================
// Debug Logs API
// =====================================================

// Receive debug logs from extension (public endpoint)
app.post('/debug/log', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { level, message, data, source, version } = req.body;
    
    if (!message) {
      res.status(400).json({ error: 'Missing message' });
      return;
    }
    
    // Get client IP
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() 
      || req.socket.remoteAddress 
      || 'unknown';
    
    const userAgent = req.headers['user-agent'] || null;
    
    await prisma.debugLog.create({
      data: {
        level: level || 'log',
        message,
        data: data || null,
        source: source || null,
        ip,
        version: version || null,
        userAgent,
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    // Don't fail loudly for debug logs
    console.error('Debug log error:', error);
    res.json({ success: false });
  }
});

// Get debug logs (admin only)
app.get('/debug/logs', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const ip = req.query.ip as string | undefined;
    const level = req.query.level as string | undefined;
    const since = req.query.since as string | undefined; // ISO date or relative like "5m", "1h", "24h"
    
    // Build where clause
    const where: {
      ip?: string;
      level?: string;
      createdAt?: { gte: Date };
    } = {};
    
    if (ip) {
      where.ip = ip;
    }
    
    if (level) {
      where.level = level;
    }
    
    if (since) {
      let sinceDate: Date;
      
      // Parse relative time
      const match = since.match(/^(\d+)(m|h|d)$/);
      if (match && match[1] && match[2]) {
        const amount = parseInt(match[1], 10);
        const unit = match[2];
        const ms = unit === 'm' ? amount * 60 * 1000 
                 : unit === 'h' ? amount * 60 * 60 * 1000 
                 : amount * 24 * 60 * 60 * 1000;
        sinceDate = new Date(Date.now() - ms);
      } else {
        sinceDate = new Date(since);
      }
      
      if (!isNaN(sinceDate.getTime())) {
        where.createdAt = { gte: sinceDate };
      }
    }
    
    const [logs, total] = await Promise.all([
      prisma.debugLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.debugLog.count({ where })
    ]);
    
    // Get unique IPs for filter dropdown
    const uniqueIps = await prisma.debugLog.groupBy({
      by: ['ip'],
      _count: true,
      orderBy: { _count: { ip: 'desc' } },
      take: 50
    });
    
    res.json({
      logs,
      total,
      limit,
      offset,
      availableIps: uniqueIps.map((i: { ip: string; _count: number }) => ({ ip: i.ip, count: i._count }))
    });
  } catch (error) {
    next(error);
  }
});

// Clear old debug logs (admin only)
app.delete('/debug/logs', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const olderThan = req.query.olderThan as string || '7d';
    
    const match = olderThan.match(/^(\d+)(m|h|d)$/);
    if (!match || !match[1] || !match[2]) {
      res.status(400).json({ error: 'Invalid olderThan format. Use format like 5m, 1h, 7d' });
      return;
    }
    
    const amount = parseInt(match[1], 10);
    const unit = match[2];
    const ms = unit === 'm' ? amount * 60 * 1000 
             : unit === 'h' ? amount * 60 * 60 * 1000 
             : amount * 24 * 60 * 60 * 1000;
    
    const cutoffDate = new Date(Date.now() - ms);
    
    const result = await prisma.debugLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } }
    });
    
    res.json({ success: true, deleted: result.count });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// Articles & Feedback API
// =====================================================

// Create article (called when starting analysis)
app.post('/articles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, title, textContent } = req.body;
    
    if (!url || !textContent) {
      res.status(400).json({ error: 'Missing required fields: url, textContent' });
      return;
    }
    
    const textHash = hashText(textContent);
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() 
      || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    // Try to find existing article with same URL and text
    let article = await prisma.article.findUnique({
      where: { url_textHash: { url, textHash } }
    });
    
    if (!article) {
      article = await prisma.article.create({
        data: { url, title, textContent, textHash, ip, userAgent }
      });
    }
    
    res.status(201).json({ articleId: article.id, isNew: !article });
  } catch (error) {
    next(error);
  }
});

// Add analysis results to article
interface HighlightInput {
  quote: string;
  importance?: string;
  gap?: string;
}

app.post('/articles/:articleId/analysis', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const articleId = req.params['articleId'];
    if (!articleId) {
      res.status(400).json({ error: 'Missing articleId parameter' });
      return;
    }
    
    const { modelVersion, rawResponse, severity, highlights, promptUsed, isCustomPrompt } = req.body as {
      modelVersion?: string;
      rawResponse: unknown;
      severity?: string;
      highlights?: HighlightInput[];
      promptUsed?: string;
      isCustomPrompt?: boolean;
    };
    
    if (!rawResponse) {
      res.status(400).json({ error: 'Missing required field: rawResponse' });
      return;
    }
    
    // Verify article exists
    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    
    // Create analysis with highlights
    const analysis = await prisma.analysis.create({
      data: {
        articleId,
        modelVersion: modelVersion ?? null,
        rawResponse,
        severity: severity ?? null,
        promptUsed: promptUsed ?? null,
        isCustomPrompt: isCustomPrompt ?? false,
        highlights: highlights ? {
          create: highlights.map((h) => ({
            quote: h.quote,
            importance: h.importance ?? 'minor',
            gap: h.gap ?? ''
          }))
        } : undefined
      },
      include: { highlights: true }
    });
    
    res.status(201).json({ 
      analysisId: analysis.id,
      highlightCount: analysis.highlights.length
    });
  } catch (error) {
    next(error);
  }
});

// Add comment/feedback (creates article if needed)
app.post('/comments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, title, textContent, selectedText, commentText } = req.body;
    
    if (!url || !textContent || !selectedText || !commentText) {
      res.status(400).json({ 
        error: 'Missing required fields: url, textContent, selectedText, commentText' 
      });
      return;
    }
    
    const textHash = hashText(textContent);
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() 
      || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    // Find or create article
    let article = await prisma.article.findUnique({
      where: { url_textHash: { url, textHash } }
    });
    
    const isNewArticle = !article;
    
    if (!article) {
      article = await prisma.article.create({
        data: { url, title, textContent, textHash, ip, userAgent }
      });
    }
    
    // Create comment
    const comment = await prisma.comment.create({
      data: {
        articleId: article.id,
        selectedText,
        commentText,
        ip,
        userAgent
      }
    });
    
    res.status(201).json({ 
      commentId: comment.id, 
      articleId: article.id,
      isNewArticle
    });
  } catch (error) {
    next(error);
  }
});

// Get all articles (admin)
app.get('/admin/articles', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          _count: { select: { analyses: true, comments: true } },
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { severity: true, highlights: { select: { id: true } } }
          }
        }
      }),
      prisma.article.count()
    ]);
    
    res.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      articles: articles.map((a: any) => {
        const latestAnalysis = a.analyses[0];
        return {
          id: a.id,
          createdAt: a.createdAt,
          url: a.url,
          title: a.title,
          textPreview: a.textContent.substring(0, 200) + (a.textContent.length > 200 ? '...' : ''),
          analysisCount: a._count.analyses,
          commentCount: a._count.comments,
          latestAnalysis: latestAnalysis ? {
            severity: latestAnalysis.severity ?? 'none',
            highlightCount: latestAnalysis.highlights.length
          } : null,
          ip: a.ip
        };
      }),
      total,
      limit,
      offset
    });
  } catch (error) {
    next(error);
  }
});

// Get single article with all data (admin)
app.get('/admin/articles/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await prisma.article.findUnique({
      where: { id: req.params.id },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          include: { highlights: true }
        },
        comments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    
    res.json({ article });
  } catch (error) {
    next(error);
  }
});

// Delete article (admin)
app.delete('/admin/articles/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.article.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get all comments (admin)
app.get('/admin/comments', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          article: { select: { url: true, title: true } }
        }
      }),
      prisma.comment.count()
    ]);
    
    res.json({ comments, total, limit, offset });
  } catch (error) {
    next(error);
  }
});

// Delete comment (admin)
app.delete('/admin/comments/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.comment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get feedback stats
app.get('/admin/feedback-stats', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [articleCount, analysisCount, commentCount, highlightCount, recentArticles] = await Promise.all([
      prisma.article.count(),
      prisma.analysis.count(),
      prisma.comment.count(),
      prisma.highlight.count(),
      prisma.article.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      })
    ]);
    
    const highlightsByImportance = await prisma.highlight.groupBy({
      by: ['importance'],
      _count: true
    });
    
    res.json({
      articles: articleCount,
      analyses: analysisCount,
      comments: commentCount,
      highlights: highlightCount,
      articlesLast24h: recentArticles,
      highlightsByImportance: highlightsByImportance.map((h: { importance: string; _count: number }) => ({
        importance: h.importance,
        count: h._count
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
