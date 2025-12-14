// Background service worker for SanityCheck

// Backend URL - defaults to Railway, can be overridden in extension storage
const BACKEND_URL = 'https://sanitycheck-production.up.railway.app';

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

// Handle messages from content script
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
});

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
