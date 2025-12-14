#!/bin/bash
# Build script for local development - bundles content.js with Readability
# For production, use: node scripts/bundle-extension.js

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
EXTENSION_DIR="$ROOT_DIR/extension"
OUTPUT_DIR="${1:-$ROOT_DIR/dist}"

echo "Building extension for local development..."
echo "Root dir: $ROOT_DIR"
echo "Extension dir: $EXTENSION_DIR"
echo "Output dir: $OUTPUT_DIR"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Step 1: Bundle content.js with Readability using esbuild
echo ""
echo "Bundling content.js with Readability..."
if [ -f "$EXTENSION_DIR/content.src.js" ]; then
    npx esbuild "$EXTENSION_DIR/content.src.js" \
        --bundle \
        --outfile="$OUTPUT_DIR/content.js" \
        --format=iife \
        --target=chrome100
    echo "✓ content.js bundled with Readability"
else
    echo "Warning: content.src.js not found, copying content.js directly"
    cp "$EXTENSION_DIR/content.js" "$OUTPUT_DIR/content.js" 2>/dev/null || true
fi

# Step 2: Copy static files
echo ""
echo "Copying static files..."
STATIC_FILES=(
    "manifest.json"
    "popup.html"
    "popup.js"
    "settings.html"
    "settings.js"
    "welcome.html"
    "styles.css"
    "content-styles.css"
    "background.js"
    "debug.js"
    "icon16.png"
    "icon48.png"
    "icon128.png"
)

for file in "${STATIC_FILES[@]}"; do
    if [ -f "$EXTENSION_DIR/$file" ]; then
        cp "$EXTENSION_DIR/$file" "$OUTPUT_DIR/"
        echo "  Copied: $file"
    else
        echo "  Warning: $file not found"
    fi
done

echo ""
echo "✓ Extension built to: $OUTPUT_DIR"
echo ""
echo "To test locally:"
echo "  1. Open chrome://extensions"
echo "  2. Enable 'Developer mode'"
echo "  3. Click 'Load unpacked' and select: $OUTPUT_DIR"
