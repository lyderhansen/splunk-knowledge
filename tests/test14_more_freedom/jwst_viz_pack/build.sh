#!/bin/bash
set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="jwst_viz_pack"

echo "=== Building $APP_NAME ==="

# Check for npm/npx
if ! command -v npx &> /dev/null; then
    echo "ERROR: npx not found. Install Node.js first."
    exit 1
fi

# Install webpack if needed
if [ ! -d "$APP_DIR/node_modules" ]; then
    echo "Installing webpack..."
    cd "$APP_DIR"
    npm init -y --silent 2>/dev/null
    npm install --save-dev webpack webpack-cli 2>/dev/null
fi

# Build each visualization
for VIZ_DIR in "$APP_DIR/default/visualizations"/jwst_*/; do
    VIZ_NAME=$(basename "$VIZ_DIR")
    if [ -f "$VIZ_DIR/webpack.config.js" ]; then
        echo "  Building $VIZ_NAME..."
        cd "$VIZ_DIR"
        npx webpack --config webpack.config.js 2>&1 | tail -3
    fi
done

# Verify builds
echo ""
echo "=== Verifying builds ==="
PASS=0
FAIL=0
for VIZ_DIR in "$APP_DIR/default/visualizations"/jwst_*/; do
    VIZ_NAME=$(basename "$VIZ_DIR")
    BUILT="$VIZ_DIR/visualization.js"
    if [ -f "$BUILT" ]; then
        HEADER=$(head -c 60 "$BUILT")
        if echo "$HEADER" | grep -q 'define(\['; then
            echo "  OK  $VIZ_NAME — AMD wrapper present"
            PASS=$((PASS + 1))
        else
            echo "  FAIL $VIZ_NAME — missing AMD wrapper"
            FAIL=$((FAIL + 1))
        fi
    else
        echo "  FAIL $VIZ_NAME — visualization.js not found"
        FAIL=$((FAIL + 1))
    fi
done

echo ""
echo "Results: $PASS passed, $FAIL failed"

if [ $FAIL -gt 0 ]; then
    echo "Fix failures before packaging."
    exit 1
fi

# Package
echo ""
echo "=== Packaging ==="
DIST_DIR="$APP_DIR/dist"
mkdir -p "$DIST_DIR"

# Clean macOS artifacts
find "$APP_DIR" -name '._*' -delete 2>/dev/null
find "$APP_DIR" -name '.DS_Store' -delete 2>/dev/null

# Remove old package
rm -f "$DIST_DIR/$APP_NAME.tar.gz"

# Create tarball (exclude dev files)
cd "$APP_DIR/.."
COPYFILE_DISABLE=1 tar czf "$DIST_DIR/$APP_NAME.tar.gz" \
    --exclude='node_modules' \
    --exclude='src' \
    --exclude='dist' \
    --exclude='*.sh' \
    --exclude='package*.json' \
    --exclude='webpack.config.js' \
    --exclude='*.woff*' \
    --exclude='*_b64.txt' \
    --exclude='font_css_block.txt' \
    --exclude='DESIGN_BRIEF.md' \
    --exclude='.*' \
    "$APP_NAME"

echo "  Package: $DIST_DIR/$APP_NAME.tar.gz"
echo "  Size: $(du -sh "$DIST_DIR/$APP_NAME.tar.gz" | cut -f1)"
echo ""
echo "=== Done ==="
echo "Install: Splunk > Manage Apps > Install app from file"
