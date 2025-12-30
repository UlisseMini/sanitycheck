# E2E Testing Implementation Plan

## Current State (as of 2025-12-29)

### What Works
- ✅ Backend server runs and API endpoint `/analyze` works correctly
- ✅ API successfully analyzes articles and returns logical issues
- ✅ Playwright can launch Chrome with the extension loaded
- ✅ Extension files built in `build/extension/`
- ✅ Test article created at `test-article.html`
- ✅ Basic test script at `test-e2e-simple.js`

### What Doesn't Work
- ❌ Cannot programmatically click Chrome extension toolbar icon (Chrome security restriction)
- ❌ Cannot trigger extension analysis automatically in tests
- ❌ Content script doesn't auto-inject on file:// URLs (manifest v3 limitation)

### The Core Problem

Chrome deliberately prevents automation tools from clicking extension icons in the toolbar. This is a security feature that cannot be bypassed. Even using:
- Chrome DevTools Protocol (CDP)
- Playwright's service worker access
- Direct tab injection via `chrome.scripting.executeScript`

...we still cannot trigger the extension the way a real user would (clicking the icon).

## The Solution: Test-Mode Extension Build

### Strategy

Create a **separate test build** of the extension that:
1. Is 99.9% identical to production code
2. Adds ONE test-only message handler to background.js
3. Allows tests to trigger analysis programmatically via the service worker
4. Tests the REAL production code path

### Why This Works

The popup does this:
```
User clicks icon → popup.js loads → calls checkPage(tabId) →
  → injects content.js → sends extractArticle message →
  → content script extracts text → sends to backend →
  → highlights issues on page
```

Our test does this:
```
Test sends TEST_TRIGGER message → background.js calls checkPage(tabId) →
  → [SAME PATH AS ABOVE]
```

We're testing the EXACT same code, just triggering it differently.

## Implementation Steps

### Step 1: Add Test Message Handler to Background Script

**File:** `src/extension/background.ts`

Add this handler (can be conditional on build mode):

```typescript
// Test-only trigger (removed in production builds)
if (process.env.BUILD_MODE === 'test') {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'TEST_TRIGGER' && message.tabId) {
      // Call the exact same function that popup uses
      handleTestTrigger(message.tabId)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Indicates async response
    }
  });
}

async function handleTestTrigger(tabId: number) {
  // Inject content script (same as popup does)
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  });

  // Send extractArticle message (same as popup does)
  const response = await chrome.tabs.sendMessage(tabId, {
    action: 'extractArticle'
  });

  return response;
}
```

### Step 2: Update Build Script

**File:** `scripts/build.js`

Add support for test builds:

```javascript
const buildMode = process.env.BUILD_MODE || 'production';

// When building, set the BUILD_MODE env var
esbuild.build({
  // ... existing config
  define: {
    'process.env.BUILD_MODE': JSON.stringify(buildMode)
  }
});
```

Add npm script:
```json
{
  "scripts": {
    "build:test": "BUILD_MODE=test node scripts/build.js"
  }
}
```

### Step 3: Update E2E Test Script

**File:** `test-e2e-simple.js`

Update to use the test trigger:

