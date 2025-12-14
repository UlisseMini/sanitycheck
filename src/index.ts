import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const ADMIN_KEY = process.env.ADMIN_KEY || 'changeme';

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
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =====================================================
// Homepage
// =====================================================

const HOMEPAGE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Logic Checker — Spot Logical Fallacies in Articles</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --bg: #0a0a0b;
      --bg-card: #141418;
      --bg-elevated: #1c1c22;
      --text: #f4f4f5;
      --text-muted: #71717a;
      --accent: #f97316;
      --accent-glow: rgba(249, 115, 22, 0.4);
      --critical: #ef4444;
      --significant: #eab308;
      --minor: #6b7280;
      --border: rgba(255, 255, 255, 0.08);
    }
    
    body {
      font-family: 'Space Grotesk', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
    }
    
    .hero {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      background: 
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(249, 115, 22, 0.15), transparent),
        radial-gradient(ellipse 60% 40% at 80% 60%, rgba(239, 68, 68, 0.08), transparent),
        var(--bg);
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      pointer-events: none;
    }
    
    .logo {
      font-size: 4rem;
      margin-bottom: 24px;
      filter: drop-shadow(0 0 40px var(--accent-glow));
    }
    
    h1 {
      font-size: clamp(2.5rem, 6vw, 4rem);
      font-weight: 700;
      letter-spacing: -2px;
      margin-bottom: 16px;
      background: linear-gradient(135deg, var(--text) 0%, var(--accent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .tagline {
      font-family: 'Crimson Pro', Georgia, serif;
      font-size: clamp(1.25rem, 3vw, 1.75rem);
      color: var(--text-muted);
      font-style: italic;
      margin-bottom: 48px;
      max-width: 600px;
    }
    
    .cta-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: center;
    }
    
    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 18px 36px;
      background: linear-gradient(135deg, var(--accent), #ea580c);
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
      text-decoration: none;
      border-radius: 12px;
      box-shadow: 0 4px 24px var(--accent-glow), 0 0 0 1px rgba(255,255,255,0.1) inset;
      transition: all 0.2s;
    }
    
    .download-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px var(--accent-glow), 0 0 0 1px rgba(255,255,255,0.15) inset;
    }
    
    .download-btn svg {
      width: 20px;
      height: 20px;
    }
    
    .chrome-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    
    .chrome-badge svg {
      width: 20px;
      height: 20px;
    }
    
    .features {
      padding: 80px 20px;
      max-width: 1000px;
      margin: 0 auto;
    }
    
    .features h2 {
      text-align: center;
      font-size: 2rem;
      margin-bottom: 48px;
      color: var(--text);
    }
    
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }
    
    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 28px;
      transition: border-color 0.2s, transform 0.2s;
    }
    
    .feature-card:hover {
      border-color: rgba(249, 115, 22, 0.3);
      transform: translateY(-2px);
    }
    
    .feature-icon {
      font-size: 2rem;
      margin-bottom: 16px;
    }
    
    .feature-card h3 {
      font-size: 1.2rem;
      margin-bottom: 8px;
      color: var(--text);
    }
    
    .feature-card p {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.7;
    }
    
    .install-section {
      padding: 80px 20px;
      background: var(--bg-card);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }
    
    .install-content {
      max-width: 700px;
      margin: 0 auto;
    }
    
    .install-section h2 {
      text-align: center;
      font-size: 2rem;
      margin-bottom: 48px;
    }
    
    .install-steps {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .step {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }
    
    .step-number {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      background: var(--accent);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
    }
    
    .step-content h3 {
      font-size: 1.1rem;
      margin-bottom: 6px;
    }
    
    .step-content p {
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    
    .step-content code {
      background: var(--bg);
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: var(--accent);
    }
    
    .demo-section {
      padding: 80px 20px;
      max-width: 900px;
      margin: 0 auto;
      text-align: center;
    }
    
    .demo-section h2 {
      font-size: 2rem;
      margin-bottom: 24px;
    }
    
    .demo-section p {
      color: var(--text-muted);
      margin-bottom: 32px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .demo-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      text-align: left;
    }
    
    .demo-quote {
      font-family: 'Crimson Pro', Georgia, serif;
      font-size: 1.2rem;
      line-height: 1.8;
      margin-bottom: 24px;
      padding: 20px;
      background: linear-gradient(90deg, rgba(234, 179, 8, 0.15) 0%, transparent 100%);
      border-left: 3px solid var(--significant);
      border-radius: 4px;
    }
    
    .demo-quote mark {
      background: rgba(234, 179, 8, 0.25);
      color: inherit;
      padding: 2px 4px;
      border-radius: 2px;
    }
    
    .demo-analysis {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: var(--bg-elevated);
      border-radius: 8px;
    }
    
    .demo-emoji {
      font-size: 1.5rem;
    }
    
    .demo-analysis-content h4 {
      color: var(--significant);
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    
    .demo-analysis-content p {
      color: var(--text);
      margin: 0;
      font-size: 1rem;
    }
    
    footer {
      padding: 40px 20px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    
    footer a {
      color: var(--accent);
      text-decoration: none;
    }
    
    footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <section class="hero">
    <div class="logo">⚖️</div>
    <h1>Logic Checker</h1>
    <p class="tagline">An AI-powered browser extension that spots logical fallacies and reasoning gaps in any article you read.</p>
    
    <div class="cta-group">
      <a href="/static/logic-checker-extension.zip" class="download-btn" download>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        Download Extension
      </a>
      <div class="chrome-badge">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29L1.931 5.47zm13.069 7.64a5.45 5.45 0 0 1-1.09 3.254l-3.953 6.847c.566.063 1.142.096 1.727.096 6.627 0 12-5.373 12-12 0-1.24-.188-2.437-.537-3.561H13.091a5.454 5.454 0 0 1 1.909 5.364z"/></svg>
        Works on Chrome, Edge, Brave & Arc
      </div>
    </div>
  </section>
  
  <section class="features">
    <h2>What It Does</h2>
    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">🧠</div>
        <h3>AI-Powered Analysis</h3>
        <p>Uses Claude 4.5 Sonnet to deeply analyze article logic, finding non-sequiturs, conflations, and unsupported claims.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🎯</div>
        <h3>Inline Highlighting</h3>
        <p>Problematic passages are highlighted directly in the article. Hover to see what's wrong with the reasoning.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>Severity Ranking</h3>
        <p>Issues are ranked by importance — critical gaps in red, significant issues in yellow, minor concerns in gray.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">💡</div>
        <h3>Concise Explanations</h3>
        <p>Each issue gets a one-line explanation that makes the logical leap immediately obvious.</p>
      </div>
    </div>
  </section>
  
  <section class="demo-section">
    <h2>See It In Action</h2>
    <p>The extension highlights passages with questionable logic and explains the issue on hover.</p>
    
    <div class="demo-card">
      <div class="demo-quote">
        "There have been studies about progress in all kinds of fields that come to the same conclusion: <mark>linear progress needs exponential resources</mark>. What does that mean? If you want to improve a system further and further, you need more and more resources."
      </div>
      <div class="demo-analysis">
        <span class="demo-emoji">🟠</span>
        <div class="demo-analysis-content">
          <h4>Unsupported Generalization</h4>
          <p>"All fields" is a strong claim — which studies? Does this apply universally?</p>
        </div>
      </div>
    </div>
  </section>
  
  <section class="install-section">
    <div class="install-content">
      <h2>Installation Instructions</h2>
      <div class="install-steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Download the Extension</h3>
            <p>Click the download button above to get the <code>.zip</code> file.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Unzip the File</h3>
            <p>Extract the zip to a folder on your computer. Remember where you put it.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Open Chrome Extensions</h3>
            <p>Go to <code>chrome://extensions</code> in your browser. Enable "Developer mode" in the top right.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">4</div>
          <div class="step-content">
            <h3>Load the Extension</h3>
            <p>Click "Load unpacked" and select the folder you extracted. The extension icon should appear in your toolbar.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">5</div>
          <div class="step-content">
            <h3>Start Analyzing</h3>
            <p>Navigate to any article and click the extension icon. Hit "Analyze for Fallacies" and watch the magic happen.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
  
  <footer>
    <p>Built with ❤️ by humans (with AI assistance) · <a href="/admin">Admin</a> · <a href="https://github.com/UlisseMini/sanitycheck">GitHub</a></p>
  </footer>
</body>
</html>
`;

// Serve homepage
app.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(HOMEPAGE_HTML);
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
  <title>Logic Checker Admin</title>
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
  </style>
</head>
<body>
  <div class="login-container" id="loginContainer">
    <div class="login-box">
      <h1 class="login-title">⚖️ Logic Checker</h1>
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
        <h1 class="header-title">⚖️ Logic Checker Admin</h1>
        <button class="logout-btn" onclick="logout()">Logout</button>
      </div>
    </header>
    
    <div class="container">
      <div class="stats-grid" id="statsGrid">
        <div class="stat-card">
          <div class="stat-value" id="totalCount">-</div>
          <div class="stat-label">Total Annotations</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="todayCount">-</div>
          <div class="stat-label">Last 24 Hours</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="typesCount">-</div>
          <div class="stat-label">Fallacy Types</div>
        </div>
      </div>
      
      <div class="section-title">
        <span>Recent Annotations</span>
        <a href="#" class="export-btn" id="exportBtn">📥 Export JSONL</a>
      </div>
      
      <div class="annotations-list" id="annotationsList">
        <div class="loading">Loading annotations...</div>
      </div>
      
      <div class="pagination" id="pagination"></div>
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
      await loadStats();
      await loadAnnotations();
    }
    
    async function loadStats() {
      try {
        const res = await fetch('/stats');
        const data = await res.json();
        
        document.getElementById('totalCount').textContent = data.total || 0;
        document.getElementById('todayCount').textContent = data.last24h || 0;
        document.getElementById('typesCount').textContent = data.byFallacyType?.length || 0;
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }
    
    async function loadAnnotations() {
      const list = document.getElementById('annotationsList');
      list.innerHTML = '<div class="loading">Loading...</div>';
      
      try {
        const res = await fetch('/annotations?limit=' + limit + '&offset=' + (currentPage * limit));
        const data = await res.json();
        
        if (!data.annotations || data.annotations.length === 0) {
          list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No annotations yet</p></div>';
          return;
        }
        
        list.innerHTML = data.annotations.map(ann => \`
          <div class="annotation-card" data-id="\${ann.id}">
            <div class="annotation-header">
              <span class="annotation-type">\${ann.fallacyType || 'unspecified'}</span>
              <span class="annotation-date">\${new Date(ann.createdAt).toLocaleString()}</span>
            </div>
            <div class="annotation-quote">\${escapeHtml(ann.quote)}</div>
            <div class="annotation-text">\${escapeHtml(ann.annotation)}</div>
            <div class="annotation-url">
              <a href="\${ann.url}" target="_blank">\${ann.url}</a>
            </div>
            <div style="margin-top: 12px; text-align: right;">
              <button class="delete-btn" onclick="deleteAnnotation('\${ann.id}')">Delete</button>
            </div>
          </div>
        \`).join('');
        
        renderPagination(data.total);
      } catch (err) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Failed to load annotations</p></div>';
      }
    }
    
    function renderPagination(total) {
      const totalPages = Math.ceil(total / limit);
      const pagination = document.getElementById('pagination');
      
      if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
      }
      
      pagination.innerHTML = \`
        <button class="page-btn" onclick="changePage(-1)" \${currentPage === 0 ? 'disabled' : ''}>← Prev</button>
        <span style="padding: 8px 16px; color: #71717a;">Page \${currentPage + 1} of \${totalPages}</span>
        <button class="page-btn" onclick="changePage(1)" \${currentPage >= totalPages - 1 ? 'disabled' : ''}>Next →</button>
      \`;
    }
    
    function changePage(delta) {
      currentPage += delta;
      loadAnnotations();
    }
    
    async function deleteAnnotation(id) {
      if (!confirm('Delete this annotation?')) return;
      
      try {
        const res = await fetch('/admin/annotations/' + id, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + adminKey }
        });
        
        if (res.ok) {
          loadStats();
          loadAnnotations();
        } else {
          alert('Failed to delete');
        }
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    }
    
    document.getElementById('exportBtn').addEventListener('click', (e) => {
      e.preventDefault();
      window.open('/export?key=' + adminKey, '_blank');
    });
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text || '';
      return div.innerHTML;
    }
  </script>
</body>
</html>
`;

// Serve admin page
app.get('/admin', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(ADMIN_HTML);
});

// Verify admin key
app.get('/admin/verify', requireAdmin, (req: Request, res: Response) => {
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
app.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
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
      byFallacyType: byType.map(b => ({
        type: b.fallacyType || 'unspecified',
        count: b._count
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Export annotations as JSONL (for prompt engineering) - requires admin key
app.get('/export', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
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

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
