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
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    ${themeCssVariables}
    
    body {
      font-family: 'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f8f9fa;
      color: #202124;
      min-height: 100vh;
      line-height: 1.5;
    }
    
    .container {
      max-width: 640px;
      margin: 0 auto;
      padding: 48px 24px;
    }
    
    .header {
      margin-bottom: 32px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: 400;
      color: #202124;
      margin-bottom: 8px;
      letter-spacing: 0;
    }
    
    .header p {
      font-size: 14px;
      color: #5f6368;
      line-height: 1.5;
    }
    
    .form-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
      padding: 24px;
      margin-bottom: 24px;
    }
    
    .form-section {
      margin-bottom: 24px;
    }
    
    .form-section:last-child {
      margin-bottom: 0;
    }
    
    .question-label {
      font-size: 14px;
      font-weight: 500;
      color: #202124;
      margin-bottom: 8px;
      display: block;
    }
    
    .required-indicator {
      color: #d93025;
      margin-left: 4px;
    }
    
    .form-input {
      width: 100%;
      padding: 8px 12px;
      font-size: 14px;
      font-family: 'Google Sans', 'Roboto', sans-serif;
      border: 1px solid #dadce0;
      border-radius: 4px;
      background: white;
      color: #202124;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    .form-input:focus {
      outline: none;
      border-color: #1a73e8;
      box-shadow: 0 0 0 2px rgba(26,115,232,0.1);
    }
    
    .form-input::placeholder {
      color: #80868b;
    }
    
    textarea.form-input {
      min-height: 100px;
      resize: vertical;
      font-family: 'Google Sans', 'Roboto', sans-serif;
    }
    
    .form-help-text {
      font-size: 12px;
      color: #5f6368;
      margin-top: 4px;
    }
    
    .submit-container {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 24px;
    }
    
    .submit-btn {
      background: #1a73e8;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 500;
      font-family: 'Google Sans', 'Roboto', sans-serif;
      cursor: pointer;
      transition: background-color 0.2s, box-shadow 0.2s;
      box-shadow: 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
    }
    
    .submit-btn:hover {
      background: #1557b0;
      box-shadow: 0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15);
    }
    
    .submit-btn:active {
      background: #1557b0;
      box-shadow: 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
    }
    
    .submit-btn:disabled {
      background: #dadce0;
      color: #80868b;
      cursor: not-allowed;
      box-shadow: none;
    }
    
    .message {
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 24px;
      font-size: 14px;
      display: none;
    }
    
    .message.success {
      background: #e8f5e9;
      color: #1e7e34;
      border: 1px solid #c3e6cb;
      display: block;
    }
    
    .message.error {
      background: #fce8e6;
      color: #c5221f;
      border: 1px solid #f9dedc;
      display: block;
    }
    
    .footer {
      text-align: center;
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #dadce0;
    }
    
    .footer a {
      color: #1a73e8;
      text-decoration: none;
      font-size: 14px;
    }
    
    .footer a:hover {
      text-decoration: underline;
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
