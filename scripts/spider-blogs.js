#!/usr/bin/env node
/**
 * Blog Spider - Finds critique/refutation articles from SlateStarCodex
 * Saves both the critique and (if available) the article being critiqued
 */

const https = require('https');
const http = require('http');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const fs = require('fs');
const path = require('path');

// Configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BACKEND_URL = process.env.BACKEND_URL || 'https://sanitycheck-production.up.railway.app';
const USE_BACKEND_PROXY = !ANTHROPIC_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '..', 'articles');
const DELAY_MS = 2000; // Be nice to servers
const MAX_ARTICLES = process.env.MAX_ARTICLES ? parseInt(process.env.MAX_ARTICLES) : 100;

// Stats
let stats = {
  fetched: 0,
  analyzed: 0,
  saved: 0,
  critiquePairs: 0,
  errors: 0,
  skipped: 0
};

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch URL with retry
async function fetchUrl(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, { 
          headers: { 'User-Agent': 'SanityCheck-Spider/1.0 (research purposes)' },
          timeout: 30000
        }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const redirectUrl = res.headers.location.startsWith('http') 
              ? res.headers.location 
              : new URL(res.headers.location, url).href;
            fetchUrl(redirectUrl, retries - 1).then(resolve).catch(reject);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(1000 * (i + 1));
    }
  }
}

// Extract article text using Readability
function extractArticle(html, url) {
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;
  
  const reader = new Readability(document);
  const article = reader.parse();
  
  if (!article) return null;
  
  return {
    title: article.title,
    content: article.textContent,
    html: article.content, // Keep HTML for link extraction
    excerpt: article.excerpt,
    length: article.length
  };
}

// Extract external links from article HTML
function extractExternalLinks(html, baseUrl) {
  const dom = new JSDOM(html);
  const links = [];
  
  dom.window.document.querySelectorAll('a[href]').forEach(a => {
    const href = a.href;
    // Skip internal SSC links, anchors, common non-article sites
    if (!href || 
        href.includes('slatestarcodex.com') ||
        href.includes('astralcodexten') ||
        href.startsWith('#') ||
        href.includes('wikipedia.org') ||
        href.includes('twitter.com') ||
        href.includes('youtube.com') ||
        href.includes('amazon.com') ||
        href.includes('google.com') ||
        href.includes('reddit.com/r/') ||
        href.includes('.pdf') ||
        href.includes('.jpg') ||
        href.includes('.png')) {
      return;
    }
    
    // Look for article-like links (news sites, blogs, opinion pieces)
    if (href.startsWith('http')) {
      links.push({
        url: href,
        text: a.textContent.trim().substring(0, 100)
      });
    }
  });
  
  return links;
}

