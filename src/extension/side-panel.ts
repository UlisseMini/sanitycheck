// ABOUTME: Side panel UI for persistent analysis display
// ABOUTME: Shows current tab's analysis and syncs with popup state

import { debug } from './debug';
import type { Article, AnalysisResult, Highlight } from './types';

// UI elements
const noAnalysisSection = document.getElementById('no-analysis')!;
const loadingSection = document.getElementById('loading-section')!;
const resultsSection = document.getElementById('results-section')!;
const errorSection = document.getElementById('error-section')!;
const resultsContent = document.getElementById('results-content')!;
const errorMessage = document.getElementById('error-message')!;
const articleTitle = document.getElementById('article-title')!;
const articleWordcount = document.getElementById('article-wordcount')!;
const articleUrl = document.getElementById('article-url')!;

interface StoredAnalysis {
  article: Article;
  result: AnalysisResult;
  timestamp: number;
}

async function init(): Promise<void> {
  debug.log('Side panel initializing', {}, 'side-panel');
  
  // Apply theme
  const { theme } = await chrome.storage.local.get('theme');
  if (theme === 'miss') {
    document.body.classList.add('theme-miss');
  }
  
  // Listen for theme changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.theme) {
      if (changes.theme.newValue === 'miss') {
        document.body.classList.add('theme-miss');
      } else {
        document.body.classList.remove('theme-miss');
      }
    }
    
    if (changes.currentAnalysis) {
      debug.log('Analysis updated in storage', {}, 'side-panel');
      loadCurrentAnalysis();
    }
    
    if (changes.analysisLoading) {
      if (changes.analysisLoading.newValue) {
        showLoading();
      }
    }
  });
  
  // Load current analysis
  await loadCurrentAnalysis();
}

async function loadCurrentAnalysis(): Promise<void> {
  try {
    const { currentAnalysis } = await chrome.storage.local.get('currentAnalysis');
    
    if (!currentAnalysis) {
      debug.log('No current analysis', {}, 'side-panel');
      showNoAnalysis();
      return;
    }
    
    const analysis: StoredAnalysis = currentAnalysis;
    debug.log('Loaded analysis from storage', {
      hasArticle: !!analysis.article,
      hasResult: !!analysis.result
    }, 'side-panel');
    
    showAnalysis(analysis.article, analysis.result);
  } catch (error) {
    debug.error('Failed to load analysis', error, 'side-panel');
    showError('Failed to load analysis');
  }
}

function showNoAnalysis(): void {
  hideAll();
  noAnalysisSection.classList.remove('hidden');
}

function showLoading(): void {
  hideAll();
  loadingSection.classList.remove('hidden');
}

function showAnalysis(article: Article, result: AnalysisResult): void {
  hideAll();
  
  // Show results section which includes article info
  resultsSection.classList.remove('hidden');
  articleTitle.textContent = article.title || 'Untitled Article';
  articleWordcount.textContent = `${article.wordCount.toLocaleString()} words`;
  articleUrl.textContent = article.url;
  articleUrl.setAttribute('title', article.url);
  
  if (result.highlights && result.highlights.length > 0) {
    renderHighlights(result.highlights);
  } else if (result.rawResponse?.severity === 'none') {
    resultsContent.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--success);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 32px; height: 32px; margin-bottom: 12px;">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <p style="font-weight: 600; margin-bottom: 8px;">No Issues Found</p>
        <p style="font-size: 13px; color: var(--text-secondary);">This article appears to be logically sound.</p>
      </div>
    `;
  } else {
    resultsContent.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--text-muted);">
        <p>Analysis completed but no highlights generated.</p>
      </div>
    `;
  }
  
  debug.log('Analysis displayed in side panel', {
    highlightCount: result.highlights?.length || 0
  }, 'side-panel');
}

function renderHighlights(highlights: Highlight[]): void {
  let html = '';
  
  highlights.forEach((highlight, index) => {
    const itemId = `quote-${index}`;
    const severity = highlight.severity || 'moderate';
    const severityColor = {
      critical: 'var(--error)',
      significant: 'var(--warning)',
      moderate: 'var(--accent)',
      minor: 'var(--text-muted)'
    }[severity] || 'var(--accent)';
    
    html += `
      <div class="result-item">
        <div class="result-item-content">
          <p class="result-explanation">${escapeHtml(highlight.explanation)}<span class="quote-toggle-icon" data-target="${itemId}">▼</span></p>
          <div class="result-quote-wrapper" id="${itemId}">
            <blockquote class="result-quote">"${escapeHtml(highlight.quote)}"</blockquote>
          </div>
        </div>
      </div>
    `;
  });
  
  resultsContent.innerHTML = html;
}

function showError(message: string): void {
  hideAll();
  errorSection.classList.remove('hidden');
  errorMessage.textContent = message;
}

function hideAll(): void {
  noAnalysisSection.classList.add('hidden');
  loadingSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
  errorSection.classList.add('hidden');
}

function formatCategory(category: string): string {
  return category
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add event delegation for quote toggles
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const icon = target.closest('.quote-toggle-icon') as HTMLElement;
  
  if (icon) {
    const targetId = icon.getAttribute('data-target');
    if (targetId) {
      const wrapper = document.getElementById(targetId);
      
      if (wrapper) {
        wrapper.classList.toggle('expanded');
        icon.classList.toggle('expanded');
      }
    }
  }
});

// Initialize
init().catch(error => {
  debug.error('Side panel initialization failed', error, 'side-panel');
});
