// Welcome page script - extracted from welcome.html for CSP compliance

interface Article {
  url: string;
  content: string;
}

// Article examples data
const articles: Article[] = [
  {
    url: "techdigest.com/ai-revolution-workplace",
    content: `
      <p>
        A recent survey found that 78% of companies have adopted at least one AI tool in the past year. <span class="highlight critical" data-type="Unsupported Leap" data-importance="critical" data-explanation="Adoption rates don't indicate effectiveness or satisfaction. Many companies adopt tools that go unused, and the survey doesn't reveal whether these tools actually improved productivity or outcomes.">This widespread adoption proves that AI is fundamentally transforming how businesses operate.</span> Industry experts predict this trend will only accelerate.
      </p>
      <p>
        One CEO reported that after implementing an AI assistant, his team's output doubled within weeks. <span class="highlight significant" data-type="Anecdotal Evidence" data-importance="significant" data-explanation="A single company's experience cannot be generalized. The timing could be coincidental, other factors may have contributed, and 'output' is vague—quantity doesn't equal quality.">His experience demonstrates the massive productivity gains available to any company willing to embrace these tools.</span>
      </p>
      <p>
        Critics who worry about job displacement are missing the bigger picture. <span class="highlight minor" data-type="Dismissive Framing" data-importance="minor" data-explanation="Characterizing legitimate concerns as 'missing the bigger picture' dismisses them without addressing the substance. Job displacement concerns are supported by economic research and historical precedent.">Every major technological shift has ultimately created more jobs than it eliminated.</span>
      </p>
    `
  },
  {
    url: "jamesclear.substack.com/p/habits-identity",
    content: `
      <p>
        I used to struggle with consistency until I realized something: you don't rise to the level of your goals, you fall to the level of your systems. <span class="highlight significant" data-type="False Dichotomy" data-importance="significant" data-explanation="Goals and systems aren't mutually exclusive—they work together. Many successful people credit both clear goals AND good systems. Presenting this as either/or oversimplifies the relationship.">Once I stopped focusing on goals entirely and built better systems, everything changed.</span>
      </p>
      <p>
        The key insight is that every action you take is a vote for the type of person you wish to become. <span class="highlight minor" data-type="Unfalsifiable Claim" data-importance="minor" data-explanation="While this framing can be motivating, it's structured so it can't be proven wrong. Any action can be interpreted as 'voting for identity,' making it more of a perspective than a verifiable insight.">This is why identity-based habits are more powerful than outcome-based habits.</span> When you focus on who you want to become rather than what you want to achieve, lasting change becomes inevitable.
      </p>
      <p>
        I've seen this work for thousands of readers who write to me. <span class="highlight critical" data-type="Survivorship Bias" data-importance="critical" data-explanation="Only hearing from readers who succeeded creates a skewed sample. Those for whom the advice didn't work are less likely to write in, making success rates appear higher than they actually are.">The pattern is undeniable—identity change precedes behavior change, every single time.</span>
      </p>
    `
  },
  {
    url: "morningnews.com/economy/housing-crisis",
    content: `
      <p>
        Home prices have increased 40% over the past three years while wages grew only 12%. <span class="highlight critical" data-type="Missing Context" data-importance="critical" data-explanation="These national averages mask huge regional variation. Some markets saw prices drop while others doubled. Without geographic breakdown, the comparison is misleading for most readers' actual situations.">Young Americans are now locked out of homeownership for the foreseeable future.</span>
      </p>
      <p>
        Real estate experts point to limited housing supply as the primary driver. <span class="highlight significant" data-type="Oversimplification" data-importance="significant" data-explanation="Housing affordability involves multiple interacting factors: interest rates, investment buying, zoning laws, construction costs, and income inequality. Reducing it to 'supply' ignores policy choices that shape the market.">If we simply built more homes, prices would naturally fall to affordable levels.</span> Several cities have begun relaxing zoning restrictions in response.
      </p>
      <p>
        Some economists argue that remote work migration is responsible, pointing to price spikes in previously affordable cities. <span class="highlight minor" data-type="Post Hoc Reasoning" data-importance="minor" data-explanation="Remote work and price increases happened around the same time, but correlation isn't causation. Low interest rates, pandemic savings, and investor activity also spiked during this period.">Cities that attracted remote workers saw prices double, proving the connection.</span>
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

// Show tooltip for a highlight
function showTooltipForHighlight(highlight: HTMLElement, cursorXPos: number, cursorYPos: number) {
  const type = highlight.dataset.type || 'Issue';
  const importance = highlight.dataset.importance || 'minor';
  const explanation = highlight.dataset.explanation || '';
  
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
}

themeToggle.addEventListener('click', toggleTheme);

// Load saved theme preference
if (localStorage.getItem('theme') === 'miss') {
  toggleTheme();
}

