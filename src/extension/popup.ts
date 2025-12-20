/**
 * SanityCheck - Popup Script
 */

import { makeKawaii } from '../shared';
import {
  AnalysisIssue,
  ParsedAnalysis,
  ExtractedArticle,
  sendToBackground,
  sendToContent,
} from './messaging';
import { debug } from './debug';
import { DEBUG_MODE, BACKEND_URL } from './config';

// Extended article type for popup (includes wordCount from extraction)
type Article = ExtractedArticle;

// DOM Elements
const pageStatus = document.getElementById('page-status')!;
const actionSection = document.getElementById('action-section')!;
const analyzeBtn = document.getElementById('analyze-btn')!;
const loadingSection = document.getElementById('loading-section')!;
const resultsSection = document.getElementById('results-section')!;
const resultsContent = document.getElementById('results-content')!;
const errorSection = document.getElementById('error-section')!;
const errorMessage = document.getElementById('error-message')!;
const articleTextSection = document.getElementById('article-text-section')!;
const articleTextContent = document.getElementById('article-text-content')!;
const closeArticleTextBtn = document.getElementById('close-article-text')!;

let currentArticle: Article | null = null;
let currentTabId: number | null = null;
let statusPollInterval: ReturnType<typeof setInterval> | null = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => { void init(); });

async function init(): Promise<void> {
  try {
    // Load theme preference
    chrome.storage.local.get(['theme'], (result) => {
      if (result.theme === 'miss') {
        document.body.classList.add('theme-miss');
        document.title = 'Miss Information';
      } else {
        document.body.classList.remove('theme-miss');
        document.title = 'SanityCheck';
      }
    });
    
    // Listen for theme changes
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.theme) {
        if (changes.theme.newValue === 'miss') {
          document.body.classList.add('theme-miss');
          document.title = 'Miss Information';
        } else {
          document.body.classList.remove('theme-miss');
          document.title = 'SanityCheck';
        }
      }
    });
    
    const debugIndicator = document.getElementById('debug-indicator');
    if (DEBUG_MODE && debugIndicator) {
      debugIndicator.classList.remove('hidden');
      const backendUrlElement = document.getElementById('backend-url');
      if (backendUrlElement) {
        backendUrlElement.textContent = BACKEND_URL;
      }
    } else if (debugIndicator) {
      debugIndicator.classList.add('hidden');
    }
    
    debug.log('Popup initialized', { timestamp: new Date().toISOString() }, 'popup-init');
    
    await checkCurrentPage();
    
    analyzeBtn.addEventListener('click', () => { void analyzeArticle(); });
    pageStatus.addEventListener('click', toggleArticleText);
    closeArticleTextBtn.addEventListener('click', hideArticleText);
    
    debug.log('Initialization complete', {}, 'popup-init');
  } catch (error) {
    debug.error('Initialization failed', error, 'popup-init');
  }
}

window.addEventListener('unload', () => {
  if (statusPollInterval) {
    clearInterval(statusPollInterval);
  }
});

async function checkCurrentPage(): Promise<void> {
  try {
    debug.log('Checking current page', {}, 'popup-check-page');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      showError('Cannot access this tab');
      return;
    }
    
    currentTabId = tab.id;
    
    debug.log('Tab info retrieved', {
      tabId: tab.id,
      url: tab.url,
      title: tab.title
    }, 'popup-check-page');
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      debug.log('Content script injected', {}, 'popup-check-page');
    } catch (injectError) {
      debug.warn('Content script injection failed (may already be injected)', { error: injectError }, 'popup-check-page');
    }
    
    debug.log('Sending extractArticle message', {}, 'popup-check-page');
    
    const response = await sendToContent(tab.id, { action: 'extractArticle' });
    
    debug.log('Received article extraction response', {
      hasResponse: !!response,
      isArticle: response?.isArticle,
      wordCount: response?.wordCount,
      confidence: response?.confidence
    }, 'popup-check-page');
    
    if (response && response.isArticle) {
      currentArticle = response;
      debug.log('Article detected', {
        wordCount: response.wordCount,
        confidence: response.confidence,
        title: response.title
      }, 'popup-check-page');
      showArticleDetected(response);
      
      await checkAnalysisStatus(tab.url ?? '');
      
    } else if (response) {
      debug.log('Not an article page', {
        wordCount: response.wordCount,
        confidence: response.confidence
      }, 'popup-check-page');
      showNotArticle(response);
      
      if (response.wordCount > 100) {
        currentArticle = response;
        await checkAnalysisStatus(tab.url ?? '');
      }
    } else {
      debug.warn('No response from content script', {}, 'popup-check-page');
      showError('Could not analyze this page');
    }
  } catch (error) {
    debug.error('Error checking page', error, 'popup-check-page', {
      tabId: currentTabId,
    });
    showError('Cannot analyze this page. Try refreshing and reopening the extension.');
  }
}