// Call Claude Haiku to classify if article is a critique
async function classifyAsCritique(title, content, externalLinks) {
  const maxChars = 6000;
  const truncatedContent = content.length > maxChars 
    ? content.substring(0, maxChars) + '...[truncated]' 
    : content;
  
  const linksList = externalLinks.slice(0, 10).map(l => `- ${l.text}: ${l.url}`).join('\n');
  
  const prompt = `You are analyzing a SlateStarCodex blog post to determine if it's a critique or refutation of another article/argument.

We're looking for posts where Scott Alexander:
1. Critiques, refutes, or analyzes flawed reasoning in a specific external article/post/argument
2. Points out logical fallacies or bad reasoning that smart people fall for
3. Responds to or rebuts someone else's argument in detail

This should be a substantive intellectual critique, not just a mention or link roundup.

Article Title: ${title}

Article Content (beginning):
${truncatedContent}

External links found in article:
${linksList || '(none found)'}

Respond with JSON only (no markdown):
{
  "is_critique": true/false,
  "confidence": 0.0-1.0,
  "critique_type": "refutation" | "analysis" | "response" | "debunking" | "not_critique",
  "target_description": "brief description of what's being critiqued",
  "target_url": "URL of the article being critiqued, if identifiable from the links (or null)",
  "reasoning_quality": "high" | "medium" | "low",
  "reason": "brief explanation of why this is or isn't a good critique article"
}`;

  let response;
  
  if (USE_BACKEND_PROXY) {
    response = await new Promise((resolve, reject) => {
      const url = new URL('/analyze', BACKEND_URL);
      const data = JSON.stringify({
        prompt: prompt,
        maxTokens: 400,
        temperature: 0.1
      });
      
      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ content: [{ text: parsed.text }] });
          } catch (e) {
            reject(new Error(`Failed to parse: ${body.substring(0, 200)}`));
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  } else {
    response = await new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: 'claude-haiku-4-5-20241022',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      });
      
      const req = https.request({
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse: ${body}`));
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
  
  if (response.error) {
    throw new Error(response.error.message);
  }
  
  const text = response.content?.[0]?.text || '';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('\nFailed to parse Haiku response:', text.substring(0, 200));
  }
  return { is_critique: false, confidence: 0, critique_type: 'error', reason: 'Parse error' };
}

// Save article to file
function saveArticle(article, url, classification, isCritique = true, relatedUrl = null) {
  const safeName = article.title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 80)
    .toLowerCase();
  
  const prefix = isCritique ? 'critique-' : 'target-';
  const filename = `${prefix}${safeName}.txt`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  const metadata = isCritique ? `
Type: Critique
Critique Type: ${classification.critique_type}
Target: ${classification.target_description}
Target URL: ${classification.target_url || 'not found'}
Reasoning Quality: ${classification.reasoning_quality}
` : `
Type: Target Article (being critiqued)
Related Critique: ${relatedUrl}
`;

  const content = `Title: ${article.title}
URL: ${url}
${metadata}
---

${article.content}`;
  
  fs.writeFileSync(filepath, content, 'utf-8');
  return filename;
}

// Get all SSC article URLs (not archive pages)
async function getSSCArticles() {
  console.log('\n📚 Fetching SlateStarCodex article list...');
  const articles = new Set();
  
  // SSC article URLs have format: /YYYY/MM/DD/article-slug/
  const articlePattern = /slatestarcodex\.com\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+\/?$/i;
  
  try {
    // Fetch main page
    console.log('   Fetching main page...');
    const mainHtml = await fetchUrl('https://slatestarcodex.com/');
    const mainDom = new JSDOM(mainHtml);
    
    mainDom.window.document.querySelectorAll('a[href]').forEach(link => {
      const href = link.href;
      if (href && articlePattern.test(href)) {
        articles.add(href.replace(/\/$/, '')); // Normalize
      }
    });
    
    // Fetch archive pages (monthly archives have article links)
    for (const year of ['2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013']) {
      for (const month of ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']) {
        try {
          const archiveUrl = `https://slatestarcodex.com/${year}/${month}/`;
          process.stdout.write(`\r   Fetching ${year}/${month}...`);
          
          const html = await fetchUrl(archiveUrl);
          const dom = new JSDOM(html);
          
          dom.window.document.querySelectorAll('a[href]').forEach(link => {
            const href = link.href;
            if (href && articlePattern.test(href)) {
              articles.add(href.replace(/\/$/, ''));
            }
          });
          
          await sleep(300);
        } catch (e) {
          // Month might not exist, that's fine
        }
      }
    }
    
  } catch (e) {
    console.error('\nError fetching SSC:', e.message);
  }
  
  console.log(`\n   Found ${articles.size} unique SSC articles`);
  return Array.from(articles);
}

