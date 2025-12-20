// ABOUTME: Background service worker for SanityCheck.
// ABOUTME: Handles API calls, analysis state, and content script messaging.

import { BACKEND_URL } from './config'
import { api, AnalyzeData } from './api'
import {
  Article,
  AnalysisStatus,
  FeedbackPayload,
  BackgroundMessage,
  ContentMessage,
  sendToContent,
} from './messaging'

// Track ongoing analyses by tab URL
const ongoingAnalyses = new Map<string, AnalysisStatus>()

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  // Create context menu
  chrome.contextMenus.create({
    id: 'leave-feedback',
    title: 'Leave feedback on this text',
    contexts: ['selection']
  })

  console.log('SanityCheck: Context menu created')

  // Open welcome page on first install
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') })
  }
})

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'leave-feedback' && info.selectionText && tab?.id) {
    const message: ContentMessage = {
      action: 'showFeedbackDialog',
      selectedText: info.selectionText,
      url: tab.url ?? '',
      title: tab.title ?? ''
    }
    sendToContent(tab.id, message)
  }
})

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request: BackgroundMessage, _sender, sendResponse) => {
  switch (request.action) {
    case 'submitFeedback':
      submitFeedback(request.data)
        .then(result => sendResponse({ success: true, ...result }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true

    case 'getBackendUrl':
      chrome.storage.local.get(['backendUrl'], (result) => {
        sendResponse({ url: result.backendUrl || BACKEND_URL })
      })
      return true

    case 'startAnalysis':
      startAnalysis(request.tabId, request.article)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true

    case 'getAnalysisStatus': {
      const status = ongoingAnalyses.get(request.url)
      sendResponse(status || { status: 'none' })
      return true
    }

    case 'clearAnalysis':
      ongoingAnalyses.delete(request.url)
      sendResponse({ success: true })
      return true

    default:
      return false
  }
})

async function submitFeedback(data: FeedbackPayload) {
  // Type-safe API call via Eden
  const result = await api.comments.post({
    url: data.url,
    title: data.title,
    textContent: data.articleText,
    selectedText: data.selectedText,
    commentText: data.commentText
  })

  if (result.error) {
    const errorMsg = 'value' in result.error ? result.error.value.message : 'Unknown error'
    throw new Error(`Failed to submit feedback: ${errorMsg}`)
  }

  return result.data
}

async function startAnalysis(tabId: number, article: Article) {
  const url = article.url

  // Mark as in progress
  ongoingAnalyses.set(url, { status: 'analyzing' })

  try {
    // Type-safe API call via Eden
    const result = await api.analyze.post({
      text: article.text
    })

    if (result.error) {
      const errorMsg = 'value' in result.error ? result.error.value.message : 'Unknown error'
      throw new Error(`API error: ${errorMsg}`)
    }

    const data = result.data as AnalyzeData

    // Store result (as 'parsed' to match what popup.ts expects)
    // Convert null to undefined for compatibility with ParsedAnalysis type
    ongoingAnalyses.set(url, {
      status: 'complete',
      parsed: {
        ...data,
        central_argument_analysis: data.central_argument_analysis
      }
    })

    // Notify the content script to display highlights
    try {
      const message: ContentMessage = { action: 'highlightIssues', issues: data.issues }
      await sendToContent(tabId, message)
    } catch (_e) {
      console.log('Could not send highlights to tab (tab may have been closed)')
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    ongoingAnalyses.set(url, { status: 'error', error: errorMessage })
    console.error('Analysis error:', error)
  }
}
