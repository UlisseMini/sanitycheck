// Content script for extracting article text and highlighting issues

(function() {
  // Avoid re-injecting
  if (window.__logicCheckerInjected) return;
  window.__logicCheckerInjected = true;

  // Simple inline debug logger for content script
  const DEBUG_SERVER_URL = 'http://localhost:3000/debug/log';
  const DEBUG_ENABLED = true;
  
  const debug = {
    log: (message, data = {}, source = 'content') => {
      if (!DEBUG_ENABLED) return;
      fetch(DEBUG_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'info',
          message,
          data: { ...data, url: window.location.href },
          source,
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

  debug.log('Content script initialized', {
    url: window.location.href,
    title: document.title
  }, 'content-init');

  // Inject styles for highlighting
  const styleId = 'logic-checker-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .logic-checker-highlight {
        cursor: help;
        position: relative;
        transition: background 0.2s ease, border-color 0.2s ease;
        border-radius: 2px;
        padding: 1px 0;
        border-bottom: 2px wavy;
      }
      
      /* Critical issues - Red */
      .logic-checker-highlight.critical,
      .logic-checker-highlight[data-importance="critical"] {
        background: linear-gradient(to bottom, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.15) 100%);
        border-bottom-color: #ef4444;
      }
      
      .logic-checker-highlight.critical:hover,
      .logic-checker-highlight[data-importance="critical"]:hover {
        background: rgba(239, 68, 68, 0.35);
      }
      
      /* Significant issues - Yellow/Warning */
      .logic-checker-highlight.significant,
      .logic-checker-highlight[data-importance="significant"] {
        background: linear-gradient(to bottom, rgba(234, 179, 8, 0.25) 0%, rgba(234, 179, 8, 0.15) 100%);
        border-bottom-color: #eab308;
      }
      
      .logic-checker-highlight.significant:hover,
      .logic-checker-highlight[data-importance="significant"]:hover {
        background: rgba(234, 179, 8, 0.35);
      }
      
      /* Minor issues - Gray/Muted */
      .logic-checker-highlight.minor,
      .logic-checker-highlight[data-importance="minor"] {
        background: linear-gradient(to bottom, rgba(115, 115, 115, 0.25) 0%, rgba(115, 115, 115, 0.15) 100%);
        border-bottom-color: #737373;
      }
      
      .logic-checker-highlight.minor:hover,
      .logic-checker-highlight[data-importance="minor"]:hover {
        background: rgba(115, 115, 115, 0.35);
      }
      
      /* Default (fallback) - Orange */
      .logic-checker-highlight:not(.critical):not(.significant):not(.minor):not([data-importance]) {
        background: linear-gradient(to bottom, rgba(249, 115, 22, 0.25) 0%, rgba(249, 115, 22, 0.15) 100%);
        border-bottom-color: #f97316;
      }
      
      .logic-checker-highlight:not(.critical):not(.significant):not(.minor):not([data-importance]):hover {
        background: rgba(249, 115, 22, 0.35);
      }
      
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
      
      /* Critical tooltip - Red */
      .logic-checker-tooltip.critical {
        border-color: #ef4444;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.2);
      }
      
      /* Significant tooltip - Yellow */
      .logic-checker-tooltip.significant {
        border-color: #eab308;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(234, 179, 8, 0.2);
      }
      
      /* Minor tooltip - Gray */
      .logic-checker-tooltip.minor {
        border-color: #737373;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(115, 115, 115, 0.2);
      }
      
      /* Default tooltip - Orange */
      .logic-checker-tooltip:not(.critical):not(.significant):not(.minor) {
        border-color: #f97316;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(249, 115, 22, 0.2);
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
      
      /* Type color based on tooltip class */
      .logic-checker-tooltip.critical .logic-checker-tooltip-type {
        color: #ef4444;
      }
      
      .logic-checker-tooltip.significant .logic-checker-tooltip-type {
        color: #eab308;
      }
      
      .logic-checker-tooltip.minor .logic-checker-tooltip-type {
        color: #737373;
      }
      
      .logic-checker-tooltip:not(.critical):not(.significant):not(.minor) .logic-checker-tooltip-type {
        color: #f97316;
      }
      
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
      
      /* Badge color based on tooltip class */
      .logic-checker-tooltip.critical .logic-checker-tooltip-badge {
        background: #ef4444;
      }
      
      .logic-checker-tooltip.significant .logic-checker-tooltip-badge {
        background: #eab308;
      }
      
      .logic-checker-tooltip.minor .logic-checker-tooltip-badge {
        background: #737373;
      }
      
      .logic-checker-tooltip:not(.critical):not(.significant):not(.minor) .logic-checker-tooltip-badge {
        background: #f97316;
      }
    `;
    document.head.appendChild(style);
    debug.log('Styles injected', {}, 'content-init');
  }

  // Get or create tooltip element
  function ensureTooltip() {
    let tooltip = document.getElementById('logic-checker-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'logic-checker-tooltip';
      tooltip.className = 'logic-checker-tooltip';
      document.body.appendChild(tooltip);
      debug.log('Tooltip element created', {}, 'content-init');
    }
    return tooltip;
  }
  
  // Initialize tooltip on load
  let tooltip = ensureTooltip();

  // Heuristics for detecting if a page is an article
  function isArticlePage() {
    debug.debug('Checking if page is an article', {}, 'content-article-check');
    
    const articleElement = document.querySelector('article');
    const hasArticleTag = !!articleElement;
    
    const articleClasses = ['article', 'post', 'entry', 'story', 'blog-post', 'article-content', 'post-content'];
    const hasArticleClass = articleClasses.some(cls => 
      document.querySelector(`.${cls}`) || document.querySelector(`[class*="${cls}"]`)
    );
    
    const hasArticleSchema = !!document.querySelector('[itemtype*="Article"]') || 
                             !!document.querySelector('[itemtype*="BlogPosting"]') ||
                             !!document.querySelector('[itemtype*="NewsArticle"]');
    
    const ogType = document.querySelector('meta[property="og:type"]');
    const hasArticleMeta = ogType && ogType.content === 'article';
    
    const paragraphs = document.querySelectorAll('p');
    const substantialParagraphs = Array.from(paragraphs).filter(p => p.textContent.trim().length > 100);
    const hasSubstantialContent = substantialParagraphs.length >= 3;
    
    const hasHeadline = !!document.querySelector('h1');
    const hasByline = !!document.querySelector('[class*="author"]') || 
                      !!document.querySelector('[class*="byline"]') ||
                      !!document.querySelector('[rel="author"]');
    
    let score = 0;
    if (hasArticleTag) score += 3;
    if (hasArticleClass) score += 2;
    if (hasArticleSchema) score += 3;
    if (hasArticleMeta) score += 2;
    if (hasSubstantialContent) score += 2;
    if (hasHeadline) score += 1;
    if (hasByline) score += 1;
    
    const result = {
      isArticle: score >= 4,
      confidence: score,
      indicators: {
        hasArticleTag,
        hasArticleClass,
        hasArticleSchema,
        hasArticleMeta,
        hasSubstantialContent,
        hasHeadline,
        hasByline
      }
    };
    
    debug.log('Article check complete', {
      isArticle: result.isArticle,
      confidence: result.confidence,
      indicators: result.indicators
    }, 'content-article-check');
    
    return result;
  }

  // Extract the main article text
  function extractArticleText() {
    debug.log('Extracting article text', {}, 'content-extract');
    
    let articleText = '';
    let title = '';
    
    const h1 = document.querySelector('h1');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    title = h1?.textContent?.trim() || ogTitle?.content || document.title;
    
    debug.debug('Title extracted', { title }, 'content-extract');
    
    const articleEl = document.querySelector('article');
    if (articleEl) {
      articleText = extractTextFromElement(articleEl);
      debug.debug('Extracted from article tag', { textLength: articleText.length }, 'content-extract');
    }
    
    if (!articleText || articleText.length < 500) {
      const contentSelectors = [
        '.article-content',
        '.post-content', 
        '.entry-content',
        '.story-body',
        '.article-body',
        '[itemprop="articleBody"]',
        '.content-body',
        'main article',
        'main',
        '.post',
        '.article'
      ];
      
      for (const selector of contentSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = extractTextFromElement(el);
          if (text.length > articleText.length) {
            articleText = text;
            debug.debug(`Found better match with selector: ${selector}`, { textLength: text.length }, 'content-extract');
          }
        }
      }
    }
    
    if (!articleText || articleText.length < 500) {
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
      
      if (textParts.length > 0) {
        articleText = textParts.join('\n\n');
        debug.debug('Extracted from paragraphs', { paragraphCount: textParts.length, textLength: articleText.length }, 'content-extract');
      }
    }
    
    const wordCount = articleText.split(/\s+/).filter(w => w.length > 0).length;
    
    debug.log('Article extraction complete', {
      title,
      textLength: articleText.length,
      wordCount,
      url: window.location.href
    }, 'content-extract');
    
    return {
      title,
      text: articleText,
      wordCount,
      url: window.location.href
    };
  }

  function extractTextFromElement(element) {
    try {
      const clone = element.cloneNode(true);
      
      const unwantedSelectors = [
        'script', 'style', 'nav', 'aside', 'footer', 'header',
        '.advertisement', '.ads', '.social-share', '.comments',
        '.related-articles', '.sidebar', '.navigation', 'figure',
        '.share-buttons', '.author-bio', 'noscript', 'iframe'
      ];
      
      unwantedSelectors.forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
      });
      
      let text = clone.textContent || '';
      
      text = text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
      
      const paragraphs = clone.querySelectorAll('p');
      if (paragraphs.length > 0) {
        text = Array.from(paragraphs)
          .map(p => p.textContent.trim())
          .filter(t => t.length > 0)
          .join('\n\n');
      }
      
      return text;
    } catch (error) {
      debug.error('Error extracting text from element', error, 'content-extract-element');
      return '';
    }
  }

  // =====================================================
  // TEXT MATCHING AND HIGHLIGHTING
  // =====================================================

  // Normalize text for fuzzy matching
  function normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'") // Smart quotes
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-') // Dashes
      .replace(/\u2026/g, '...') // Ellipsis
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Find the best match for a quote in the page text
  function findTextInPage(quote) {
    if (!quote || quote.length < 10) {
      debug.warn('Invalid quote provided', { quoteLength: quote?.length || 0 }, 'content-find-text');
      return null;
    }
    
    debug.debug('Finding text in page', { quoteLength: quote.length, quotePreview: quote.substring(0, 50) }, 'content-find-text');
    
    const normalizedQuote = normalizeText(quote);
    
    // Get all text nodes in the document
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

    // Collect all text nodes with their positions
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    debug.debug('Text nodes collected', { nodeCount: textNodes.length }, 'content-find-text');

    // Build a concatenated text and map positions back to nodes
    let fullText = '';
    const nodeMap = []; // Maps character positions to {node, offset}
    
    for (const textNode of textNodes) {
      const text = textNode.textContent;
      for (let i = 0; i < text.length; i++) {
        nodeMap.push({ node: textNode, offset: i });
      }
      fullText += text;
    }

    debug.debug('Full text built', {
      fullTextLength: fullText.length,
      nodeMapLength: nodeMap.length
    }, 'content-find-text');

    // Build normalized text with position mapping
    const normalizedFullText = normalizeText(fullText);
    const normalizedToOriginalMap = buildNormalizedMapping(fullText, normalizedFullText);
    
    debug.debug('Normalized text built', {
      normalizedLength: normalizedFullText.length,
      originalLength: fullText.length,
      mappingLength: normalizedToOriginalMap.length
    }, 'content-find-text');
    
    // Try exact match first
    let matchIndex = normalizedFullText.indexOf(normalizedQuote);
    
    debug.debug('Exact match attempt', { 
      found: matchIndex !== -1, 
      matchIndex,
      normalizedQuoteLength: normalizedQuote.length
    }, 'content-find-text');
    
    // If no exact match, try fuzzy matching with increasing tolerance
    if (matchIndex === -1) {
      matchIndex = fuzzyFind(normalizedFullText, normalizedQuote);
      debug.debug('Fuzzy match attempt', { found: matchIndex !== -1, matchIndex }, 'content-find-text');
    }
    
    if (matchIndex === -1) {
      debug.warn('Could not find quote in page', {
        quotePreview: quote.substring(0, 100),
        normalizedQuotePreview: normalizedQuote.substring(0, 100),
        pageTextLength: normalizedFullText.length
      }, 'content-find-text');
      return null;
    }

    // Map the match back to original text positions using the mapping array
    const matchEndIndex = matchIndex + normalizedQuote.length;
    
    debug.debug('Mapping positions', {
      matchIndex,
      matchEndIndex,
      normalizedQuoteLength: normalizedQuote.length,
      mappingArrayLength: normalizedToOriginalMap.length
    }, 'content-find-text');
    
    if (matchIndex >= normalizedToOriginalMap.length || matchEndIndex > normalizedToOriginalMap.length) {
      debug.warn('Match indices out of bounds for mapping', {
        matchIndex,
        matchEndIndex,
        mappingLength: normalizedToOriginalMap.length
      }, 'content-find-text');
      return null;
    }
    
    const originalMatchStart = normalizedToOriginalMap[matchIndex];
    const originalMatchEnd = normalizedToOriginalMap[Math.min(matchEndIndex, normalizedToOriginalMap.length - 1)];

    debug.debug('Mapped positions', {
      originalMatchStart,
      originalMatchEnd,
      nodeMapLength: nodeMap.length
    }, 'content-find-text');

    if (originalMatchStart === undefined || originalMatchEnd === undefined) {
      debug.warn('Failed to map match positions', {
        matchIndex,
        originalMatchStart,
        originalMatchEnd
      }, 'content-find-text');
      return null;
    }
    
    if (originalMatchStart >= nodeMap.length || originalMatchEnd >= nodeMap.length) {
      debug.warn('Match positions out of bounds', {
        originalMatchStart,
        originalMatchEnd,
        nodeMapLength: nodeMap.length
      }, 'content-find-text');
      return null;
    }

    const matchInfo = {
      startNode: nodeMap[originalMatchStart].node,
      startOffset: nodeMap[originalMatchStart].offset,
      endNode: nodeMap[Math.min(originalMatchEnd - 1, nodeMap.length - 1)].node,
      endOffset: nodeMap[Math.min(originalMatchEnd - 1, nodeMap.length - 1)].offset + 1
    };
    
    debug.log('Text match found', {
      quotePreview: quote.substring(0, 50),
      matchStart: originalMatchStart,
      matchEnd: originalMatchEnd
    }, 'content-find-text');

    return matchInfo;
  }

  // Build a mapping array: normalizedPos -> originalPos
  // This replicates the exact normalization process to create accurate mapping
  function buildNormalizedMapping(original, normalized) {
    const mapping = [];
    let origIdx = 0;
    let normIdx = 0;
    let lastWasWhitespace = false;
    
    // Process original text character by character, matching normalized output
    while (origIdx < original.length && normIdx < normalized.length) {
      const origChar = original[origIdx];
      
      // Check if this is whitespace (any whitespace character)
      const isWhitespace = /\s/.test(origChar);
      
      if (isWhitespace) {
        // normalizeText() collapses all whitespace sequences to single space
        // Only map the first whitespace in a sequence
        if (!lastWasWhitespace && normalized[normIdx] === ' ') {
          mapping[normIdx] = origIdx;
          normIdx++;
        }
        lastWasWhitespace = true;
        origIdx++;
      } else {
        lastWasWhitespace = false;
        
        // Normalize character exactly as normalizeText() does
        let normChar = origChar.toLowerCase();
        
        // Character replacements (done before whitespace normalization)
        if (normChar === '\u2018' || normChar === '\u2019') {
          normChar = "'";
        } else if (normChar === '\u201C' || normChar === '\u201D') {
          normChar = '"';
        } else if (normChar === '\u2013' || normChar === '\u2014') {
          normChar = '-';
        } else if (normChar === '\u2026') {
          // Ellipsis becomes three dots
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
            // Shouldn't happen if normalization is consistent
            origIdx++;
            continue;
          }
        }
        
        // Map this character if it matches normalized text
        if (normIdx < normalized.length && normChar === normalized[normIdx]) {
          mapping[normIdx] = origIdx;
          normIdx++;
          origIdx++;
        } else {
          // Character doesn't match - might be trimmed whitespace at start/end
          // or some other edge case. Skip it.
          origIdx++;
        }
      }
    }
    
    // Handle case where normalized text has remaining characters
    // (shouldn't happen if normalization is consistent, but be safe)
    const lastMapped = mapping.length > 0 ? mapping[mapping.length - 1] : Math.max(0, original.length - 1);
    while (mapping.length < normalized.length) {
      mapping.push(Math.min(lastMapped, original.length - 1));
    }
    
    debug.debug('Built normalized mapping', {
      originalLength: original.length,
      normalizedLength: normalized.length,
      mappingLength: mapping.length,
      sampleMappings: mapping.slice(0, 10).map((val, idx) => ({ norm: idx, orig: val }))
    }, 'content-find-text');
    
    return mapping;
  }

  // Fuzzy find - looks for best substring match
  function fuzzyFind(haystack, needle) {
    if (needle.length > haystack.length) return -1;
    
    // Try progressively shorter prefixes of the needle
    for (let len = needle.length; len >= Math.min(30, needle.length * 0.5); len--) {
      const prefix = needle.substring(0, len);
      const idx = haystack.indexOf(prefix);
      if (idx !== -1) {
        return idx;
      }
    }
    
    // Try finding key phrases from the needle
    const words = needle.split(' ').filter(w => w.length > 3);
    if (words.length >= 3) {
      // Look for sequences of 3+ consecutive words
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

  // Highlight a range of text
  function highlightRange(matchInfo, issue, index) {
    if (!matchInfo) return false;

    try {
      debug.debug('Highlighting range', {
        issueIndex: index,
        issueType: issue.type,
        quotePreview: issue.quote?.substring(0, 50)
      }, 'content-highlight');
      
      const range = document.createRange();
      range.setStart(matchInfo.startNode, matchInfo.startOffset);
      range.setEnd(matchInfo.endNode, matchInfo.endOffset);

      // Create highlight wrapper
      const highlight = document.createElement('span');
      const importance = issue.importance || 'minor';
      highlight.className = `logic-checker-highlight ${importance}`;
      highlight.dataset.issueIndex = index;
      highlight.dataset.issueType = issue.type;
      highlight.dataset.importance = importance;
      // Handle all formats: new (gap), medium (why_it_doesnt_follow), old (explanation)
      highlight.dataset.issueExplanation = issue.gap || issue.why_it_doesnt_follow || issue.explanation || '';

      // Wrap the range
      range.surroundContents(highlight);

      // Add hover events
      highlight.addEventListener('mouseenter', showTooltip);
      highlight.addEventListener('mouseleave', hideTooltip);
      highlight.addEventListener('mousemove', moveTooltip);

      debug.log('Range highlighted successfully', { issueIndex: index }, 'content-highlight');
      return true;
    } catch (e) {
      debug.warn('Could not highlight range (trying alternative)', e, 'content-highlight', {
        issueIndex: index,
        errorMessage: e.message
      });
      
      // Try alternative: highlight individual text nodes
      return highlightAlternative(matchInfo, issue, index);
    }
  }

  // Alternative highlighting for complex ranges
  function highlightAlternative(matchInfo, issue, index) {
    try {
      debug.debug('Trying alternative highlighting', { issueIndex: index }, 'content-highlight-alt');
      
      const range = document.createRange();
      range.setStart(matchInfo.startNode, matchInfo.startOffset);
      range.setEnd(matchInfo.endNode, matchInfo.endOffset);
      
      // Get all text nodes in range
      const fragment = range.cloneContents();
      const textContent = fragment.textContent;
      
      if (textContent.length < 10) {
        debug.warn('Alternative highlight failed: text too short', { textLength: textContent.length }, 'content-highlight-alt');
        return false;
      }

      // Just highlight the start node as a fallback
      const startText = matchInfo.startNode.textContent;
      const before = startText.substring(0, matchInfo.startOffset);
      const highlighted = startText.substring(matchInfo.startOffset);
      
      const wrapper = document.createElement('span');
      const importance = issue.importance || 'minor';
      wrapper.className = `logic-checker-highlight ${importance}`;
      wrapper.dataset.issueIndex = index;
      wrapper.dataset.issueType = issue.type;
      wrapper.dataset.importance = importance;
      // Handle all formats: new (gap), medium (why_it_doesnt_follow), old (explanation)
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

      debug.log('Alternative highlighting successful', { issueIndex: index }, 'content-highlight-alt');
      return true;
    } catch (e) {
      debug.error('Alternative highlighting failed', e, 'content-highlight-alt', {
        issueIndex: index
      });
      return false;
    }
  }

  // Tooltip functions
  function showTooltip(e) {
    const highlight = e.target.closest('.logic-checker-highlight');
    if (!highlight) return;

    // Ensure tooltip exists (in case it was removed)
    const tooltip = ensureTooltip();
    
    const type = highlight.dataset.issueType;
    const explanation = highlight.dataset.issueExplanation;
    const importance = highlight.dataset.importance || 'minor';
    
    // Set tooltip class based on importance
    tooltip.className = `logic-checker-tooltip ${importance}`;
    
    // Choose emoji based on importance
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

    // Keep tooltip in viewport
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

  // Clear previous highlights
  function clearHighlights() {
    const highlights = document.querySelectorAll('.logic-checker-highlight');
    debug.log('Clearing highlights', { count: highlights.length }, 'content-highlight');
    
    highlights.forEach(el => {
      const parent = el.parentNode;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
    });
  }

  // Main highlight function
  function highlightIssues(issues) {
    debug.log('Starting highlight process', { issueCount: issues.length }, 'content-highlight');
    
    // Ensure tooltip exists before creating highlights
    ensureTooltip();
    
    clearHighlights();
    
    let successCount = 0;
    const startTime = Date.now();
    
    issues.forEach((issue, index) => {
      if (!issue.quote) {
        debug.warn('Issue missing quote', { issueIndex: index, issueType: issue.type }, 'content-highlight');
        return;
      }
      
      const matchInfo = findTextInPage(issue.quote);
      if (matchInfo) {
        const success = highlightRange(matchInfo, issue, index);
        if (success) successCount++;
      } else {
        debug.warn('Could not find match for quote', {
          issueIndex: index,
          issueType: issue.type,
          quotePreview: issue.quote.substring(0, 50)
        }, 'content-highlight');
      }
    });

    debug.log('Highlight process complete', {
      successCount,
      totalIssues: issues.length,
      duration: Date.now() - startTime
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
        debug.log('Sending article extraction response', {
          isArticle: response.isArticle,
          wordCount: response.wordCount
        }, 'content-message');
        sendResponse(response);
      } else if (request.action === 'highlightIssues') {
        debug.log('Highlighting issues', { issueCount: request.issues?.length || 0 }, 'content-message');
        highlightIssues(request.issues);
        sendResponse({ success: true });
      } else {
        debug.warn('Unknown action', { action: request.action }, 'content-message');
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
})();
