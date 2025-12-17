// Welcome page script - extracted from welcome.html for CSP compliance

interface Article {
  url: string;
  content: string;
}

// Article examples data
const articles: Article[] = [
  {
    url: "healthnews.com/coffee-longevity-study",
    content: `
      <p>
        A new study of 180,000 adults found that those who drank 3-4 cups of coffee daily had a 15% lower risk of death over the 12-year follow-up period. <span class="highlight significant" data-type="Hidden Confounders" data-importance="significant" data-explanation="Standard controls miss key confounders like socioeconomic status, sleep quality, and pre-existing conditions. Coffee drinkers may differ from non-drinkers in unmeasured ways that actually explain the longevity difference.">The researchers controlled for smoking, alcohol, and exercise.</span> The findings suggest coffee could be a key to living longer.
      </p>
      <p>
        Lead author Dr. Martinez notes that coffee's antioxidant properties may explain the protective effect. <span class="highlight minor" data-type="Publication Bias" data-importance="minor" data-explanation="Studies finding no effect are less likely to be published. Consistent positive findings across studies may reflect shared methodological biases rather than genuine truth.">Previous studies have shown similar associations,</span> making this one of the most robust findings in nutritional science.
      </p>
      <p>
        Interestingly, the effect was strongest among participants who had been drinking coffee for decades. <span class="highlight critical" data-type="Reverse Causation" data-importance="critical" data-explanation="Long-term coffee drinkers still alive may have been healthier to begin with. Sicker people often quit coffee on medical advice, creating the false appearance of a dose-response relationship.">This suggests the benefits compound over time,</span> so starting early may be especially important.
      </p>
    `
  },
  {
    url: "techinsider.com/unicorn-patterns",
    content: `
      <p>
        After analyzing 500 successful startups, we identified three common traits: strong founding teams, rapid iteration, and deep customer empathy. <span class="highlight critical" data-type="Base Rate Neglect" data-importance="critical" data-explanation="Without knowing how common these traits are in failed startups, 87% tells us nothing. If 90% of failures also had these traits, they're not predictive of success at all.">These factors were present in 87% of companies that reached unicorn status.</span>
      </p>
      <p>
        What's remarkable is how consistent the pattern is. <span class="highlight significant" data-type="Narrative Fallacy" data-importance="significant" data-explanation="Post-hoc analysis finds patterns because humans are pattern-seekers. The 'playbook' is constructed backward from success—their paths likely looked very different in real-time, with luck playing a major role.">From Stripe to Notion to Figma, the same playbook appears again and again.</span> This suggests a replicable formula for startup success.
      </p>
      <p>
        Notably, many of these founders had no formal business training. <span class="highlight significant" data-type="Survivorship Bias" data-importance="significant" data-explanation="We're not hearing from founders with intuition and hustle who failed. Credentials may reduce variance in outcomes even if some succeed without them—we just don't see the failures.">Their success came from intuition and hustle rather than MBA frameworks</span>—a lesson for aspiring entrepreneurs.
      </p>
    `
  },
  {
    url: "wealthwise.substack.com/long-term-investing",
    content: `
      <p>
        The data is clear: over any 20-year period in U.S. history, the stock market has recovered from every crash. <span class="highlight critical" data-type="Survivorship Bias in Markets" data-importance="critical" data-explanation="We study markets that recovered. Markets that went to zero (Russia 1917, China 1949, Germany 1945) aren't in our dataset. The U.S. surviving and thriving isn't guaranteed—it's one draw from possible histories.">This makes staying invested through downturns the only rational strategy.</span>
      </p>
      <p>
        Dollar-cost averaging removes the stress of timing. <span class="highlight significant" data-type="Mathematically Misleading" data-importance="significant" data-explanation="This sounds like a timing advantage, but it isn't. DCA actually underperforms lump-sum investing roughly 68% of the time. The 'buy more when low' framing obscures that you're just slowly entering a rising market.">By investing the same amount monthly, you automatically buy more shares when prices are low and fewer when high.</span>
      </p>
      <p>
        The math speaks for itself: the S&P 500 has returned roughly 10% annually over the past century. <span class="highlight significant" data-type="Geometric vs. Arithmetic Mean" data-importance="significant" data-explanation="10% average annual returns ≠ 10% compound growth. Volatility drag means actual wealth grows slower than the average suggests. A portfolio gaining 50% then losing 33% 'averages' 8.5% annually but has returned exactly 0%.">Even accounting for inflation, that's 7% real returns—enough to double your money every decade.</span>
      </p>
    `
  }
];

