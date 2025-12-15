/**
 * Shared color palette and CSS variables
 * Used by both extension and backend
 * 
 * Two themes:
 * - SanityCheck (default): Professional blue accent
 * - Miss Information: Playful purple/anime aesthetic
 */

export type ThemeName = 'sanitycheck' | 'miss';

// Base colors shared across themes
const baseColors = {
  // Status colors (same in both themes)
  error: '#ef4444',
  errorSubtle: 'rgba(239, 68, 68, 0.12)',
  success: '#10b981',
  successSubtle: 'rgba(16, 185, 129, 0.12)',
  warning: '#f59e0b',
  warningSubtle: 'rgba(245, 158, 11, 0.12)',
  
  // Severity colors (same in both themes)
  severityCritical: '#ef4444',
  severitySignificant: '#eab308',
  severityMinor: '#737373',
} as const;

/**
 * SanityCheck Theme - Professional blue accent
 */
export const colors = {
  ...baseColors,
  
  // Backgrounds
  bgPrimary: '#0f1117',
  bgSecondary: '#1a1d27',
  bgTertiary: '#242936',
  bgHover: '#2d3344',
  
  // Text
  textPrimary: '#f0f2f5',
  textSecondary: '#9ca3b0',
  textMuted: '#6b7280',
  
  // Accent (blue)
  accent: '#60a5fa',
  accentHover: '#93c5fd',
  accentSubtle: 'rgba(96, 165, 250, 0.12)',
  
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
  
  severityDefault: '#60a5fa',
} as const;

/**
 * Miss Information Theme - Playful purple/anime aesthetic
 */
export const missColors = {
  ...baseColors,
  
  // Backgrounds (purple-tinted dark)
  bgPrimary: '#1a1520',
  bgSecondary: '#231d2b',
  bgTertiary: '#2d2638',
  bgHover: '#3a3245',
  
  // Text (lavender-tinted)
  textPrimary: '#f5f0fa',
  textSecondary: '#c4b8d4',
  textMuted: '#8b7fa3',
  
  // Accent (purple)
  accent: '#c084fc',
  accentHover: '#d8b4fe',
  accentSubtle: 'rgba(192, 132, 252, 0.12)',
  
  // Borders (purple-tinted)
  border: 'rgba(192, 132, 252, 0.15)',
  borderStrong: 'rgba(192, 132, 252, 0.25)',
  
  // Highlight colors (purple-shifted for theme consistency)
  highlightCritical: 'rgba(239, 68, 68, 0.25)',
  highlightCriticalHover: 'rgba(239, 68, 68, 0.4)',
  highlightSignificant: 'rgba(234, 179, 8, 0.25)',
  highlightSignificantHover: 'rgba(234, 179, 8, 0.4)',
  highlightMinor: 'rgba(139, 127, 163, 0.25)',
  highlightMinorHover: 'rgba(139, 127, 163, 0.4)',
  highlightDefault: 'rgba(192, 132, 252, 0.25)',
  highlightDefaultHover: 'rgba(192, 132, 252, 0.4)',
  
  severityDefault: '#c084fc',
} as const;

/**
 * Generate CSS variables for a theme
 */
function generateCssVariables(theme: typeof colors | typeof missColors): string {
  return `
  --bg-primary: ${theme.bgPrimary};
  --bg-secondary: ${theme.bgSecondary};
  --bg-tertiary: ${theme.bgTertiary};
  --bg-hover: ${theme.bgHover};
  --text-primary: ${theme.textPrimary};
  --text-secondary: ${theme.textSecondary};
  --text-muted: ${theme.textMuted};
  --accent: ${theme.accent};
  --accent-hover: ${theme.accentHover};
  --accent-subtle: ${theme.accentSubtle};
  --error: ${theme.error};
  --error-subtle: ${theme.errorSubtle};
  --success: ${theme.success};
  --success-subtle: ${theme.successSubtle};
  --warning: ${theme.warning};
  --warning-subtle: ${theme.warningSubtle};
  --border: ${theme.border};
  --border-strong: ${theme.borderStrong};
  --severity-critical: ${theme.severityCritical};
  --severity-significant: ${theme.severitySignificant};
  --severity-minor: ${theme.severityMinor};`;
}

/**
 * CSS for the default SanityCheck theme
 */
export const cssVariables = `
:root {
${generateCssVariables(colors)}
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 14px;
}
`;

/**
 * CSS for the Miss Information alternate theme
 * Applied when body has class "theme-miss"
 */
export const missCssVariables = `
body.theme-miss {
${generateCssVariables(missColors)}
}
`;

/**
 * Combined CSS with both themes for pages that support theme switching
 */
export const themeCssVariables = cssVariables + missCssVariables;
