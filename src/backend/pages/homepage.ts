/**
 * Homepage HTML generator using shared styles
 */

import { colors, demoHighlightCSS, DEMO_EXAMPLES } from '../../shared';

function generateDemoCard(example: typeof DEMO_EXAMPLES[0]): string {
  return `
      <div class="demo-card">
        <div class="demo-quote">
          "${example.quote} <span class="demo-highlight">${example.highlightedPart}<span class="demo-tooltip"><div class="demo-tooltip-header"><span class="demo-tooltip-badge">${example.importance.charAt(0).toUpperCase() + example.importance.slice(1)}</span></div><div class="demo-tooltip-explanation">${example.gap}</div></span></span>"
        </div>
      </div>`;
}

export function generateHomepage(): string {
  const demoCards = DEMO_EXAMPLES.map(generateDemoCard).join('\n');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SanityCheck — Catch the Reasoning Gaps You'd Miss</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --bg-primary: ${colors.bgPrimary};
      --bg-secondary: ${colors.bgSecondary};
      --bg-tertiary: ${colors.bgTertiary};
      --bg-hover: ${colors.bgHover};
      --text-primary: ${colors.textPrimary};
      --text-secondary: ${colors.textSecondary};
      --text-muted: ${colors.textMuted};
      --accent: ${colors.accent};
      --accent-hover: ${colors.accentHover};
      --border: ${colors.border};
      --border-strong: ${colors.borderStrong};
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }
    
    /* Hero Section */
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
    
    /* Demo Section */
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
    
    /* Shared highlight/tooltip styles */
    ${demoHighlightCSS}
    
    /* How It Works */
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
${demoCards}
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
</html>`;
}
