/**
 * Homepage HTML generator using shared styles
 */

import { themeCssVariables } from '../../shared';

export function generateHomepage(): string {
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SanityCheck — Catch the Reasoning Gaps You'd Miss</title>
  <link rel="icon" type="image/png" sizes="16x16" href="/static/icon16.png">
  <link rel="icon" type="image/png" sizes="48x48" href="/static/icon48.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Comfortaa:wght@700&family=Quicksand:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    /* ===== Theme Variables (from shared/colors.ts) ===== */
    ${themeCssVariables}
    
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
    
    /* Miss Information specific sparkle effect */
    body.theme-miss .theme-toggle-slider::after {
      content: '✨';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 10px;
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
      padding: 60px 24px 20px;
      text-align: center;
    }
    
    .hero-content {
      max-width: 700px;
      margin: 0 auto;
    }
    
    h1 {
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 3rem;
      font-weight: 700;
      letter-spacing: -1px;
      color: var(--text-primary);
      margin-bottom: 16px;
      transition: all 0.4s ease;
    }
    
    h1 .accent {
      color: var(--accent);
      transition: color 0.4s ease;
    }
    
    /* Miss Information Logo Styles */
    body.theme-miss h1 {
      font-family: 'Comfortaa', 'Quicksand', cursive;
      font-size: 2.8rem;
      letter-spacing: 1px;
    }
    
    .logo-sanity {
      display: inline;
    }
    
    .logo-miss {
      display: none;
    }
    
    body.theme-miss .logo-sanity {
      display: none;
    }
    
    body.theme-miss .logo-miss {
      display: inline;
    }
    
    .logo-miss .miss-heart {
      color: #f472b6;
      display: inline-block;
      animation: heartbeat 1.5s ease-in-out infinite;
    }
    
    @keyframes heartbeat {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }
    
    .logo-miss .sparkle {
      color: #fcd34d;
      font-size: 0.7em;
      vertical-align: super;
    }
    
    /* Miss Information button styles */
    body.theme-miss .download-btn {
      background: linear-gradient(135deg, #c084fc 0%, #a855f7 50%, #f472b6 100%);
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(192, 132, 252, 0.4);
    }
    
    body.theme-miss .download-btn:hover {
      background: linear-gradient(135deg, #d8b4fe 0%, #c084fc 50%, #f9a8d4 100%);
      transform: translateY(-2px) scale(1.02);
    }
    
    /* Miss Information subtle background sparkles */
    body.theme-miss::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(2px 2px at 20% 30%, rgba(244, 114, 182, 0.3), transparent),
        radial-gradient(2px 2px at 40% 70%, rgba(192, 132, 252, 0.2), transparent),
        radial-gradient(2px 2px at 60% 20%, rgba(252, 211, 77, 0.2), transparent),
        radial-gradient(2px 2px at 80% 50%, rgba(192, 132, 252, 0.3), transparent),
        radial-gradient(1px 1px at 10% 80%, rgba(244, 114, 182, 0.2), transparent),
        radial-gradient(1px 1px at 90% 10%, rgba(252, 211, 77, 0.15), transparent);
      pointer-events: none;
      z-index: 0;
      animation: sparkle-drift 20s linear infinite;
    }
    
    @keyframes sparkle-drift {
      0% { transform: translateY(0); }
      100% { transform: translateY(-20px); }
    }
    
    body.theme-miss .hero,
    body.theme-miss .demo-section,
    body.theme-miss .how-section,
    body.theme-miss .install-section,
    body.theme-miss footer {
      position: relative;
      z-index: 1;
    }
    
    /* Miss Information nav arrows */
    body.theme-miss .nav-arrow {
      border-color: rgba(192, 132, 252, 0.3);
      background: rgba(192, 132, 252, 0.1);
    }
    
    body.theme-miss .nav-arrow:hover {
      background: rgba(192, 132, 252, 0.25);
      border-color: #c084fc;
      color: #f5f0fa;
    }
    
    /* Miss Information page dots */
    body.theme-miss .page-dot.active {
      background: linear-gradient(135deg, #c084fc, #f472b6);
      border-color: transparent;
    }
    
    /* Miss Information how-section styling */
    body.theme-miss .how-step-num {
      background: linear-gradient(135deg, #c084fc 0%, #f472b6 100%);
    }
    
    /* Smooth theme transitions */
    body, .download-btn, .nav-arrow, .page-dot, .how-step-num {
      transition: all 0.4s ease;
    }
    
    .tagline {
      font-size: 1.25rem;
      color: #ffffff;
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
      padding: 20px 24px 80px;
      max-width: 960px;
      margin: 0 auto;
      position: relative;
    }
    
    .section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--text-muted);
      margin-bottom: 16px;
      text-align: center;
    }
    
    .demo-wrapper {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .nav-arrow {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 1px solid var(--border-strong);
      background: var(--bg-secondary);
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }
    
    .nav-arrow:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border-color: var(--text-muted);
    }
    
    .nav-arrow svg {
      width: 20px;
      height: 20px;
    }
    
    .browser-window {
      flex: 1;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border-strong);
      background: #1c1c1c;
      position: relative;
    }
    
    .browser-header {
      background: #2a2a2a;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border);
    }
    
    .browser-dots {
      display: flex;
      gap: 6px;
    }
    
    .browser-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    
    .browser-dot.red { background: #ff5f56; }
    .browser-dot.yellow { background: #ffbd2e; }
    .browser-dot.green { background: #27ca40; }
    
    .browser-url {
      flex: 1;
      background: #1a1a1a;
      border-radius: 4px;
      padding: 5px 12px;
      font-size: 12px;
      color: var(--text-muted);
      font-family: -apple-system, BlinkMacSystemFont, monospace;
    }
    
    .browser-content {
      padding: 28px 32px;
      background: #ffffff;
      position: relative;
      min-height: 220px;
    }
    
    .article-text {
      font-size: 19px;
      line-height: 1.9;
      color: #1a1a1a;
      font-family: Georgia, 'Times New Roman', serif;
    }
    
    .article-text p {
      margin-bottom: 1em;
    }
    
    .article-text p:last-child {
      margin-bottom: 0;
    }
    
    /* Highlight Styles */
    .highlight {
      cursor: help;
      position: relative;
      display: inline;
      border-radius: 2px;
      padding: 2px 4px;
      margin: 0 -2px;
      transition: background 0.2s ease;
    }
    
    .highlight.critical {
      background: linear-gradient(to bottom, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.2) 100%);
    }
    
    .highlight.critical.active,
    .highlight.critical:hover {
      background: rgba(239, 68, 68, 0.45);
    }
    
    .highlight.significant {
      background: linear-gradient(to bottom, rgba(234, 179, 8, 0.3) 0%, rgba(234, 179, 8, 0.2) 100%);
    }
    
    .highlight.significant.active,
    .highlight.significant:hover {
      background: rgba(234, 179, 8, 0.45);
    }
    
    .highlight.minor {
      background: linear-gradient(to bottom, rgba(115, 115, 115, 0.3) 0%, rgba(115, 115, 115, 0.2) 100%);
    }
    
    .highlight.minor.active,
    .highlight.minor:hover {
      background: rgba(115, 115, 115, 0.45);
    }
    
    /* Fake Cursor */
    .fake-cursor {
      position: absolute;
      width: 20px;
      height: 20px;
      pointer-events: none;
      z-index: 100;
      opacity: 1;
      transition: opacity 0.2s ease;
    }
    
    .fake-cursor.hidden {
      opacity: 0;
    }
    
    .fake-cursor svg {
      width: 20px;
      height: 20px;
      filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
    }
    
    /* Tooltip Styles */
    .tooltip {
      position: fixed;
      z-index: 10000;
      width: max-content;
      max-width: 340px;
      min-width: 260px;
      background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
      border: 1px solid;
      border-radius: 8px;
      padding: 12px 14px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      font-size: 13px;
      line-height: 1.5;
      color: #f5f5f5;
      pointer-events: none;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.15s ease, transform 0.15s ease;
    }
    
    .tooltip.visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    .tooltip.critical {
      border-color: #ef4444;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.2);
    }
    
    .tooltip.significant {
      border-color: #eab308;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(234, 179, 8, 0.2);
    }
    
    .tooltip.minor {
      border-color: #737373;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(115, 115, 115, 0.2);
    }
    
    .tooltip-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .tooltip.critical .tooltip-badge {
      background: #ef4444;
      color: white;
    }
    
    .tooltip.significant .tooltip-badge {
      background: #eab308;
      color: #000;
    }
    
    .tooltip.minor .tooltip-badge {
      background: #737373;
      color: white;
    }
    
    .tooltip-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    
    .tooltip-icon {
      font-size: 16px;
    }
    
    .tooltip-type {
      font-weight: 600;
      font-size: 14px;
    }
    
    .tooltip.critical .tooltip-type { color: #ef4444; }
    .tooltip.significant .tooltip-type { color: #eab308; }
    .tooltip.minor .tooltip-type { color: #737373; }
    
    .tooltip-text {
      color: #d4d4d4;
    }
    
    /* Page Indicators */
    .page-indicators {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
    }
    
    .page-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-strong);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .page-dot.active {
      background: var(--accent);
      border-color: var(--accent);
    }
    
    .page-dot:hover:not(.active) {
      background: var(--bg-hover);
    }
    
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
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
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

    @media (max-width: 900px) {
      .how-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; }
    }
    
    @media (max-width: 600px) {
      .how-grid { grid-template-columns: 1fr; gap: 20px; }
    }
    
    @media (max-width: 600px) {
      .hero { padding: 40px 20px 32px; }
      .demo-section, .how-section, .install-section { padding: 48px 20px; }
    }
  </style>
</head>
<body>
  <!-- Theme Toggle -->
  <div class="theme-toggle-container">
    <span class="theme-label active" id="label-sanity">Sanity</span>
    <div class="theme-toggle" id="theme-toggle" onclick="toggleTheme()">
      <div class="theme-toggle-slider"></div>
    </div>
    <span class="theme-label" id="label-miss">Miss Info</span>
  </div>

  <section class="hero">
    <div class="hero-content">
      <h1>
        <span class="logo-sanity">Sanity<span class="accent">Check</span></span>
        <span class="logo-miss">Miss <span class="accent">Info</span><span class="miss-heart">♡</span><span class="sparkle">✧</span></span>
      </h1>
      <p class="tagline">
        <span class="logo-sanity">A browser extension that catches the reasoning gaps you'd normally miss.</span>
        <span class="logo-miss">Your kawaii detective for spotting sneaky logic~ ♪</span>
      </p>
      
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
    <p class="section-label">Watch the demo or hover to explore</p>
    
    <div class="demo-wrapper">
      <button class="nav-arrow" id="prev-btn" aria-label="Previous example">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      
      <div class="browser-window" id="browser-window">
        <div class="browser-header">
          <div class="browser-dots">
            <span class="browser-dot red"></span>
            <span class="browser-dot yellow"></span>
            <span class="browser-dot green"></span>
          </div>
          <div class="browser-url" id="browser-url">techdigest.com/ai-revolution-workplace</div>
        </div>
        <div class="browser-content" id="browser-content">
          <div class="article-text" id="article-text"></div>
          
          <!-- Fake cursor -->
          <div class="fake-cursor" id="fake-cursor">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4L10.5 20L12.5 13.5L19 11.5L4 4Z" fill="black" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
      
      <button class="nav-arrow" id="next-btn" aria-label="Next example">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
    
    <div class="page-indicators" id="page-indicators"></div>
  </section>
  
  <!-- Tooltip element -->
  <div class="tooltip" id="tooltip"></div>
  
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
          <p>The LLM Council reads the article and identifies where conclusions don't follow from premises.</p>
        </div>
        <div class="how-step">
          <div class="how-step-num">3</div>
          <h3>See issues inline</h3>
          <p>Problematic passages are highlighted. Hover to see what's wrong with the reasoning.</p>
        </div>
        <div class="how-step">
          <div class="how-step-num">4</div>
          <h3>Leave us feedback</h3>
          <p>We're in beta! Help improve the model by clicking "leave feedback on this text" on any highlight.</p>
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
  
  <script>
    // Article examples data
    const articles = [
      {
        url: "techdigest.com/ai-revolution-workplace",
        content: \`
          <p>
            A recent survey found that 78% of companies have adopted at least one AI tool in the past year. <span class="highlight critical" data-type="Unsupported Leap" data-importance="critical" data-explanation="Adoption rates don't indicate effectiveness or satisfaction. Many companies adopt tools that go unused, and the survey doesn't reveal whether these tools actually improved productivity or outcomes.">This widespread adoption proves that AI is fundamentally transforming how businesses operate.</span> Industry experts predict this trend will only accelerate.
          </p>
          <p>
            One CEO reported that after implementing an AI assistant, his team's output doubled within weeks. <span class="highlight significant" data-type="Anecdotal Evidence" data-importance="significant" data-explanation="A single company's experience cannot be generalized. The timing could be coincidental, other factors may have contributed, and 'output' is vague—quantity doesn't equal quality.">His experience demonstrates the massive productivity gains available to any company willing to embrace these tools.</span>
          </p>
          <p>
            Critics who worry about job displacement are missing the bigger picture. <span class="highlight minor" data-type="Dismissive Framing" data-importance="minor" data-explanation="Characterizing legitimate concerns as 'missing the bigger picture' dismisses them without addressing the substance. Job displacement concerns are supported by economic research and historical precedent.">Every major technological shift has ultimately created more jobs than it eliminated.</span>
          </p>
        \`
      },
      {
        url: "jamesclear.substack.com/p/habits-identity",
        content: \`
          <p>
            I used to struggle with consistency until I realized something: you don't rise to the level of your goals, you fall to the level of your systems. <span class="highlight significant" data-type="False Dichotomy" data-importance="significant" data-explanation="Goals and systems aren't mutually exclusive—they work together. Many successful people credit both clear goals AND good systems. Presenting this as either/or oversimplifies the relationship.">Once I stopped focusing on goals entirely and built better systems, everything changed.</span>
          </p>
          <p>
            The key insight is that every action you take is a vote for the type of person you wish to become. <span class="highlight minor" data-type="Unfalsifiable Claim" data-importance="minor" data-explanation="While this framing can be motivating, it's structured so it can't be proven wrong. Any action can be interpreted as 'voting for identity,' making it more of a perspective than a verifiable insight.">This is why identity-based habits are more powerful than outcome-based habits.</span> When you focus on who you want to become rather than what you want to achieve, lasting change becomes inevitable.
          </p>
          <p>
            I've seen this work for thousands of readers who write to me. <span class="highlight critical" data-type="Survivorship Bias" data-importance="critical" data-explanation="Only hearing from readers who succeeded creates a skewed sample. Those for whom the advice didn't work are less likely to write in, making success rates appear higher than they actually are.">The pattern is undeniable—identity change precedes behavior change, every single time.</span>
          </p>
        \`
      },
      {
        url: "morningnews.com/economy/housing-crisis",
        content: \`
          <p>
            Home prices have increased 40% over the past three years while wages grew only 12%. <span class="highlight critical" data-type="Missing Context" data-importance="critical" data-explanation="These national averages mask huge regional variation. Some markets saw prices drop while others doubled. Without geographic breakdown, the comparison is misleading for most readers' actual situations.">Young Americans are now locked out of homeownership for the foreseeable future.</span>
          </p>
          <p>
            Real estate experts point to limited housing supply as the primary driver. <span class="highlight significant" data-type="Oversimplification" data-importance="significant" data-explanation="Housing affordability involves multiple interacting factors: interest rates, investment buying, zoning laws, construction costs, and income inequality. Reducing it to 'supply' ignores policy choices that shape the market.">If we simply built more homes, prices would naturally fall to affordable levels.</span> Several cities have begun relaxing zoning restrictions in response.
          </p>
          <p>
            Some economists argue that remote work migration is responsible, pointing to price spikes in previously affordable cities. <span class="highlight minor" data-type="Post Hoc Reasoning" data-importance="minor" data-explanation="Remote work and price increases happened around the same time, but correlation isn't causation. Low interest rates, pandemic savings, and investor activity also spiked during this period.">Cities that attracted remote workers saw prices double, proving the connection.</span>
          </p>
        \`
      }
    ];
    
    let currentArticleIndex = 0;
    
    const tooltip = document.getElementById('tooltip');
    const fakeCursor = document.getElementById('fake-cursor');
    const browserContent = document.getElementById('browser-content');
    const browserUrl = document.getElementById('browser-url');
    const articleText = document.getElementById('article-text');
    const pageIndicators = document.getElementById('page-indicators');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    let highlights = [];
    let isUserControlling = false;
    let animationPaused = false;
    let currentHighlightIndex = 0;
    let animationTimeout = null;
    let cursorX = 50;
    let cursorY = 50;
    let animationFrameId = null;
    
    // Initialize page indicators
    function initPageIndicators() {
      pageIndicators.innerHTML = '';
      articles.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'page-dot ' + (i === currentArticleIndex ? 'active' : '');
        dot.addEventListener('click', () => goToArticle(i));
        pageIndicators.appendChild(dot);
      });
    }
    
    // Update page indicators
    function updatePageIndicators() {
      const dots = pageIndicators.querySelectorAll('.page-dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentArticleIndex);
      });
    }
    
    // Load article content
    function loadArticle(index) {
      const article = articles[index];
      browserUrl.textContent = article.url;
      articleText.innerHTML = article.content;
      
      // Re-query highlights after content change
      highlights = Array.from(document.querySelectorAll('.highlight'));
      
      // Re-attach event listeners to new highlights
      highlights.forEach(highlight => {
        highlight.addEventListener('mouseenter', (e) => {
          if (!isUserControlling) return;
          showTooltipForHighlight(highlight, e.clientX, e.clientY);
        });
        
        highlight.addEventListener('mouseleave', () => {
          if (!isUserControlling) return;
          hideTooltip();
        });
        
        highlight.addEventListener('mousemove', (e) => {
          if (!isUserControlling) return;
          positionTooltipAt(e.clientX, e.clientY);
        });
      });
      
      updatePageIndicators();
    }
    
    // Navigate to specific article
    function goToArticle(index) {
      stopAnimation();
      currentArticleIndex = index;
      currentHighlightIndex = 0;
      cursorX = 50;
      cursorY = 50;
      fakeCursor.style.left = '50px';
      fakeCursor.style.top = '50px';
      loadArticle(index);
      setTimeout(startAnimation, 300);
    }
    
    // Navigate to next/previous
    function nextArticle() {
      goToArticle((currentArticleIndex + 1) % articles.length);
    }
    
    function prevArticle() {
      goToArticle((currentArticleIndex - 1 + articles.length) % articles.length);
    }
    
    // Show tooltip for a highlight
    function showTooltipForHighlight(highlight, cursorX, cursorY) {
      const type = highlight.dataset.type || 'Issue';
      const importance = highlight.dataset.importance || 'minor';
      const explanation = highlight.dataset.explanation || '';
      
      const emoji = importance === 'critical' ? '🔴' : 
                    importance === 'significant' ? '🟠' : '🟡';
      
      tooltip.className = 'tooltip ' + importance;
      tooltip.innerHTML = 
        '<div class="tooltip-badge">Logic Issue</div>' +
        '<div class="tooltip-header">' +
          '<span class="tooltip-icon">' + emoji + '</span>' +
          '<span class="tooltip-type">' + type + '</span>' +
        '</div>' +
        '<div class="tooltip-text">' + explanation + '</div>';
      
      positionTooltipAt(cursorX, cursorY);
      tooltip.classList.add('visible');
      highlight.classList.add('active');
    }
    
    function hideTooltip() {
      tooltip.classList.remove('visible');
      highlights.forEach(h => h.classList.remove('active'));
    }
    
    function positionTooltipAt(x, y) {
      const padding = 15;
      const rect = tooltip.getBoundingClientRect();
      
      let left = x + padding;
      let top = y + padding;
      
      if (left + rect.width > window.innerWidth - padding) {
        left = x - rect.width - padding;
      }
      if (top + rect.height > window.innerHeight - padding) {
        top = y - rect.height - padding;
      }
      
      tooltip.style.left = Math.max(padding, left) + 'px';
      tooltip.style.top = Math.max(padding, top) + 'px';
    }
    
    // Quadratic bezier curve interpolation
    function quadraticBezier(t, p0, p1, p2) {
      const mt = 1 - t;
      return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
    }
    
    // Animate cursor along a curved path
    function animateCursorToPosition(targetX, targetY, duration, callback) {
      const startX = cursorX;
      const startY = cursorY;
      const startTime = performance.now();
      
      const midX = (startX + targetX) / 2;
      const midY = (startY + targetY) / 2;
      const distance = Math.sqrt((targetX - startX) ** 2 + (targetY - startY) ** 2);
      
      const angle = Math.atan2(targetY - startY, targetX - startX) + Math.PI / 2;
      const arcIntensity = (Math.random() - 0.5) * distance * 0.8;
      const controlX = midX + Math.cos(angle) * arcIntensity;
      const controlY = midY + Math.sin(angle) * arcIntensity;
      
      function animate(currentTime) {
        if (isUserControlling || animationPaused) {
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
          return;
        }
        
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        cursorX = quadraticBezier(eased, startX, controlX, targetX);
        cursorY = quadraticBezier(eased, startY, controlY, targetY);
        
        fakeCursor.style.left = cursorX + 'px';
        fakeCursor.style.top = cursorY + 'px';
        
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          if (callback) callback();
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    }
    
    // Animate fake cursor through highlights
    function animateCursor() {
      if (isUserControlling || animationPaused) return;
      if (highlights.length === 0) return;
      
      const highlight = highlights[currentHighlightIndex];
      const contentRect = browserContent.getBoundingClientRect();
      const highlightRect = highlight.getBoundingClientRect();
      
      const xOffset = 0.15 + Math.random() * 0.35;
      const yOffset = 0.3 + Math.random() * 0.4;
      
      const targetX = highlightRect.left + highlightRect.width * xOffset - contentRect.left;
      const targetY = highlightRect.top + highlightRect.height * yOffset - contentRect.top;
      
      animateCursorToPosition(targetX, targetY, 800, () => {
        if (isUserControlling || animationPaused) return;
        
        const absX = highlightRect.left + highlightRect.width * xOffset;
        const absY = highlightRect.top + highlightRect.height * yOffset;
        showTooltipForHighlight(highlight, absX, absY);
        
        animationTimeout = setTimeout(() => {
          if (isUserControlling || animationPaused) return;
          
          hideTooltip();
          
          animationTimeout = setTimeout(() => {
            if (isUserControlling || animationPaused) return;
            
            currentHighlightIndex = (currentHighlightIndex + 1) % highlights.length;
            animateCursor();
          }, 300);
          
        }, 2500);
      });
    }
    
    function startAnimation() {
      isUserControlling = false;
      animationPaused = false;
      fakeCursor.classList.remove('hidden');
      animateCursor();
    }
    
    function stopAnimation() {
      isUserControlling = true;
      if (animationTimeout) {
        clearTimeout(animationTimeout);
        animationTimeout = null;
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      fakeCursor.classList.add('hidden');
      hideTooltip();
    }
    
    // Event listeners
    browserContent.addEventListener('mouseenter', () => {
      stopAnimation();
    });
    
    browserContent.addEventListener('mouseleave', () => {
      hideTooltip();
      setTimeout(() => {
        if (!isUserControlling) return;
        startAnimation();
      }, 1000);
    });
    
    prevBtn.addEventListener('click', prevArticle);
    nextBtn.addEventListener('click', nextArticle);
    
    // Initialize
    initPageIndicators();
    loadArticle(0);
    setTimeout(startAnimation, 500);
    
    // ===== Theme Toggle =====
    function toggleTheme() {
      const body = document.body;
      const toggle = document.getElementById('theme-toggle');
      const labelSanity = document.getElementById('label-sanity');
      const labelMiss = document.getElementById('label-miss');
      
      body.classList.toggle('theme-miss');
      toggle.classList.toggle('active');
      
      const isMiss = body.classList.contains('theme-miss');
      labelSanity.classList.toggle('active', !isMiss);
      labelMiss.classList.toggle('active', isMiss);
      
      // Update page title
      document.title = isMiss 
        ? 'Miss Information ♡ Your Kawaii Logic Detective~' 
        : 'SanityCheck — Catch the Reasoning Gaps You\\'d Miss';
      
      // Save preference
      localStorage.setItem('theme', isMiss ? 'miss' : 'sanity');
    }
    
    // Load saved theme preference
    (function() {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'miss') {
        toggleTheme();
      }
    })();
  </script>
</body>
</html>`;
}