let currentArticleIndex = 0;

const tooltip = document.getElementById('tooltip') as HTMLElement;
const fakeCursor = document.getElementById('fake-cursor') as HTMLElement;
const browserContent = document.getElementById('browser-content') as HTMLElement;
const browserUrl = document.getElementById('browser-url') as HTMLElement;
const articleText = document.getElementById('article-text') as HTMLElement;
const pageIndicators = document.getElementById('page-indicators') as HTMLElement;
const prevBtn = document.getElementById('prev-btn') as HTMLElement;
const nextBtn = document.getElementById('next-btn') as HTMLElement;

let highlights: HTMLElement[] = [];
let isUserControlling = false;
let animationPaused = false;
let currentHighlightIndex = 0;
let animationTimeout: ReturnType<typeof setTimeout> | null = null;
let cursorX = 50;
let cursorY = 50;
let animationFrameId: number | null = null;

// Initialize page indicators
function initPageIndicators() {
  pageIndicators.innerHTML = '';
  articles.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = `page-dot ${i === currentArticleIndex ? 'active' : ''}`;
    dot.addEventListener('click', () => goToArticle(i));
    pageIndicators.appendChild(dot);
  });
}

// Update page indicators
function updatePageIndicators() {
  const dots = pageIndicators.querySelectorAll('.page-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentArticleIndex);
  });
}

// Load article content
function loadArticle(index: number) {
  const article = articles[index];
  if (!article) return;
  browserUrl.textContent = article.url;
  articleText.innerHTML = article.content;
  
  // Re-query highlights after content change
  highlights = Array.from(document.querySelectorAll('.highlight')) as HTMLElement[];
  
  // Re-attach event listeners to new highlights
  highlights.forEach(highlight => {
    highlight.addEventListener('mouseenter', (e) => {
      if (!isUserControlling) return;
      showTooltipForHighlight(highlight, (e as MouseEvent).clientX, (e as MouseEvent).clientY);
    });
    
    highlight.addEventListener('mouseleave', () => {
      if (!isUserControlling) return;
      hideTooltip();
    });
    
    highlight.addEventListener('mousemove', (e) => {
      if (!isUserControlling) return;
      positionTooltipAt((e as MouseEvent).clientX, (e as MouseEvent).clientY);
    });
  });
  
  updatePageIndicators();
}

// Navigate to specific article
function goToArticle(index: number) {
  stopAnimation();
  currentArticleIndex = index;
  currentHighlightIndex = 0;
  cursorX = 50;
  cursorY = 50;
  fakeCursor.style.left = '50px';
  fakeCursor.style.top = '50px';
  loadArticle(index);
  setTimeout(startAnimation, 300);
}

// Navigate to next/previous
function nextArticle() {
  goToArticle((currentArticleIndex + 1) % articles.length);
}

function prevArticle() {
  goToArticle((currentArticleIndex - 1 + articles.length) % articles.length);
}

/**
 * Apply kawaii styling to text (for Miss Info mode)
 * Adds ~, <3, uwu, ✨, etc. while preserving the meaning
 */
