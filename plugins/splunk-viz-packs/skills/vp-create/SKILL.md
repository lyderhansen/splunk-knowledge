---
name: vp-create
description: "Builds and packages Splunk custom visualization apps — flat AMD compilation, post-build validation, and tarball packaging ready for Splunk install."
when_to_use: "Use when building, validating, or packaging a viz app. Triggers on 'build app', 'package tarball', 'deploy viz', 'validate build', 'create tarball'."
disable-model-invocation: true
allowed-tools: Bash(node *) Bash(tar *) Bash(find *) Bash(wc *) Bash(chmod *)
model: sonnet
---

# vp-create — build and package a viz app

## Workflow

```
Task Progress:
- [ ] Step 1: Build flat AMD bundles
- [ ] Step 2: Validate all vizs
- [ ] Step 3: Fix any failures
- [ ] Step 4: Package tarball
- [ ] Step 5: Verify archive
- [ ] Step 6: Report completion
```

## Step 1: Build (flat AMD)

```bash
node ${CLAUDE_SKILL_DIR}/scripts/build_flat.js /path/to/app
```

This inlines theme.js into each viz and wraps as AMD module.

## Step 2: Validate

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/validate_viz.sh /path/to/app
```

CRITICAL: Do NOT package if validation fails. Fix and re-validate.

## Step 3: Fix failures

Common fixes:
- `FAIL B10`: Replace hardcoded namespace with `{{VIZ_NAMESPACE}}`
- `FAIL B7`: Replace `default=` with `value=`
- `FAIL B5`: Add `type="custom"` to color picker
- `FAIL B20`: Change themeMode default from "dark" to "auto"
- `FAIL F3`: Replace const/let/arrow with var/function

After fixing, re-run build (step 1) then validate (step 2).

## Step 3b: Generate app icons (MANDATORY)

Without app icons, Splunk shows a generic grey placeholder in the app list.
Run this BEFORE packaging — it takes 2 seconds.

```python
python3 -c "
from PIL import Image, ImageDraw, ImageFont
import os, sys
app_dir = sys.argv[1]
accent = sys.argv[2]  # e.g. '#635BFF'
initial = sys.argv[3] # e.g. 'S'
os.makedirs(os.path.join(app_dir, 'static'), exist_ok=True)
for size, name in [(36,'appIcon.png'),(72,'appIcon_2x.png'),(36,'appIconAlt.png'),(72,'appIconAlt_2x.png')]:
    img = Image.new('RGB', (size, size), accent)
    draw = ImageDraw.Draw(img)
    fs = size // 2
    try: font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', fs)
    except: font = ImageFont.load_default()
    draw.text((size//2, size//2), initial, fill='#FFFFFF', font=font, anchor='mm')
    img.save(os.path.join(app_dir, 'static', name))
print('OK — 4 icons generated in static/')
" /path/to/app "#ACCENT" "X"
```

Replace `/path/to/app`, `#ACCENT` (brand accent hex), and `X` (first letter of app name).

## Step 3c: Generate preview.png per viz (MANDATORY)

Each viz needs `preview.png` at 250x150. Shown in Splunk viz picker. Without it, the viz appears as a black box.

```python
python3 -c "
from PIL import Image, ImageDraw
import sys
out = sys.argv[1]    # e.g. /path/to/app/appserver/static/visualizations/my_viz/preview.png
accent = sys.argv[2] # e.g. '#635BFF'
bg = sys.argv[3]     # e.g. '#1A1A2E'
img = Image.new('RGB', (250, 150), bg)
draw = ImageDraw.Draw(img)
# Draw a simplified viz silhouette — bars, arcs, or chart shape
for i in range(5):
    bh = 30 + (i * 15) % 80
    draw.rectangle([30 + i*42, 150 - bh, 30 + i*42 + 32, 150], fill=accent)
img.save(out)
print('OK — ' + out)
" /path/to/viz/preview.png "#ACCENT" "#BG"
```

Adapt the silhouette shape to match the viz type (bars for bar charts, arc for gauges, grid for tables, etc.).

## Step 4: Package

```bash
APP_DIR="/absolute/path/to/app"
PARENT_DIR="$(dirname "$APP_DIR")"
APP_NAME="$(basename "$APP_DIR")"
cd "$PARENT_DIR"

find "$APP_NAME" -name '._*' -delete
find "$APP_NAME" -name '.DS_Store' -delete
rm -f "${APP_NAME}.tar.gz"

COPYFILE_DISABLE=1 tar czf "${APP_NAME}.tar.gz" \
  --exclude='._*' \
  --exclude='.DS_Store' \
  --exclude='.git*' \
  --exclude='node_modules' \
  --exclude='_build' \
  --exclude='*.tar.gz' \
  --exclude='src' \
  --exclude='*/shared' \
  --exclude='build_flat.js' \
  "$APP_NAME"
```

ALWAYS use absolute paths. Build steps may change cwd.

## Step 5: Verify archive

```bash
tar tzf "${APP_NAME}.tar.gz" | head -1
# Must be: ${APP_NAME}/

tar tzf "${APP_NAME}.tar.gz" | grep '\.tar\.gz' && echo "ERROR: nested archive!" && exit 1

SIZE=$(wc -c < "${APP_NAME}.tar.gz")
[ "$SIZE" -lt 1000 ] && echo "ERROR: archive too small ($SIZE bytes)" && exit 1
echo "OK — $SIZE bytes"
```

## Step 6: Completion output

```
Viz pack ready for install

  File: {{PACK_ID}}.tar.gz
  Path: /full/absolute/path/to/{{PACK_ID}}.tar.gz
  Size: XX KB
  Vizs: viz1, viz2, viz3

Install: Upload via Splunk Web → Manage Apps → Install from File
Restart: Required for static images to be served
```

## Nav bar template

```xml
<nav search_view="search" color="{{ACCENT_HEX}}">
  <view name="{{DASHBOARD_VIEW}}" default="true" />
  <view name="search" />
</nav>
```

Save to `default/data/ui/nav/default.xml`.

## Packaging checklist

```
- [ ] validate_viz.sh passed (zero FAIL)
- [ ] App icons generated (step 3b — static/appIcon.png exists)
- [ ] Preview.png generated per viz (step 3c — each viz dir has preview.png)
- [ ] Tarball > 1KB
- [ ] No nested .tar.gz in archive
- [ ] Top-level dir matches app name
- [ ] build in app.conf incremented
- [ ] No src/ or node_modules/ in archive
- [ ] No .DS_Store or ._* files
- [ ] Nav bar exists (default.xml)
- [ ] Light theme tested (themeMode=light in formatter, verify text is readable)
```
