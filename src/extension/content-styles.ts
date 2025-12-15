/**
 * Content script styles - exported for injection into pages
 */

import { contentStyles } from '../shared/highlight-styles';

export const CONTENT_STYLES = contentStyles;

// Function to inject styles into a page
export function injectStyles(): void {
  const styleId = 'sanitycheck-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = CONTENT_STYLES;
  document.head.appendChild(style);
}
