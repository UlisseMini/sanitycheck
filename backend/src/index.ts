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
  <title>SanityCheck — Catch the Reasoning Gaps You'd Miss</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --bg-primary: #0f1117;
      --bg-secondary: #1a1d27;
      --bg-tertiary: #242936;
      --bg-hover: #2d3344;
      --text-primary: #f0f2f5;
      --text-secondary: #9ca3b0;
      --text-muted: #6b7280;
      --accent: #f97316;
      --accent-hover: #fb923c;
      --accent-subtle: rgba(249, 115, 22, 0.12);
      --error: #ef4444;
      --warning: #f59e0b;
      --warning-subtle: rgba(245, 158, 11, 0.12);
      --border: rgba(255, 255, 255, 0.08);
      --border-strong: rgba(255, 255, 255, 0.12);
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }
    
    /* Hero Section - Compact */
    .hero {
      padding: 60px 24px 40px;
      text-align: center;
    }
    
    .hero-content {
      max-width: 700px;
      margin: 0 auto;
    }
    
    .logo-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .logo-icon {
      width: 40px;
      height: 40px;
      fill: var(--accent);
    }
    
    h1 {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: var(--text-primary);
    }
    
    .tagline {
      font-size: 1.25rem;
      color: var(--text-secondary);
      margin-bottom: 28px;
      line-height: 1.5;
    }
    
    .cta-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }
    
    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 14px 28px;
      background: var(--accent);
      color: white;
      font-size: 1rem;
      font-weight: 600;
      text-decoration: none;
      border-radius: 10px;
      transition: all 0.15s ease;
    }
    
    .download-btn:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
    }
    
    .download-btn svg {
      width: 18px;
      height: 18px;
    }
    
    .browser-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    
    .browser-badge svg {
      width: 16px;
      height: 16px;
      opacity: 0.7;
    }
    
    /* Demo Section - Primary Focus */
    .demo-section {
      padding: 60px 24px 80px;
      max-width: 900px;
      margin: 0 auto;
    }
    
    .demo-header {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .demo-header h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--text-primary);
    }
    
    .demo-header p {
      color: var(--text-muted);
      font-size: 1rem;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
      gap: 20px;
    }
    
    .demo-card {
      background: #18181b;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      transition: border-color 0.15s ease;
    }
    
    .demo-card:hover {
      border-color: var(--border-strong);
    }
    
    .demo-quote {
      font-size: 0.95rem;
      line-height: 1.8;
      color: #d4d4d4;
    }
    
    /* Extension-style highlights */
    .demo-highlight {
      cursor: help;
      position: relative;
      background: linear-gradient(to bottom, rgba(234, 179, 8, 0.25) 0%, rgba(234, 179, 8, 0.15) 100%);
      border-radius: 2px;
      padding: 1px 2px;
      transition: background 0.2s ease;
    }
    
    .demo-highlight:hover {
      background: rgba(234, 179, 8, 0.4);
    }
    
    .demo-highlight.critical {
      background: linear-gradient(to bottom, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.15) 100%);
    }
    
    .demo-highlight.critical:hover {
      background: rgba(239, 68, 68, 0.4);
    }
    
    .demo-highlight.minor {
      background: linear-gradient(to bottom, rgba(115, 115, 115, 0.25) 0%, rgba(115, 115, 115, 0.15) 100%);
    }
    
    .demo-highlight.minor:hover {
      background: rgba(115, 115, 115, 0.4);
    }
    
    /* Extension-style tooltip */
    .demo-tooltip {
      position: absolute;
      z-index: 1000;
      width: max-content;
      max-width: 400px;
      min-width: 280px;
      background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
      border: 1px solid #eab308;
      border-radius: 8px;
      padding: 12px 14px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(234, 179, 8, 0.2);
      font-size: 13px;
      line-height: 1.5;
      color: #f5f5f5;
      pointer-events: none;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      left: 0;
      top: 100%;
      margin-top: 8px;
    }
    
    .demo-highlight:hover .demo-tooltip {
      opacity: 1;
      transform: translateY(0);
    }
    
    .demo-tooltip-header {
      margin-bottom: 6px;
    }
    
    .demo-tooltip-badge {
      background: #eab308;
      color: #000;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .demo-tooltip-type {
      font-weight: 600;
      font-size: 13px;
      color: #eab308;
    }
    
    .demo-tooltip-explanation {
      color: #d4d4d4;
    }
    
    /* How It Works - Minimal */
    .how-section {
      padding: 60px 24px;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border);
    }
    
    .how-content {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }
    
    .how-section h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 40px;
    }
    
    .how-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
    }
    
    .how-step {
      text-align: center;
    }
    
    .how-step-num {
      width: 40px;
      height: 40px;
      background: var(--accent);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
      color: white;
      margin: 0 auto 16px;
    }
    
    .how-step h3 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-primary);
    }
    
    .how-step p {
      color: var(--text-muted);
      font-size: 0.9rem;
      line-height: 1.5;
    }
    
    /* Install Section */
    .install-section {
      padding: 60px 24px;
      border-top: 1px solid var(--border);
    }
    
    .install-content {
      max-width: 560px;
      margin: 0 auto;
    }
    
    .install-section h2 {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 32px;
    }
    
    .install-steps {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .step {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }
    
    .step-number {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-strong);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    
    .step-content h3 {
      font-size: 0.95rem;
      font-weight: 600;
      margin-bottom: 2px;
      color: var(--text-primary);
    }
    
    .step-content p {
      color: var(--text-muted);
      font-size: 0.85rem;
      line-height: 1.5;
    }
    
    .step-content code {
      background: var(--bg-tertiary);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', 'Menlo', monospace;
      font-size: 0.8rem;
      color: var(--accent);
    }
    
    /* Footer */
    footer {
      padding: 32px 24px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
      border-top: 1px solid var(--border);
    }
    
    footer a {
      color: var(--text-secondary);
      text-decoration: none;
      transition: color 0.15s ease;
    }
    
    footer a:hover {
      color: var(--accent);
    }

    @media (max-width: 800px) {
      .demo-grid { grid-template-columns: 1fr; }
      .how-grid { grid-template-columns: 1fr; gap: 24px; }
    }
    
    @media (max-width: 600px) {
      .hero { padding: 40px 20px 32px; }
      .demo-section, .how-section, .install-section { padding: 48px 20px; }
    }
  </style>
</head>
<body>
  <section class="hero">
    <div class="hero-content">
      <div class="logo-row">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
        <h1>SanityCheck</h1>
      </div>
      <p class="tagline">A browser extension that catches the reasoning gaps you'd normally miss.</p>
      
      <div class="cta-group">
        <a href="/static/sanitycheck-extension.zip" class="download-btn" download>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Download Extension
        </a>
        <div class="browser-badge">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29L1.931 5.47zm13.069 7.64a5.45 5.45 0 0 1-1.09 3.254l-3.953 6.847c.566.063 1.142.096 1.727.096 6.627 0 12-5.373 12-12 0-1.24-.188-2.437-.537-3.561H13.091a5.454 5.454 0 0 1 1.909 5.364z"/></svg>
          Chrome, Edge, Brave & Arc
        </div>
      </div>
    </div>
  </section>
  
  <section class="demo-section">
    <div class="demo-header">
      <h2>Statements that sound reasonable—until you look closer</h2>
      <p>SanityCheck highlights logical leaps in articles and explains exactly what's off.</p>
    </div>
    
    <div class="demo-grid">
      <div class="demo-card">
        <div class="demo-quote">
          "Remote workers report higher satisfaction and productivity in surveys. <span class="demo-highlight">Companies resisting remote work are simply prioritizing control over results.<span class="demo-tooltip"><div class="demo-tooltip-header"><span class="demo-tooltip-badge">Significant</span></div><div class="demo-tooltip-explanation">Assumes no other reasons (collaboration, training juniors, culture) could matter.</div></span></span>"
        </div>
      </div>
      
      <div class="demo-card">
        <div class="demo-quote">
          "The brain uses 20% of our calories despite being only 2% of body weight. <span class="demo-highlight">This explains why thinking hard leaves us mentally exhausted.<span class="demo-tooltip"><div class="demo-tooltip-header"><span class="demo-tooltip-badge">Significant</span></div><div class="demo-tooltip-explanation">High baseline energy use doesn't mean thinking harder uses significantly more.</div></span></span>"
        </div>
      </div>
      
      <div class="demo-card">
        <div class="demo-quote">
          "Critics of the proposal haven't offered any realistic alternatives. <span class="demo-highlight">Until they do, we should move forward with this plan.<span class="demo-tooltip"><div class="demo-tooltip-header"><span class="demo-tooltip-badge">Significant</span></div><div class="demo-tooltip-explanation">Lack of a better idea doesn't make this one good.</div></span></span>"
        </div>
      </div>
      
      <div class="demo-card">
        <div class="demo-quote">
          "The top-performing schools in the district all use this curriculum. <span class="demo-highlight">Adopting it would help struggling schools catch up.<span class="demo-tooltip"><div class="demo-tooltip-header"><span class="demo-tooltip-badge">Significant</span></div><div class="demo-tooltip-explanation">Top schools may succeed for other reasons (funding, demographics, teachers).</div></span></span>"
        </div>
      </div>
    </div>
  </section>
  
  <section class="how-section">
    <div class="how-content">
      <h2>How It Works</h2>
      <div class="how-grid">
        <div class="how-step">
          <div class="how-step-num">1</div>
          <h3>Click on any article</h3>
          <p>Open the extension while reading any online article or blog post.</p>
        </div>
        <div class="how-step">
          <div class="how-step-num">2</div>
          <h3>AI analyzes the logic</h3>
          <p>Claude reads the article and identifies where conclusions don't follow from premises.</p>
        </div>
        <div class="how-step">
          <div class="how-step-num">3</div>
          <h3>See issues inline</h3>
          <p>Problematic passages are highlighted. Hover to see what's wrong with the reasoning.</p>
        </div>
      </div>
    </div>
  </section>
  
  <section class="install-section">
    <div class="install-content">
      <h2>Installation</h2>
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
            <p>Extract the zip to a folder on your computer.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Open Chrome Extensions</h3>
            <p>Navigate to <code>chrome://extensions</code> and enable "Developer mode".</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">4</div>
          <div class="step-content">
            <h3>Load the Extension</h3>
            <p>Click "Load unpacked" and select the extracted folder.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">5</div>
          <div class="step-content">
            <h3>Start Analyzing</h3>
            <p>Navigate to any article and click the extension icon to analyze.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
  
  <footer>
    <p>Built by humans, with AI assistance · <a href="/admin">Admin</a> · <a href="https://github.com/UlisseMini/sanitycheck">GitHub</a></p>
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
