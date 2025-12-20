/**
 * Extension messaging types and wrappers
 *
 * Single source of truth for all messages between popup, background, and content scripts.
 * These wrappers provide compile-time type safety for all extension messaging.
 */

// Re-export types from backend (single source of truth)
export type {
  AnalysisIssue,
  CentralArgumentAnalysis,
  AnalysisResponse,
  Importance,
  Severity
} from '../backend/routes/analyze'

import type { AnalysisIssue, CentralArgumentAnalysis, Severity } from '../backend/routes/analyze'

// =====================================================
// Extension-specific types
// =====================================================

export interface ParsedAnalysis {
  issues?: AnalysisIssue[];
  severity?: Severity;
  summary?: string;
  overall_assessment?: string;
  central_argument_analysis?: CentralArgumentAnalysis;
  rawText?: string;
}

export interface AnalysisStatus {
  status: 'none' | 'analyzing' | 'complete' | 'error';
  parsed?: ParsedAnalysis;
  error?: string;
}

export interface Article {
  title: string;
  text: string;
  url: string;
}

export interface ExtractedArticle extends Article {
  wordCount: number;
  isArticle: boolean;
  confidence: number;
}

// =====================================================
// Messages TO Background (from popup or content)
// =====================================================

export type BackgroundMessage =
  | { action: 'submitFeedback'; data: FeedbackPayload }
  | { action: 'startAnalysis'; tabId: number; article: Article }
  | { action: 'getAnalysisStatus'; url: string }
  | { action: 'clearAnalysis'; url: string }
  | { action: 'getBackendUrl' };

export interface FeedbackPayload {
  url: string;
  title: string;
  articleText: string;
  selectedText: string;
  commentText: string;
}

// Response types for background messages
export type BackgroundResponse<T extends BackgroundMessage['action']> =
  T extends 'submitFeedback' ? { success: boolean; error?: string; commentId?: string } :
  T extends 'startAnalysis' ? { success: boolean; error?: string } :
  T extends 'getAnalysisStatus' ? AnalysisStatus :
  T extends 'clearAnalysis' ? { success: boolean } :
  T extends 'getBackendUrl' ? { url: string } :
  never;

// =====================================================
// Messages TO Content (from background or popup)
// =====================================================

export type ContentMessage =
  | { action: 'highlightIssues'; issues: AnalysisIssue[] }
  | { action: 'showFeedbackDialog'; selectedText: string; url: string; title: string }
  | { action: 'checkArticle' }
  | { action: 'extractArticle' };

// Response types for content messages
export type ContentResponse<T extends ContentMessage['action']> =
  T extends 'highlightIssues' ? { success: boolean } :
  T extends 'showFeedbackDialog' ? { success: boolean } :
  T extends 'checkArticle' ? { isArticle: boolean; confidence: number } :
  T extends 'extractArticle' ? ExtractedArticle :
  never;

// =====================================================
// Typed messaging wrappers
// =====================================================

/**
 * Send a typed message to the background script
 */
export function sendToBackground<T extends BackgroundMessage>(
  message: T
): Promise<BackgroundResponse<T['action']>> {
  return chrome.runtime.sendMessage(message);
}

/**
 * Send a typed message to a content script
 */
export function sendToContent<T extends ContentMessage>(
  tabId: number,
  message: T
): Promise<ContentResponse<T['action']>> {
  return chrome.tabs.sendMessage(tabId, message);
}
