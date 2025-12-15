/**
 * FAQ page HTML generator
 */

import { themeCssVariables } from '../../shared';

export function generateFaqPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FAQ — SanityCheck</title>
  <link rel="icon" type="image/png" sizes="16x16" href="/static/icon16.png">
  <link rel="icon" type="image/png" sizes="48x48" href="/static/icon48.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    ${themeCssVariables}
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      line-height: 1.6;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 60px 24px;
    }
    
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 14px;
      margin-bottom: 32px;
      transition: color 0.15s ease;
    }
    
    .back-link:hover {
      color: var(--accent);
    }
    
    h1 {
      font-family: 'Poppins', sans-serif;
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 48px;
      letter-spacing: -1px;
    }
    
    h1 .accent {
      color: var(--accent);
    }
    
    .faq-item {
      margin-bottom: 40px;
      padding-bottom: 40px;
      border-bottom: 1px solid var(--border);
    }
    
    .faq-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .faq-question {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 16px;
    }
    
    .faq-answer {
      color: var(--text-secondary);
      font-size: 1rem;
      line-height: 1.7;
    }
    
    .faq-answer a {
      color: var(--accent);
      text-decoration: none;
    }
    
    .faq-answer a:hover {
      text-decoration: underline;
    }
    
    /* Installation Steps */
    .install-steps {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .install-step {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }
    
    .step-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: var(--bg-tertiary);
      border-bottom: 1px solid var(--border);
    }
    
    .step-number {
      width: 28px;
      height: 28px;
      background: var(--accent);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }
    
    .step-title {
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .step-content {
      padding: 20px;
    }
    
    .step-description {
      color: var(--text-secondary);
      margin-bottom: 16px;
    }
    
    /* Screenshot mockup */
    .screenshot {
      background: #1e1e1e;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .browser-bar {
      background: #2d2d2d;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    
    .browser-dots {
      display: flex;
      gap: 6px;
    }
    
    .browser-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    
    .browser-dot.red { background: #ff5f57; }
    .browser-dot.yellow { background: #febc2e; }
    .browser-dot.green { background: #28c840; }
    
    .browser-url {
      flex: 1;
      background: #1e1e1e;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      color: #888;
      font-family: monospace;
    }
    
    .screenshot-content {
      padding: 20px;
      min-height: 120px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    /* Chrome menu mockup */
    .chrome-menu {
      background: #292929;
      border-radius: 8px;
      padding: 8px 0;
      width: fit-content;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    
    .chrome-menu-item {
      padding: 8px 40px 8px 16px;
      color: #e0e0e0;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .chrome-menu-item.highlight {
      background: var(--accent);
      color: #fff;
    }
    
    .chrome-menu-item .arrow {
      margin-left: auto;
      opacity: 0.5;
    }
    
    /* Extensions page mockup */
    .extensions-page {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .extensions-header {
      font-size: 18px;
      font-weight: 500;
      color: #e0e0e0;
      margin-bottom: 8px;
    }
    
    .dev-mode-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #888;
    }
    
    .toggle-switch {
      width: 36px;
      height: 20px;
      background: var(--accent);
      border-radius: 10px;
      position: relative;
    }
    
    .toggle-switch::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      background: #fff;
      border-radius: 50%;
      top: 2px;
      right: 2px;
    }
    
    .load-btn {
      background: var(--accent);
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
      width: fit-content;
    }
    
    /* Folder picker mockup */
    .folder-picker {
      background: #2a2a2a;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .folder-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      font-size: 13px;
      color: #aaa;
    }
    
    .folder-item.selected {
      background: rgba(96, 165, 250, 0.2);
      color: var(--accent);
    }
    
    .folder-icon {
      font-size: 16px;
    }
    
    /* Success state */
    .extension-card {
      background: #2a2a2a;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .extension-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--accent), #3b82f6);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    
    .extension-info h3 {
      color: #e0e0e0;
      font-size: 15px;
      margin-bottom: 4px;
    }
    
    .extension-info p {
      color: #888;
      font-size: 12px;
    }
    
    .enabled-badge {
      margin-left: auto;
      background: rgba(40, 200, 64, 0.2);
      color: #28c840;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    
    footer {
      margin-top: 60px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    
    footer a {
      color: var(--text-secondary);
      text-decoration: none;
      transition: color 0.15s ease;
    }
    
    footer a:hover {
      color: var(--accent);
    }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back-link">← Back to Home</a>
    
    <h1>Frequently Asked <span class="accent">Questions</span></h1>
    
    <div class="faq-item">
      <div class="faq-question">How do I install SanityCheck?</div>
      <div class="faq-answer">
        <p>SanityCheck is a Chrome extension. Here's how to install it:</p>
        
        <div class="install-steps">
          <div class="install-step">
            <div class="step-header">
              <div class="step-number">1</div>
              <div class="step-title">Download the extension</div>
            </div>
            <div class="step-content">
              <p class="step-description">Click the download button on our <a href="/">homepage</a> to get the extension ZIP file, then unzip it to a folder on your computer.</p>
            </div>
          </div>
          
          <div class="install-step">
            <div class="step-header">
              <div class="step-number">2</div>
              <div class="step-title">Open Chrome Extensions</div>
            </div>
            <div class="step-content">
              <p class="step-description">In Chrome, go to the menu (⋮) → Extensions → Manage Extensions. Or type <code>chrome://extensions</code> in your address bar.</p>
              <div class="screenshot">
                <div class="browser-bar">
                  <div class="browser-dots">
                    <div class="browser-dot red"></div>
                    <div class="browser-dot yellow"></div>
                    <div class="browser-dot green"></div>
                  </div>
                  <div class="browser-url">chrome://extensions</div>
                </div>
                <div class="screenshot-content">
                  <div class="extensions-page">
                    <div class="extensions-header">Extensions</div>
                    <div class="dev-mode-toggle">
                      Developer mode
                      <div class="toggle-switch"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="install-step">
            <div class="step-header">
              <div class="step-number">3</div>
              <div class="step-title">Enable Developer Mode</div>
            </div>
            <div class="step-content">
              <p class="step-description">Toggle on "Developer mode" in the top-right corner. This allows you to load unpacked extensions.</p>
            </div>
          </div>
          
          <div class="install-step">
            <div class="step-header">
              <div class="step-number">4</div>
              <div class="step-title">Load the extension</div>
            </div>
            <div class="step-content">
              <p class="step-description">Click "Load unpacked" and select the folder where you unzipped the extension.</p>
              <div class="screenshot">
                <div class="browser-bar">
                  <div class="browser-dots">
                    <div class="browser-dot red"></div>
                    <div class="browser-dot yellow"></div>
                    <div class="browser-dot green"></div>
                  </div>
                  <div class="browser-url">chrome://extensions</div>
                </div>
                <div class="screenshot-content">
                  <div class="extensions-page">
                    <button class="load-btn">Load unpacked</button>
                    <div class="folder-picker">
                      <div class="folder-item">
                        <span class="folder-icon">📁</span> Downloads
                      </div>
                      <div class="folder-item selected">
                        <span class="folder-icon">📂</span> sanitycheck-extension
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="install-step">
            <div class="step-header">
              <div class="step-number">5</div>
              <div class="step-title">You're all set!</div>
            </div>
            <div class="step-content">
              <p class="step-description">SanityCheck should now appear in your extensions. Pin it to your toolbar for easy access.</p>
              <div class="screenshot">
                <div class="browser-bar">
                  <div class="browser-dots">
                    <div class="browser-dot red"></div>
                    <div class="browser-dot yellow"></div>
                    <div class="browser-dot green"></div>
                  </div>
                  <div class="browser-url">chrome://extensions</div>
                </div>
                <div class="screenshot-content">
                  <div class="extension-card">
                    <div class="extension-icon">🧠</div>
                    <div class="extension-info">
                      <h3>SanityCheck</h3>
                      <p>Identify logical fallacies in what you read</p>
                    </div>
                    <span class="enabled-badge">Enabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="faq-item">
      <div class="faq-question">How accurate is SanityCheck?</div>
      <div class="faq-answer">
        SanityCheck uses an ensemble of LLMs to identify potential logical issues, but it's not perfect. Think of it as a second pair of eyes that catches things you might miss—not an oracle. We recommend using it as a starting point for critical thinking, not a replacement for it.
      </div>
    </div>
    
    <div class="faq-item">
      <div class="faq-question">Does it work on all websites?</div>
      <div class="faq-answer">
        SanityCheck works best on article-style content: news sites, blogs, opinion pieces, and long-form writing. It may not work well on paywalled content, dynamically-loaded pages, or sites with unusual HTML structures.
      </div>
    </div>
    
    <div class="faq-item">
      <div class="faq-question">Is my data sent to a server?</div>
      <div class="faq-answer">
        Yes, the article text is sent to our server for analysis. We don't store the content permanently or associate it with your identity. See our privacy practices on <a href="https://github.com/UlisseMini/sanitycheck" target="_blank">GitHub</a>.
      </div>
    </div>
    
    <div class="faq-item">
      <div class="faq-question">Why do some highlights seem wrong?</div>
      <div class="faq-answer">
        LLMs can make mistakes or be overly cautious. If you see a highlight that seems off, click "leave feedback on this text" to help us improve. We're actively training on user feedback to reduce false positives.
      </div>
    </div>
    
    <div class="faq-item">
      <div class="faq-question">Is this free?</div>
      <div class="faq-answer">
        Yes, SanityCheck is currently free during our beta period. We may introduce usage limits or a paid tier in the future to cover API costs, but the core functionality will remain accessible.
      </div>
    </div>
    
    <footer>
      <a href="/">Home</a> · <a href="https://github.com/UlisseMini/sanitycheck" target="_blank">GitHub</a>
    </footer>
  </div>
</body>
</html>`;
}

