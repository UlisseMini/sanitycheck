// SanityCheck - Popup Script

const BACKEND_URL = 'https://sanitycheck-production.up.railway.app';

// Debug logging will be available via window.debug

const DEFAULT_ANALYSIS_PROMPT = `You help readers notice genuine reasoning problems in articles—things they'd agree are valid weaknesses, even if they agree with the conclusions.

## Your Goal

Surface issues where you're confident it's a real structural flaw AND it matters to the core argument. The cost of a bad objection (annoying the reader, undermining trust) exceeds the cost of missing something. So:

- Only flag things that made you genuinely think "wait, that doesn't follow"
- Try to steelman first—if there's a reasonable interpretation, don't flag
- Ask: would someone who agrees with the article still nod and say "yeah, that's fair"?

Good flags: evidence-conclusion mismatches, load-bearing unstated assumptions, logical leaps that don't follow even charitably.

Bad flags: factual disputes (you might be wrong), nitpicks on tangential points, things that only look wrong if you disagree with the content.

## Output Format

Return JSON:

{
  "central_argument_analysis": {
    "main_conclusion": "1 sentence: what the author claims",
    "central_logical_gap": "1-2 sentences: the main structural weakness, if any. Be clear and direct."
  },
  "issues": [
    {
      "importance": "critical|significant|minor",
      "quote": "Exact quote from text, 20-60 words",
      "gap": "Brief explanation (<15 words ideal). Reader should immediately think 'oh yeah, that's a leap.'"
    }
  ],
  "severity": "none|minor|moderate|significant"
}

## Rules

- Keep "gap" explanations brief and immediately recognizable. E.g., "Constraints ≠ impossibility" or "One example doesn't prove a universal"
- Quote exactly from the text
- 1-4 issues typical. Zero is fine if nothing clears the bar.
- Quality over quantity—only flag what you're confident about

ARTICLE:
`;

// Current prompt (may be customized)
let currentPrompt = DEFAULT_ANALYSIS_PROMPT;
let isCustomPrompt = false;

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
    
    // Load custom prompt if set
    const stored = await chrome.storage.local.get(['customPrompt']);
    debug.log('Storage loaded', { hasCustomPrompt: !!stored.customPrompt }, 'popup-init');
    
    if (stored.customPrompt) {
      currentPrompt = stored.customPrompt;
      isCustomPrompt = true;
      debug.log('Using custom prompt', { promptLength: currentPrompt.length }, 'popup-init');
    } else {
      currentPrompt = DEFAULT_ANALYSIS_PROMPT;
      isCustomPrompt = false;
    }
    
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
      
      // Check for cached results
      const cached = await chrome.storage.local.get([`analysis_${tab.url}`]);
      if (cached[`analysis_${tab.url}`]) {
        const parsed = cached[`analysis_${tab.url}`];
        displayResults(parsed);
        if (parsed.issues?.length > 0) {
          await sendHighlightsToPage(parsed.issues);
        }
      }
    } else if (response) {
      debug.log('Not an article page', {
        wordCount: response.wordCount,
        confidence: response.confidence
      }, 'popup-check-page');
      showNotArticle(response);
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
  
  hideError();
  actionSection.classList.add('hidden');
  loadingSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');
  
  // Clear cached results when re-running
  if (currentArticle?.url) {
    await chrome.storage.local.remove([`analysis_${currentArticle.url}`]);
  }
  
  const analysisStartTime = Date.now();
  
  try {
    // Truncate article if too long (limit to ~8000 words for context window)
    let articleText = currentArticle.text;
    const words = articleText.split(/\s+/);
    const originalWordCount = words.length;
    
    if (words.length > 8000) {
      articleText = words.slice(0, 8000).join(' ') + '\n\n[Article truncated for analysis...]';
      debug.log('Article truncated', {
        originalWords: originalWordCount,
        truncatedWords: 8000
      }, 'popup-analyze');
    }
    
    debug.log('Prepared prompt', {
      promptLength: currentPrompt.length,
      articleLength: articleText.length,
      totalLength: currentPrompt.length + articleText.length,
      isCustomPrompt
    }, 'popup-analyze');
    
    const fullPrompt = currentPrompt + articleText;
    
    // Call backend analyze endpoint
    debug.log('Calling backend /analyze', {
      promptLength: fullPrompt.length
    }, 'popup-analyze');
    
    const result = await callAnalyzeEndpoint(fullPrompt);
    
    debug.log('Backend analyze call completed', {
      resultLength: result?.length || 0,
      duration: Date.now() - analysisStartTime
    }, 'popup-analyze');
    
    // Parse and display results
    debug.log('Parsing results', { resultPreview: result?.substring(0, 200) }, 'popup-analyze');
    const parsed = parseResults(result);
    
    debug.log('Results parsed', {
      hasIssues: !!(parsed?.issues),
      issueCount: parsed?.issues?.length || 0,
      severity: parsed?.severity,
      hasRawText: !!parsed?.rawText
    }, 'popup-analyze');
    
    displayResults(parsed);
    
    // Cache results
    if (currentArticle?.url) {
      await chrome.storage.local.set({ [`analysis_${currentArticle.url}`]: parsed });
    }
    
    // Send highlights to content script
    if (parsed && parsed.issues && parsed.issues.length > 0) {
      debug.log('Sending highlights to content script', {
        issueCount: parsed.issues.length
      }, 'popup-analyze');
      await sendHighlightsToPage(parsed.issues);
    }
    
    // Store article and analysis to backend (fire and forget)
    storeAnalysisToBackend(currentArticle, result, parsed).catch(err => {
      debug.warn('Failed to store analysis to backend', { error: err.message }, 'popup-analyze');
    });
    
    debug.log('Analysis complete', {
      totalDuration: Date.now() - analysisStartTime,
      issueCount: parsed?.issues?.length || 0
    }, 'popup-analyze');
    
  } catch (error) {
    debug.error('Analysis error', error, 'popup-analyze', {
      duration: Date.now() - analysisStartTime,
      articleWordCount: currentArticle.wordCount
    });
    showError(error.message || 'Failed to analyze article');
    actionSection.classList.remove('hidden');
  } finally {
    loadingSection.classList.add('hidden');
  }
}

