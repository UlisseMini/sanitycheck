/**
 * SanityCheck - Content script for extracting article text and highlighting issues
 * This file is bundled with Readability.js during build
 */

import { Readability, isProbablyReaderable } from '@mozilla/readability';
import { BACKEND_URL, makeKawaii } from '../shared';
import {
  AnalysisIssue,
  ContentMessage,
  ContentResponse,
  sendToBackground,
} from './messaging';
import { contentStyles } from '../shared/highlight-styles';

declare global {
  interface Window {
    __logicCheckerInjected?: boolean;
  }
}

interface HighlightData {
  issue: AnalysisIssue;
  index: number;
  importance: string;
  explanation: string;
}

(function() {
  // Avoid re-injecting
  if (window.__logicCheckerInjected) return;
  window.__logicCheckerInjected = true;

  // Simple inline debug logger for content script
  const DEBUG_ENABLED = true;
  const EXTENSION_VERSION = '1.2.0';
  const DEBUG_SERVER_URL = `${BACKEND_URL}/debug/log`;
  
  // Theme preference cache (checked on load)
  let isMissInfoMode = false;
  
  // Check theme preference from chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['theme'], (result) => {
      isMissInfoMode = result.theme === 'miss';
    });
    
    // Listen for theme changes
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.theme) {
        isMissInfoMode = changes.theme.newValue === 'miss';
      }
    });
  }

  const debug = {
    log: (message: string, data: Record<string, unknown> = {}, source = 'content'): void => {
      if (!DEBUG_ENABLED) return;
      void fetch(DEBUG_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'log',
          message,
          data: { ...data, url: window.location.href },
          source,
          version: EXTENSION_VERSION,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    },
    warn: (message: string, data: Record<string, unknown> = {}, source = 'content'): void => {
      if (!DEBUG_ENABLED) return;
      void fetch(DEBUG_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'warn',
          message,
          data: { ...data, url: window.location.href },
          source,
          version: EXTENSION_VERSION,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    },
    error: (message: string, error: unknown, source = 'content', additionalData: Record<string, unknown> = {}): void => {
      if (!DEBUG_ENABLED) return;
      const err = error as Error | undefined;
      void fetch(DEBUG_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'error',
          message,
          data: {
            ...additionalData,
            url: window.location.href,
            error: err ? {
              name: err.name,
              message: err.message,
              stack: err.stack
            } : undefined
          },
          source,
          version: EXTENSION_VERSION,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    },
    debug: (message: string, data: Record<string, unknown> = {}, source = 'content'): void => {
      if (!DEBUG_ENABLED) return;
      void fetch(DEBUG_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'debug',
          message,
          data: { ...data, url: window.location.href },
          source,
          version: EXTENSION_VERSION,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    }
  };

  // Set up error handlers
  window.addEventListener('error', (event) => {
    debug.error('Window error in content script', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    }, 'content-window-error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    debug.error('Unhandled promise rejection in content script', event.reason, 'content-promise-rejection');
  });

  // Feature detection for CSS Custom Highlight API
  const USE_CSS_HIGHLIGHT_API = typeof CSS !== 'undefined' && 
                                 'highlights' in CSS && 
                                 typeof Highlight !== 'undefined';
  
  debug.log('Content script initialized', {
    url: window.location.href,
    title: document.title,
    useCSSHighlightAPI: USE_CSS_HIGHLIGHT_API,
    hasReadability: typeof Readability !== 'undefined'
  }, 'content-init');

  // Store highlight metadata for tooltip display
  const highlightRanges = new Map<Range, HighlightData>();

  // Inject styles for highlighting
  const styleId = 'logic-checker-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = contentStyles;
    document.head.appendChild(style);
    debug.log('Styles injected', { useCSSHighlightAPI: USE_CSS_HIGHLIGHT_API }, 'content-init');
  }

  // Get or create tooltip element
  function ensureTooltip(): HTMLElement {
    let tooltip = document.getElementById('logic-checker-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'logic-checker-tooltip';
      tooltip.className = 'logic-checker-tooltip';
      document.body.appendChild(tooltip);
    }
    return tooltip;
  }
  
  const tooltip = ensureTooltip();

  // =====================================================
  // READABILITY-BASED ARTICLE DETECTION AND EXTRACTION
  // =====================================================

  interface ArticleCheckResult {
    isArticle: boolean;
    confidence: number;
    indicators: {
      isProbablyReaderable: boolean;
      hasArticleTag: boolean;
      hasArticleSchema: boolean;
      hasArticleMeta: boolean;
    };
  }

  function isArticlePage(): ArticleCheckResult {
    debug.debug('Checking if page is an article using Readability', {}, 'content-article-check');
    
    const isProbablyArticle = isProbablyReaderable(document, {
      minContentLength: 140,
      minScore: 20
    });
    
    const hasArticleTag = !!document.querySelector('article');
    const hasArticleSchema = !!document.querySelector('[itemtype*="Article"]') || 
                             !!document.querySelector('[itemtype*="BlogPosting"]');
    const ogType = document.querySelector('meta[property="og:type"]') as HTMLMetaElement | null;
    const hasArticleMeta = ogType?.content === 'article';
    
    let score = 0;
    if (isProbablyArticle) score += 5;
    if (hasArticleTag) score += 2;
    if (hasArticleSchema) score += 2;
    if (hasArticleMeta) score += 1;
    
    const result: ArticleCheckResult = {
      isArticle: score >= 4 || isProbablyArticle,
      confidence: score,
      indicators: {
        isProbablyReaderable: isProbablyArticle,
        hasArticleTag,
        hasArticleSchema,
        hasArticleMeta
      }
    };
    
    debug.log('Article check complete (Readability)', {
      isArticle: result.isArticle,
      confidence: result.confidence,
      isProbablyReaderable: isProbablyArticle
    }, 'content-article-check');
    
    return result;
  }

  // =====================================================
  // SITE-SPECIFIC EXTRACTORS
  // =====================================================

  interface ExtractedArticle {
    title: string;
    text: string;
    wordCount: number;
    url: string;
    source?: string;
    byline?: string;
    siteName?: string;
    excerpt?: string;
  }

  type SiteExtractor = () => ExtractedArticle | null;

  function getSiteSpecificExtractor(): SiteExtractor | null {
    const host = window.location.hostname.toLowerCase();
    
    if (host.includes('lesswrong.com') || host.includes('greaterwrong.com')) {
      return () => {
        const postContent = document.querySelector('#postContent');
        if (!postContent) return null;
        
        const title = document.querySelector('h1')?.textContent?.trim() ?? document.title;
        const text = postContent.textContent ?? '';
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
        
        if (wordCount < 10) return null;
        
        return { title, text, wordCount, url: window.location.href, source: 'lesswrong' };
      };
    }
    
    return null;
  }

  function extractArticleText(): ExtractedArticle {
    const siteExtractor = getSiteSpecificExtractor();
    if (siteExtractor) {
      try {
        const result = siteExtractor();
        if (result && result.text && result.wordCount > 10) {
          debug.log('Article extracted', { 
            extractor: result.source, 
            wordCount: result.wordCount 
          }, 'content-extract');
          return result;
        }
      } catch (e) {
        const err = e as Error;
        debug.warn('Site-specific extraction failed', { error: err.message }, 'content-extract');
      }
    }
    
    try {
      const docClone = document.cloneNode(true) as Document;
      docClone.querySelectorAll('script, style, noscript, iframe, svg').forEach(el => el.remove());
      
      const reader = new Readability(docClone, { charThreshold: 100 });
      const article = reader.parse();
      
      if (article?.textContent) {
        const wordCount = article.textContent.split(/\s+/).filter(w => w.length > 0).length;
        
        debug.log('Article extracted', { extractor: 'readability', wordCount }, 'content-extract');
        
        return {
          title: article.title ?? document.title,
          text: article.textContent,
          wordCount,
          url: window.location.href,
          byline: article.byline ?? undefined,
          siteName: article.siteName ?? undefined,
          excerpt: article.excerpt ?? undefined
        };
      }
      
      debug.warn('Readability failed, using fallback', {}, 'content-extract');
      return fallbackExtraction();
      
    } catch (error) {
      debug.error('Readability error', error, 'content-extract');
      return fallbackExtraction();
    }
  }

  function fallbackExtraction(): ExtractedArticle {
    debug.log('Using fallback extraction', {}, 'content-extract-fallback');
    
    const h1 = document.querySelector('h1');
    const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
    const title = h1?.textContent?.trim() ?? ogTitle?.content ?? document.title;
    
    const paragraphs = document.querySelectorAll('p');
    const textParts: string[] = [];
    
    paragraphs.forEach(p => {
      const parent = p.closest('nav, footer, header, aside, .sidebar, .comments, .advertisement');
      if (parent) return;
      
      const text = p.textContent?.trim() ?? '';
      if (text.length > 50) {
        textParts.push(text);
      }
    });
    
    const articleText = textParts.join('\n\n');
    const wordCount = articleText.split(/\s+/).filter(w => w.length > 0).length;
    
    debug.log('Fallback extraction complete', {
      title,
      textLength: articleText.length,
      wordCount
    }, 'content-extract-fallback');
    
    return {
      title,
      text: articleText,
      wordCount,
      url: window.location.href
    };
  }

  // =====================================================
  // TEXT MATCHING AND HIGHLIGHTING
  // =====================================================

  interface MatchInfo {
    startNode: Text;
    startOffset: number;
    endNode: Text;
    endOffset: number;
  }

  function normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function findTextInPage(quote: string): MatchInfo | null {
    if (!quote || quote.length < 10) {
      return null;
    }
    
    const normalizedQuote = normalizeText(quote);
    
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.closest('.logic-checker-tooltip')) {
            return NodeFilter.FILTER_REJECT;
          }
          if ((node.textContent?.trim().length ?? 0) === 0) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes: Text[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      textNodes.push(node);
    }

    let fullText = '';
    const nodeMap: Array<{ node: Text; offset: number }> = [];
    
    for (const textNode of textNodes) {
      const text = textNode.textContent ?? '';
      for (let i = 0; i < text.length; i++) {
        nodeMap.push({ node: textNode, offset: i });
      }
      fullText += text;
    }

    const normalizedFullText = normalizeText(fullText);
    const normalizedToOriginalMap = buildNormalizedMapping(fullText, normalizedFullText);
    
    let matchIndex = normalizedFullText.indexOf(normalizedQuote);
    
    if (matchIndex === -1) {
      matchIndex = fuzzyFind(normalizedFullText, normalizedQuote);
    }
    
    if (matchIndex === -1) {
      return null;
    }

    const matchEndIndex = matchIndex + normalizedQuote.length;
    
    if (matchIndex >= normalizedToOriginalMap.length || matchEndIndex > normalizedToOriginalMap.length) {
      return null;
    }
    
    const originalMatchStart = normalizedToOriginalMap[matchIndex];
    const originalMatchEnd = normalizedToOriginalMap[Math.min(matchEndIndex, normalizedToOriginalMap.length - 1)];

    if (originalMatchStart === undefined || originalMatchEnd === undefined) {
      return null;
    }
    
    if (originalMatchStart >= nodeMap.length || originalMatchEnd >= nodeMap.length) {
      return null;
    }

    const endPos = Math.min(originalMatchEnd - 1, nodeMap.length - 1);
    const endNodeEntry = nodeMap[endPos];
    if (!endNodeEntry) return null;
    
    const endNode = endNodeEntry.node;
    const endText = endNode.textContent ?? '';
    
    let endOffset = endNodeEntry.offset + 1;
    while (endOffset < endText.length && /\w/.test(endText[endOffset] ?? '')) endOffset++;
    
    const startNodeEntry = nodeMap[originalMatchStart];
    if (!startNodeEntry) return null;
    
    return {
      startNode: startNodeEntry.node,
      startOffset: startNodeEntry.offset,
      endNode: endNode,
      endOffset: endOffset
    };
  }

  function buildNormalizedMapping(original: string, normalized: string): number[] {
    const mapping: number[] = [];
    let origIdx = 0;
    let normIdx = 0;
    let lastWasWhitespace = false;
    
    while (origIdx < original.length && normIdx < normalized.length) {
      const origChar = original[origIdx] ?? '';
      const isWhitespace = /\s/.test(origChar);
      
      if (isWhitespace) {
        if (!lastWasWhitespace && normalized[normIdx] === ' ') {
          mapping[normIdx] = origIdx;
          normIdx++;
        }
        lastWasWhitespace = true;
        origIdx++;
      } else {
        lastWasWhitespace = false;
        
        let normChar = origChar.toLowerCase();
        
        if (normChar === '\u2018' || normChar === '\u2019') {
          normChar = "'";
        } else if (normChar === '\u201C' || normChar === '\u201D') {
          normChar = '"';
        } else if (normChar === '\u2013' || normChar === '\u2014') {
          normChar = '-';
        } else if (normChar === '\u2026') {
          if (normIdx + 2 < normalized.length && 
              normalized[normIdx] === '.' && 
              normalized[normIdx + 1] === '.' && 
              normalized[normIdx + 2] === '.') {
            mapping[normIdx] = origIdx;
            mapping[normIdx + 1] = origIdx;
            mapping[normIdx + 2] = origIdx;
            normIdx += 3;
            origIdx++;
            continue;
          } else {
            origIdx++;
            continue;
          }
        }
        
        if (normIdx < normalized.length && normChar === normalized[normIdx]) {
          mapping[normIdx] = origIdx;
          normIdx++;
          origIdx++;
        } else {
          origIdx++;
        }
      }
    }
    
    const lastMapped = mapping.length > 0 ? (mapping[mapping.length - 1] ?? 0) : Math.max(0, original.length - 1);
    while (mapping.length < normalized.length) {
      mapping.push(Math.min(lastMapped, original.length - 1));
    }
    
    return mapping;
  }

  function fuzzyFind(haystack: string, needle: string): number {
    if (needle.length > haystack.length) return -1;
    
    for (let len = needle.length; len >= Math.min(30, needle.length * 0.5); len--) {
      const prefix = needle.substring(0, len);
      const idx = haystack.indexOf(prefix);
      if (idx !== -1) {
        return idx;
      }
    }
    
    const words = needle.split(' ').filter(w => w.length > 3);
    if (words.length >= 3) {
      for (let i = 0; i <= words.length - 3; i++) {
        const phrase = words.slice(i, i + 3).join(' ');
        const idx = haystack.indexOf(phrase);
        if (idx !== -1) {
          return idx;
        }
      }
    }
    
    return -1;
  }

  // =====================================================
  // CSS Custom Highlight API
  // =====================================================
  
  function highlightWithCSSAPI(matchInfo: MatchInfo, issue: AnalysisIssue, index: number): boolean {
    try {
      const range = document.createRange();
      range.setStart(matchInfo.startNode, matchInfo.startOffset);
      range.setEnd(matchInfo.endNode, matchInfo.endOffset);
      
      const importance = issue.importance ?? 'default';
      const highlightName = `logic-checker-${importance}`;
      
      highlightRanges.set(range, {
        issue,
        index,
        importance,
        explanation: issue.gap ?? issue.why_it_doesnt_follow ?? issue.explanation ?? ''
      });
      
      let highlight = CSS.highlights.get(highlightName);
      if (!highlight) {
        highlight = new Highlight();
        CSS.highlights.set(highlightName, highlight);
      }
      
      highlight.add(range);
      return true;
    } catch (_e) {
      return false;
    }
  }
  
  function clearCSSHighlights(): void {
    const names = ['logic-checker-critical', 'logic-checker-significant', 'logic-checker-minor', 'logic-checker-default'];
    names.forEach(name => {
      if (CSS.highlights.has(name)) {
        CSS.highlights.delete(name);
      }
    });
    highlightRanges.clear();
  }
  
  function getHighlightAtPoint(x: number, y: number): HighlightData | null {
    let caretPos: { offsetNode: Node; offset: number } | null = null;
    
    if ('caretPositionFromPoint' in document) {
      const pos = (document as Document & { caretPositionFromPoint(x: number, y: number): { offsetNode: Node; offset: number } | null }).caretPositionFromPoint(x, y);
      if (!pos) return null;
      caretPos = pos;
    } else if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(x, y);
      if (!range) return null;
      caretPos = { offsetNode: range.startContainer, offset: range.startOffset };
    } else {
      return null;
    }
    
    const node = caretPos.offsetNode;
    const offset = caretPos.offset;
    
    for (const [range, data] of highlightRanges) {
      try {
        if (range.isPointInRange(node, offset)) {
          return data;
        }
      } catch (_e) {
        continue;
      }
    }
    
    return null;
  }
  
  let lastHighlightData: HighlightData | null = null;
  
  function handleMouseMoveForHighlight(e: MouseEvent): void {
    if (!USE_CSS_HIGHLIGHT_API) return;
    
    const data = getHighlightAtPoint(e.clientX, e.clientY);
    
    if (data) {
      if (data !== lastHighlightData) {
        showTooltipForData(e, data);
        lastHighlightData = data;
      } else {
        const tooltipEl = ensureTooltip();
        positionTooltip(e, tooltipEl);
      }
    } else {
      if (lastHighlightData) {
        hideTooltip();
        lastHighlightData = null;
      }
    }
  }
  
  function showTooltipForData(e: MouseEvent, data: HighlightData): void {
    const tooltipEl = ensureTooltip();
    const importance = data.importance ?? 'minor';
    
    tooltipEl.className = `logic-checker-tooltip ${importance}`;
    
    const emoji = importance === 'critical' ? '🔴' : 
                  importance === 'significant' ? '🟠' : '🟡';

    const typeLabel = data.issue.type ?? data.issue.importance ?? 'Issue';
    tooltipEl.innerHTML = `
      <div class="logic-checker-tooltip-badge">Logic Issue</div>
      <div class="logic-checker-tooltip-header">
        <span class="logic-checker-tooltip-icon">${emoji}</span>
        <span class="logic-checker-tooltip-type">${escapeHtml(typeLabel)}</span>
      </div>
      <div class="logic-checker-tooltip-explanation">${escapeHtml(data.explanation || 'No explanation available')}</div>
    `;

    positionTooltip(e, tooltipEl);
    tooltipEl.classList.add('visible');
  }
  
  if (USE_CSS_HIGHLIGHT_API) {
    document.addEventListener('mousemove', handleMouseMoveForHighlight, { passive: true });
  }

  // =====================================================
  // Span-based Highlighting (Fallback)
  // =====================================================
  
  function highlightRangeWithSpan(matchInfo: MatchInfo, issue: AnalysisIssue, index: number): boolean {
    try {
      const range = document.createRange();
      range.setStart(matchInfo.startNode, matchInfo.startOffset);
      range.setEnd(matchInfo.endNode, matchInfo.endOffset);

      const highlight = document.createElement('span');
      const importance = issue.importance ?? 'minor';
      highlight.className = `logic-checker-highlight ${importance}`;
      highlight.dataset['issueIndex'] = String(index);
      highlight.dataset['issueType'] = issue.type ?? issue.importance ?? 'issue';
      highlight.dataset['importance'] = importance;
      highlight.dataset['issueExplanation'] = issue.gap ?? issue.why_it_doesnt_follow ?? issue.explanation ?? '';

      range.surroundContents(highlight);

      highlight.addEventListener('mouseenter', showTooltipEvent);
      highlight.addEventListener('mouseleave', hideTooltip);
      highlight.addEventListener('mousemove', moveTooltip);

      return true;
    } catch (_e) {
      return highlightAlternative(matchInfo, issue, index);
    }
  }

  function highlightAlternative(matchInfo: MatchInfo, issue: AnalysisIssue, index: number): boolean {
    try {
      const range = document.createRange();
      range.setStart(matchInfo.startNode, matchInfo.startOffset);
      range.setEnd(matchInfo.endNode, matchInfo.endOffset);
      
      const fragment = range.cloneContents();
      const textContent = fragment.textContent ?? '';
      
      if (textContent.length < 10) {
        return false;
      }

      const startText = matchInfo.startNode.textContent ?? '';
      const before = startText.substring(0, matchInfo.startOffset);
      const highlighted = startText.substring(matchInfo.startOffset);
      
      const wrapper = document.createElement('span');
      const importance = issue.importance ?? 'minor';
      wrapper.className = `logic-checker-highlight ${importance}`;
      wrapper.dataset['issueIndex'] = String(index);
      wrapper.dataset['issueType'] = issue.type ?? issue.importance ?? 'issue';
      wrapper.dataset['importance'] = importance;
      wrapper.dataset['issueExplanation'] = issue.gap ?? issue.why_it_doesnt_follow ?? issue.explanation ?? '';
      wrapper.textContent = highlighted;
      
      const parent = matchInfo.startNode.parentNode;
      if (!parent) return false;
      
      const beforeNode = document.createTextNode(before);
      
      parent.insertBefore(beforeNode, matchInfo.startNode);
      parent.insertBefore(wrapper, matchInfo.startNode);
      parent.removeChild(matchInfo.startNode);

      wrapper.addEventListener('mouseenter', showTooltipEvent);
      wrapper.addEventListener('mouseleave', hideTooltip);
      wrapper.addEventListener('mousemove', moveTooltip);

      return true;
    } catch (_e) {
      return false;
    }
  }
  
  function highlightRange(matchInfo: MatchInfo, issue: AnalysisIssue, index: number): boolean {
    if (USE_CSS_HIGHLIGHT_API) {
      return highlightWithCSSAPI(matchInfo, issue, index);
    } else {
      return highlightRangeWithSpan(matchInfo, issue, index);
    }
  }

  // Tooltip functions
  function showTooltipEvent(e: Event): void {
    const highlight = (e.target as HTMLElement).closest('.logic-checker-highlight') as HTMLElement | null;
    if (!highlight) return;

    const tooltipEl = ensureTooltip();
    
    const type = highlight.dataset['issueType'] ?? 'issue';
    const explanation = highlight.dataset['issueExplanation'] ?? '';
    const importance = highlight.dataset['importance'] ?? 'minor';
    
    tooltipEl.className = `logic-checker-tooltip ${importance}`;
    
    const emoji = importance === 'critical' ? '🔴' : 
                  importance === 'significant' ? '🟠' : '🟡';

    // Apply kawaii styling if in Miss Info mode
    let displayExplanation = explanation || 'No explanation available';
    if (isMissInfoMode) {
      displayExplanation = makeKawaii(displayExplanation);
    }
    
    tooltipEl.innerHTML = `
      <div class="logic-checker-tooltip-badge">Logic Issue</div>
      <div class="logic-checker-tooltip-header">
        <span class="logic-checker-tooltip-icon">${emoji}</span>
        <span class="logic-checker-tooltip-type">${escapeHtml(type)}</span>
      </div>
      <div class="logic-checker-tooltip-explanation">${escapeHtml(displayExplanation)}</div>
    `;

    positionTooltip(e as MouseEvent, tooltipEl);
    tooltipEl.classList.add('visible');
  }

  function hideTooltip(): void {
    const tooltipEl = ensureTooltip();
    tooltipEl.classList.remove('visible');
  }

  function moveTooltip(e: Event): void {
    const tooltipEl = ensureTooltip();
    positionTooltip(e as MouseEvent, tooltipEl);
  }

  function positionTooltip(e: MouseEvent, tooltipElement: HTMLElement): void {
    const padding = 15;
    const tooltipRect = tooltipElement.getBoundingClientRect();
    
    let x = e.clientX + padding;
    let y = e.clientY + padding;

    if (x + tooltipRect.width > window.innerWidth - padding) {
      x = e.clientX - tooltipRect.width - padding;
    }
    if (y + tooltipRect.height > window.innerHeight - padding) {
      y = e.clientY - tooltipRect.height - padding;
    }

    tooltipElement.style.left = `${Math.max(padding, x)}px`;
    tooltipElement.style.top = `${Math.max(padding, y)}px`;
  }

  function escapeHtml(text: string): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function clearHighlights(): void {
    if (USE_CSS_HIGHLIGHT_API) {
      clearCSSHighlights();
    }
    
    const highlights = document.querySelectorAll('.logic-checker-highlight');
    highlights.forEach(el => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
    });
  }

  function highlightIssues(issues: AnalysisIssue[]): void {
    debug.log('Starting highlight process', { 
      issueCount: issues.length,
      method: USE_CSS_HIGHLIGHT_API ? 'CSS Highlight API' : 'Span wrapping'
    }, 'content-highlight');
    
    ensureTooltip();
    clearHighlights();
    
    let successCount = 0;
    
    issues.forEach((issue, index) => {
      if (!issue.quote) return;
      
      const matchInfo = findTextInPage(issue.quote);
      if (matchInfo) {
        const success = highlightRange(matchInfo, issue, index);
        if (success) successCount++;
      }
    });

    debug.log('Highlight process complete', {
      successCount,
      totalIssues: issues.length
    }, 'content-highlight');
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((request: ContentMessage, _sender, sendResponse) => {
    debug.log('Message received', { action: request.action }, 'content-message');
    
    try {
      switch (request.action) {
        case 'checkArticle': {
          const result: ContentResponse<'checkArticle'> = isArticlePage();
          sendResponse(result);
          break;
        }
        case 'extractArticle': {
          const article = extractArticleText();
          const articleCheck = isArticlePage();
          const response: ContentResponse<'extractArticle'> = {
            ...article,
            ...articleCheck
          };
          sendResponse(response);
          break;
        }
        case 'highlightIssues': {
          highlightIssues(request.issues);
          sendResponse({ success: true });
          break;
        }
        case 'showFeedbackDialog': {
          showFeedbackDialog(request.selectedText, request.url, request.title);
          sendResponse({ success: true });
          break;
        }
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      debug.error('Error handling message', error, 'content-message', {
        action: request.action
      });
      sendResponse({ error: (error as Error).message });
    }
    
    return true;
  });

  // =====================================================
  // Feedback Dialog
  // =====================================================

  function showFeedbackDialog(selectedText: string, url: string, title: string): void {
    const existing = document.querySelector('.logic-checker-annotation-overlay');
    if (existing) existing.remove();

    const articleText = extractArticleText().text || document.body.innerText.substring(0, 50000);

    const overlay = document.createElement('div');
    overlay.className = 'logic-checker-annotation-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'logic-checker-annotation-dialog';

    dialog.innerHTML = `
      <div class="logic-checker-annotation-header">
        <h2 class="logic-checker-annotation-title">💬 Leave Feedback</h2>
        <button class="logic-checker-annotation-close" aria-label="Close">&times;</button>
      </div>
      
      <div class="logic-checker-annotation-quote">"${escapeHtml(selectedText)}"</div>
      
      <label class="logic-checker-annotation-label">Your Feedback</label>
      <textarea 
        class="logic-checker-annotation-textarea" 
        id="lc-feedback-text"
        placeholder="Share your thoughts on this passage..."
      ></textarea>
      
      <div class="logic-checker-annotation-actions">
        <button class="logic-checker-annotation-btn logic-checker-annotation-btn-secondary" id="lc-cancel">
          Cancel
        </button>
        <button class="logic-checker-annotation-btn logic-checker-annotation-btn-primary" id="lc-submit">
          Submit
        </button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const textarea = dialog.querySelector('#lc-feedback-text') as HTMLTextAreaElement;
    setTimeout(() => textarea.focus(), 100);

    const close = (): void => { overlay.remove(); };
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    
    dialog.querySelector('.logic-checker-annotation-close')?.addEventListener('click', close);
    dialog.querySelector('#lc-cancel')?.addEventListener('click', close);

    dialog.querySelector('#lc-submit')?.addEventListener('click', () => {
      void (async () => {
        const feedbackText = textarea.value.trim();

        if (!feedbackText) {
          textarea.style.borderColor = '#ef4444';
          textarea.focus();
          return;
        }

        const submitBtn = dialog.querySelector('#lc-submit') as HTMLButtonElement;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
          const response = await sendToBackground({
            action: 'submitFeedback',
            data: {
              url,
              title,
              articleText,
              selectedText,
              commentText: feedbackText
            }
          });

          if (response.success) {
            const actionsEl = dialog.querySelector('.logic-checker-annotation-actions');
            if (actionsEl) {
              actionsEl.innerHTML = `
                <div class="logic-checker-annotation-success">
                  ✅ Feedback submitted! Thank you.
                </div>
              `;
            }
            setTimeout(close, 1500);
          } else {
            throw new Error(response.error ?? 'Failed to submit');
          }
        } catch (error) {
          debug.error('Failed to submit feedback', error, 'content-feedback');
          const actionsEl = dialog.querySelector('.logic-checker-annotation-actions');
          if (actionsEl) {
            actionsEl.innerHTML = `
              <div class="logic-checker-annotation-error">
                ❌ ${escapeHtml((error as Error).message)}
              </div>
              <button class="logic-checker-annotation-btn logic-checker-annotation-btn-secondary" id="lc-retry">
                Try Again
              </button>
            `;
          }
        }
      })();
    });

    const escHandler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  // Silence the unused variable warning for tooltip
  void tooltip;
})();
