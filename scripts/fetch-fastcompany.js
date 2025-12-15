#!/usr/bin/env node
/**
 * Try alternative method for Fast Company article that blocks simple requests
 */

const https = require('https');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const fs = require('fs');
const path = require('path');

const url = 'https://www.fastcompany.com/90458795/humans-are-hardwired-to-dismiss-facts-that-dont-fit-their-worldview';
const OUTPUT_DIR = path.join(__dirname, '..', 'articles');

async function fetchWithBrowserHeaders(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 30000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http') 
          ? res.headers.location 
          : new URL(res.headers.location, url).href;
        fetchWithBrowserHeaders(redirectUrl).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        // Handle gzip
        if (res.headers['content-encoding'] === 'gzip') {
          const zlib = require('zlib');
          zlib.gunzip(buffer, (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded.toString());
          });
        } else {
          resolve(buffer.toString());
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  try {
    console.log('📥 Attempting to fetch Fast Company article with browser headers...');
    const html = await fetchWithBrowserHeaders(url);
    
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    if (!article || !article.textContent || article.textContent.length < 100) {
      console.log('❌ Failed to extract content');
      return;
    }
    
    const cleanText = article.textContent
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/^\s+|\s+$/gm, '')
      .trim();
    
    const content = `Title: ${article.title}
URL: ${url}

Type: Target Article (being critiqued)
Description: Fast Company article on confirmation bias
Length: ${cleanText.length} characters

---

${cleanText}`;
    
    const filepath = path.join(OUTPUT_DIR, 'target-fastcompany-confirmation-bias.txt');
    fs.writeFileSync(filepath, content, 'utf-8');
    
    console.log(`✅ Saved as: target-fastcompany-confirmation-bias.txt`);
    console.log(`📊 Length: ${cleanText.length} chars`);
    
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
  }
}

main();