function makeKawaii(text: string): string {
  if (!text) return text;
  
  let result = text;
  
  // Replace periods with ~ sometimes (about 30% of the time)
  result = result.replace(/\.(\s+|$)/g, (match, space) => {
    if (Math.random() < 0.3) {
      return '~' + space;
    }
    return match;
  });
  
  // Add <3 for positive/love words occasionally
  const loveWords = ['good', 'great', 'excellent', 'helpful', 'useful', 'important'];
  loveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      if (Math.random() < 0.15) {
        return match + ' <3';
      }
      return match;
    });
  });
  
  // Add "uwu" or "owo" very rarely (only once per text, and only 5% chance)
  if (Math.random() < 0.05 && result.length > 50) {
    result = result.replace(/([.!?])(\s+)/, (match, punct, space) => {
      return punct + space + (Math.random() < 0.5 ? 'uwu' : 'owo') + ' ';
    });
  }
  
  // Add sparkles ✨ occasionally (10% chance per sentence)
  result = result.replace(/([.!?])(\s+)/g, (match, punct, space) => {
    if (Math.random() < 0.1) {
      return punct + ' ✨' + space;
    }
    return match;
  });
  
  // Make it slightly more casual - replace formal phrases occasionally (but not always)
  result = result.replace(/it is important to note/gi, (match) => Math.random() < 0.3 ? 'just so you know~' : match);
  result = result.replace(/it should be noted/gi, (match) => Math.random() < 0.3 ? 'heads up~' : match);
  result = result.replace(/it is worth noting/gi, (match) => Math.random() < 0.3 ? 'worth mentioning~' : match);
  result = result.replace(/this suggests/gi, (match) => Math.random() < 0.25 ? 'this kinda suggests' : match);
  result = result.replace(/this indicates/gi, (match) => Math.random() < 0.25 ? 'this kinda indicates' : match);
  result = result.replace(/\bhowever\b/gi, (match, offset) => offset > 0 && Math.random() < 0.4 ? 'but' : match);
  result = result.replace(/\bfurthermore\b/gi, (match) => Math.random() < 0.3 ? 'also~' : match);
  result = result.replace(/\btherefore\b/gi, (match) => Math.random() < 0.3 ? 'so' : match);
  
  return result;
}

// Show tooltip for a highlight
function showTooltipForHighlight(highlight: HTMLElement, cursorXPos: number, cursorYPos: number) {
  const type = highlight.dataset.type || 'Issue';
  const importance = highlight.dataset.importance || 'minor';
  let explanation = highlight.dataset.explanation || '';
  
  // Apply kawaii styling if in Miss Info mode
  if (document.body.classList.contains('theme-miss')) {
    explanation = makeKawaii(explanation);
  }
  
  const emoji = importance === 'critical' ? '🔴' : 
                importance === 'significant' ? '🟠' : '🟡';
  
  tooltip.className = `tooltip ${importance}`;
  tooltip.innerHTML = `
    <div class="tooltip-badge">Logic Issue</div>
    <div class="tooltip-header">
      <span class="tooltip-icon">${emoji}</span>
      <span class="tooltip-type">${type}</span>
    </div>
    <div class="tooltip-text">${explanation}</div>
  `;
  
  positionTooltipAt(cursorXPos, cursorYPos);
  tooltip.classList.add('visible');
  highlight.classList.add('active');
}

function hideTooltip() {
  tooltip.classList.remove('visible');
  highlights.forEach(h => h.classList.remove('active'));
}

function positionTooltipAt(x: number, y: number) {
  const padding = 15;
  const rect = tooltip.getBoundingClientRect();
  
  let left = x + padding;
  let top = y + padding;
  
  if (left + rect.width > window.innerWidth - padding) {
    left = x - rect.width - padding;
  }
  if (top + rect.height > window.innerHeight - padding) {
    top = y - rect.height - padding;
  }
  
  tooltip.style.left = `${Math.max(padding, left)}px`;
  tooltip.style.top = `${Math.max(padding, top)}px`;
}

// Quadratic bezier curve interpolation
function quadraticBezier(t: number, p0: number, p1: number, p2: number): number {
  const mt = 1 - t;
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
}

// Animate cursor along a curved path
function animateCursorToPosition(targetX: number, targetY: number, duration: number, callback?: () => void) {
  const startX = cursorX;
  const startY = cursorY;
  const startTime = performance.now();
  
  const midX = (startX + targetX) / 2;
  const midY = (startY + targetY) / 2;
  const distance = Math.sqrt((targetX - startX) ** 2 + (targetY - startY) ** 2);
  
  const angle = Math.atan2(targetY - startY, targetX - startX) + Math.PI / 2;
  const arcIntensity = (Math.random() - 0.5) * distance * 0.8;
  const controlX = midX + Math.cos(angle) * arcIntensity;
  const controlY = midY + Math.sin(angle) * arcIntensity;
  
  function animate(currentTime: number) {
    if (isUserControlling || animationPaused) {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      return;
    }
    
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    
    cursorX = quadraticBezier(eased, startX, controlX, targetX);
    cursorY = quadraticBezier(eased, startY, controlY, targetY);
    
    fakeCursor.style.left = `${cursorX}px`;
    fakeCursor.style.top = `${cursorY}px`;
    
    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      if (callback) callback();
    }
  }
  
  animationFrameId = requestAnimationFrame(animate);
}

