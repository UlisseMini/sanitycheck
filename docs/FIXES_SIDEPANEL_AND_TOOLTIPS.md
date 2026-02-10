# Fixes: Side Panel Button & Tooltip Categories

## Issues Fixed

### 1. ✅ Side Panel Button Not Visible
**Problem:** The "Open in Side Panel" button wasn't showing after analysis completed.

**Root Cause:** The button was placed inside `actionSection` which gets hidden when results are displayed.

**Solution:**
- Created a separate `sidepanel-section` container
- Moved the button outside of `actionSection`
- Now properly shows/hides independently from other sections

**Files Changed:**
- `src/extension/static/popup.html` - Separated sidepanel button into its own section
- `src/extension/popup.ts` - Updated DOM element references and visibility logic

---

### 2. ✅ Tooltip Not Showing Issue Category/Type
**Problem:** Hover tooltips only showed "Logic Issue" and severity (critical/significant), but not the actual category/type of issue (e.g., "Central Logical Gap", "Questionable Premise").

**Root Cause:** 
1. API returns `category` field but content script was only checking for `type`
2. Tooltip badge was hardcoded to "Logic Issue" instead of showing the actual category
3. The header was showing the wrong value (type instead of severity)

**Solution:**
- Added `category` and `severity` fields to `AnalysisIssue` interface
- Updated content script to check for `category` first, then fall back to `type`
- Changed tooltip display:
  - **Badge** (top): Now shows the category/type (e.g., "Central Logical Gap")
  - **Header** (with emoji): Now shows the severity (e.g., "critical", "significant")
  - **Body**: Explanation text (unchanged)

**Files Changed:**
- `src/extension/messaging.ts` - Added `category` and `severity` to AnalysisIssue interface
- `src/extension/content.ts` - Updated tooltip rendering logic (3 locations)

---

## New Tooltip Display Format

### Before:
```
┌─────────────────────┐
│ Logic Issue         │ ← Always the same
│ 🔴 critical         │ ← Only severity
│ [explanation]       │
└─────────────────────┘
```

### After:
```
┌──────────────────────────────┐
│ Central Logical Gap          │ ← Actual issue category
│ 🔴 critical                  │ ← Severity level
│ [detailed explanation]       │
└──────────────────────────────┘
```

## Testing

### To Test Side Panel Button:
1. Reload extension
2. Analyze any article
3. **You should now see:** "Open in Side Panel" button below the results
4. Click it to open the persistent side panel

### To Test Tooltip Categories:
1. Reload extension
2. Analyze an article with issues
3. Hover over highlighted text
4. **You should now see:** 
   - Badge shows the issue type (e.g., "Central Logical Gap")
   - Header shows the severity (e.g., "critical")
   - Body shows the explanation

## API Response Format Expected

The API should return issues with these fields:
```json
{
  "issues": [
    {
      "quote": "...",
      "category": "Central Logical Gap",
      "severity": "critical",
      "explanation": "..."
    }
  ]
}
```

If the API uses `type` instead of `category`, or `importance` instead of `severity`, the code will still work as it falls back to those fields.

## Fallback Chain

**For Category Display:**
1. `issue.category` (preferred)
2. `issue.type` (fallback)
3. `issue.importance` (fallback)
4. `'Issue'` (default)

**For Severity Display:**
1. `issue.severity` (preferred)
2. `issue.importance` (fallback)
3. Derived from internal importance calculation (default)
