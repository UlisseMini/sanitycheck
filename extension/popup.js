// SanityCheck - Popup Script

const BACKEND_URL = 'https://sanitycheck-production.up.railway.app';

// Debug logging will be available via window.debug

// DOM Elements
const settingsBtn = document.getElementById('settings-btn');
const pageStatus = document.getElementById('page-status');
const actionSection = document.getElementById('action-section');
const analyzeBtn = document.getElementById('analyze-btn');
const loadingSection = document.getElementById('loading-section');
const resultsSection = document.getElementById('results-section');
const resultsContent = document.getElementById('results-content');
const errorSection = document.getElementById('error-section');
const errorMessage = document.getElementById('error-message');
const articleTextSection = document.getElementById('article-text-section');
const articleTextContent = document.getElementById('article-text-content');
const closeArticleTextBtn = document.getElementById('close-article-text');

let currentArticle = null;
let currentTabId = null;
let statusPollInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    // Check if debug mode is enabled
    const DEBUG_ENABLED = typeof window.debug !== 'undefined' && window.debug.ENABLED !== false;
    const debugIndicator = document.getElementById('debug-indicator');
    if (DEBUG_ENABLED && debugIndicator) {
      debugIndicator.classList.remove('hidden');
    } else if (debugIndicator) {
      debugIndicator.classList.add('hidden');
    }
    
    debug.log('Popup initialized', { timestamp: new Date().toISOString() }, 'popup-init');
    
    // Check current page
    await checkCurrentPage();
    
    // Set up event listeners
    settingsBtn.addEventListener('click', openSettings);
    analyzeBtn.addEventListener('click', analyzeArticle);
    pageStatus.addEventListener('click', toggleArticleText);
    closeArticleTextBtn.addEventListener('click', hideArticleText);
    
    debug.log('Initialization complete', {}, 'popup-init');
  } catch (error) {
    debug.error('Initialization failed', error, 'popup-init');
  }
}

// Clean up when popup closes
window.addEventListener('unload', () => {
  if (statusPollInterval) {
    clearInterval(statusPollInterval);
  }
});

function openSettings() {
  // Open settings page in a new tab
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
}

async function checkCurrentPage() {
  try {
    debug.log('Checking current page', {}, 'popup-check-page');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTabId = tab.id;
    
    debug.log('Tab info retrieved', {
      tabId: tab.id,
      url: tab.url,
      title: tab.title
    }, 'popup-check-page');
    
    // Inject content script if needed and get article info
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      debug.log('Content script injected', {}, 'popup-check-page');
    } catch (injectError) {
      debug.warn('Content script injection failed (may already be injected)', injectError, 'popup-check-page');
    }
    
    // Request article check from content script
    debug.log('Sending extractArticle message', {}, 'popup-check-page');
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractArticle' });
    
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
      
      // Check for ongoing analysis or cached results
      await checkAnalysisStatus(tab.url);
      
    } else if (response) {
      debug.log('Not an article page', {
        wordCount: response.wordCount,
        confidence: response.confidence
      }, 'popup-check-page');
      showNotArticle(response);
      
      // Still check for ongoing analysis
      if (response.wordCount > 100) {
        currentArticle = response;
        await checkAnalysisStatus(tab.url);
      }
    } else {
      debug.warn('No response from content script', {}, 'popup-check-page');
      showError('Could not analyze this page');
    }
  } catch (error) {
    debug.error('Error checking page', error, 'popup-check-page', {
      tabId: currentTabId,
      url: window.location?.href
    });
    showError('Cannot analyze this page. Try refreshing and reopening the extension.');
  }
}

async function checkAnalysisStatus(url) {
  // First check if there's an ongoing analysis in background
  const status = await chrome.runtime.sendMessage({ action: 'getAnalysisStatus', url });
  
  debug.log('Analysis status check', { status }, 'popup-status');
  
  if (status.status === 'analyzing') {
    // Analysis is in progress - show loading and poll for updates
    showLoading();
    startStatusPolling(url);
    return;
  }
  
  if (status.status === 'complete' && status.parsed) {
    // Just completed - show results
    displayResults(status.parsed);
    if (status.parsed.issues?.length > 0) {
      await sendHighlightsToPage(status.parsed.issues);
    }
    return;
  }
  
  if (status.status === 'error') {
    showError(status.error || 'Analysis failed');
    actionSection.classList.remove('hidden');
    return;
  }
  
  // Check for cached results
  const cached = await chrome.storage.local.get([`analysis_${url}`]);
  if (cached[`analysis_${url}`]) {
    const parsed = cached[`analysis_${url}`];
    displayResults(parsed);
    if (parsed.issues?.length > 0) {
      await sendHighlightsToPage(parsed.issues);
    }
  }
}