async function checkAnalysisStatus(url: string): Promise<void> {
  const status = await sendToBackground({ action: 'getAnalysisStatus', url });
  
  debug.log('Analysis status check', { status }, 'popup-status');
  
  if (status.status === 'analyzing') {
    showLoading();
    startStatusPolling(url);
    return;
  }
  
  if (status.status === 'complete' && status.parsed) {
    displayResults(status.parsed);
    if (status.parsed.issues && status.parsed.issues.length > 0) {
      await sendHighlightsToPage(status.parsed.issues);
    }
    return;
  }
  
  if (status.status === 'error') {
    showError(status.error ?? 'Analysis failed');
    actionSection.classList.remove('hidden');
    return;
  }
  
  const cached = await chrome.storage.local.get([`analysis_${url}`]) as Record<string, ParsedAnalysis>;
  const cachedAnalysis = cached[`analysis_${url}`];
  if (cachedAnalysis) {
    displayResults(cachedAnalysis);
    if (cachedAnalysis.issues && cachedAnalysis.issues.length > 0) {
      await sendHighlightsToPage(cachedAnalysis.issues);
    }
  }
}

function startStatusPolling(url: string): void {
  statusPollInterval = setInterval(() => {
    void (async () => {
      try {
        const status = await sendToBackground({ action: 'getAnalysisStatus', url });
        
        if (status.status === 'complete') {
          if (statusPollInterval) clearInterval(statusPollInterval);
          statusPollInterval = null;
          loadingSection.classList.add('hidden');
          
          if (status.parsed) {
            displayResults(status.parsed);
            if (status.parsed.issues && status.parsed.issues.length > 0) {
              await sendHighlightsToPage(status.parsed.issues);
            }
          }
        } else if (status.status === 'error') {
          if (statusPollInterval) clearInterval(statusPollInterval);
          statusPollInterval = null;
          loadingSection.classList.add('hidden');
          showError(status.error ?? 'Analysis failed');
          actionSection.classList.remove('hidden');
        }
      } catch (_e) {
        // Ignore polling errors
      }
    })();
  }, 500);
}

function showLoading(): void {
  hideError();
  actionSection.classList.add('hidden');
  loadingSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');
}

function showArticleDetected(article: Article): void {
  const statusIcon = pageStatus.querySelector('.status-icon');
  const statusText = pageStatus.querySelector('.status-text');
  const viewHint = pageStatus.querySelector('.view-text-hint');
  
  if (statusIcon) {
    statusIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
    statusIcon.classList.add('ready');
  }
  
  if (statusText) {
    statusText.innerHTML = `
      <strong>Article detected</strong><br>
      <span style="color: var(--text-muted); font-size: 12px;">${article.wordCount.toLocaleString()} words</span>
    `;
  }
  
  if (viewHint) {
    viewHint.classList.remove('hidden');
  }
  
  pageStatus.classList.add('article');
  pageStatus.classList.add('clickable');
  actionSection.classList.remove('hidden');
  
  debug.log('Article detected UI updated', {
    wordCount: article.wordCount,
    hasText: !!article.text
  }, 'popup-ui');
}

