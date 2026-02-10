# Analysis Persistence Solutions

## Problem
Currently, when a user clicks away from the extension popup (even while staying on the same page), the analysis results disappear. This creates a poor user experience as users can't reference the analysis while reading the article.

## Proposed Solutions

### Option 1: Side Panel (Recommended) ✨
**Description:** Use Chrome's Side Panel API to display analysis in a persistent sidebar that stays open alongside the webpage.

**Pros:**
- Native Chrome feature (built-in persistence)
- Stays visible while user browses the article
- Can show analysis history for current tab
- Good screen real estate management
- Professional UX (similar to Chrome DevTools)

**Cons:**
- Requires Chrome 114+ (most users have this)
- Need to update manifest to v3 side panel permissions

**Implementation:**
```javascript
// manifest.json
{
  "side_panel": {
    "default_path": "side-panel.html"
  },
  "permissions": ["sidePanel"]
}

// Open side panel from popup
chrome.sidePanel.open({ windowId: currentWindow.id });
```

---

### Option 2: Content Script Overlay (Inline Widget)
**Description:** Inject a collapsible/expandable panel directly into the webpage that persists as the user scrolls and navigates.

**Pros:**
- Highly visible and accessible
- No need to switch contexts
- Can overlay or dock to side of page
- Works on any Chromium browser

**Cons:**
- Can interfere with page layout
- May conflict with website styles
- Requires careful z-index management
- More complex CSS handling

**Implementation:**
- Create a fixed-position div injected via content script
- Store state in chrome.storage.local
- Listen for page navigation to restore state

---

### Option 3: Analysis History Page (New Tab)
**Description:** Open a dedicated history page showing all analyses with:
- Article title + URL
- Timestamp
- Full analysis results
- Ability to search/filter past analyses

**Pros:**
- Simple to implement
- Full screen real estate
- Can build rich features (search, export, sharing)
- Clear separation from reading experience

**Cons:**
- Requires switching tabs to reference
- Breaks reading flow
- Less immediate access to analysis

**Implementation:**
```javascript
// Store analysis in chrome.storage
chrome.storage.local.set({
  [`analysis_${articleUrl}_${timestamp}`]: {
    url: articleUrl,
    title: articleTitle,
    timestamp: Date.now(),
    analysis: results
  }
});

// Open history page
chrome.tabs.create({ url: 'history.html' });
```

---

### Option 4: Hybrid Approach (Best UX) 🌟
**Description:** Combine multiple approaches:
1. **Immediate:** Show analysis in side panel for current session
2. **Persistent:** Save to history for later review
3. **Quick Access:** Small floating button on page to re-open analysis

**Features:**
- Side panel shows current analysis
- Auto-saves to history page
- Floating "View Analysis" button in corner of page
- Badge on extension icon showing # of analyses on current page
- Export analysis as PDF/markdown

**Pros:**
- Best of all worlds
- Flexible for different use cases
- Professional user experience
- Future-proof for additional features

**Cons:**
- More complex implementation
- Larger codebase to maintain

---

## Recommended Implementation Plan

### Phase 1: Side Panel (Quick Win)
1. Add side panel support to manifest
2. Move popup UI to side panel
3. Keep analysis visible while user reads
4. Add "Open in Side Panel" button to popup

### Phase 2: History Tracking
1. Save analyses to chrome.storage with metadata
2. Create history.html page
3. Add search/filter functionality
4. Show last N analyses in side panel

### Phase 3: Enhanced UX
1. Add floating button on content page
2. Implement export features (PDF, Markdown)
3. Add sharing capabilities
4. Sync history across devices (chrome.storage.sync)

## Technical Considerations

### Storage
- Use `chrome.storage.local` for analysis history (unlimited storage)
- Implement cleanup for old analyses (30-day retention?)
- Consider compression for large analyses

### State Management
- Store current tab's analysis state separately
- Track "active analysis" per tab
- Persist across page refreshes

### Performance
- Lazy load history items
- Implement pagination for large histories
- Cache analysis results

## Next Steps
1. Gather user feedback on preferences
2. Implement Phase 1 (Side Panel)
3. Test with beta users
4. Iterate based on usage patterns
