/**
 * Technical FAQ page HTML generator
 * Explains why LLMs miss logical fallacies and how fine-tuning helps
 */

import { themeCssVariables } from '../../shared';

export function generateTechnicalFaqPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Technical FAQ — SanityCheck</title>
  <link rel="icon" type="image/png" sizes="16x16" href="/static/icon16.png">
  <link rel="icon" type="image/png" sizes="48x48" href="/static/icon48.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Comfortaa:wght@700&family=Quicksand:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    ${themeCssVariables}
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      line-height: 1.7;
      transition: background 0.4s ease, color 0.4s ease;
    }
    
    /* ===== Theme Toggle ===== */
    .theme-toggle-container {
      position: fixed;
      top: 20px;
      right: 24px;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .theme-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      transition: color 0.3s ease;
    }
    
    .theme-label.active {
      color: var(--accent);
    }
    
    .theme-toggle {
      position: relative;
      width: 50px;
      height: 26px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-strong);
      border-radius: 13px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .theme-toggle:hover {
      border-color: var(--accent);
    }
    
    .theme-toggle-slider {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      background: var(--accent);
      border-radius: 50%;
      transition: transform 0.3s cubic-bezier(0.68, -0.15, 0.32, 1.15);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .theme-toggle.active .theme-toggle-slider {
      transform: translateX(24px);
    }
    
    body.theme-miss .theme-toggle-slider::after {
      content: '✨';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 9px;
    }
    
    /* Miss Info theme adjustments */
    body.theme-miss h1 {
      font-family: 'Comfortaa', 'Quicksand', cursive;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 80px 24px 60px;
    }
    
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 14px;
      margin-bottom: 32px;
      transition: color 0.15s ease;
    }
    
    .back-link:hover {
      color: var(--accent);
    }
    
    h1 {
      font-family: 'Poppins', sans-serif;
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 16px;
      letter-spacing: -1px;
    }
    
    h1 .accent {
      color: var(--accent);
    }
    
    .subtitle {
      color: var(--text-secondary);
      font-size: 1.1rem;
      margin-bottom: 48px;
      line-height: 1.6;
    }
    
    .section {
      margin-bottom: 56px;
    }
    
    .section-title {
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--border);
    }
    
    .section-content {
      color: var(--text-secondary);
      font-size: 1rem;
      line-height: 1.8;
    }
    
    .section-content p {
      margin-bottom: 20px;
    }
    
    .section-content p:last-child {
      margin-bottom: 0;
    }
    
    .highlight-box {
      background: var(--bg-secondary);
      border-left: 4px solid var(--accent);
      padding: 20px 24px;
      margin: 24px 0;
      border-radius: 4px;
    }
    
    .highlight-box strong {
      color: var(--text-primary);
      display: block;
      margin-bottom: 8px;
      font-size: 1.05rem;
    }
    
    .example-list {
      list-style: none;
      padding-left: 0;
      margin: 24px 0;
    }
    
    .example-list li {
      padding: 16px 0;
      border-bottom: 1px solid var(--border);
      padding-left: 32px;
      position: relative;
    }
    
    .example-list li:last-child {
      border-bottom: none;
    }
    
    .example-list li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: var(--accent);
      font-weight: bold;
    }
    
    .example-list .example-title {
      color: var(--text-primary);
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .example-list .example-desc {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
    
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      background: var(--bg-secondary);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .comparison-table th,
    .comparison-table td {
      padding: 16px 20px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    
    .comparison-table th {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      font-weight: 600;
    }
    
    .comparison-table td {
      color: var(--text-secondary);
    }
    
    .comparison-table tr:last-child td {
      border-bottom: none;
    }
    
    .code-like {
      font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
      background: var(--bg-tertiary);
      padding: 2px 6px;
      border-radius: 3px;
      color: var(--accent);
      font-size: 0.9em;
    }
    
    footer {
      margin-top: 80px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    
    footer a {
      color: var(--text-secondary);
      text-decoration: none;
      transition: color 0.15s ease;
    }
    
    footer a:hover {
      color: var(--accent);
    }
  </style>
</head>
<body>
  <!-- Theme Toggle -->
  <div class="theme-toggle-container">
    <span class="theme-label active" id="label-sanity">Sanity</span>
    <div class="theme-toggle" id="theme-toggle">
      <div class="theme-toggle-slider"></div>
    </div>
    <span class="theme-label" id="label-miss">Miss Info</span>
  </div>

  <div class="container">
    <a href="/" class="back-link">← Back to Home</a>
    
    <h1>Technical <span class="accent">FAQ</span></h1>
    <p class="subtitle">Why general-purpose LLMs miss logical fallacies, and how we're training models that catch them</p>
    
    <div class="section">
      <h2 class="section-title">The Problem: Why LLMs Miss Logic Gaps</h2>
      <div class="section-content">
        <p>
          Most large language models are trained on massive amounts of text from the internet—everything from Wikipedia articles to Reddit threads to news sites. This gives them an impressive ability to understand language and generate coherent responses. But when it comes to <em>critical reasoning</em>, they often fall short.
        </p>
        
        <p>
          Here's the thing: LLMs learn patterns from their training data. If an article uses sophisticated language and cites studies, the model might classify it as "well-reasoned" simply because it <em>looks</em> like high-quality content. The model has learned to recognize the <strong>style</strong> of good reasoning, but not necessarily the <strong>structure</strong> of valid logic.
        </p>
        
        <div class="highlight-box">
          <strong>Think of it like this:</strong>
          An LLM might see "Studies show that coffee drinkers live longer" and think it sounds reasonable, because that's the kind of claim that appears in legitimate news articles. But it won't automatically check: <em>Did the study account for confounding variables? Could there be reverse causation? Are we seeing the full picture or just survivors?</em>
        </div>
        
        <p>
          This isn't really a bug—it's a fundamental limitation of how these models work. They're pattern-matching engines, not logical reasoning systems. They're trying to predict "what would a human say next?" rather than "does this argument actually make sense?"
        </p>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">What Kinds of Logic Gaps Get Missed?</h2>
      <div class="section-content">
        <p>
          General-purpose LLMs tend to miss logical fallacies that require thinking beyond the surface-level meaning of the text. Here are the most common categories:
        </p>
        
        <ul class="example-list">
          <li>
            <div class="example-title">Hidden Confounders</div>
            <div class="example-desc">When a study claims "X causes Y" but doesn't account for a third factor Z that might explain both. For example: "Coffee drinkers are healthier" might actually mean "People who can afford coffee and have time for it are healthier"—it's not the coffee, it's the socioeconomic status.</div>
          </li>
          
          <li>
            <div class="example-title">Survivorship Bias</div>
            <div class="example-desc">Only looking at the winners. "All successful startups had these traits" ignores the thousands of failed startups that also had those traits. The model sees the pattern in the successful cases but doesn't think to check the failures.</div>
          </li>
          
          <li>
            <div class="example-title">Base Rate Neglect</div>
            <div class="example-desc">Focusing on percentages within a group without considering how common that group is overall. "87% of unicorn startups have strong teams" sounds impressive until you realize 90% of <em>all</em> startups have strong teams—so it's not actually predictive.</div>
          </li>
          
          <li>
            <div class="example-title">Reverse Causation</div>
            <div class="example-desc">Assuming A causes B when actually B causes A, or when they're correlated due to some other factor. "People who exercise regularly sleep better" might actually mean "People who sleep well have energy to exercise"—not that exercise improves sleep.</div>
          </li>
          
          <li>
            <div class="example-title">Narrative Fallacy</div>
            <div class="example-desc">Constructing a story after the fact that makes success seem inevitable. "They succeeded because of their playbook" ignores the role of luck, timing, and all the paths that didn't work. LLMs are especially good at recognizing narratives, but not at questioning whether they're retroactively constructed.</div>
          </li>
        </ul>
        
        <p>
          These aren't mistakes that show up in grammar or spelling—they're errors in the <em>reasoning chain</em>. A general LLM will read "Studies show X" and think "okay, that seems credible" without systematically checking whether the conclusion actually follows from the premises.
        </p>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">Why These Gaps Are Hard to Catch</h2>
      <div class="section-content">
        <p>
          There are several reasons why general-purpose models struggle with these kinds of logical fallacies:
        </p>
        
        <p>
          <strong>1. Training data bias:</strong> Most internet text doesn't explicitly call out logical fallacies. Articles present arguments as if they're sound, and LLMs learn to mimic that style. They get really good at writing arguments that <em>sound</em> convincing, but they don't develop a strong "skepticism module" for detecting flaws.
        </p>
        
        <p>
          <strong>2. Lack of structured reasoning:</strong> General LLMs process text holistically—they understand the overall meaning but don't break arguments down into premises, conclusions, and logical steps. To catch a fallacy, you need to trace the reasoning: "What evidence supports this claim? What alternative explanations exist? What assumptions are being made?"
        </p>
        
        <p>
          <strong>3. No domain-specific knowledge:</strong> Catching statistical fallacies (like base rate neglect) requires understanding probability theory. Catching causal fallacies requires understanding study design. General models have some of this knowledge, but it's not activated reliably when reading articles.
        </p>
        
        <p>
          <strong>4. Overconfidence in authority:</strong> If an article cites a study or an expert, the model often treats that as sufficient proof. It doesn't automatically think "but how was the study designed?" or "but what did the expert actually say?"
        </p>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">How Fine-Tuning Helps</h2>
      <div class="section-content">
        <p>
          This is where fine-tuning comes in. Instead of training a model on random internet text, we train it specifically on examples of logical fallacies in real articles. Think of it like the difference between someone who's read everything and someone who's specifically trained to be a fact-checker.
        </p>
        
        <p>
          Here's how it works:
        </p>
        
        <ul class="example-list">
          <li>
            <div class="example-title">Focused Training Data</div>
            <div class="example-desc">We feed the model thousands of examples where humans have identified logical fallacies. Each example shows the model: "Here's a passage that looks reasonable, but here's why the reasoning is flawed." Over time, it learns the patterns of bad reasoning, not just good writing style.</div>
          </li>
          
          <li>
            <div class="example-title">Explicit Reasoning Chains</div>
            <div class="example-desc">The fine-tuning process forces the model to break down arguments step-by-step. Instead of just saying "this seems wrong," it learns to identify: "This claims X causes Y, but there's a confounding variable Z that explains both, and the study didn't control for it."</div>
          </li>
          
          <li>
            <div class="example-title">Systematic Checklist</div>
            <div class="example-desc">A fine-tuned model develops something like a mental checklist: "When I see a causal claim, I check for reverse causation. When I see a study, I check for confounders. When I see success stories, I check for survivorship bias." General models don't have this systematic approach.</div>
          </li>
          
          <li>
            <div class="example-title">Feedback Loop</div>
            <div class="example-desc">As users flag false positives and missed issues, we retrain the model. It gets better at distinguishing between "genuinely problematic reasoning" and "valid arguments that happen to discuss uncertainties." This is iterative improvement that general models don't get.</div>
          </li>
        </ul>
        
        <div class="highlight-box">
          <strong>The key insight:</strong>
          A fine-tuned model is like a detective who's specifically trained to look for specific types of crimes, rather than a general police officer who knows a bit about everything but might miss subtle patterns.
        </div>
        
        <p>
          This doesn't mean fine-tuned models are perfect—they still make mistakes. But they're <em>systematically better</em> at the specific task of detecting logical fallacies because they've been optimized for it, rather than trying to be good at everything.
        </p>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">General vs. Fine-Tuned: A Comparison</h2>
      <div class="section-content">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Aspect</th>
              <th>General-Purpose LLM</th>
              <th>Fine-Tuned Logic Model</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Training focus</strong></td>
              <td>Broad internet text (general knowledge)</td>
              <td>Logical fallacies and reasoning patterns</td>
            </tr>
            <tr>
              <td><strong>What it recognizes</strong></td>
              <td>Well-written text, authoritative tone</td>
              <td>Specific fallacy patterns (confounders, bias, etc.)</td>
            </tr>
            <tr>
              <td><strong>Reasoning approach</strong></td>
              <td>Holistic understanding</td>
              <td>Structured, step-by-step analysis</td>
            </tr>
            <tr>
              <td><strong>False positives</strong></td>
              <td>Lower (doesn't flag much)</td>
              <td>Higher initially, improves with feedback</td>
            </tr>
            <tr>
              <td><strong>False negatives</strong></td>
              <td>Higher (misses subtle fallacies)</td>
              <td>Lower (trained specifically to catch them)</td>
            </tr>
            <tr>
              <td><strong>Best for</strong></td>
              <td>General conversation, summarizing</td>
              <td>Detecting logical gaps in arguments</td>
            </tr>
          </tbody>
        </table>
        
        <p>
          It's the difference between a jack-of-all-trades and a specialist. Both have their place, but when you need someone to catch logical fallacies in articles, you want the specialist.
        </p>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">The Bottom Line</h2>
      <div class="section-content">
        <p>
          General-purpose LLMs are incredible tools for understanding and generating language. But they're not built for systematic logical reasoning. They'll miss fallacies that require thinking beyond the surface text—confounders, bias, statistical traps, and causal errors.
        </p>
        
        <p>
          Fine-tuned models that are specifically trained to catch logical fallacies perform better because they've been optimized for that exact task. They learn the patterns of bad reasoning, develop systematic checklists, and improve through user feedback. They're not perfect, but they're purpose-built for finding the gaps that general models miss.
        </p>
        
        <p>
          That's what SanityCheck does: it uses models that have been specifically trained to catch these reasoning gaps, so you can catch the logical fallacies you'd normally miss.
        </p>
      </div>
    </div>
    
    <footer>
      <a href="/">Home</a> · <a href="/faq">FAQ</a> · <a href="https://github.com/UlisseMini/sanitycheck" target="_blank">GitHub</a>
    </footer>
  </div>
  
  <script>
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const labelSanity = document.getElementById('label-sanity');
    const labelMiss = document.getElementById('label-miss');
    
    function toggleTheme() {
      document.body.classList.toggle('theme-miss');
      themeToggle.classList.toggle('active');
      
      const isMiss = document.body.classList.contains('theme-miss');
      labelSanity.classList.toggle('active', !isMiss);
      labelMiss.classList.toggle('active', isMiss);
      
      document.title = isMiss ? 'Technical FAQ — Miss Information ♡' : 'Technical FAQ — SanityCheck';
      localStorage.setItem('theme', isMiss ? 'miss' : 'sanity');
    }
    
    themeToggle.addEventListener('click', toggleTheme);
    
    // Load saved theme preference
    if (localStorage.getItem('theme') === 'miss') {
      toggleTheme();
    }
  </script>
</body>
</html>`;
}