function startStatusPolling(url) {
  // Poll every 500ms for status updates
  statusPollInterval = setInterval(async () => {
    try {
      const status = await chrome.runtime.sendMessage({ action: 'getAnalysisStatus', url });
      
      if (status.status === 'complete') {
        clearInterval(statusPollInterval);
        statusPollInterval = null;
        loadingSection.classList.add('hidden');
        
        if (status.parsed) {
          displayResults(status.parsed);
          // Highlights already sent by background script, but send again to be sure
          if (status.parsed.issues?.length > 0) {
            await sendHighlightsToPage(status.parsed.issues);
          }
        }
      } else if (status.status === 'error') {
        clearInterval(statusPollInterval);
        statusPollInterval = null;
        loadingSection.classList.add('hidden');
        showError(status.error || 'Analysis failed');
        actionSection.classList.remove('hidden');
      }
      // If still 'analyzing', keep polling
    } catch (e) {
      // Ignore polling errors
    }
  }, 500);
}

function showLoading() {
  hideError();
  actionSection.classList.add('hidden');
  loadingSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');
}

function showArticleDetected(article) {
  const statusIcon = pageStatus.querySelector('.status-icon');
  const statusText = pageStatus.querySelector('.status-text');
  const viewHint = pageStatus.querySelector('.view-text-hint');
  
  statusIcon.textContent = '📄';
  statusText.innerHTML = `
    <strong>Article detected</strong><br>
    <span style="color: var(--text-muted); font-size: 12px;">${article.wordCount.toLocaleString()} words</span>
  `;
  
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

function showNotArticle(info) {
  const statusIcon = pageStatus.querySelector('.status-icon');
  const statusText = pageStatus.querySelector('.status-text');
  const viewHint = pageStatus.querySelector('.view-text-hint');
  
  statusIcon.textContent = '🔗';
  statusText.innerHTML = `
    <strong>Not an article page</strong><br>
    <span style="color: var(--text-muted); font-size: 12px;">This appears to be a different type of page</span>
  `;
  
  // Still allow analysis if there's some content
  if (info && info.wordCount > 100) {
    currentArticle = info;
    actionSection.classList.remove('hidden');
    analyzeBtn.innerHTML = '<span class="btn-icon">🧠</span> Analyze Anyway';
    
    // Make clickable to view text
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

function showError(message) {
  errorSection.classList.remove('hidden');
  errorMessage.textContent = message;
}

function hideError() {
  errorSection.classList.add('hidden');
}

async function analyzeArticle() {
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
  
  try {
    // Send message to background script to start analysis
    // This will continue even if popup is closed!
    const response = await chrome.runtime.sendMessage({
      action: 'startAnalysis',
      tabId: currentTabId,
      article: currentArticle
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to start analysis');
    }
    
    debug.log('Analysis started in background', {}, 'popup-analyze');
    
    // Start polling for status
    startStatusPolling(currentArticle.url);
    
  } catch (error) {
    debug.error('Failed to start analysis', error, 'popup-analyze');
    showError(error.message || 'Failed to start analysis');
    actionSection.classList.remove('hidden');
    loadingSection.classList.add('hidden');
  }
}

async function sendHighlightsToPage(issues) {
  if (!currentTabId) {
    debug.warn('Cannot send highlights: no tab ID', {}, 'popup-highlights');
    return;
  }
  
  debug.log('Sending highlights to content script', {
    issueCount: issues.length,
    tabId: currentTabId
  }, 'popup-highlights');
  
  try {
    await chrome.tabs.sendMessage(currentTabId, {
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

function displayResults(parsed) {
  resultsSection.classList.remove('hidden');
  loadingSection.classList.add('hidden');
  actionSection.classList.add('hidden');
  
  // Handle raw text fallback
  if (parsed.rawText) {
    resultsContent.innerHTML = `
      <div style="color: var(--warning); margin-bottom: 12px;">
        ⚠️ Could not parse structured response
      </div>
      <div style="white-space: pre-wrap; font-size: 12px;">${escapeHtml(parsed.rawText)}</div>
    `;
    return;
  }
  
  // Display formatted results
  if (!parsed.issues || parsed.issues.length === 0) {
    resultsContent.innerHTML = `
      <div class="no-fallacies">
        <div class="icon">✅</div>
        <strong>No significant issues found</strong>
        <p style="color: var(--text-muted); margin-top: 8px;">${escapeHtml(parsed.summary || parsed.overall_assessment || 'The article appears to be logically sound.')}</p>
      </div>
    `;
    return;
  }
  
  // Build HTML for issues with new styling
  let html = '';
  
  // Summary section with improved styling
  html += `
    <div class="analysis-summary">
      <div class="summary-header">
        <span class="issue-count">${parsed.issues.length} issue${parsed.issues.length !== 1 ? 's' : ''} found</span>
        <span class="severity-badge ${parsed.severity || 'none'}">${parsed.severity || 'unknown'}</span>
      </div>
      ${parsed.summary || parsed.overall_assessment ? `<p style="color: var(--text-secondary); font-size: 12px; line-height: 1.6;">${escapeHtml(parsed.summary || parsed.overall_assessment)}</p>` : ''}
      <p style="color: var(--accent); margin-top: 10px; font-size: 11px; font-style: italic;">💡 Issues are highlighted in the article. Hover to see details.</p>
    </div>
  `;
  
  // Show central logical gap if available (new Claude format)
  if (parsed.central_argument_analysis?.central_logical_gap) {
    html += `
      <div class="central-gap-box">
        <div class="central-gap-header">
          <span style="font-size: 16px;">🎯</span>
          Central Logical Gap
        </div>
        <div class="central-gap-content">
          ${escapeHtml(parsed.central_argument_analysis.central_logical_gap)}
        </div>
      </div>
    `;
  }
  
  // Sort issues by importance (critical first)
  const sortedIssues = [...parsed.issues].sort((a, b) => {
    const order = { critical: 0, significant: 1, minor: 2 };
    return (order[a.importance] || 2) - (order[b.importance] || 2);
  });
  
  sortedIssues.forEach((issue, index) => {
    const importanceEmoji = issue.importance === 'critical' ? '🔴' : 
                            issue.importance === 'significant' ? '🟠' : '🟡';
    const importanceClass = issue.importance || 'minor';
    
    // Handle all formats: new (gap), medium (why_it_doesnt_follow), old (explanation)
    const gap = issue.gap || issue.why_it_doesnt_follow || issue.explanation || '';
    
    html += `
      <div class="fallacy-item ${importanceClass}" data-issue-index="${index}">
        <div class="fallacy-header">
          <span class="importance-icon">${importanceEmoji}</span>
          <span class="importance-badge ${importanceClass}">${issue.importance || 'issue'}</span>
        </div>
        ${issue.quote ? `<div class="fallacy-quote">"${escapeHtml(issue.quote.substring(0, 150))}${issue.quote.length > 150 ? '...' : ''}"</div>` : ''}
        ${gap ? `<div class="fallacy-gap-simple">${escapeHtml(gap)}</div>` : ''}
      </div>
    `;
  });
  
  resultsContent.innerHTML = html;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function toggleArticleText() {
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

function showArticleText() {
  if (!currentArticle || !currentArticle.text) {
    debug.warn('Cannot show article text: no article available', {}, 'popup-article-text');
    return;
  }
  
  debug.log('Showing article text', {
    textLength: currentArticle.text.length,
    wordCount: currentArticle.wordCount,
    title: currentArticle.title
  }, 'popup-article-text');
  
  // Update header with title if available
  const header = articleTextSection.querySelector('h3');
  if (header && currentArticle.title) {
    header.textContent = `Extracted Article: ${currentArticle.title}`;
  }
  
  // Display the article text
  articleTextContent.textContent = currentArticle.text;
  articleTextSection.classList.remove('hidden');
  
  // Scroll to the article text section
  articleTextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideArticleText() {
  debug.log('Hiding article text', {}, 'popup-article-text');
  articleTextSection.classList.add('hidden');
}
