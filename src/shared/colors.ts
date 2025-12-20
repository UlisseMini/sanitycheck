/**
 * Shared color palette and CSS variables
 * Used by both extension and backend
 *
 * Two themes:
 * - SanityCheck (default): Professional blue accent
 * - Miss Information: Playful purple/anime aesthetic
 */

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
 * CSS for the default SanityCheck theme
 */
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
  --severity-critical: ${colors.severityCritical};
  --severity-significant: ${colors.severitySignificant};
  --severity-minor: ${colors.severityMinor};
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
  --bg-primary: #1a1520;
  --bg-secondary: #231d2b;
  --bg-tertiary: #2d2638;
  --bg-hover: #3a3245;
  --text-primary: #f5f0fa;
  --text-secondary: #c4b8d4;
  --text-muted: #8b7fa3;
  --accent: #c084fc;
  --accent-hover: #d8b4fe;
  --accent-subtle: rgba(192, 132, 252, 0.12);
  --error: #ef4444;
  --error-subtle: rgba(239, 68, 68, 0.12);
  --success: #10b981;
  --success-subtle: rgba(16, 185, 129, 0.12);
  --warning: #f59e0b;
  --warning-subtle: rgba(245, 158, 11, 0.12);
  --border: rgba(192, 132, 252, 0.15);
  --border-strong: rgba(192, 132, 252, 0.25);
  --severity-critical: #ef4444;
  --severity-significant: #eab308;
  --severity-minor: #737373;
}
`;

/**
 * Miss Information theme background styling
 * Uses a semi-transparent overlay on top of the background image
 * 
 * @param imagePath - Path to missinfo_bg.jpg (differs between homepage and extension)
 *   - Homepage: '/static/missinfo_bg.jpg'
 *   - Extension welcome page: 'icons/missinfo_bg.jpg'
 */
export function missBackgroundCss(imagePath: string): string {
  return `
body.theme-miss {
  background: 
    linear-gradient(
      to bottom,
      rgba(26, 21, 32, 0.85) 0%,
      rgba(26, 21, 32, 0.75) 50%,
      rgba(26, 21, 32, 0.9) 100%
    ),
    url('${imagePath}');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
`;
}

/**
 * Combined CSS with both themes for pages that support theme switching
 * For homepage (backend), includes background image
 */
export const themeCssVariables = cssVariables + missCssVariables + missBackgroundCss('/static/missinfo_bg.jpg');
