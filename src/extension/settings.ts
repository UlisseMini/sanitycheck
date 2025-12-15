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

// Initialize
document.addEventListener('DOMContentLoaded', () => { void init(); });

async function init(): Promise<void> {
  const stored = await chrome.storage.local.get(['customPrompt']) as { customPrompt?: string };
  
  if (stored.customPrompt) {
    promptEditor.value = stored.customPrompt;
    updateBadge(true);
  } else {
    promptEditor.value = DEFAULT_ANALYSIS_PROMPT;
    updateBadge(false);
  }
  
  savePromptBtn.addEventListener('click', () => { void savePrompt(); });
  resetPromptBtn.addEventListener('click', () => { void resetPrompt(); });
  
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
