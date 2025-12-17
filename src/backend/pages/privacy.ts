/**
 * Privacy Policy page HTML generator
 */

import { themeCssVariables } from '../../shared';

export function generatePrivacyPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy — SanityCheck</title>
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
      margin-bottom: 16px;
      letter-spacing: -1px;
    }
    
    h1 .accent {
      color: var(--accent);
    }
    
    .last-updated {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 48px;
    }
    
    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-top: 48px;
      margin-bottom: 16px;
      color: var(--text-primary);
    }
    
    h3 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-top: 32px;
      margin-bottom: 12px;
      color: var(--text-primary);
    }
    
    p {
      margin-bottom: 16px;
      color: var(--text-secondary);
    }
    
    ul {
      margin-left: 24px;
      margin-bottom: 16px;
      color: var(--text-secondary);
    }
    
    li {
      margin-bottom: 8px;
    }
    
    .highlight-box {
      background: var(--bg-secondary);
      border-left: 3px solid var(--accent);
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 4px;
    }
    
    .highlight-box p {
      margin-bottom: 0;
      color: var(--text-primary);
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
    
    <h1>Privacy <span class="accent">Policy</span></h1>
    <p class="last-updated">Last updated: December 2024</p>
    
    <div class="highlight-box">
      <p><strong>Summary:</strong> SanityCheck sends article text to our backend for analysis. We do not store article content permanently or associate it with your identity. We only store your preferences locally in your browser.</p>
    </div>
    
    <h2>1. Information We Collect</h2>
    
    <h3>Article Content</h3>
    <p>When you click "Analyze" on an article, SanityCheck extracts and sends the article's text content to our backend server for logical fallacy analysis. This includes:</p>
    <ul>
      <li>The article's text content</li>
      <li>The article's URL and title (for analysis and feedback purposes)</li>
    </ul>
    
    <h3>Local Storage</h3>
    <p>SanityCheck stores the following information locally in your browser (chrome.storage.local):</p>
    <ul>
      <li>Theme preference (SanityCheck vs Miss Information mode)</li>
      <li>Optional custom analysis prompts (if you customize them in Settings)</li>
      <li>Cached analysis results (to avoid re-analyzing the same article)</li>
    </ul>
    <p>This data is stored only on your device and is never transmitted to us.</p>
    
    <h3>Feedback Data</h3>
    <p>If you submit feedback using the "Leave feedback on this text" feature, we collect:</p>
    <ul>
      <li>The selected text and your feedback comment</li>
      <li>The article URL and title</li>
      <li>Anonymized metadata (IP address for abuse prevention, but not stored with feedback content)</li>
    </ul>
    
    <h2>2. How We Use Your Information</h2>
    
    <p><strong>Article Analysis:</strong> Article text is sent to our backend API where it is processed by language models to identify logical fallacies and reasoning issues. The analysis results are returned to the extension for display.</p>
    
    <p><strong>Feedback Improvement:</strong> Feedback you submit helps us improve the accuracy of our analysis model. Feedback is reviewed for quality and may be used to train or improve our analysis algorithms.</p>
    
    <p><strong>No Tracking:</strong> We do not track your browsing activity, build profiles of your interests, or use your data for advertising purposes.</p>
    
    <h2>3. Data Storage and Retention</h2>
    
    <h3>Article Content</h3>
    <p>Article text sent for analysis is <strong>not permanently stored</strong>. It is processed and discarded immediately after analysis completes. We do not maintain a database of articles you analyze.</p>
    
    <h3>Feedback</h3>
    <p>Feedback submissions are stored on our servers for model improvement purposes. This data is anonymized and not associated with your identity.</p>
    
    <h3>Local Data</h3>
    <p>All preferences and cached results stored locally in your browser remain on your device. You can clear this data at any time by uninstalling the extension or clearing Chrome's extension storage.</p>
    
    <h2>4. Data Sharing</h2>
    
    <p>We do not sell, rent, or share your data with third parties. Article content is processed by our backend API, which may use third-party language model services (currently Anthropic Claude) for analysis. These services process the data only to perform the analysis and do not retain it.</p>
    
    <h2>5. Your Rights</h2>
    
    <ul>
      <li><strong>Access:</strong> You can view your local preferences through the extension's Settings page</li>
      <li><strong>Deletion:</strong> Uninstalling the extension removes all locally stored data</li>
      <li><strong>Control:</strong> You can choose not to use the extension if you prefer not to send article content for analysis</li>
    </ul>
    
    <h2>6. Security</h2>
    
    <p>We use HTTPS encryption for all data transmission between the extension and our backend. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
    
    <h2>7. Changes to This Policy</h2>
    
    <p>We may update this Privacy Policy from time to time. We will notify users of any material changes by updating the "Last updated" date at the top of this page. Continued use of the extension after changes constitutes acceptance of the updated policy.</p>
    
    <h2>8. Contact Us</h2>
    
    <p>If you have questions about this Privacy Policy, please contact us via our <a href="https://github.com/UlisseMini/sanitycheck" target="_blank">GitHub repository</a>.</p>
    
    <footer>
      <a href="/">Home</a> · <a href="/faq">FAQ</a> · <a href="https://github.com/UlisseMini/sanitycheck" target="_blank">GitHub</a>
    </footer>
  </div>
</body>
</html>`;
}

