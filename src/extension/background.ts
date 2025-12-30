/**
 * Background service worker for SanityCheck
 * Built from TypeScript with shared imports
 */

import { BACKEND_URL } from './config';
import {
  Article,
  AnalysisStatus,
  AnalysisIssue,
  FeedbackPayload,
  BackgroundMessage,
  ContentMessage,
  sendToContent,
} from './messaging';

// Track ongoing analyses by tab URL
const ongoingAnalyses = new Map<string, AnalysisStatus>();

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  // Create context menu
  chrome.contextMenus.create({
    id: 'leave-feedback',
    title: 'Leave feedback on this text',
    contexts: ['selection']
  });

  console.log('SanityCheck: Context menu created');

  // Open welcome page on first install (disabled in test builds)
  // @ts-expect-error - BUILD_MODE is injected at build time
  if (details.reason === 'install' && process.env.BUILD_MODE !== 'test') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  }
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'leave-feedback' && info.selectionText && tab?.id) {
    const message: ContentMessage = {
      action: 'showFeedbackDialog',
      selectedText: info.selectionText,
      url: tab.url ?? '',
      title: tab.title ?? ''
    };
    sendToContent(tab.id, message);
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request: BackgroundMessage, _sender, sendResponse) => {
  switch (request.action) {
    case 'submitFeedback':
      submitFeedback(request.data)
        .then(result => sendResponse({ success: true, ...result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getBackendUrl':
      chrome.storage.local.get(['backendUrl'], (result) => {
        sendResponse({ url: result.backendUrl || BACKEND_URL });
      });
      return true;

    case 'startAnalysis':
      startAnalysis(request.tabId, request.article)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getAnalysisStatus': {
      const status = ongoingAnalyses.get(request.url);
      sendResponse(status || { status: 'none' });
      return true;
    }

    case 'clearAnalysis':
      ongoingAnalyses.delete(request.url);
      sendResponse({ success: true });
      return true;

    // Test-only trigger (removed in production builds)
    // @ts-expect-error - BUILD_MODE is injected at build time
    case 'TEST_TRIGGER':
      if (process.env.BUILD_MODE === 'test') {
        handleTestTrigger(request.tabId)
          .then(result => sendResponse({ success: true, result }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
      }
      return false;

    default:
      return false;
  }
});

async function handleTestTrigger(tabId: number) {
  // Inject content script (same as popup does)
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  });

  // Send extractArticle message (same as popup does)
  const response = await chrome.tabs.sendMessage(tabId, {
    action: 'extractArticle'
  });

  // Start analysis if we got an article
  if (response && response.text) {
    await startAnalysis(tabId, response);
  }

  return response;
}

// Expose test trigger function globally for test access
// @ts-expect-error - BUILD_MODE is injected at build time
declare const process: { env: { BUILD_MODE: string } };
if (process.env.BUILD_MODE === 'test') {
  (globalThis as unknown as { handleTestTrigger: typeof handleTestTrigger }).handleTestTrigger = handleTestTrigger;
}

async function submitFeedback(data: FeedbackPayload) {
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

async function startAnalysis(tabId: number, article: Article) {
  const url = article.url;
  
  // Mark as in progress
  ongoingAnalyses.set(url, { status: 'analyzing' });
  
  try {
    // Call backend
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: article.text
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();

    // Store result (as 'parsed' to match what popup.ts expects)
    const issues: AnalysisIssue[] = result.issues || [];
    ongoingAnalyses.set(url, { status: 'complete', parsed: result });
    
    // Notify the content script to display highlights
    try {
      const message: ContentMessage = { action: 'highlightIssues', issues };
      await sendToContent(tabId, message);
    } catch (_e) {
      console.log('Could not send highlights to tab (tab may have been closed)');
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    ongoingAnalyses.set(url, { status: 'error', error: errorMessage });
    console.error('Analysis error:', error);
  }
}