```javascript
async function runE2ETest() {
  console.log('🧪 Starting SanityCheck E2E Test\n');

  const extensionPath = path.join(__dirname, 'build/extension');

  // Launch Chrome with extension
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
    await page.goto(`file://${__dirname}/test-article.html`);
    console.log('✅ Article loaded');

    // Get extension service worker
    const serviceWorker = browserContext.serviceWorkers()[0];

    // Get Chrome tab ID
    const tabs = await serviceWorker.evaluate(async () => {
      const allTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      return allTabs[0]?.id;
    });

    console.log('📍 Tab ID:', tabs);

    // Trigger analysis via test message
    console.log('\n🎬 Triggering analysis...');
    const result = await serviceWorker.evaluate(async (tabId) => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TEST_TRIGGER', tabId },
          (response) => resolve(response)
        );
      });
    }, tabs);

    console.log('✅ Analysis triggered:', result);

    // Wait for highlights to appear
    console.log('\n⏳ Waiting for highlights...');
    await page.waitForSelector('.sanitycheck-highlight', { timeout: 40000 });

    // Count highlights
    const count = await page.locator('.sanitycheck-highlight').count();
    console.log(`✅ Found ${count} highlighted issues`);

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/test-success.png',
      fullPage: true
    });

    // Validate results
    const issues = await page.evaluate(() => {
      const highlights = document.querySelectorAll('.sanitycheck-highlight');
      return Array.from(highlights).map(h => ({
        text: h.textContent.slice(0, 50) + '...',
        importance: h.className.includes('critical') ? 'critical' : 'significant'
      }));
    });

    console.log('\n📊 Issues found:', JSON.stringify(issues, null, 2));
    console.log('\n✅ E2E TEST PASSED');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ path: 'screenshots/test-failure.png' });
    throw error;
  } finally {
    await browserContext.close();
  }
}
```

### Step 4: Handle Welcome Page Issue

The extension opens a welcome page on first install. Fix this:

**Option A:** Disable welcome page in test builds

In `src/extension/background.ts`:
```typescript
if (process.env.BUILD_MODE !== 'test') {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({ url: 'welcome.html' });
  });
}
```

**Option B:** In test, focus the test page after loading

```javascript
await page.goto(`file://${__dirname}/test-article.html`);
await page.bringToFront(); // Ensure it's the active tab
await page.waitForTimeout(500);
```

### Step 5: Add Test to CI/CD

**File:** `.github/workflows/test.yml` (create if doesn't exist)

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build test extension
        run: npm run build:test

      - name: Start backend
        run: |
          docker-compose up -d
          npx prisma migrate deploy
          npm run dev &
          sleep 5
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/sanitycheck

      - name: Install Playwright
        run: npx playwright install chromium

      - name: Run E2E tests
        run: node test-e2e-simple.js

      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: screenshots/
```

## Testing the Implementation

### Manual Test Run

1. Build test extension:
```bash
npm run build:test
```

2. Start backend:
```bash
docker-compose up -d
npx prisma migrate deploy
npm run dev
```

3. Run test:
```bash
node test-e2e-simple.js
```

4. Check screenshots in `screenshots/` directory

### Expected Output

```
🧪 Starting SanityCheck E2E Test

📦 Extension path: /Users/.../build/extension

🚀 Launching Chrome with extension...

📄 Loading test article...
✅ Article loaded
📍 Tab ID: 123456

🎬 Triggering analysis...
✅ Analysis triggered: { success: true }

⏳ Waiting for highlights...
✅ Found 4 highlighted issues

📊 Issues found: [
  {
    "text": "This is obvious because technology always improves...",
    "importance": "critical"
  },
  {
    "text": "Since AI is improving, it follows that it will...",
    "importance": "critical"
  },
  {
    "text": "Cars, planes, and nuclear weapons have never...",
    "importance": "significant"
  },
  {
    "text": "Anyone who disagrees with this assessment is...",
    "importance": "significant"
  }
]

✅ E2E TEST PASSED
```

## File Structure After Implementation

```
sanitycheck/
├── src/extension/
│   ├── background.ts          # Modified: Add TEST_TRIGGER handler
│   └── ...
├── scripts/
│   └── build.js               # Modified: Support BUILD_MODE env var
├── test-article.html          # Exists: Test article with logical fallacies
├── test-e2e-simple.js         # Modified: Use TEST_TRIGGER
├── package.json               # Modified: Add build:test script
├── .github/workflows/
│   └── test.yml               # New: CI/CD pipeline
└── docs/plans/
    └── e2e-testing-implementation.md  # This file
```

## Minimal Coupling Analysis

### What Changes in Production Code
- **One conditional message handler** in background.ts (~15 lines)
- **One build-time environment variable** check
- **Optional: Conditional welcome page** (~2 lines)

