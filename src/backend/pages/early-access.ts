/**
 * Early Access Signup page HTML generator
 */

import { themeCssVariables } from '../../shared';

export function generateEarlyAccessPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign up for Early Access — SanityCheck</title>
  <link rel="icon" type="image/png" sizes="16x16" href="/static/icon16.png">
  <link rel="icon" type="image/png" sizes="48x48" href="/static/icon48.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Comfortaa:wght@700&family=Quicksand:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    ${themeCssVariables}
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      line-height: 1.6;
      transition: background 0.3s ease, color 0.3s ease;
    }
    
    .container {
      max-width: 720px;
      margin: 0 auto;
      padding: 64px 24px 80px;
    }
    
    .header {
      margin-bottom: 32px;
      text-align: center;
    }
    
    .header h1 {
      font-family: 'Poppins', 'Inter', sans-serif;
      font-size: 34px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 10px;
      letter-spacing: -0.5px;
      transition: color 0.3s ease;
    }
    
    /* Miss Information font styling */
    body.theme-miss .header h1 {
      font-family: 'Comfortaa', 'Quicksand', cursive;
      font-size: 32px;
      letter-spacing: 1px;
    }
    
    .header p {
      font-size: 16px;
      color: var(--text-secondary);
      line-height: 1.6;
    }
    
    .form-container {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      padding: 28px;
      margin-top: 24px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.3s ease;
    }
    
    .form-section {
      margin-bottom: 24px;
    }
    
    .form-section:last-child {
      margin-bottom: 0;
    }
    
    .question-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
      display: block;
      letter-spacing: 0.1px;
    }
    
    .required-indicator {
      color: var(--accent);
      margin-left: 4px;
    }
    
    .form-input {
      width: 100%;
      padding: 10px 14px;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg-primary);
      color: var(--text-primary);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    .form-input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(80,120,255,0.18);
    }
    
    .form-input::placeholder {
      color: var(--text-muted);
    }
    
    textarea.form-input {
      min-height: 110px;
      resize: vertical;
      font-family: 'Inter', sans-serif;
    }
    
    .form-help-text {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    
    .submit-container {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 24px;
    }
    
    .submit-btn {
      background: var(--accent);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 500;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: background-color 0.2s, box-shadow 0.2s, transform 0.15s ease;
      box-shadow: 0 10px 24px rgba(0,0,0,0.16);
    }
    
    .submit-btn:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
      box-shadow: 0 12px 28px rgba(0,0,0,0.2);
    }
    
    .submit-btn:active {
      transform: translateY(0);
      box-shadow: 0 8px 20px rgba(0,0,0,0.16);
    }
    
    .submit-btn:disabled {
      background: var(--bg-tertiary);
      color: var(--text-muted);
      cursor: not-allowed;
      box-shadow: none;
    }
    
    .message {
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
      display: none;
      border: 1px solid transparent;
    }
    
    .message.success {
      background: rgba(34, 197, 94, 0.12);
      color: #22c55e;
      border-color: rgba(34, 197, 94, 0.2);
      display: block;
    }
    
    .message.error {
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.2);
      display: block;
    }
    
    .footer {
      text-align: center;
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
    }
    
    .footer a {
      color: var(--accent);
      text-decoration: none;
      font-size: 14px;
    }
    
    .footer a:hover {
      text-decoration: underline;
    }

    .theme-toggle-container {
      position: fixed;
      top: 18px;
      right: 22px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 1000;
      user-select: none;
    }
    
    .theme-label {
      font-size: 12px;
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
      width: 56px;
      height: 28px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-strong);
      border-radius: 14px;
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
      width: 20px;
      height: 20px;
      background: var(--accent);
      border-radius: 50%;
      transition: transform 0.3s cubic-bezier(0.68, -0.15, 0.32, 1.15);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .theme-toggle.active .theme-toggle-slider {
      transform: translateX(28px);
    }
    
    body.theme-miss .theme-toggle-slider::after {
      content: '✨';
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-size: 10px;
    }
    
    @media (max-width: 600px) {
      .container {
        padding: 24px 16px;
      }
      
      .header h1 {
        font-size: 24px;
      }
      
      .form-container {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="theme-toggle-container">
    <span class="theme-label active" id="label-sanity">Sanity</span>
    <div class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
      <div class="theme-toggle-slider"></div>
    </div>
    <span class="theme-label" id="label-miss">Miss Info</span>
  </div>

  <div class="container">
    <div class="header">
      <h1>Sign up for Early Access</h1>
      <p>SanityCheck is still in development, and we'd love to have beta testers help us test and be the first to try out new features.</p>
    </div>
    
    <div id="message" class="message"></div>
    
    <form id="earlyAccessForm" class="form-container">
      <div class="form-section">
        <label class="question-label" for="firstName">
          First name
          <span class="required-indicator">*</span>
        </label>
        <input 
          type="text" 
          id="firstName" 
          name="firstName" 
          class="form-input" 
          required
          placeholder="Your first name"
        >
      </div>
      
      <div class="form-section">
        <label class="question-label" for="email">
          Email
          <span class="required-indicator">*</span>
        </label>
        <input 
          type="email" 
          id="email" 
          name="email" 
          class="form-input" 
          required
          placeholder="your.email@example.com"
        >
      </div>
      
      <div class="form-section">
        <label class="question-label" for="discord">
          Discord username (optional)
        </label>
        <input 
          type="text" 
          id="discord" 
          name="discord" 
          class="form-input" 
          placeholder="username#1234"
        >
        <div class="form-help-text">We'll use this to reach out about beta testing opportunities</div>
      </div>
      
      <div class="form-section">
        <label class="question-label" for="reason">
          Why are you interested? (optional)
        </label>
        <textarea 
          id="reason" 
          name="reason" 
          class="form-input" 
          placeholder="Tell us what excites you about SanityCheck..."
        ></textarea>
      </div>
      
      <div class="submit-container">
        <button type="submit" class="submit-btn" id="submitBtn">Submit</button>
      </div>
    </form>
    
    <div class="footer">
      <a href="/">← Back to homepage</a>
    </div>
  </div>
  
  <script>
    const form = document.getElementById('earlyAccessForm');
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submitBtn');

    // Theme toggle (match homepage saved choice)
    const body = document.body;
    const toggle = document.getElementById('theme-toggle');
    const labelSanity = document.getElementById('label-sanity');
    const labelMiss = document.getElementById('label-miss');
    
    function applyTheme(isMiss) {
      body.classList.toggle('theme-miss', isMiss);
      toggle.classList.toggle('active', isMiss);
      labelSanity.classList.toggle('active', !isMiss);
      labelMiss.classList.toggle('active', isMiss);
      document.title = isMiss 
        ? 'Miss Information ♡ Early Access' 
        : 'SanityCheck — Early Access';
    }
    
    function toggleTheme() {
      const isMiss = !body.classList.contains('theme-miss');
      applyTheme(isMiss);
      localStorage.setItem('theme', isMiss ? 'miss' : 'sanity');
    }
    
    toggle.addEventListener('click', toggleTheme);
    
    (function loadTheme() {
      const saved = localStorage.getItem('theme');
      if (saved === 'miss') applyTheme(true);
      else applyTheme(false);
    })();
    
    function showMessage(text, isError = false) {
      messageDiv.textContent = text;
      messageDiv.className = 'message ' + (isError ? 'error' : 'success');
      messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        email: document.getElementById('email').value.trim(),
        discord: document.getElementById('discord').value.trim() || null,
        reason: document.getElementById('reason').value.trim() || null
      };
      
      // Disable submit button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      
      try {
        const response = await fetch('/api/early-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          showMessage('Thank you for signing up! We\\'ll be in touch soon.');
          form.reset();
        } else {
          showMessage(data.error || 'Something went wrong. Please try again.', true);
        }
      } catch (error) {
        showMessage('Network error. Please check your connection and try again.', true);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    });
  </script>
</body>
</html>`;
}
