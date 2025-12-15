/**
 * Background service worker for SanityCheck
 * Built from TypeScript with shared imports
 */

import { BACKEND_URL, DEFAULT_ANALYSIS_PROMPT, AnalysisResult } from '../shared';

// Track ongoing analyses by tab URL
const ongoingAnalyses = new Map<string, { status: string; result?: AnalysisResult; error?: string }>();

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
  if (info.menuItemId === 'leave-feedback' && info.selectionText && tab?.id) {
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
    return true;
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
    startAnalysis(tabId, article)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  // Get analysis status
  if (request.action === 'getAnalysisStatus') {
    const { url } = request;
    const status = ongoingAnalyses.get(url);
    sendResponse(status || { status: 'none' });
    return true;
  }
  
  // Clear analysis
  if (request.action === 'clearAnalysis') {
    const { url } = request;
    ongoingAnalyses.delete(url);
    sendResponse({ success: true });
    return true;
  }
  
  return false;
});

async function submitFeedback(data: { url: string; title: string; articleText: string; selectedText: string; commentText: string }) {
  const response = await fetch(`${BACKEND_URL}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: data.url,
      title: data.title,
      textContent: data.articleText,
      selectedText: data.selectedText,
      commentText: data.commentText
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to submit feedback: ${response.status}`);
  }
  
  return response.json();
}

async function startAnalysis(tabId: number, article: { title: string; text: string; url: string }) {
  const url = article.url;
  
  // Mark as in progress
  ongoingAnalyses.set(url, { status: 'analyzing' });
  
  try {
    // Get custom prompt if set
    const stored = await chrome.storage.local.get(['customPrompt']);
    const currentPrompt = stored.customPrompt || DEFAULT_ANALYSIS_PROMPT;
    
    // Call backend
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: currentPrompt + article.text,
        maxTokens: 8192,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Parse the response
    let result;
    try {
      // Extract JSON from response (might be wrapped in markdown code blocks)
      let jsonText = data.text;
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      result = JSON.parse(jsonText);
    } catch (_e) {
      throw new Error('Failed to parse API response as JSON');
    }
    
    // Store result (as 'parsed' to match what popup.ts expects)
    ongoingAnalyses.set(url, { status: 'complete', parsed: result });
    
    // Notify the content script to display highlights
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: 'highlightIssues',
        issues: result.issues || []
      });
    } catch (_e) {
      console.log('Could not send highlights to tab (tab may have been closed)');
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    ongoingAnalyses.set(url, { status: 'error', error: errorMessage });
    console.error('Analysis error:', error);
  }
}
