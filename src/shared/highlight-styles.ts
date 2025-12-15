/**
 * Shared highlight and tooltip styles
 * Used by extension content script and homepage demos
 */

import { colors } from './colors';

/**
 * CSS for inline highlights (for content scripts injecting into pages)
 */
export const highlightCSS = `
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

/**
 * CSS for tooltips
 */
export const tooltipCSS = `
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

/**
 * Combined highlight + tooltip styles for injection
 */
export const contentStyles = highlightCSS + '\n' + tooltipCSS;

/**
 * Demo-specific styles for homepage (uses CSS hover instead of JS)
 */
export const demoHighlightCSS = `
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