function showNotArticle(info: Article): void {
  const statusIcon = pageStatus.querySelector('.status-icon');
  const statusText = pageStatus.querySelector('.status-text');
  const viewHint = pageStatus.querySelector('.view-text-hint');
  
  if (statusIcon) {
    statusIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
  }
  
  if (statusText) {
    statusText.innerHTML = `
      <strong>Not an article page</strong><br>
      <span style="color: var(--text-muted); font-size: 12px;">This appears to be a different type of page</span>
    `;
  }
  
  if (info && info.wordCount > 100) {
    currentArticle = info;
    actionSection.classList.remove('hidden');
    analyzeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg> Analyze Anyway`;
    
    if (viewHint) {
      viewHint.classList.remove('hidden');
    }
    pageStatus.classList.add('clickable');
  } else {
    if (viewHint) {
      viewHint.classList.add('hidden');
    }
    pageStatus.classList.remove('clickable');
  }
}

function showError(message: string): void {
  errorSection.classList.remove('hidden');
  errorMessage.textContent = message;
}

function hideError(): void {
  errorSection.classList.add('hidden');
}

async function analyzeArticle(): Promise<void> {
  if (!currentArticle) {
    debug.warn('Analyze called but no article available', {}, 'popup-analyze');
    return;
  }
  
  debug.log('Starting article analysis', {
    wordCount: currentArticle.wordCount,
    title: currentArticle.title,
    url: currentArticle.url
  }, 'popup-analyze');
  
  showLoading();
  
  if (!currentTabId) {
    showError('No tab available');
    return;
  }
  
  try {
    const response = await sendToBackground({
      action: 'startAnalysis',
      tabId: currentTabId,
      article: currentArticle
    });
    
    if (!response.success) {
      throw new Error(response.error ?? 'Failed to start analysis');
    }
    
    debug.log('Analysis started in background', {}, 'popup-analyze');
    
    startStatusPolling(currentArticle.url);
    
  } catch (error) {
    const err = error as Error;
    debug.error('Failed to start analysis', error, 'popup-analyze');
    showError(err.message ?? 'Failed to start analysis');
    actionSection.classList.remove('hidden');
    loadingSection.classList.add('hidden');
  }
}

async function sendHighlightsToPage(issues: AnalysisIssue[]): Promise<void> {
  if (!currentTabId) {
    debug.warn('Cannot send highlights: no tab ID', {}, 'popup-highlights');
    return;
  }
  
  debug.log('Sending highlights to content script', {
    issueCount: issues.length,
    tabId: currentTabId
  }, 'popup-highlights');
  
  try {
    await sendToContent(currentTabId, {
      action: 'highlightIssues',
      issues: issues
    });
    debug.log('Highlights sent successfully', {}, 'popup-highlights');
  } catch (error) {
    debug.error('Failed to send highlights', error, 'popup-highlights', {
      tabId: currentTabId,
      issueCount: issues.length
    });
  }
}

function displayResults(parsed: ParsedAnalysis): void {
  resultsSection.classList.remove('hidden');
  loadingSection.classList.add('hidden');
  actionSection.classList.add('hidden');
  
  if (parsed.rawText) {
    resultsContent.innerHTML = `
      <div style="color: var(--warning); margin-bottom: 12px;">
        Could not parse structured response
      </div>
      <div style="white-space: pre-wrap; font-size: 12px;">${escapeHtml(parsed.rawText)}</div>
    `;
    return;
  }
  
  if (!parsed.issues || parsed.issues.length === 0) {
    resultsContent.innerHTML = `
      <div class="no-fallacies">
        <div class="checkmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
        <strong>No significant issues found</strong>
        <p style="color: var(--text-muted); margin-top: 8px;">${escapeHtml(addKawaiiToText(parsed.summary ?? parsed.overall_assessment ?? 'The article appears to be logically sound.'))}</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  html += `
    <div class="analysis-summary">
      <div class="summary-header">
        <span class="issue-count">${parsed.issues.length} issue${parsed.issues.length !== 1 ? 's' : ''} found</span>
        <span class="severity-badge ${parsed.severity ?? 'none'}">${parsed.severity ?? 'unknown'}</span>
      </div>
      ${parsed.summary ?? parsed.overall_assessment ? `<p style="color: var(--text-secondary); font-size: 12px; line-height: 1.6;">${escapeHtml(addKawaiiToText(parsed.summary ?? parsed.overall_assessment ?? ''))}</p>` : ''}
      <p style="color: var(--text-muted); margin-top: 10px; font-size: 11px;">Issues are highlighted in the article. Hover to see details.</p>
    </div>
  `;
  
  if (parsed.central_argument_analysis?.central_logical_gap) {
    html += `
      <div class="central-gap-box">
        <div class="central-gap-header">
          Central Logical Gap
        </div>
        <div class="central-gap-content">
          ${escapeHtml(addKawaiiToText(parsed.central_argument_analysis.central_logical_gap))}
        </div>
      </div>
    `;
  }
  
  const sortedIssues = [...parsed.issues].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, significant: 1, minor: 2 };
    return (order[a.importance ?? 'minor'] ?? 2) - (order[b.importance ?? 'minor'] ?? 2);
  });
  
  sortedIssues.forEach((issue, index) => {
    const importanceClass = issue.importance ?? 'minor';
    const gap = issue.gap;
    
    html += `
      <div class="fallacy-item ${importanceClass}" data-issue-index="${index}">
        <div class="fallacy-header">
          <span class="importance-badge ${importanceClass}">${issue.importance ?? 'issue'}</span>
        </div>
        ${issue.quote ? `<div class="fallacy-quote">"${escapeHtml(issue.quote.substring(0, 150))}${issue.quote.length > 150 ? '...' : ''}"</div>` : ''}
        ${gap ? `<div class="fallacy-gap-simple">${escapeHtml(addKawaiiToText(gap))}</div>` : ''}
      </div>
    `;
  });
  
  resultsContent.innerHTML = html;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Apply kawaii styling only when in Miss Information mode
 */
function addKawaiiToText(text: string): string {
  if (!text) return text;
  if (!document.body.classList.contains('theme-miss')) {
    return text;
  }
  return makeKawaii(text);
}

function toggleArticleText(): void {
  if (!currentArticle || !currentArticle.text) {
    debug.warn('No article text to display', {}, 'popup-article-text');
    return;
  }
  
  if (articleTextSection.classList.contains('hidden')) {
    showArticleText();
  } else {
    hideArticleText();
  }
}

function showArticleText(): void {
  if (!currentArticle || !currentArticle.text) {
    debug.warn('Cannot show article text: no article available', {}, 'popup-article-text');
    return;
  }
  
  debug.log('Showing article text', {
    textLength: currentArticle.text.length,
    wordCount: currentArticle.wordCount,
    title: currentArticle.title
  }, 'popup-article-text');
  
  const header = articleTextSection.querySelector('h3');
  if (header && currentArticle.title) {
    header.textContent = `Extracted Article: ${currentArticle.title}`;
  }
  
  articleTextContent.textContent = currentArticle.text;
  articleTextSection.classList.remove('hidden');
  
  articleTextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideArticleText(): void {
  debug.log('Hiding article text', {}, 'popup-article-text');
  articleTextSection.classList.add('hidden');
}

