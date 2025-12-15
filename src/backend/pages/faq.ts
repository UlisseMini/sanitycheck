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
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Comfortaa:wght@700&family=Quicksand:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    ${themeCssVariables}
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      line-height: 1.6;
      transition: background 0.4s ease, color 0.4s ease;
    }
    
    /* ===== Theme Toggle ===== */
    .theme-toggle-container {
      position: fixed;
      top: 20px;
      right: 24px;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .theme-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      transition: color 0.3s ease;
    }
    
    .theme-label.active {
      color: var(--accent);
    }
    
    .theme-toggle {
      position: relative;
      width: 50px;
      height: 26px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-strong);
      border-radius: 13px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .theme-toggle:hover {
      border-color: var(--accent);
    }
    
    .theme-toggle-slider {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      background: var(--accent);
      border-radius: 50%;
      transition: transform 0.3s cubic-bezier(0.68, -0.15, 0.32, 1.15);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .theme-toggle.active .theme-toggle-slider {
      transform: translateX(24px);
    }
    
    body.theme-miss .theme-toggle-slider::after {
      content: '✨';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 9px;
    }
    
    /* Miss Info theme adjustments */
    body.theme-miss h1 {
      font-family: 'Comfortaa', 'Quicksand', cursive;
    }
    
    body.theme-miss .step-number {
      background: linear-gradient(135deg, #c084fc 0%, #f472b6 100%);
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
    
    /* Chrome Extensions Page Mockup - Realistic Light Theme */
    .chrome-screenshot {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      font-family: 'Segoe UI', Roboto, Arial, sans-serif;
    }
    
    .chrome-header {
      background: #f8f9fa;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .chrome-logo {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #ea4335 25%, #fbbc04 25%, #fbbc04 50%, #34a853 50%, #34a853 75%, #4285f4 75%);
      border-radius: 50%;
    }
    
    .chrome-title {
      font-size: 22px;
      font-weight: 400;
      color: #202124;
    }
    
    .chrome-search {
      flex: 1;
      max-width: 600px;
      margin-left: 24px;
      background: #f1f3f4;
      border: 2px solid #1a73e8;
      border-radius: 24px;
      padding: 10px 16px;
      font-size: 14px;
      color: #5f6368;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .chrome-search-icon {
      color: #9aa0a6;
    }
    
    .dev-mode-area {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #202124;
    }
    
    .toggle-pill {
      width: 44px;
      height: 24px;
      background: #1a73e8;
      border-radius: 12px;
      position: relative;
      cursor: pointer;
    }
    
    .toggle-pill::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      background: #fff;
      border-radius: 50%;
      top: 2px;
      right: 2px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    
    .chrome-toolbar {
      background: #fff;
      padding: 12px 24px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      gap: 12px;
    }
    
    .chrome-btn {
      background: #fff;
      border: 1px solid #1a73e8;
      color: #1a73e8;
      padding: 8px 20px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }
    
    .chrome-btn:hover {
      background: #f0f7ff;
    }
    
    .chrome-btn.primary {
      background: #1a73e8;
      color: #fff;
    }
    
    .chrome-body {
      display: flex;
      min-height: 200px;
    }
    
    .chrome-sidebar {
      width: 200px;
      background: #fff;
      border-right: 1px solid #e0e0e0;
      padding: 16px 0;
    }
    
    .sidebar-item {
      padding: 10px 24px;
      font-size: 14px;
      color: #5f6368;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }
    
    .sidebar-item.active {
      background: #e8f0fe;
      color: #1a73e8;
      border-left: 3px solid #1a73e8;
      padding-left: 21px;
    }
    
    .sidebar-icon {
      font-size: 18px;
    }
    
    .chrome-main {
      flex: 1;
      padding: 24px;
      background: #f8f9fa;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 500;
      color: #202124;
      margin-bottom: 16px;
    }
    
    /* Extension Card - Realistic */
    .ext-card {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      display: flex;
      align-items: flex-start;
      gap: 16px;
      border: 1px solid #e0e0e0;
    }
    
    .ext-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      flex-shrink: 0;
    }
    
    .ext-icon-img {
      width: 48px;
      height: 48px;
      border-radius: 8px;
    }
    
    .ext-details {
      flex: 1;
    }
    
    .ext-name {
      font-size: 16px;
      font-weight: 500;
      color: #202124;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .ext-version {
      font-weight: 400;
      color: #5f6368;
    }
    
    .ext-desc {
      font-size: 13px;
      color: #5f6368;
      margin-top: 4px;
    }
    
    .ext-id {
      font-size: 12px;
      color: #9aa0a6;
      margin-top: 12px;
      font-family: monospace;
    }
    
    .ext-links {
      font-size: 12px;
      color: #1a73e8;
      margin-top: 4px;
    }
    
    .ext-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
    }
    
    .ext-btn {
      background: #fff;
      border: 1px solid #dadce0;
      color: #1a73e8;
      padding: 6px 16px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    
    .ext-toggle {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .ext-toggle-pill {
      width: 36px;
      height: 20px;
      background: #1a73e8;
      border-radius: 10px;
      position: relative;
    }
    
    .ext-toggle-pill::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      background: #fff;
      border-radius: 50%;
      top: 2px;
      right: 2px;
    }
    
    /* Folder Dialog */
    .folder-dialog {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      max-width: 400px;
    }
    
    .folder-dialog-title {
      font-size: 16px;
      font-weight: 500;
      color: #202124;
      margin-bottom: 16px;
    }
    
    .folder-list {
      background: #f8f9fa;
      border: 1px solid #dadce0;
      border-radius: 4px;
      padding: 8px;
    }
    
    .folder-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 13px;
      color: #5f6368;
      cursor: pointer;
    }
    
    .folder-row:hover {
      background: #e8f0fe;
    }
    
    .folder-row.selected {
      background: #d2e3fc;
      color: #1a73e8;
    }
    
    .folder-row-icon {
      font-size: 18px;
      color: #fbbc04;
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
  <!-- Theme Toggle -->
  <div class="theme-toggle-container">
    <span class="theme-label active" id="label-sanity">Sanity</span>
    <div class="theme-toggle" id="theme-toggle">
      <div class="theme-toggle-slider"></div>
    </div>
    <span class="theme-label" id="label-miss">Miss Info</span>
  </div>

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
              <div class="step-title">Open Chrome Extensions & Enable Developer Mode</div>
            </div>
            <div class="step-content">
              <p class="step-description">Type <code>chrome://extensions</code> in your address bar. Toggle on "Developer mode" in the top-right corner.</p>
              <div class="chrome-screenshot">
                <div class="chrome-header">
                  <div class="chrome-logo"></div>
                  <span class="chrome-title">Extensions</span>
                  <div class="chrome-search">
                    <span class="chrome-search-icon">🔍</span>
                    Search extensions
                  </div>
                  <div class="dev-mode-area">
                    Developer mode
                    <div class="toggle-pill"></div>
                  </div>
                </div>
                <div class="chrome-toolbar">
                  <button class="chrome-btn primary">Load unpacked</button>
                  <button class="chrome-btn">Pack extension</button>
                  <button class="chrome-btn">Update</button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="install-step">
            <div class="step-header">
              <div class="step-number">3</div>
              <div class="step-title">Load the extension</div>
            </div>
            <div class="step-content">
              <p class="step-description">Click "Load unpacked" and select the folder where you unzipped the extension.</p>
              <div class="chrome-screenshot">
                <div style="padding: 20px;">
                  <div class="folder-dialog">
                    <div class="folder-dialog-title">Select the extension folder</div>
                    <div class="folder-list">
                      <div class="folder-row">
                        <span class="folder-row-icon">📁</span> Downloads
                      </div>
                      <div class="folder-row selected">
                        <span class="folder-row-icon">📂</span> sanitycheck-extension
                      </div>
                      <div class="folder-row">
                        <span class="folder-row-icon">📁</span> Documents
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="install-step">
            <div class="step-header">
              <div class="step-number">4</div>
              <div class="step-title">You're all set!</div>
            </div>
            <div class="step-content">
              <p class="step-description">SanityCheck should now appear in your extensions list. Pin it to your toolbar for easy access.</p>
              <div class="chrome-screenshot">
                <div class="chrome-header">
                  <div class="chrome-logo"></div>
                  <span class="chrome-title">Extensions</span>
                  <div class="chrome-search">
                    <span class="chrome-search-icon">🔍</span>
                    Search extensions
                  </div>
                  <div class="dev-mode-area">
                    Developer mode
                    <div class="toggle-pill"></div>
                  </div>
                </div>
                <div class="chrome-toolbar">
                  <button class="chrome-btn">Load unpacked</button>
                  <button class="chrome-btn">Pack extension</button>
                  <button class="chrome-btn">Update</button>
                </div>
                <div class="chrome-body">
                  <div class="chrome-sidebar">
                    <div class="sidebar-item active">
                      <span class="sidebar-icon">🧩</span> My extensions
                    </div>
                    <div class="sidebar-item">
                      <span class="sidebar-icon">⌨️</span> Keyboard shortcuts
                    </div>
                  </div>
                  <div class="chrome-main">
                    <div class="section-title">All Extensions</div>
                    <div class="ext-card">
                      <div class="ext-icon">
                        <img src="/static/icon48.png" alt="SanityCheck" class="ext-icon-img">
                      </div>
                      <div class="ext-details">
                        <div class="ext-name">
                          SanityCheck <span class="ext-version">1.1.0</span>
                        </div>
                        <div class="ext-desc">Surfaces genuine logical gaps and reasoning issues in articles</div>
                        <div class="ext-id">ID: cnonmmniemjiakcfldgpepdopnnbdbjd</div>
                        <div class="ext-links">Inspect views: <a href="#">service worker</a></div>
                        <div class="ext-actions">
                          <button class="ext-btn">Details</button>
                          <button class="ext-btn">Remove</button>
                          <div class="ext-toggle">
                            <span>↻</span>
                            <div class="ext-toggle-pill"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="faq-item">
      <div class="faq-question">What's the difference between SanityCheck and Miss Info?</div>
      <div class="faq-answer">
        They both run on the same backend—that is, both will catch the same logical issues. However, Miss Info communicates far more casually and has more of a human tone (and a different colour palette!). Try toggling the switch in the top-right corner to see the difference.
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
  
  <script>
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const labelSanity = document.getElementById('label-sanity');
    const labelMiss = document.getElementById('label-miss');
    
    function toggleTheme() {
      document.body.classList.toggle('theme-miss');
      themeToggle.classList.toggle('active');
      
      const isMiss = document.body.classList.contains('theme-miss');
      labelSanity.classList.toggle('active', !isMiss);
      labelMiss.classList.toggle('active', isMiss);
      
      document.title = isMiss ? 'FAQ — Miss Information ♡' : 'FAQ — SanityCheck';
      localStorage.setItem('theme', isMiss ? 'miss' : 'sanity');
    }
    
    themeToggle.addEventListener('click', toggleTheme);
    
    // Load saved theme preference
    if (localStorage.getItem('theme') === 'miss') {
      toggleTheme();
    }
  </script>
</body>
</html>`;
}

