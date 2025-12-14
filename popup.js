// Logic Checker - Popup Script

const REPLICATE_MODEL = 'anthropic/claude-4.5-sonnet';
const REPLICATE_VERSION = '459655107e29a683cb6deb73a9640cf9aeae39ea7c87803a2ae81c311f6ef44f'; // Claude 4.5 Sonnet version
const DEFAULT_API_KEY = 'r8_8W58bzhjnfMwMaD4WRbAkliOiBTsJu71htD8F'; // From .env

// Debug logging will be available via window.debug

const ANALYSIS_PROMPT = `You are a logic auditor. Find logical gaps in arguments.

## Task

Find where conclusions DON'T follow from premises. Focus on:
- Non-sequiturs: "A, therefore B" — but B doesn't follow from A
- Conflation: Treating "X is hard" as "X is impossible"
- Circular reasoning: Conclusion assumed in premises
- Inconsistent rules: Principle used for X but ignored for Y
- Unsupported claims: "X is impossible/optimal" without proof

## Output Format

Return JSON:

{
  "central_argument_analysis": {
    "main_conclusion": "1 sentence: what author claims",
    "central_logical_gap": "1-2 sentences: the main logical leap. Be blunt and clear."
  },
  "issues": [
    {
      "type": "Fallacy name",
      "importance": "critical|significant|minor",
      "quote": "Exact quote from text, 20-60 words",
      "gap": "1 sentence max. What's the leap? Be direct. E.g., 'Constraints ≠ impossibility' or 'One expert's opinion ≠ proof'"
    }
  ],
  "severity": "none|minor|moderate|significant"
}

## CRITICAL RULES

**BE BRIEF.** Each "gap" explanation must be:
- 1 sentence max (ideally under 15 words)
- Immediately obvious — reader should think "oh yeah, that's a leap"
- Direct and blunt — no hedging, no academic language

Examples of GOOD gap explanations:
- "Constraints ≠ impossibility"
- "One physicist's opinion doesn't prove physics is exhausted"
- "Current limits don't rule out future breakthroughs"
- "Defining AGI to require robotics, then using robotics to dismiss it"

Examples of BAD (too long) explanations:
- "The author assumes that because current systems face constraints, future systems will necessarily face the same constraints, which is an unwarranted leap because..."

**Quote exactly from the text. Focus on issues that matter to the main argument.**

ARTICLE:
`;

// DOM Elements
const apiKeyInput = document.getElementById('api-key');
const saveKeyBtn = document.getElementById('save-key');
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
    debug.log('Popup initialized', { timestamp: new Date().toISOString() }, 'popup-init');
    
    // Load saved API key or use default
    const stored = await chrome.storage.local.get(['replicateApiKey']);
    debug.log('Storage loaded', { hasKey: !!stored.replicateApiKey }, 'popup-init');
    
    if (stored.replicateApiKey) {
      apiKeyInput.value = stored.replicateApiKey;
      debug.log('Using stored API key', { keyLength: stored.replicateApiKey.length }, 'popup-init');
    } else {
      // Use hardcoded key from .env
      apiKeyInput.value = DEFAULT_API_KEY;
      await chrome.storage.local.set({ replicateApiKey: DEFAULT_API_KEY });
      debug.log('Using default API key', { keyLength: DEFAULT_API_KEY.length }, 'popup-init');
    }
    
    // Check current page
    await checkCurrentPage();
    
    // Set up event listeners
    saveKeyBtn.addEventListener('click', saveApiKey);
    analyzeBtn.addEventListener('click', analyzeArticle);
    pageStatus.addEventListener('click', toggleArticleText);
    closeArticleTextBtn.addEventListener('click', hideArticleText);
    
    debug.log('Initialization complete', {}, 'popup-init');
  } catch (error) {
    debug.error('Initialization failed', error, 'popup-init');
  }
}

