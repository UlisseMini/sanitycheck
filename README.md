# Logic Checker Chrome Extension

A Chrome extension that analyzes web articles for logical fallacies and non-sequiturs using AI, then highlights problematic passages directly in the article.

## Features

- 🔍 **Smart Article Detection**: Automatically detects if a page is an article
- 🧠 **AI-Powered Analysis**: Uses Claude 4.5 Sonnet to identify logical fallacies
- ⚠️ **Visual Highlighting**: Highlights problematic passages with importance-based colors
- 💡 **Hover Tooltips**: Hover over highlights to see brief explanations
- 🎯 **Central Gap Detection**: Identifies the main logical gap in the argument
- 🔴🟠🟡 **Importance Levels**: Critical, significant, and minor issues color-coded

## Installation

### Step 1: Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Navigate to and select this directory
5. The extension should now appear in your extensions list

### Step 2: Pin the Extension (Optional)

1. Click the **Extensions** icon (puzzle piece) in Chrome's toolbar
2. Find **"Logic Checker"** and click the **pin icon**

### Step 3: Get Your API Key

1. Get your Replicate API key from [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
2. Click the extension icon
3. Enter your API key in the input field
4. Click **Save**

## Usage

1. Navigate to any article
2. Click the **Logic Checker** extension icon
3. Click **"Analyze for Fallacies"**
4. Wait for analysis (30-90 seconds for Claude 4.5 Sonnet)
5. View results in the popup AND see highlights in the article
6. **Hover over highlighted text** to see explanations

## How It Works

1. **Article Extraction**: Extracts main article text from the page
2. **AI Analysis**: Sends text to Claude 4.5 Sonnet via Replicate API
3. **Logic Check**: AI identifies logical gaps, non-sequiturs, and fallacies
4. **Central Gap**: Identifies the main logical weakness in the argument
5. **Highlighting**: Color-codes issues by importance (red/yellow/gray)
6. **Tooltips**: Shows brief explanations on hover

## What It Detects

- **Non-sequiturs**: Conclusions that don't follow from premises
- **Conflation**: Treating "X is hard" as "X is impossible"
- **Circular reasoning**: Conclusion assumed in premises
- **Inconsistent rules**: Principle used for X but ignored for Y
- **Unsupported claims**: "X is impossible/optimal" without proof
- **Hasty generalizations**: Broad claims from limited evidence
- **False dichotomies**: Only two options when more exist
- **Genetic fallacies**: Dismissing ideas based on origin

## Project Structure

```
sanitycheck/
├── manifest.json       # Extension configuration
├── popup.html          # Extension popup UI
├── popup.js            # Main extension logic
├── content.js          # Article extraction & highlighting
├── styles.css          # Extension styling
├── debug.js            # Debug logging utility
├── icon*.png           # Extension icons
├── README.md           # This file
└── debug-server/       # Debug server (optional)
    ├── debug-server.js
    ├── package.json
    └── package-lock.json
```

## Debug Server (Optional)

For development/debugging, you can run a local server to capture logs.

```bash
cd debug-server
npm install
npm start
```

Server runs on `http://localhost:3000`:
- `POST /debug/log` - Receive logs
- `GET /debug/logs` - View logs
- `DELETE /debug/logs` - Clear logs
- `GET /debug/health` - Health check

Logs are written to `debug-server/debug.log`.

## Notes

- Analyzes **logical structure only**, not factual accuracy
- Works best with traditional article formats
- Analysis takes 30-90 seconds (Claude 4.5 Sonnet)
- Requires active internet connection
- Debug server is optional (logs queue if unavailable)
