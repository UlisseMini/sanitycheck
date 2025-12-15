/**
 * Shared color palette and CSS variables
 * Used by both extension and backend
 */

export const colors = {
  // Backgrounds
  bgPrimary: '#0f1117',
  bgSecondary: '#1a1d27',
  bgTertiary: '#242936',
  bgHover: '#2d3344',
  
  // Text
  textPrimary: '#f0f2f5',
  textSecondary: '#9ca3b0',
  textMuted: '#6b7280',
  
  // Accent
  accent: '#60a5fa',
  accentHover: '#93c5fd',
  accentSubtle: 'rgba(96, 165, 250, 0.12)',
  
  // Status colors
  error: '#ef4444',
  errorSubtle: 'rgba(239, 68, 68, 0.12)',
  success: '#10b981',
  successSubtle: 'rgba(16, 185, 129, 0.12)',
  warning: '#f59e0b',
  warningSubtle: 'rgba(245, 158, 11, 0.12)',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.12)',
  
  // Highlight colors (for reasoning gaps)
  highlightCritical: 'rgba(239, 68, 68, 0.25)',
  highlightCriticalHover: 'rgba(239, 68, 68, 0.4)',
  highlightSignificant: 'rgba(234, 179, 8, 0.25)',
  highlightSignificantHover: 'rgba(234, 179, 8, 0.4)',
  highlightMinor: 'rgba(115, 115, 115, 0.25)',
  highlightMinorHover: 'rgba(115, 115, 115, 0.4)',
  highlightDefault: 'rgba(96, 165, 250, 0.25)',
  highlightDefaultHover: 'rgba(96, 165, 250, 0.4)',
  
  // Severity border colors
  severityCritical: '#ef4444',
  severitySignificant: '#eab308',
  severityMinor: '#737373',
  severityDefault: '#60a5fa',
} as const;

export const cssVariables = `
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
