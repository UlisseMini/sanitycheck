// ABOUTME: E2E test that uses TEST_TRIGGER message to trigger extension analysis programmatically.
// ABOUTME: Uses Playwright with extension service worker to test real production code path.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runE2ETest() {
  console.log('🧪 Starting SanityCheck E2E Test\n');

  const extensionPath = path.join(__dirname, 'build/extension');

  // Create timestamped screenshots directory for this run
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').slice(0, -5);
  const screenshotsDir = path.join(__dirname, 'screenshots', `run-${timestamp}`);

  if (fs.existsSync(screenshotsDir)) {
    fs.rmSync(screenshotsDir, { recursive: true });
  }
  fs.mkdirSync(screenshotsDir, { recursive: true });

  console.log('📦 Extension path:', extensionPath);
  console.log('📸 Screenshots will be saved to:', screenshotsDir);

  // Launch Chrome with extension
  console.log('\n🚀 Launching Chrome with extension...');
  const browserContext = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  const page = await browserContext.newPage();

  try {
    // Load test article
    const testArticlePath = path.join(__dirname, 'test-article.html');
    console.log('\n📄 Loading test article...');
    await page.goto(`file://${testArticlePath}`);
    await page.bringToFront(); // Ensure this is the active tab
    await page.waitForTimeout(1000);
    console.log('✅ Article loaded');

    // Screenshot 1: Article loaded
    await page.screenshot({
      path: path.join(screenshotsDir, '01-article-loaded.png'),
      fullPage: true
    });
    console.log('📸 Screenshot: 01-article-loaded.png');

    // Get extension service worker
    const serviceWorkers = browserContext.serviceWorkers();
    if (serviceWorkers.length === 0) {
      throw new Error('No service worker found - extension did not load');
    }
    const serviceWorker = serviceWorkers[0];
    console.log('✅ Service worker found');

    // Get Chrome tab ID
    const tabId = await serviceWorker.evaluate(async () => {
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      return tabs[0]?.id;
    });

    if (!tabId) {
      throw new Error('Could not get tab ID');
    }

    console.log('📍 Tab ID:', tabId);

    // Trigger analysis by calling handleTestTrigger directly
    console.log('\n🎬 Triggering analysis...');

    // Note: We let the extension use CSS Highlight API since it's available,
    // but we acknowledge that CSS highlights may not appear in Playwright screenshots.
    // The test verifies that highlights ARE being applied (CSS.highlights.size > 0)
    // even if they don't render visually in screenshots.
    const result = await serviceWorker.evaluate(async (tabId) => {
      try {
        // Call the exposed handleTestTrigger function
        const response = await globalThis.handleTestTrigger(tabId);
        return { success: true, result: response };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, tabId);

    console.log('📬 Result received:', result);
    if (!result) {
      throw new Error('No response from handleTestTrigger');
    }
    if (!result.success) {
      throw new Error(`Analysis trigger failed: ${result.error}`);
    }
    console.log('✅ Analysis triggered successfully');

    // Screenshot 2: Immediately after triggering (should have NO highlights yet)
    await page.screenshot({
      path: path.join(screenshotsDir, '02-analysis-triggered-no-highlights.png'),
      fullPage: true
    });
    console.log('📸 Screenshot: 02-analysis-triggered-no-highlights.png');

    // Wait for highlights to appear (CSS Highlight API)
    console.log('\n⏳ Waiting for highlights to appear...');
    let highlightCount = 0;
    let waitIterations = 0;
    for (let i = 0; i < 40; i++) {
      highlightCount = await page.evaluate(() => {
        return CSS.highlights ? CSS.highlights.size : 0;
      });
      if (highlightCount > 0) {
        waitIterations = i;
        break;
      }
      await page.waitForTimeout(1000);
    }

    if (highlightCount === 0) {
      throw new Error('No highlights found after 40 seconds');
    }

    console.log(`✅ Found ${highlightCount} CSS Highlight API groups (appeared after ${waitIterations} seconds)`);
    console.log('ℹ️  Note: CSS Highlight API highlights do not appear in Playwright screenshots');
    console.log('ℹ️  This is a known limitation - highlights work in real browser usage');

    // Wait a moment before screenshot
    await page.waitForTimeout(500);

    // Screenshot 3: Highlights applied
    await page.screenshot({
      path: path.join(screenshotsDir, '03-highlights-appeared.png'),
      fullPage: true
    });
    console.log('📸 Screenshot: 03-highlights-appeared.png');

    // Debug: Show CSS Highlight API details
    const debugInfo = await page.evaluate(() => {
      const highlights = [];
      if (CSS.highlights) {
        CSS.highlights.forEach((highlight, name) => {
          highlights.push({
            name: name,
            rangeCount: highlight.size
          });
        });
      }

      return {
        cssHighlightAPIAvailable: typeof CSS !== 'undefined' && 'highlights' in CSS,
        highlightGroups: highlights,
        totalRanges: highlights.reduce((sum, h) => sum + h.rangeCount, 0)
      };
    });

    console.log('\n🔍 Highlight verification:', JSON.stringify(debugInfo, null, 2));

    // Screenshot 4: Final verification
    await page.screenshot({
      path: path.join(screenshotsDir, '04-final-verification.png'),
      fullPage: true
    });
    console.log('📸 Screenshot: 04-final-verification.png');

    console.log('\n✅ E2E TEST PASSED');
    console.log('\n📁 All screenshots saved to:', screenshotsDir);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ path: path.join(screenshotsDir, 'test-failure.png') });
    throw error;
  } finally {
    await browserContext.close();
  }
}

runE2ETest().catch(error => {
  console.error('Fatal:', error);
  process.exit(1);
});