async function saveApiKey() {
  try {
    const key = apiKeyInput.value.trim();
    debug.log('Saving API key', { keyLength: key.length }, 'popup-save-key');
    
    if (key) {
      await chrome.storage.local.set({ replicateApiKey: key });
      saveKeyBtn.textContent = 'Saved!';
      debug.log('API key saved successfully', {}, 'popup-save-key');
      
      setTimeout(() => {
        saveKeyBtn.textContent = 'Save';
      }, 1500);
    } else {
      debug.warn('Attempted to save empty API key', {}, 'popup-save-key');
    }
  } catch (error) {
    debug.error('Failed to save API key', error, 'popup-save-key');
  }
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
  
  // Use input value or fall back to default
  let apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    apiKey = DEFAULT_API_KEY;
    apiKeyInput.value = DEFAULT_API_KEY;
    debug.log('Using default API key', {}, 'popup-analyze');
  }
  
  hideError();
  actionSection.classList.add('hidden');
  loadingSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');
  
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
      promptLength: ANALYSIS_PROMPT.length,
      articleLength: articleText.length,
      totalLength: ANALYSIS_PROMPT.length + articleText.length
    }, 'popup-analyze');
    
    const fullPrompt = ANALYSIS_PROMPT + articleText;
    
    // Call Replicate API
    debug.log('Calling Replicate API', {
      model: REPLICATE_MODEL,
      version: REPLICATE_VERSION,
      promptLength: fullPrompt.length
    }, 'popup-analyze');
    
    const result = await callReplicate(apiKey, fullPrompt);
    
    debug.log('Replicate API call completed', {
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
    
    // Send highlights to content script
    if (parsed && parsed.issues && parsed.issues.length > 0) {
      debug.log('Sending highlights to content script', {
        issueCount: parsed.issues.length
      }, 'popup-analyze');
      await sendHighlightsToPage(parsed.issues);
    }
    
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

async function callReplicate(apiKey, prompt) {
  const callStartTime = Date.now();
  
  try {
    debug.log('Creating Replicate prediction', {
      model: REPLICATE_MODEL,
      version: REPLICATE_VERSION,
      promptLength: prompt.length
    }, 'popup-replicate');
    
    // Create prediction - API requires 'version' not 'model'
    const requestBody = {
      version: REPLICATE_VERSION,
      input: {
        prompt: prompt,
        max_tokens: 8192,
        temperature: 0.3,
      }
    };
    
    debug.debug('Request body prepared', {
      hasVersion: !!requestBody.version,
      versionLength: requestBody.version?.length,
      inputKeys: Object.keys(requestBody.input)
    }, 'popup-replicate');
    
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    debug.log('Replicate create response received', {
      status: createResponse.status,
      ok: createResponse.ok,
      statusText: createResponse.statusText
    }, 'popup-replicate');
    
    if (!createResponse.ok) {
      let error;
      try {
        error = await createResponse.json();
      } catch (e) {
        const errorText = await createResponse.text();
        debug.error('Failed to parse error response', e, 'popup-replicate', {
          status: createResponse.status,
          errorText
        });
        throw new Error(`API error: ${createResponse.status} ${createResponse.statusText}`);
      }
      
      debug.error('Replicate API error', new Error(error.detail || 'Failed to start analysis'), 'popup-replicate', {
        status: createResponse.status,
        errorBody: error,
        requestBody: {
          version: requestBody.version,
          inputKeys: Object.keys(requestBody.input)
        }
      });
      throw new Error(error.detail || 'Failed to start analysis');
    }
    
    const prediction = await createResponse.json();
    
    debug.log('Prediction created', {
      predictionId: prediction.id,
      status: prediction.status,
      urls: !!prediction.urls
    }, 'popup-replicate');
    
    // Poll for completion
    let result = prediction;
    let pollCount = 0;
    const maxPolls = 120; // 2 minutes max
    
    while (result.status !== 'succeeded' && result.status !== 'failed' && pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      pollCount++;
      
      debug.debug(`Polling prediction (attempt ${pollCount})`, {
        status: result.status,
        predictionId: result.id
      }, 'popup-replicate');
      
      try {
        const pollResponse = await fetch(result.urls.get, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          }
        });
        
        if (!pollResponse.ok) {
          debug.warn('Poll response not OK', {}, 'popup-replicate', {
            status: pollResponse.status,
            pollCount
          });
        }
        
        result = await pollResponse.json();
      } catch (pollError) {
        debug.error('Poll request failed', pollError, 'popup-replicate', {
          pollCount,
          predictionId: result.id
        });
        throw pollError;
      }
    }
    
    if (pollCount >= maxPolls) {
      debug.error('Polling timeout', new Error('Max polls reached'), 'popup-replicate', {
        pollCount,
        finalStatus: result.status
      });
      throw new Error('Analysis timed out');
    }
    
    debug.log('Prediction completed', {
      status: result.status,
      pollCount,
      duration: Date.now() - callStartTime
    }, 'popup-replicate');
    
    if (result.status === 'failed') {
      debug.error('Prediction failed', new Error(result.error || 'Analysis failed'), 'popup-replicate', {
        error: result.error,
        predictionId: result.id
      });
      throw new Error(result.error || 'Analysis failed');
    }
    
    // Combine output (it comes as an array of strings for streaming models)
    const output = Array.isArray(result.output) ? result.output.join('') : result.output;
    
    debug.log('Output extracted', {
      outputLength: output?.length || 0,
      isArray: Array.isArray(result.output),
      arrayLength: Array.isArray(result.output) ? result.output.length : 0
    }, 'popup-replicate');
    
    return output;
  } catch (error) {
    debug.error('Replicate API call failed', error, 'popup-replicate', {
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
        <strong>No logical fallacies detected</strong>
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
        <div class="fallacy-name">
          <span class="importance-icon">${importanceEmoji}</span>
          ${escapeHtml(issue.type)}
          ${issue.importance ? `<span class="importance-badge ${importanceClass}">${issue.importance}</span>` : ''}
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
