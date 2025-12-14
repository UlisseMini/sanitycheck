// Background service worker for SanityCheck

// Backend URL - defaults to Railway, can be overridden in extension storage
const BACKEND_URL = 'https://sanitycheck-production.up.railway.app';

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

// Track ongoing analyses by tab URL
const ongoingAnalyses = new Map();

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  // Create context menu
  chrome.contextMenus.create({
    id: 'leave-feedback',
    title: 'Leave feedback on this text',
    contexts: ['selection']
  });
  
  console.log('SanityCheck: Context menu created');
  
  // Open welcome page on first install
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  }
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'leave-feedback' && info.selectionText) {
    // Send message to content script to show feedback dialog
    chrome.tabs.sendMessage(tab.id, {
      action: 'showFeedbackDialog',
      selectedText: info.selectionText,
      url: tab.url,
      title: tab.title
    });
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'submitFeedback') {
    submitFeedback(request.data)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'getBackendUrl') {
    chrome.storage.local.get(['backendUrl'], (result) => {
      sendResponse({ url: result.backendUrl || BACKEND_URL });
    });
    return true;
  }
  
  // Start analysis in background
  if (request.action === 'startAnalysis') {
    const { tabId, article } = request;
    startBackgroundAnalysis(tabId, article)
      .then(() => sendResponse({ success: true, status: 'started' }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  // Check analysis status
  if (request.action === 'getAnalysisStatus') {
    const { url } = request;
    const status = ongoingAnalyses.get(url);
    sendResponse(status || { status: 'none' });
    return false;
  }
  
  // Cancel analysis
  if (request.action === 'cancelAnalysis') {
    const { url } = request;
    ongoingAnalyses.delete(url);
    sendResponse({ success: true });
    return false;
  }
});

// Start analysis in background (persists even if popup closes)
async function startBackgroundAnalysis(tabId, article) {
  const url = article.url;
  
  console.log('[background] Starting analysis for:', url);
  
  // Mark as in progress
  ongoingAnalyses.set(url, { 
    status: 'analyzing', 
    startTime: Date.now(),
    tabId 
  });
  
  // Clear any cached results
  await chrome.storage.local.remove([`analysis_${url}`]);
  
  try {
    // Get custom prompt if set
    const stored = await chrome.storage.local.get(['customPrompt']);
    const currentPrompt = stored.customPrompt || DEFAULT_ANALYSIS_PROMPT;
    const isCustomPrompt = !!stored.customPrompt;
    
    // Truncate article if too long
    let articleText = article.text;
    const words = articleText.split(/\s+/);
    if (words.length > 8000) {
      articleText = words.slice(0, 8000).join(' ') + '\n\n[Article truncated for analysis...]';
    }
    
    const fullPrompt = currentPrompt + articleText;
    
    console.log('[background] Calling /analyze, prompt length:', fullPrompt.length);
    
    // Call backend
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: fullPrompt,
        maxTokens: 8192,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    const rawResult = data.text;
    
    console.log('[background] Got response, length:', rawResult?.length);
    
    // Parse results
    const parsed = parseResults(rawResult);
    
    console.log('[background] Parsed results, issues:', parsed.issues?.length || 0);
    
    // Cache results
    await chrome.storage.local.set({ [`analysis_${url}`]: parsed });
    
    // Update status
    ongoingAnalyses.set(url, { 
      status: 'complete', 
      parsed,
      duration: Date.now() - ongoingAnalyses.get(url).startTime
    });
    
    // Send highlights to content script
    if (parsed.issues && parsed.issues.length > 0) {
      try {
        await chrome.tabs.sendMessage(tabId, {
          action: 'highlightIssues',
          issues: parsed.issues
        });
        console.log('[background] Sent highlights to tab:', tabId);
      } catch (e) {
        console.warn('[background] Could not send highlights (tab may be closed):', e.message);
      }
    }
    
    // Store to backend (fire and forget)
    storeAnalysisToBackend(article, rawResult, parsed, currentPrompt, isCustomPrompt).catch(err => {
      console.warn('[background] Failed to store to backend:', err.message);
    });
    
    console.log('[background] Analysis complete for:', url);
    
  } catch (error) {
    console.error('[background] Analysis failed:', error);
    ongoingAnalyses.set(url, { 
      status: 'error', 
      error: error.message 
    });
  }
}

// Parse results (same logic as popup.js)
function parseResults(rawResult) {
  if (!rawResult || typeof rawResult !== 'string') {
    return {
      summary: 'Invalid response format',
      issues: [],
      severity: 'unknown',
      rawText: String(rawResult)
    };
  }
  
  // Strategy 1: Direct parse
  try {
    return JSON.parse(rawResult.trim());
  } catch (e) {}
  
  // Strategy 2: Find JSON object in response
  try {
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {}
  
  // Strategy 3: Find JSON between code blocks
  try {
    const codeBlockMatch = rawResult.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim());
    }
  } catch (e) {}
  
  // Strategy 4: Try to fix common JSON issues
  try {
    let fixed = rawResult
      .replace(/^[^{]*/, '')
      .replace(/[^}]*$/, '')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/'/g, '"')
      .replace(/(\w+):/g, '"$1":');
    return JSON.parse(fixed);
  } catch (e) {}
  
  // Fallback
  return {
    summary: 'Could not parse structured response',
    issues: [],
    severity: 'unknown',
    rawText: rawResult
  };
}

// Store analysis to backend
async function storeAnalysisToBackend(article, rawResult, parsed, currentPrompt, isCustomPrompt) {
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
    
    console.log('[background] Stored analysis to backend');
  } catch (error) {
    console.error('[background] Backend storage failed:', error);
  }
}

async function submitFeedback(data) {
  const stored = await chrome.storage.local.get(['backendUrl']);
  const backendUrl = stored.backendUrl || BACKEND_URL;
  
  const response = await fetch(`${backendUrl}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: data.url,
      title: data.title,
      textContent: data.articleText,
      selectedText: data.selectedText,
      commentText: data.commentText
    })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}
