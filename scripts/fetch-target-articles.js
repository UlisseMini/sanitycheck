#!/usr/bin/env node
/**
 * Fetch specific target articles referenced in critique files
 * Uses Readability to extract clean article text
 */

const https = require('https');
const http = require('http');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'articles');

// Target articles to fetch
const TARGETS = [
  {
    name: 'io9-chemical-imbalance',
    url: 'https://gizmodo.com/the-most-popular-antidepressants-are-based-on-a-theory-1686163236',
    description: 'IO9 article on chemical imbalance theory'
  },
  {
    name: 'fastcompany-confirmation-bias',
    url: 'https://www.fastcompany.com/90458795/humans-are-hardwired-to-dismiss-facts-that-dont-fit-their-worldview',
    description: 'Fast Company article on confirmation bias'
  },
  {
    name: 'macintyre-cloth-masks-study',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4420971/',
    description: 'MacIntyre 2015 study on cloth masks'
  }
];

// Fetch URL with retry
async function fetchUrl(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, { 
          headers: { 
            'User-Agent': 'Mozilla/5.0 (compatible; research)',
            'Accept': 'text/html,application/xhtml+xml'
          },
          timeout: 30000
        }, (res) => {
          // Handle redirects
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
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Extract and clean article text
function extractArticle(html, url) {
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;
  
  const reader = new Readability(document, {
    charThreshold: 0 // Include all content
  });
  const article = reader.parse();
  
  if (!article) return null;
  
  // Clean up the text
  let cleanText = article.textContent
    .replace(/\n{3,}/g, '\n\n')  // Max 2 newlines
    .replace(/[ \t]{2,}/g, ' ')   // No multiple spaces
    .replace(/^\s+|\s+$/gm, '')   // Trim lines
    .trim();
  
  return {
    title: article.title?.trim() || 'Untitled',
    content: cleanText,
    excerpt: article.excerpt?.trim() || '',
    length: cleanText.length
  };
}

// Save article
function saveArticle(article, targetInfo) {
  const filename = `target-${targetInfo.name}.txt`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  const content = `Title: ${article.title}
URL: ${targetInfo.url}

Type: Target Article (being critiqued)
Description: ${targetInfo.description}
Length: ${article.length} characters

---

${article.content}`;
  
  fs.writeFileSync(filepath, content, 'utf-8');
  return filename;
}

// Main
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Fetching Target Articles');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  for (const target of TARGETS) {
    try {
      console.log(`📥 Fetching: ${target.description}`);
      console.log(`   URL: ${target.url}`);
      
      const html = await fetchUrl(target.url);
      const article = extractArticle(html, target.url);
      
      if (!article || !article.content || article.content.length < 100) {
        console.log('   ❌ Failed to extract content\n');
        continue;
      }
      
      const filename = saveArticle(article, target);
      console.log(`   ✅ Saved as: ${filename}`);
      console.log(`   📊 Length: ${article.length} chars\n`);
      
      // Be nice to servers
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}\n`);
    }
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ Done!');
  console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(console.error);