### What Doesn't Change
- ❌ No test mocks
- ❌ No fake API responses
- ❌ No stubbed functions
- ❌ No test-specific UI changes

### Test Coverage
- ✅ Content script injection
- ✅ Article extraction with Readability
- ✅ Message passing (content ↔ background)
- ✅ Backend API calls
- ✅ Response parsing
- ✅ DOM manipulation (highlighting)
- ✅ CSS styling of highlights
- ✅ Error handling

## Alternative Approaches (Rejected)

### 1. Manual Testing Only
**Rejected because:** Can't run in CI/CD, no regression protection

### 2. Mock Everything
**Rejected because:** Doesn't test real integration, misses real bugs

### 3. Selenium IDE Extension Recorder
**Rejected because:** Still can't click extension icons, same problem

### 4. Use `chrome.debugger` API
**Rejected because:** Still can't access toolbar, overly complex

### 5. Expose Everything via Content Script
**Rejected because:** Violates extension security model, too coupled

## Future Enhancements

1. **Multiple test scenarios:**
   - Test on different article types
   - Test error handling (network failures)
   - Test edge cases (empty articles, malformed HTML)

2. **Visual regression testing:**
   - Compare screenshots to baseline
   - Detect UI regressions

3. **Performance testing:**
   - Measure analysis time
   - Check for memory leaks

4. **Cross-browser testing:**
   - Firefox (needs different extension format)
   - Edge (uses Chromium, should work)

## Notes for Fresh Developer

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL)
- Chrome/Chromium installed

### Quick Start
```bash
# Install dependencies
npm install

# Build test extension
npm run build:test

# Start database
docker-compose up -d
npx prisma migrate deploy

# Start backend (in separate terminal)
npm run dev

# Run E2E test
node test-e2e-simple.js
```

### Troubleshooting

**"Tab not found"**
- The welcome page opened and became active
- Solution: Use `page.bringToFront()` after loading test article

**"Timeout waiting for highlights"**
- Backend not running
- Wrong API URL in extension config
- Check screenshots/error.png for visual debugging

**"Service worker not found"**
- Extension didn't load
- Check extension path in test script
- Verify build completed successfully

### Key Files to Understand
1. `src/extension/popup.ts` - Shows how real user triggers analysis
2. `src/extension/background.ts` - Where TEST_TRIGGER handler goes
3. `src/extension/content.ts` - Does the actual article extraction and highlighting
4. `test-e2e-simple.js` - The test script
5. `test-article.html` - Test fixture with known logical issues

## Success Criteria

✅ Test runs in under 60 seconds
✅ Test passes consistently (99%+ success rate)
✅ Tests real production code (not mocks)
✅ Minimal coupling (<20 lines of test-specific code)
✅ Can run in CI/CD
✅ Provides clear failure messages with screenshots
✅ Documents regression when bugs are introduced

## Questions to Answer During Implementation

1. Should TEST_TRIGGER be removed in production builds entirely?
   - **Recommendation:** Yes, use `if (process.env.BUILD_MODE === 'test')`

2. Should we use a separate test manifest?
   - **Recommendation:** No, same manifest, just different build

3. How to handle API keys in tests?
   - **Recommendation:** Use environment variables, same as dev

4. Should tests run headless?
   - **Recommendation:** No, headless doesn't support extensions well
   - But can use virtual display (Xvfb) in CI

5. How to prevent test pollution between runs?
   - **Recommendation:** Use fresh browser context each run (Playwright does this)

## Estimated Implementation Time

- Step 1 (Test handler): **30 minutes**
- Step 2 (Build script): **15 minutes**
- Step 3 (Test script): **45 minutes**
- Step 4 (Welcome page): **15 minutes**
- Step 5 (CI/CD): **30 minutes**
- Testing & debugging: **60 minutes**

**Total: ~3 hours** for a working E2E test suite
