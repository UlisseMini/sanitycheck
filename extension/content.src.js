// SanityCheck - Content script for extracting article text and highlighting issues
// This file is bundled with Readability.js during build

import { Readability, isProbablyReaderable } from '@mozilla/readability';

(function() {
  // Avoid re-injecting
  if (window.__logicCheckerInjected) return;
  window.__logicCheckerInjected = true;

  // Simple inline debug logger for content script
  const DEBUG_ENABLED = true; // Set to true to enable debug logging
  const EXTENSION_VERSION = '1.2.0';
  const DEBUG_SERVER_URL = 'https://sanitycheck-production.up.railway.app/debug/log';
  
  const debug = {
    log: (message, data = {}, source = 'content') => {
      if (!DEBUG_ENABLED) return;
      fetch(DEBUG_SERVER_URL, {
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
    warn: (message, data = {}, source = 'content') => {
      if (!DEBUG_ENABLED) return;
      fetch(DEBUG_SERVER_URL, {
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
    error: (message, error, source = 'content', additionalData = {}) => {
      if (!DEBUG_ENABLED) return;
      fetch(DEBUG_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'error',
          message,
          data: {
            ...additionalData,
            url: window.location.href,
            error: error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : undefined
          },
          source,
          version: EXTENSION_VERSION,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    },
    debug: (message, data = {}, source = 'content') => {
      if (!DEBUG_ENABLED) return;
      fetch(DEBUG_SERVER_URL, {
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
      error: event.error
    }, 'content-window-error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    debug.error('Unhandled promise rejection in content script', event.reason, 'content-promise-rejection');
  });

  // Feature detection for CSS Custom Highlight API
  const USE_CSS_HIGHLIGHT_API = typeof CSS !== 'undefined' && 
                                 typeof CSS.highlights !== 'undefined' && 
                                 typeof Highlight !== 'undefined';
  
  debug.log('Content script initialized', {
    url: window.location.href,
    title: document.title,
    useCSSHighlightAPI: USE_CSS_HIGHLIGHT_API,
    hasReadability: typeof Readability !== 'undefined'
  }, 'content-init');

  // Store highlight metadata for tooltip display (used by CSS Highlight API)
  const highlightRanges = new Map(); // Map<Range, {issue, index}>

  // Inject styles for highlighting
  const styleId = 'logic-checker-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* ===== CSS Custom Highlight API Styles ===== */
      ::highlight(logic-checker-critical) {
        background-color: rgba(239, 68, 68, 0.25);
      }
      
      ::highlight(logic-checker-significant) {
        background-color: rgba(234, 179, 8, 0.25);
      }
      
      ::highlight(logic-checker-minor) {
        background-color: rgba(115, 115, 115, 0.25);
      }
      
      ::highlight(logic-checker-default) {
        background-color: rgba(249, 115, 22, 0.25);
      }
      
      /* ===== Fallback: Span-based Highlight Styles ===== */
      .logic-checker-highlight {
        cursor: help;
        position: relative;
        transition: background 0.2s ease, border-color 0.2s ease;
        border-radius: 2px;
        padding: 1px 0;
      }
      
      .logic-checker-highlight.critical,
      .logic-checker-highlight[data-importance="critical"] {
        background: linear-gradient(to bottom, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.15) 100%);
      }
      
      .logic-checker-highlight.critical:hover,
      .logic-checker-highlight[data-importance="critical"]:hover {
        background: rgba(239, 68, 68, 0.35);
      }
      
      .logic-checker-highlight.significant,
      .logic-checker-highlight[data-importance="significant"] {
        background: linear-gradient(to bottom, rgba(234, 179, 8, 0.25) 0%, rgba(234, 179, 8, 0.15) 100%);
      }
      
      .logic-checker-highlight.significant:hover,
      .logic-checker-highlight[data-importance="significant"]:hover {
        background: rgba(234, 179, 8, 0.35);
      }
      
      .logic-checker-highlight.minor,
      .logic-checker-highlight[data-importance="minor"] {
        background: linear-gradient(to bottom, rgba(115, 115, 115, 0.25) 0%, rgba(115, 115, 115, 0.15) 100%);
      }
      
      .logic-checker-highlight.minor:hover,
      .logic-checker-highlight[data-importance="minor"]:hover {
        background: rgba(115, 115, 115, 0.35);
      }
      
      .logic-checker-highlight:not(.critical):not(.significant):not(.minor):not([data-importance]) {
        background: linear-gradient(to bottom, rgba(249, 115, 22, 0.25) 0%, rgba(249, 115, 22, 0.15) 100%);
      }
      
      .logic-checker-highlight:not(.critical):not(.significant):not(.minor):not([data-importance]):hover {
        background: rgba(249, 115, 22, 0.35);
      }
      
      /* ===== Tooltip Styles ===== */
      .logic-checker-tooltip {
        position: fixed;
        z-index: 2147483647;
        max-width: 380px;
        background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
        border: 1px solid;
        border-radius: 8px;
        padding: 14px 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        line-height: 1.5;
        color: #f5f5f5;
        pointer-events: none;
        opacity: 0;
        transform: translateY(8px);
        transition: opacity 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
      }
      
      .logic-checker-tooltip.critical {
        border-color: #ef4444;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.2);
      }
      
      .logic-checker-tooltip.significant {
        border-color: #eab308;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(234, 179, 8, 0.2);
      }
      
      .logic-checker-tooltip.minor {
        border-color: #737373;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(115, 115, 115, 0.2);
      }
      
      .logic-checker-tooltip:not(.critical):not(.significant):not(.minor) {
        border-color: #60a5fa;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(96, 165, 250, 0.2);
      }
      
      .logic-checker-tooltip.visible {
        opacity: 1;
        transform: translateY(0);
      }
      
      .logic-checker-tooltip-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #333;
      }
      
      .logic-checker-tooltip-icon {
        font-size: 18px;
      }
      
      .logic-checker-tooltip-type {
        font-weight: 600;
        font-size: 14px;
      }
      
      .logic-checker-tooltip.critical .logic-checker-tooltip-type { color: #ef4444; }
      .logic-checker-tooltip.significant .logic-checker-tooltip-type { color: #eab308; }
      .logic-checker-tooltip.minor .logic-checker-tooltip-type { color: #737373; }
      .logic-checker-tooltip:not(.critical):not(.significant):not(.minor) .logic-checker-tooltip-type { color: #60a5fa; }
      
      .logic-checker-tooltip-explanation {
        color: #d4d4d4;
      }
      
      .logic-checker-tooltip-badge {
        position: absolute;
        top: -8px;
        right: 12px;
        color: white;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .logic-checker-tooltip.critical .logic-checker-tooltip-badge { background: #ef4444; }
      .logic-checker-tooltip.significant .logic-checker-tooltip-badge { background: #eab308; }
      .logic-checker-tooltip.minor .logic-checker-tooltip-badge { background: #737373; }
      .logic-checker-tooltip:not(.critical):not(.significant):not(.minor) .logic-checker-tooltip-badge { background: #60a5fa; }
    `;
    document.head.appendChild(style);
    debug.log('Styles injected', { useCSSHighlightAPI: USE_CSS_HIGHLIGHT_API }, 'content-init');
  }

  // Get or create tooltip element
  function ensureTooltip() {
    let tooltip = document.getElementById('logic-checker-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'logic-checker-tooltip';
      tooltip.className = 'logic-checker-tooltip';
      document.body.appendChild(tooltip);
    }
    return tooltip;
  }
  
  let tooltip = ensureTooltip();

  // =====================================================
  // READABILITY-BASED ARTICLE DETECTION AND EXTRACTION
  // =====================================================

  function isArticlePage() {
    debug.debug('Checking if page is an article using Readability', {}, 'content-article-check');
    
    // Use Readability's built-in heuristic
    const isProbablyArticle = isProbablyReaderable(document, {
      minContentLength: 140,
      minScore: 20
    });
    
    // Also check for common article indicators as a backup
    const hasArticleTag = !!document.querySelector('article');
    const hasArticleSchema = !!document.querySelector('[itemtype*="Article"]') || 
                             !!document.querySelector('[itemtype*="BlogPosting"]');
    const ogType = document.querySelector('meta[property="og:type"]');
    const hasArticleMeta = ogType && ogType.content === 'article';
    
    // Calculate confidence score
    let score = 0;
    if (isProbablyArticle) score += 5;
    if (hasArticleTag) score += 2;
    if (hasArticleSchema) score += 2;
    if (hasArticleMeta) score += 1;
    
    const result = {
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

  function getSiteSpecificExtractor() {
    const host = window.location.hostname.toLowerCase();
    
    // LessWrong / GreaterWrong - use #postContent for cleaner extraction
    if (host.includes('lesswrong.com') || host.includes('greaterwrong.com')) {
      return () => {
        const postContent = document.querySelector('#postContent');
        if (!postContent) return null;
        
        const title = document.querySelector('h1')?.textContent?.trim() || document.title;
        const text = postContent.innerText || postContent.textContent || '';
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
        
        if (wordCount < 10) return null;
        
        return { title, text, wordCount, url: window.location.href, source: 'lesswrong' };
      };
    }
    
    // Add more sites here: if (host.includes('example.com')) { return () => {...}; }
    
    return null;
  }

  function extractArticleText() {
    const host = window.location.hostname;
    
    // Try site-specific extraction first
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
        debug.warn('Site-specific extraction failed', { error: e.message }, 'content-extract');
      }
    }
    
    // Default: Readability extraction
    try {
      const docClone = document.cloneNode(true);
      docClone.querySelectorAll('script, style, noscript, iframe, svg').forEach(el => el.remove());
      
      const reader = new Readability(docClone, { charThreshold: 100 });
      const article = reader.parse();
      
      if (article && article.textContent) {
        const wordCount = article.textContent.split(/\s+/).filter(w => w.length > 0).length;
        
        debug.log('Article extracted', { extractor: 'readability', wordCount }, 'content-extract');
        
        return {
          title: article.title || document.title,
          text: article.textContent,
          wordCount,
          url: window.location.href,
          byline: article.byline,
          siteName: article.siteName,
          excerpt: article.excerpt
        };
      }
      
      debug.warn('Readability failed, using fallback', {}, 'content-extract');
      return fallbackExtraction();
      
    } catch (error) {
      debug.error('Readability error', error, 'content-extract');
      return fallbackExtraction();
    }
  }

  // Fallback extraction for when Readability fails
  function fallbackExtraction() {
    debug.log('Using fallback extraction', {}, 'content-extract-fallback');
    
    let articleText = '';
    let title = '';
    
    const h1 = document.querySelector('h1');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    title = h1?.textContent?.trim() || ogTitle?.content || document.title;
    
    // Try to get paragraphs
    const paragraphs = document.querySelectorAll('p');
    const textParts = [];
    
    paragraphs.forEach(p => {
      const parent = p.closest('nav, footer, header, aside, .sidebar, .comments, .advertisement');
      if (parent) return;
      
      const text = p.textContent.trim();
      if (text.length > 50) {
        textParts.push(text);
      }
    });
    
    articleText = textParts.join('\n\n');
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

  function normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function findTextInPage(quote) {
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
          if (node.textContent.trim().length === 0) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    let fullText = '';
    const nodeMap = [];
    
    for (const textNode of textNodes) {
      const text = textNode.textContent;
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
    const endNode = nodeMap[endPos].node;
    const endText = endNode.textContent;
    
    let endOffset = nodeMap[endPos].offset + 1;
    while (endOffset < endText.length && /\w/.test(endText[endOffset])) endOffset++;
    
    return {
      startNode: nodeMap[originalMatchStart].node,
      startOffset: nodeMap[originalMatchStart].offset,
      endNode: endNode,
      endOffset: endOffset
    };
  }

  function buildNormalizedMapping(original, normalized) {
    const mapping = [];
    let origIdx = 0;
    let normIdx = 0;
    let lastWasWhitespace = false;
    
    while (origIdx < original.length && normIdx < normalized.length) {
      const origChar = original[origIdx];
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
    
    const lastMapped = mapping.length > 0 ? mapping[mapping.length - 1] : Math.max(0, original.length - 1);
    while (mapping.length < normalized.length) {
      mapping.push(Math.min(lastMapped, original.length - 1));
    }
    
    return mapping;
  }

  function fuzzyFind(haystack, needle) {
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
  
  function highlightWithCSSAPI(matchInfo, issue, index) {
    if (!matchInfo) return false;
    
    try {
      const range = document.createRange();
      range.setStart(matchInfo.startNode, matchInfo.startOffset);
      range.setEnd(matchInfo.endNode, matchInfo.endOffset);
      
      const importance = issue.importance || 'default';
      const highlightName = `logic-checker-${importance}`;
      
      highlightRanges.set(range, {
        issue,
        index,
        importance,
        explanation: issue.gap || issue.why_it_doesnt_follow || issue.explanation || ''
      });
      
      let highlight = CSS.highlights.get(highlightName);
      if (!highlight) {
        highlight = new Highlight();
        CSS.highlights.set(highlightName, highlight);
      }
      
      highlight.add(range);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  function clearCSSHighlights() {
    const names = ['logic-checker-critical', 'logic-checker-significant', 'logic-checker-minor', 'logic-checker-default'];
    names.forEach(name => {
      if (CSS.highlights.has(name)) {
        CSS.highlights.delete(name);
      }
    });
    highlightRanges.clear();
  }
  
  function getHighlightAtPoint(x, y) {
    let caretPos;
    if (document.caretPositionFromPoint) {
      caretPos = document.caretPositionFromPoint(x, y);
      if (!caretPos) return null;
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
      } catch (e) {
        continue;
      }
    }
    
    return null;
  }
  
  let lastHighlightData = null;
  
  function handleMouseMoveForHighlight(e) {
    if (!USE_CSS_HIGHLIGHT_API) return;
    
    const data = getHighlightAtPoint(e.clientX, e.clientY);
    
    if (data) {
      if (data !== lastHighlightData) {
        showTooltipForData(e, data);
        lastHighlightData = data;
      } else {
        const tooltip = ensureTooltip();
        positionTooltip(e, tooltip);
      }
    } else {
      if (lastHighlightData) {
        hideTooltip();
        lastHighlightData = null;
      }
    }
  }
  
  function showTooltipForData(e, data) {
    const tooltip = ensureTooltip();
    const importance = data.importance || 'minor';
    
    tooltip.className = `logic-checker-tooltip ${importance}`;
    
    const emoji = importance === 'critical' ? '🔴' : 
                  importance === 'significant' ? '🟠' : '🟡';

    const typeLabel = data.issue.type || data.issue.importance || 'Issue';
    tooltip.innerHTML = `
      <div class="logic-checker-tooltip-badge">Logic Issue</div>
      <div class="logic-checker-tooltip-header">
        <span class="logic-checker-tooltip-icon">${emoji}</span>
        <span class="logic-checker-tooltip-type">${escapeHtml(typeLabel)}</span>
      </div>
      <div class="logic-checker-tooltip-explanation">${escapeHtml(data.explanation || 'No explanation available')}</div>
    `;

    positionTooltip(e, tooltip);
    tooltip.classList.add('visible');
  }
  
  if (USE_CSS_HIGHLIGHT_API) {
    document.addEventListener('mousemove', handleMouseMoveForHighlight, { passive: true });
  }

  // =====================================================
  // Span-based Highlighting (Fallback)
  // =====================================================
  
  function highlightRangeWithSpan(matchInfo, issue, index) {
    if (!matchInfo) return false;

    try {
      const range = document.createRange();
      range.setStart(matchInfo.startNode, matchInfo.startOffset);
      range.setEnd(matchInfo.endNode, matchInfo.endOffset);

      const highlight = document.createElement('span');
      const importance = issue.importance || 'minor';
      highlight.className = `logic-checker-highlight ${importance}`;
      highlight.dataset.issueIndex = index;
      highlight.dataset.issueType = issue.type || issue.importance || 'issue';
      highlight.dataset.importance = importance;
      highlight.dataset.issueExplanation = issue.gap || issue.why_it_doesnt_follow || issue.explanation || '';

      range.surroundContents(highlight);

      highlight.addEventListener('mouseenter', showTooltip);
      highlight.addEventListener('mouseleave', hideTooltip);
      highlight.addEventListener('mousemove', moveTooltip);

      return true;
    } catch (e) {
      return highlightAlternative(matchInfo, issue, index);
    }
  }

  function highlightAlternative(matchInfo, issue, index) {
    try {
      const range = document.createRange();
      range.setStart(matchInfo.startNode, matchInfo.startOffset);
      range.setEnd(matchInfo.endNode, matchInfo.endOffset);
      
      const fragment = range.cloneContents();
      const textContent = fragment.textContent;
      
      if (textContent.length < 10) {
        return false;
      }

      const startText = matchInfo.startNode.textContent;
      const before = startText.substring(0, matchInfo.startOffset);
      const highlighted = startText.substring(matchInfo.startOffset);
      
      const wrapper = document.createElement('span');
      const importance = issue.importance || 'minor';
      wrapper.className = `logic-checker-highlight ${importance}`;
      wrapper.dataset.issueIndex = index;
      wrapper.dataset.issueType = issue.type || issue.importance || 'issue';
      wrapper.dataset.importance = importance;
      wrapper.dataset.issueExplanation = issue.gap || issue.why_it_doesnt_follow || issue.explanation || '';
      wrapper.textContent = highlighted;
      
      const parent = matchInfo.startNode.parentNode;
      const beforeNode = document.createTextNode(before);
      
      parent.insertBefore(beforeNode, matchInfo.startNode);
      parent.insertBefore(wrapper, matchInfo.startNode);
      parent.removeChild(matchInfo.startNode);

      wrapper.addEventListener('mouseenter', showTooltip);
      wrapper.addEventListener('mouseleave', hideTooltip);
      wrapper.addEventListener('mousemove', moveTooltip);

      return true;
    } catch (e) {
      return false;
    }
  }
  
  function highlightRange(matchInfo, issue, index) {
    if (USE_CSS_HIGHLIGHT_API) {
      return highlightWithCSSAPI(matchInfo, issue, index);
    } else {
      return highlightRangeWithSpan(matchInfo, issue, index);
    }
  }

  // Tooltip functions
  function showTooltip(e) {
    const highlight = e.target.closest('.logic-checker-highlight');
    if (!highlight) return;

    const tooltip = ensureTooltip();
    
    const type = highlight.dataset.issueType;
    const explanation = highlight.dataset.issueExplanation;
    const importance = highlight.dataset.importance || 'minor';
    
    tooltip.className = `logic-checker-tooltip ${importance}`;
    
    const emoji = importance === 'critical' ? '🔴' : 
                  importance === 'significant' ? '🟠' : '🟡';

    tooltip.innerHTML = `
      <div class="logic-checker-tooltip-badge">Logic Issue</div>
      <div class="logic-checker-tooltip-header">
        <span class="logic-checker-tooltip-icon">${emoji}</span>
        <span class="logic-checker-tooltip-type">${escapeHtml(type)}</span>
      </div>
      <div class="logic-checker-tooltip-explanation">${escapeHtml(explanation || 'No explanation available')}</div>
    `;

    positionTooltip(e, tooltip);
    tooltip.classList.add('visible');
  }

  function hideTooltip() {
    const tooltip = ensureTooltip();
    tooltip.classList.remove('visible');
  }

  function moveTooltip(e) {
    const tooltip = ensureTooltip();
    positionTooltip(e, tooltip);
  }

  function positionTooltip(e, tooltipElement) {
    const tooltip = tooltipElement || ensureTooltip();
    const padding = 15;
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let x = e.clientX + padding;
    let y = e.clientY + padding;

    if (x + tooltipRect.width > window.innerWidth - padding) {
      x = e.clientX - tooltipRect.width - padding;
    }
    if (y + tooltipRect.height > window.innerHeight - padding) {
      y = e.clientY - tooltipRect.height - padding;
    }

    tooltip.style.left = `${Math.max(padding, x)}px`;
    tooltip.style.top = `${Math.max(padding, y)}px`;
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function clearHighlights() {
    if (USE_CSS_HIGHLIGHT_API) {
      clearCSSHighlights();
    }
    
    const highlights = document.querySelectorAll('.logic-checker-highlight');
    highlights.forEach(el => {
      const parent = el.parentNode;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
    });
  }

  function highlightIssues(issues) {
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

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    debug.log('Message received', { action: request.action }, 'content-message');
    
    try {
      if (request.action === 'checkArticle') {
        const result = isArticlePage();
        sendResponse(result);
      } else if (request.action === 'extractArticle') {
        const article = extractArticleText();
        const articleCheck = isArticlePage();
        const response = {
          ...article,
          ...articleCheck
        };
        sendResponse(response);
      } else if (request.action === 'highlightIssues') {
        highlightIssues(request.issues);
        sendResponse({ success: true });
      } else if (request.action === 'showAnnotationDialog' || request.action === 'showFeedbackDialog') {
        showFeedbackDialog(request.selectedText || request.quote, request.url, request.title);
        sendResponse({ success: true });
      } else {
        sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      debug.error('Error handling message', error, 'content-message', {
        action: request.action
      });
      sendResponse({ error: error.message });
    }
    
    return true;
  });

  // =====================================================
  // Feedback Dialog
  // =====================================================

  function showFeedbackDialog(selectedText, url, title) {
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

    const textarea = dialog.querySelector('#lc-feedback-text');
    setTimeout(() => textarea.focus(), 100);

    const close = () => overlay.remove();
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    
    dialog.querySelector('.logic-checker-annotation-close').addEventListener('click', close);
    dialog.querySelector('#lc-cancel').addEventListener('click', close);

    dialog.querySelector('#lc-submit').addEventListener('click', async () => {
      const feedbackText = textarea.value.trim();

      if (!feedbackText) {
        textarea.style.borderColor = '#ef4444';
        textarea.focus();
        return;
      }

      const submitBtn = dialog.querySelector('#lc-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      try {
        const response = await chrome.runtime.sendMessage({
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
          dialog.querySelector('.logic-checker-annotation-actions').innerHTML = `
            <div class="logic-checker-annotation-success">
              ✅ Feedback submitted! Thank you.
            </div>
          `;
          setTimeout(close, 1500);
        } else {
          throw new Error(response.error || 'Failed to submit');
        }
      } catch (error) {
        debug.error('Failed to submit feedback', error, 'content-feedback');
        dialog.querySelector('.logic-checker-annotation-actions').innerHTML = `
          <div class="logic-checker-annotation-error">
            ❌ ${escapeHtml(error.message)}
          </div>
          <button class="logic-checker-annotation-btn logic-checker-annotation-btn-secondary" id="lc-retry">
            Try Again
          </button>
        `;
      }
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }
})();
