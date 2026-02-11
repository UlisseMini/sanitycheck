/**
 * SanityCheck - Settings Page
 */

import { DEFAULT_ANALYSIS_PROMPT } from '../shared';

// DOM Elements
const promptEditor = document.getElementById('prompt-editor') as HTMLTextAreaElement;
const savePromptBtn = document.getElementById('save-prompt')!;
const resetPromptBtn = document.getElementById('reset-prompt')!;
const statusMessage = document.getElementById('status-message')!;
const promptBadge = document.getElementById('prompt-badge')!;
const backBtn = document.getElementById('back-btn')!;
const themeSanityRadio = document.getElementById('theme-sanity') as HTMLInputElement;
const themeMissRadio = document.getElementById('theme-miss') as HTMLInputElement;

// Initialize
document.addEventListener('DOMContentLoaded', () => { void init(); });

async function init(): Promise<void> {
  // Initialize theme
  const themeData = await chrome.storage.local.get(['theme']) as { theme?: string };
  const currentTheme = themeData.theme || 'sanity';
  
  if (currentTheme === 'miss') {
    document.body.classList.add('theme-miss');
    document.title = 'Miss Information Settings';
    themeMissRadio.checked = true;
  } else {
    document.body.classList.remove('theme-miss');
    document.title = 'SanityCheck Settings';
    themeSanityRadio.checked = true;
  }
  
  // Initialize prompt
  const stored = await chrome.storage.local.get(['customPrompt']) as { customPrompt?: string };
  
  if (stored.customPrompt) {
    promptEditor.value = stored.customPrompt;
    updateBadge(true);
  } else {
    promptEditor.value = DEFAULT_ANALYSIS_PROMPT;
    updateBadge(false);
  }
  
  // Event listeners
  savePromptBtn.addEventListener('click', () => { void savePrompt(); });
  resetPromptBtn.addEventListener('click', () => { void resetPrompt(); });
  themeSanityRadio.addEventListener('change', () => { void setTheme('sanity'); });
  themeMissRadio.addEventListener('change', () => { void setTheme('miss'); });
  
  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.close();
  });
  
  promptEditor.addEventListener('input', () => {
    const isCustom = promptEditor.value.trim() !== DEFAULT_ANALYSIS_PROMPT.trim();
    updateBadge(isCustom);
  });
}

function updateBadge(isCustom: boolean): void {
  if (isCustom) {
    promptBadge.textContent = 'Custom';
    promptBadge.classList.remove('default');
  } else {
    promptBadge.textContent = 'Default';
    promptBadge.classList.add('default');
  }
}

async function savePrompt(): Promise<void> {
  const promptText = promptEditor.value.trim();
  
  if (!promptText) {
    showStatus('Prompt cannot be empty', 'error');
    return;
  }
  
  const isCustom = promptText !== DEFAULT_ANALYSIS_PROMPT.trim();
  
  if (isCustom) {
    await chrome.storage.local.set({ customPrompt: promptText });
  } else {
    await chrome.storage.local.remove(['customPrompt']);
  }
  
  updateBadge(isCustom);
  showStatus('Prompt saved successfully!', 'success');
}

async function resetPrompt(): Promise<void> {
  promptEditor.value = DEFAULT_ANALYSIS_PROMPT;
  await chrome.storage.local.remove(['customPrompt']);
  updateBadge(false);
  showStatus('Prompt reset to default', 'success');
}

function showStatus(message: string, type: 'success' | 'error'): void {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  
  setTimeout(() => {
    statusMessage.className = 'status-message';
  }, 3000);
}

async function setTheme(theme: 'sanity' | 'miss'): Promise<void> {
  const body = document.body;
  
  if (theme === 'miss') {
    body.classList.add('theme-miss');
    document.title = 'Miss Information Settings';
  } else {
    body.classList.remove('theme-miss');
    document.title = 'SanityCheck Settings';
  }
  
  // Save to chrome storage
  await chrome.storage.local.set({ theme });
}