// Animate fake cursor through highlights
function animateCursor() {
  if (isUserControlling || animationPaused) return;
  if (highlights.length === 0) return;
  
  const highlight = highlights[currentHighlightIndex];
  if (!highlight) return;
  const contentRect = browserContent.getBoundingClientRect();
  const highlightRect = highlight.getBoundingClientRect();
  
  const xOffset = 0.15 + Math.random() * 0.35;
  const yOffset = 0.3 + Math.random() * 0.4;
  
  const targetX = highlightRect.left + highlightRect.width * xOffset - contentRect.left;
  const targetY = highlightRect.top + highlightRect.height * yOffset - contentRect.top;
  
  animateCursorToPosition(targetX, targetY, 800, () => {
    if (isUserControlling || animationPaused) return;
    
    const absX = highlightRect.left + highlightRect.width * xOffset;
    const absY = highlightRect.top + highlightRect.height * yOffset;
    showTooltipForHighlight(highlight, absX, absY);
    
    animationTimeout = setTimeout(() => {
      if (isUserControlling || animationPaused) return;
      
      hideTooltip();
      
      animationTimeout = setTimeout(() => {
        if (isUserControlling || animationPaused) return;
        
        currentHighlightIndex = (currentHighlightIndex + 1) % highlights.length;
        animateCursor();
      }, 300);
      
    }, 2500);
  });
}

function startAnimation() {
  isUserControlling = false;
  animationPaused = false;
  fakeCursor.classList.remove('hidden');
  animateCursor();
}

function stopAnimation() {
  isUserControlling = true;
  if (animationTimeout) {
    clearTimeout(animationTimeout);
    animationTimeout = null;
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  fakeCursor.classList.add('hidden');
  hideTooltip();
}

// Event listeners
browserContent.addEventListener('mouseenter', () => {
  stopAnimation();
});

browserContent.addEventListener('mouseleave', () => {
  hideTooltip();
  setTimeout(() => {
    if (!isUserControlling) return;
    startAnimation();
  }, 1000);
});

prevBtn.addEventListener('click', prevArticle);
nextBtn.addEventListener('click', nextArticle);

const settingsLink = document.getElementById('settings-link');
if (settingsLink) {
  settingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    } else {
      window.location.href = 'settings.html';
    }
  });
}

// Initialize
initPageIndicators();
loadArticle(0);
setTimeout(startAnimation, 500);

// ===== Theme Toggle =====
const themeToggle = document.getElementById('theme-toggle') as HTMLElement;
const labelSanity = document.getElementById('label-sanity') as HTMLElement;
const labelMiss = document.getElementById('label-miss') as HTMLElement;

function toggleTheme() {
  document.body.classList.toggle('theme-miss');
  themeToggle.classList.toggle('active');
  
  const isMiss = document.body.classList.contains('theme-miss');
  labelSanity.classList.toggle('active', !isMiss);
  labelMiss.classList.toggle('active', isMiss);
  
  // Update page title
  document.title = isMiss 
    ? 'Welcome to Miss Information ♡' 
    : 'Welcome to SanityCheck';
  
  // Save preference
  localStorage.setItem('theme', isMiss ? 'miss' : 'sanity');
  
  // Also save to chrome.storage for content script access
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ theme: isMiss ? 'miss' : 'sanity' });
  }
}

themeToggle.addEventListener('click', toggleTheme);

// Load saved theme preference (check chrome.storage first, then localStorage)
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get(['theme'], (result) => {
    const savedTheme = result.theme || localStorage.getItem('theme');
    if (savedTheme === 'miss' && !document.body.classList.contains('theme-miss')) {
      toggleTheme();
    }
  });
} else {
  // Fallback to localStorage only
  if (localStorage.getItem('theme') === 'miss') {
    toggleTheme();
  }
}

