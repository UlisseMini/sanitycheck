"use strict";
(() => {
  // src/shared/colors.ts
  var colors = {
    // Backgrounds
    bgPrimary: "#0f1117",
    bgSecondary: "#1a1d27",
    bgTertiary: "#242936",
    bgHover: "#2d3344",
    // Text
    textPrimary: "#f0f2f5",
    textSecondary: "#9ca3b0",
    textMuted: "#6b7280",
    // Accent
    accent: "#60a5fa",
    accentHover: "#93c5fd",
    accentSubtle: "rgba(96, 165, 250, 0.12)",
    // Status colors
    error: "#ef4444",
    errorSubtle: "rgba(239, 68, 68, 0.12)",
    success: "#10b981",
    successSubtle: "rgba(16, 185, 129, 0.12)",
    warning: "#f59e0b",
    warningSubtle: "rgba(245, 158, 11, 0.12)",
    // Borders
    border: "rgba(255, 255, 255, 0.08)",
    borderStrong: "rgba(255, 255, 255, 0.12)",
    // Highlight colors (for reasoning gaps)
    highlightCritical: "rgba(239, 68, 68, 0.25)",
    highlightCriticalHover: "rgba(239, 68, 68, 0.4)",
    highlightSignificant: "rgba(234, 179, 8, 0.25)",
    highlightSignificantHover: "rgba(234, 179, 8, 0.4)",
    highlightMinor: "rgba(115, 115, 115, 0.25)",
    highlightMinorHover: "rgba(115, 115, 115, 0.4)",
    highlightDefault: "rgba(96, 165, 250, 0.25)",
    highlightDefaultHover: "rgba(96, 165, 250, 0.4)",
    // Severity border colors
    severityCritical: "#ef4444",
    severitySignificant: "#eab308",
    severityMinor: "#737373",
    severityDefault: "#60a5fa"
  };
  var cssVariables = `
:root {
  --bg-primary: ${colors.bgPrimary};
  --bg-secondary: ${colors.bgSecondary};
  --bg-tertiary: ${colors.bgTertiary};
  --bg-hover: ${colors.bgHover};
  --text-primary: ${colors.textPrimary};
  --text-secondary: ${colors.textSecondary};
  --text-muted: ${colors.textMuted};
  --accent: ${colors.accent};
  --accent-hover: ${colors.accentHover};
  --accent-subtle: ${colors.accentSubtle};
  --error: ${colors.error};
  --error-subtle: ${colors.errorSubtle};
  --success: ${colors.success};
  --success-subtle: ${colors.successSubtle};
  --warning: ${colors.warning};
  --warning-subtle: ${colors.warningSubtle};
  --border: ${colors.border};
  --border-strong: ${colors.borderStrong};
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 14px;
}
`;

  // src/shared/highlight-styles.ts
  var highlightCSS = `
/* ===== CSS Custom Highlight API Styles ===== */
::highlight(logic-checker-critical) {
  background-color: ${colors.highlightCritical};
}

::highlight(logic-checker-significant) {
  background-color: ${colors.highlightSignificant};
}

::highlight(logic-checker-minor) {
  background-color: ${colors.highlightMinor};
}

::highlight(logic-checker-default) {
  background-color: ${colors.highlightDefault};
}

/* ===== Fallback: Span-based Highlight Styles ===== */
.logic-checker-highlight {
  cursor: help;
  position: relative;
  transition: background 0.2s ease;
  border-radius: 2px;
  padding: 1px 2px;
}

.logic-checker-highlight.critical,
.logic-checker-highlight[data-importance="critical"] {
  background: linear-gradient(to bottom, ${colors.highlightCritical} 0%, rgba(239, 68, 68, 0.15) 100%);
}

.logic-checker-highlight.critical:hover,
.logic-checker-highlight[data-importance="critical"]:hover {
  background: ${colors.highlightCriticalHover};
}

.logic-checker-highlight.significant,
.logic-checker-highlight[data-importance="significant"] {
  background: linear-gradient(to bottom, ${colors.highlightSignificant} 0%, rgba(234, 179, 8, 0.15) 100%);
}

.logic-checker-highlight.significant:hover,
.logic-checker-highlight[data-importance="significant"]:hover {
  background: ${colors.highlightSignificantHover};
}

.logic-checker-highlight.minor,
.logic-checker-highlight[data-importance="minor"] {
  background: linear-gradient(to bottom, ${colors.highlightMinor} 0%, rgba(115, 115, 115, 0.15) 100%);
}

.logic-checker-highlight.minor:hover,
.logic-checker-highlight[data-importance="minor"]:hover {
  background: ${colors.highlightMinorHover};
}

.logic-checker-highlight:not(.critical):not(.significant):not(.minor):not([data-importance]) {
  background: linear-gradient(to bottom, ${colors.highlightDefault} 0%, rgba(249, 115, 22, 0.15) 100%);
}

.logic-checker-highlight:not(.critical):not(.significant):not(.minor):not([data-importance]):hover {
  background: ${colors.highlightDefaultHover};
}
`;
  var tooltipCSS = `
.logic-checker-tooltip {
  position: fixed;
  z-index: 2147483647;
  width: max-content;
  max-width: 400px;
  min-width: 280px;
  background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
  border: 1px solid;
  border-radius: 8px;
  padding: 12px 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: #f5f5f5;
  pointer-events: none;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.logic-checker-tooltip.critical {
  border-color: ${colors.severityCritical};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.2);
}

.logic-checker-tooltip.significant {
  border-color: ${colors.severitySignificant};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(234, 179, 8, 0.2);
}

.logic-checker-tooltip.minor {
  border-color: ${colors.severityMinor};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(115, 115, 115, 0.2);
}

.logic-checker-tooltip:not(.critical):not(.significant):not(.minor) {
  border-color: ${colors.severityDefault};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(249, 115, 22, 0.2);
}

.logic-checker-tooltip.visible {
  opacity: 1;
  transform: translateY(0);
}

.logic-checker-tooltip-header {
  margin-bottom: 6px;
}

.logic-checker-tooltip-badge {
  display: inline-block;
  color: #000;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.logic-checker-tooltip.critical .logic-checker-tooltip-badge {
  background: ${colors.severityCritical};
  color: white;
}

.logic-checker-tooltip.significant .logic-checker-tooltip-badge {
  background: ${colors.severitySignificant};
}

.logic-checker-tooltip.minor .logic-checker-tooltip-badge {
  background: ${colors.severityMinor};
  color: white;
}

.logic-checker-tooltip:not(.critical):not(.significant):not(.minor) .logic-checker-tooltip-badge {
  background: ${colors.severityDefault};
}

.logic-checker-tooltip-explanation {
  color: #d4d4d4;
}
`;
  var contentStyles = highlightCSS + "\n" + tooltipCSS;
  var demoHighlightCSS = `
.demo-highlight {
  cursor: help;
  position: relative;
  background: linear-gradient(to bottom, ${colors.highlightSignificant} 0%, rgba(234, 179, 8, 0.15) 100%);
  border-radius: 2px;
  padding: 1px 2px;
  transition: background 0.2s ease;
}

.demo-highlight:hover {
  background: ${colors.highlightSignificantHover};
}

.demo-highlight.critical {
  background: linear-gradient(to bottom, ${colors.highlightCritical} 0%, rgba(239, 68, 68, 0.15) 100%);
}

.demo-highlight.critical:hover {
  background: ${colors.highlightCriticalHover};
}

.demo-highlight.minor {
  background: linear-gradient(to bottom, ${colors.highlightMinor} 0%, rgba(115, 115, 115, 0.15) 100%);
}

.demo-highlight.minor:hover {
  background: ${colors.highlightMinorHover};
}

.demo-tooltip {
  position: absolute;
  z-index: 1000;
  width: max-content;
  max-width: 400px;
  min-width: 280px;
  background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
  border: 1px solid ${colors.severitySignificant};
  border-radius: 8px;
  padding: 12px 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(234, 179, 8, 0.2);
  font-size: 13px;
  line-height: 1.5;
  color: #f5f5f5;
  pointer-events: none;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  left: 0;
  top: 100%;
  margin-top: 8px;
}

.demo-highlight:hover .demo-tooltip {
  opacity: 1;
  transform: translateY(0);
}

.demo-tooltip-header {
  margin-bottom: 6px;
}

.demo-tooltip-badge {
  display: inline-block;
  background: ${colors.severitySignificant};
  color: #000;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.demo-tooltip-explanation {
  color: #d4d4d4;
}
`;

  // src/shared/constants.ts
  var BACKEND_URL = "https://sanitycheck-production.up.railway.app";
  var DEFAULT_ANALYSIS_PROMPT = `You help readers notice genuine reasoning problems in articles\u2014things they'd agree are valid weaknesses, even if they agree with the conclusions.

## Your Goal

Surface issues where you're confident it's a real structural flaw AND it matters to the core argument. The cost of a bad objection (annoying the reader, undermining trust) exceeds the cost of missing something. So:

- Only flag things that made you genuinely think "wait, that doesn't follow"
- Try to steelman first\u2014if there's a reasonable interpretation, don't flag
- Ask: would someone who agrees with the article still nod and say "yeah, that's fair"?

Good flags: evidence-conclusion mismatches, load-bearing unstated assumptions, logical leaps that don't follow even charitably.

Bad flags: factual disputes (you might be wrong), nitpicks on tangential points, things that only look wrong if you disagree with the content.

## Output Format

Return JSON:

{
  "central_argument_analysis": {
    "main_conclusion": "1 sentence: what the author claims",
    "central_logical_gap": "1-2 sentences: the main structural weakness, if any. Be clear and direct."
  },
  "issues": [
    {
      "importance": "critical|significant|minor",
      "quote": "Exact quote from text, 20-60 words",
      "gap": "Brief explanation (<15 words ideal). Reader should immediately think 'oh yeah, that's a leap.'"
    }
  ],
  "severity": "none|minor|moderate|significant"
}

## Rules

- Keep "gap" explanations brief and immediately recognizable. E.g., "Constraints \u2260 impossibility" or "One example doesn't prove a universal"
- Quote exactly from the text
- 1-4 issues typical. Zero is fine if nothing clears the bar.
- Quality over quantity\u2014only flag what you're confident about

ARTICLE:
`;

  // src/extension/background.ts
  var ongoingAnalyses = /* @__PURE__ */ new Map();
  chrome.runtime.onInstalled.addListener((details) => {
    chrome.contextMenus.create({
      id: "leave-feedback",
      title: "Leave feedback on this text",
      contexts: ["selection"]
    });
    console.log("SanityCheck: Context menu created");
    if (details.reason === "install") {
      chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
    }
  });
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "leave-feedback" && info.selectionText && tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: "showFeedbackDialog",
        selectedText: info.selectionText,
        url: tab.url,
        title: tab.title
      });
    }
  });
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "submitFeedback") {
      submitFeedback(request.data).then((result) => sendResponse({ success: true, ...result })).catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "getBackendUrl") {
      chrome.storage.local.get(["backendUrl"], (result) => {
        sendResponse({ url: result.backendUrl || BACKEND_URL });
      });
      return true;
    }
    if (request.action === "startAnalysis") {
      const { tabId, article } = request;
      startAnalysis(tabId, article).then(() => sendResponse({ success: true })).catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "getAnalysisStatus") {
      const { url } = request;
      const status = ongoingAnalyses.get(url);
      sendResponse(status || { status: "none" });
      return true;
    }
    if (request.action === "clearAnalysis") {
      const { url } = request;
      ongoingAnalyses.delete(url);
      sendResponse({ success: true });
      return true;
    }
    return false;
  });
  async function submitFeedback(data) {
    const response = await fetch(`${BACKEND_URL}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: data.url,
        title: data.title,
        selectedText: data.selectedText,
        comment: data.feedback
      })
    });
    if (!response.ok) {
      throw new Error(`Failed to submit feedback: ${response.status}`);
    }
    return response.json();
  }
  async function startAnalysis(tabId, article) {
    const url = article.url;
    ongoingAnalyses.set(url, { status: "analyzing" });
    try {
      const stored = await chrome.storage.local.get(["customPrompt"]);
      const currentPrompt = stored.customPrompt || DEFAULT_ANALYSIS_PROMPT;
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentPrompt + article.text,
          maxTokens: 8192,
          temperature: 0.3
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      let result;
      try {
        let jsonText = data.text;
        const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
        }
        result = JSON.parse(jsonText);
      } catch (_e) {
        throw new Error("Failed to parse API response as JSON");
      }
      ongoingAnalyses.set(url, { status: "complete", result });
      try {
        await chrome.tabs.sendMessage(tabId, {
          action: "displayHighlights",
          result
        });
      } catch (_e) {
        console.log("Could not send highlights to tab (tab may have been closed)");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      ongoingAnalyses.set(url, { status: "error", error: errorMessage });
      console.error("Analysis error:", error);
    }
  }
})();
