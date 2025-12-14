#!/bin/bash
# Build script to create extension zip for distribution

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="${1:-$ROOT_DIR/backend/public}"

echo "Building extension zip..."
echo "Root dir: $ROOT_DIR"
echo "Output dir: $OUTPUT_DIR"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Create temp directory for clean extension files
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Copy extension files
EXTENSION_FILES=(
    "manifest.json"
    "popup.html"
    "popup.js"
    "styles.css"
    "content.js"
    "content-styles.css"
    "background.js"
    "debug.js"
    "icon16.png"
    "icon48.png"
    "icon128.png"
)

for file in "${EXTENSION_FILES[@]}"; do
    if [ -f "$ROOT_DIR/$file" ]; then
        cp "$ROOT_DIR/$file" "$TEMP_DIR/"
        echo "  Copied: $file"
    else
        echo "  Warning: $file not found"
    fi
done

# Create zip
cd "$TEMP_DIR"
zip -r "$OUTPUT_DIR/logic-checker-extension.zip" . -x "*.DS_Store"

echo ""
echo "✓ Extension zip created: $OUTPUT_DIR/logic-checker-extension.zip"
ls -lh "$OUTPUT_DIR/logic-checker-extension.zip"

