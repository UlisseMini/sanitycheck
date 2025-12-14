// SanityCheck - Settings Page

const DEFAULT_API_KEY = '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';

const DEFAULT_PROMPT = `You help readers notice genuine reasoning problems in articles—things they'd agree are valid weaknesses, even if they agree with the conclusions.

## Your Goal

Surface issues where you're confident it's a real structural flaw AND it matters to the core argument. The cost of a bad objection (annoying the reader, undermining trust) exceeds the cost of missing something. So:

- Only flag things that made you genuinely think "wait, that doesn't follow"
- Try to steelman first—if there's a reasonable interpretation, don't flag
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

- Keep "gap" explanations brief and immediately recognizable. E.g., "Constraints ≠ impossibility" or "One example doesn't prove a universal"
- Quote exactly from the text
- 1-4 issues typical. Zero is fine if nothing clears the bar.
- Quality over quantity—only flag what you're confident about

ARTICLE:
`;

// DOM Elements
const promptEditor = document.getElementById('prompt-editor');
const savePromptBtn = document.getElementById('save-prompt');
const resetPromptBtn = document.getElementById('reset-prompt');
const statusMessage = document.getElementById('status-message');
const promptBadge = document.getElementById('prompt-badge');
const apiKeyInput = document.getElementById('api-key');
const saveKeyBtn = document.getElementById('save-key');
const backBtn = document.getElementById('back-btn');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Load saved prompt
  const stored = await chrome.storage.local.get(['customPrompt', 'anthropicApiKey']);
  
  if (stored.customPrompt) {
    promptEditor.value = stored.customPrompt;
    updateBadge(true);
  } else {
    promptEditor.value = DEFAULT_PROMPT;
    updateBadge(false);
  }
  
  // Load API key
  if (stored.anthropicApiKey) {
    apiKeyInput.value = stored.anthropicApiKey;
  } else {
    apiKeyInput.value = DEFAULT_API_KEY;
  }
  
  // Event listeners
  savePromptBtn.addEventListener('click', savePrompt);
  resetPromptBtn.addEventListener('click', resetPrompt);
  saveKeyBtn.addEventListener('click', saveApiKey);
  
  // Back button - close popup or navigate
  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.close();
  });
  
  // Track changes
  promptEditor.addEventListener('input', () => {
    const isCustom = promptEditor.value.trim() !== DEFAULT_PROMPT.trim();
    updateBadge(isCustom);
  });
}

function updateBadge(isCustom) {
  if (isCustom) {
    promptBadge.textContent = 'Custom';
    promptBadge.classList.remove('default');
  } else {
    promptBadge.textContent = 'Default';
    promptBadge.classList.add('default');
  }
}

async function savePrompt() {
  const promptText = promptEditor.value.trim();
  
  if (!promptText) {
    showStatus('Prompt cannot be empty', 'error');
    return;
  }
  
  // Check if it's different from default
  const isCustom = promptText !== DEFAULT_PROMPT.trim();
  
  if (isCustom) {
    await chrome.storage.local.set({ customPrompt: promptText });
  } else {
    // If same as default, remove custom prompt
    await chrome.storage.local.remove(['customPrompt']);
  }
  
  updateBadge(isCustom);
  showStatus('Prompt saved successfully!', 'success');
}

async function resetPrompt() {
  promptEditor.value = DEFAULT_PROMPT;
  await chrome.storage.local.remove(['customPrompt']);
  updateBadge(false);
  showStatus('Prompt reset to default', 'success');
}

async function saveApiKey() {
  const key = apiKeyInput.value.trim();
  
  if (key) {
    await chrome.storage.local.set({ anthropicApiKey: key });
    saveKeyBtn.textContent = 'Saved!';
    setTimeout(() => {
      saveKeyBtn.textContent = 'Save';
    }, 1500);
  }
}

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  
  setTimeout(() => {
    statusMessage.className = 'status-message';
  }, 3000);
}

