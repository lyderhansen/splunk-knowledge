#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "=== Installing dependencies ==="
npm install --silent

echo "=== Building webpack ==="
npx webpack --config webpack.config.js

echo "=== Verifying bundles ==="
for viz in battery_gauge range_kpi charge_gauge thermal_table energy_area regen_donut; do
    bundle="appserver/static/visualizations/$viz/visualization.js"
    if [ ! -f "$bundle" ]; then
        echo "FATAL: Missing $bundle"
        exit 1
    fi
    head_bytes=$(head -c 100 "$bundle")
    if echo "$head_bytes" | grep -q "define("; then
        echo "  OK: $viz — AMD wrapper present"
    else
        echo "  WARN: $viz — no AMD wrapper detected"
    fi
    if grep -q "=>" "$bundle"; then
        echo "  FATAL: $viz — arrow functions found in bundle"
        exit 1
    fi
done

echo "=== Packaging tarball ==="
cd ..
find porsche_taycan_viz -name '._*' -delete 2>/dev/null || true
find porsche_taycan_viz -name '.DS_Store' -delete 2>/dev/null || true
rm -f porsche_taycan_viz/dist/porsche_taycan_viz.tar.gz

mkdir -p porsche_taycan_viz/dist
COPYFILE_DISABLE=1 tar czf porsche_taycan_viz/dist/porsche_taycan_viz.tar.gz \
    --exclude='*/node_modules' \
    --exclude='*/src' \
    --exclude='*/dist' \
    --exclude='*/package.json' \
    --exclude='*/package-lock.json' \
    --exclude='*/webpack.config.js' \
    --exclude='*/build.sh' \
    --exclude='*/.DS_Store' \
    porsche_taycan_viz

echo "=== Done ==="
ls -lh porsche_taycan_viz/dist/porsche_taycan_viz.tar.gz