// Store article and analysis to backend for data collection
async function storeAnalysisToBackend(article, rawResult, parsed) {
  try {
    // Step 1: Create article
    const articleRes = await fetch(`${BACKEND_URL}/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: article.url,
        title: article.title,
        textContent: article.text
      })
    });
    
    if (!articleRes.ok) {
      throw new Error(`Failed to create article: ${articleRes.status}`);
    }
    
    const { articleId } = await articleRes.json();
    debug.log('Article stored', { articleId }, 'popup-backend');
    
    // Step 2: Add analysis
    const analysisRes = await fetch(`${BACKEND_URL}/articles/${articleId}/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelVersion: 'claude-sonnet-4-20250514',
        rawResponse: rawResult,
        severity: parsed?.severity,
        promptUsed: currentPrompt,
        isCustomPrompt: isCustomPrompt,
        highlights: parsed?.issues?.map(issue => ({
          quote: issue.quote,
          importance: issue.importance,
          gap: issue.gap || issue.why_it_doesnt_follow || issue.explanation || ''
        })) || []
      })
    });
    
    if (!analysisRes.ok) {
      throw new Error(`Failed to store analysis: ${analysisRes.status}`);
    }
    
    const { analysisId, highlightCount } = await analysisRes.json();
    debug.log('Analysis stored', { analysisId, highlightCount }, 'popup-backend');
    
  } catch (error) {
    debug.error('Backend storage failed', error, 'popup-backend');
    // Don't throw - this is fire-and-forget
  }
}

async function callAnalyzeEndpoint(prompt) {
  const callStartTime = Date.now();
  
  try {
    debug.log('Calling backend /analyze', {
      promptLength: prompt.length
    }, 'popup-analyze-api');
    
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        maxTokens: 8192,
        temperature: 0.3
      })
    });
    
    debug.log('Backend response received', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    }, 'popup-analyze-api');
    
    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch (e) {
        const errorText = await response.text();
        debug.error('Failed to parse error response', e, 'popup-analyze-api', {
          status: response.status,
          errorText
        });
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      debug.error('Backend API error', new Error(error.error || 'Failed to analyze'), 'popup-analyze-api', {
        status: response.status,
        errorBody: error
      });
      throw new Error(error.error || 'Failed to analyze');
    }
    
    const data = await response.json();
    
    debug.log('Backend call completed', {
      model: data.model,
      duration: data.duration,
      clientDuration: Date.now() - callStartTime
    }, 'popup-analyze-api');
    
    if (data.text) {
      debug.log('Output extracted', {
        outputLength: data.text.length
      }, 'popup-analyze-api');
      return data.text;
    } else {
      throw new Error('No text in API response');
    }
  } catch (error) {
    debug.error('Backend API call failed', error, 'popup-analyze-api', {
      duration: Date.now() - callStartTime
    });
    throw error;
  }
}

function parseResults(rawResult) {
  debug.log('Parsing results', {
    resultLength: rawResult?.length || 0,
    resultPreview: rawResult?.substring(0, 100)
  }, 'popup-parse');
  
  if (!rawResult || typeof rawResult !== 'string') {
    debug.warn('Invalid raw result', { rawResult }, 'popup-parse');
    return {
      summary: 'Invalid response format',
      issues: [],
      severity: 'unknown',
      rawText: String(rawResult)
    };
  }
  
  // Try multiple strategies to extract JSON
  
  // Strategy 1: Direct parse
  try {
    const parsed = JSON.parse(rawResult.trim());
    debug.log('Parse successful (strategy 1: direct)', {}, 'popup-parse');
    return parsed;
  } catch (e) {
    debug.debug('Strategy 1 failed', { error: e.message }, 'popup-parse');
  }
  
  // Strategy 2: Find JSON object in response
  try {
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      debug.log('Parse successful (strategy 2: regex match)', {}, 'popup-parse');
      return parsed;
    }
  } catch (e) {
    debug.debug('Strategy 2 failed', { error: e.message }, 'popup-parse');
  }
  
  // Strategy 3: Find JSON between code blocks
  try {
    const codeBlockMatch = rawResult.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      debug.log('Parse successful (strategy 3: code block)', {}, 'popup-parse');
      return parsed;
    }
  } catch (e) {
    debug.debug('Strategy 3 failed', { error: e.message }, 'popup-parse');
  }
  
  // Strategy 4: Try to fix common JSON issues
  try {
    let fixed = rawResult
      .replace(/^[^{]*/, '') // Remove leading non-JSON
      .replace(/[^}]*$/, '') // Remove trailing non-JSON
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']')
      .replace(/'/g, '"') // Replace single quotes
      .replace(/(\w+):/g, '"$1":'); // Quote unquoted keys
    const parsed = JSON.parse(fixed);
    debug.log('Parse successful (strategy 4: fixed)', {}, 'popup-parse');
    return parsed;
  } catch (e) {
    debug.debug('Strategy 4 failed', { error: e.message }, 'popup-parse');
  }
  
  // Fallback: return raw text wrapped in structure
  debug.warn('All parse strategies failed, using fallback', {
    resultLength: rawResult.length
  }, 'popup-parse');
  
  return {
    summary: 'Could not parse structured response',
    issues: [],
    severity: 'unknown',
    rawText: rawResult
  };
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
