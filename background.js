// Background service worker for Logic Checker

// Backend URL - change this after deploying to Railway
const BACKEND_URL = 'http://localhost:3001';

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'annotate-fallacy',
    title: 'Annotate as logical issue',
    contexts: ['selection']
  });
  
  console.log('Logic Checker: Context menu created');
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'annotate-fallacy' && info.selectionText) {
    // Send message to content script to show annotation dialog
    chrome.tabs.sendMessage(tab.id, {
      action: 'showAnnotationDialog',
      quote: info.selectionText,
      url: tab.url,
      title: tab.title
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'submitAnnotation') {
    submitAnnotation(request.data)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'getBackendUrl') {
    // Allow getting backend URL from storage or use default
    chrome.storage.local.get(['backendUrl'], (result) => {
      sendResponse({ url: result.backendUrl || BACKEND_URL });
    });
    return true;
  }
});

async function submitAnnotation(data) {
  // Get backend URL from storage or use default
  const stored = await chrome.storage.local.get(['backendUrl']);
  const backendUrl = stored.backendUrl || BACKEND_URL;
  
  const response = await fetch(`${backendUrl}/annotations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