// Process a single article
async function processArticle(url) {
  try {
    process.stdout.write(`\n🔍 ${url.split('/').slice(-2, -1)[0] || url.substring(0, 50)}...`);
    
    const html = await fetchUrl(url);
    stats.fetched++;
    
    const article = extractArticle(html, url);
    if (!article || !article.content || article.content.length < 1000) {
      process.stdout.write(' ⏭️ too short');
      stats.skipped++;
      return null;
    }
    
    // Extract external links for critique detection
    const externalLinks = extractExternalLinks(article.html, url);
    
    process.stdout.write(' 🤖');
    const classification = await classifyAsCritique(article.title, article.content, externalLinks);
    stats.analyzed++;
    
    if (classification.is_critique && 
        classification.confidence >= 0.7 && 
        classification.reasoning_quality !== 'low') {
      
      // Save the critique article
      const critiqueFilename = saveArticle(article, url, classification, true);
      process.stdout.write(` ✅ ${classification.critique_type}`);
      stats.saved++;
      
      let targetFilename = null;
      
      // Try to fetch and save the target article
      if (classification.target_url) {
        try {
          process.stdout.write(' → fetching target...');
          const targetHtml = await fetchUrl(classification.target_url);
          const targetArticle = extractArticle(targetHtml, classification.target_url);
          
          if (targetArticle && targetArticle.content && targetArticle.content.length > 500) {
            targetFilename = saveArticle(targetArticle, classification.target_url, classification, false, url);
            process.stdout.write(' ✅ got target!');
            stats.critiquePairs++;
          } else {
            process.stdout.write(' ⚠️ target too short');
          }
        } catch (e) {
          process.stdout.write(` ⚠️ target failed: ${e.message.substring(0, 30)}`);
        }
      }
      
      return { 
        url, 
        title: article.title, 
        classification,
        critiqueFilename,
        targetFilename,
        hasTarget: !!targetFilename
      };
    } else {
      const reason = classification.is_critique 
        ? `low quality (${classification.reasoning_quality})` 
        : classification.critique_type;
      process.stdout.write(` ❌ ${reason}`);
      return null;
    }
    
  } catch (e) {
    process.stdout.write(` ⚠️ ${e.message.substring(0, 40)}`);
    stats.errors++;
    return null;
  }
}

// Main
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SSC Critique Spider');
  console.log('  Finding critique/refutation articles with their targets');
  console.log('═══════════════════════════════════════════════════════════════');
  
  if (USE_BACKEND_PROXY) {
    console.log(`\n🔗 Using backend: ${BACKEND_URL}/analyze`);
  } else {
    console.log('\n🔑 Using direct Anthropic API');
  }
  
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`🎯 Max articles to process: ${MAX_ARTICLES}`);
  
  const allArticles = await getSSCArticles();
  const articlesToProcess = allArticles.slice(0, MAX_ARTICLES);
  
  console.log(`\n📊 Processing ${articlesToProcess.length} articles`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  const results = [];
  
  for (let i = 0; i < articlesToProcess.length; i++) {
    const url = articlesToProcess[i];
    const result = await processArticle(url);
    if (result) results.push(result);
    
    if ((i + 1) % 10 === 0) {
      console.log(`\n\n--- Progress: ${i + 1}/${articlesToProcess.length} | Critiques: ${stats.saved} | Pairs: ${stats.critiquePairs} ---`);
    }
    
    await sleep(DELAY_MS);
  }
  
  // Summary
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Articles fetched:  ${stats.fetched}`);
  console.log(`  Articles analyzed: ${stats.analyzed}`);
  console.log(`  Critiques saved:   ${stats.saved}`);
  console.log(`  Critique+Target pairs: ${stats.critiquePairs}`);
  console.log(`  Skipped:           ${stats.skipped}`);
  console.log(`  Errors:            ${stats.errors}`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  if (results.length > 0) {
    console.log('\n📄 Saved critiques:');
    results.forEach(r => {
      const target = r.hasTarget ? '(+ target)' : '(no target)';
      console.log(`   • ${r.title}`);
      console.log(`     Type: ${r.classification.critique_type} ${target}`);
      console.log(`     Target: ${r.classification.target_description}`);
    });
  }
  
  console.log(`\n✅ Done! Files saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
