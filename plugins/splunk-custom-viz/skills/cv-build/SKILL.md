---
name: cv-build
description: "Validates, packages, and (on failure) diagnoses a splunk-custom-viz app. Make sure to use this skill after cv-create writes the source files, or whenever the user asks to package, tar, build, or deploy a Splunk custom viz pack. Produces .tar.gz (Classic) or .spl (Extension API) or both. Grep-based validation — no node_modules required. Includes 54 diagnostic rules loaded on demand when a viz fails."
---

# cv-build — validate, package, debug

This skill takes whatever cv-create wrote to disk and produces an installable Splunk artifact. It is intentionally the most mechanical skill in the plugin — no design decisions, no creative judgment, just the pipeline from source files to tarball.

## Prerequisite

A `<app_id>/` directory written by cv-create. A `DESIGN-LOCK.md` at `.cv/<app_id>/` for the fidelity check (optional but recommended).

## Workflow

```
Step 1: Build (Classic: build_flat.js | Extension: yarn build)
Step 2: Validate (grep-based)
Step 3: Generate assets (icons, gradient PNG, previews)
Step 4: Transcribe dashboard from DESIGN-LOCK.md
Step 5: Package (tar.gz and/or .spl)
Step 6: Verify archive
Step 7: Report
Step 8 (on failure): Diagnose using [references/diagnostic-rules.md](references/diagnostic-rules.md)
```

## Step 1 — Build

### Classic format

```bash
node ${CLAUDE_SKILL_PLUGIN_DIR}/../../scripts/build_flat.js <app_dir>
```

This inlines `shared/theme.js` into each viz and produces `visualization.js` (AMD-wrapped) per viz.

### Extension format

```bash
cd <app_dir>
yarn install
yarn build
```

This runs the per-viz `package.json` build scripts.

### Both format

Run both Classic and Extension build steps. They produce different output files so they don't conflict.

## Step 2 — Validate

```bash
bash ${CLAUDE_SKILL_PLUGIN_DIR}/../../scripts/validate.sh <app_dir> [.cv/<app_id>/DESIGN-LOCK.md]
```

Validation includes:

- **Compliance checks (FAIL)**: VIZ_NAMESPACE, value= vs default=, color picker type="custom", themeMode "auto", ES5 only, require() vs define(), no jQuery, app.conf [package] stanza, semver version, default.meta presence, no .DS_Store, no local/ dir
- **Soft checks (WARN)**: section count, hexFromSplunk wrapping, jQuery patterns
- **Fidelity checks (WARN)**: animations declared in DESIGN-LOCK.md vs requestAnimationFrame/setInterval in source; gradients declared vs createLinearGradient
- **Absolute bans grep (WARN)**: border-left/right > 1px (BAN-1), background-clip:text (BAN-2)

If validation exits with non-zero (any FAIL), STOP. Do not package. Load [references/diagnostic-rules.md](references/diagnostic-rules.md), match the FAIL code to a rule, and report actionable fix steps.

## Step 3 — Generate assets

```bash
node ${CLAUDE_SKILL_PLUGIN_DIR}/../../scripts/generate_assets.js <app_dir>
```

Produces:

- `static/appIcon.png` (36×36, brand accent background + white app initial)
- `static/appIcon_2x.png` (72×72)
- `appserver/static/images/bg_gradient.png` (1920×1080, branded gradient)
- `appserver/static/visualizations/<viz>/preview.png` per viz (116×76)

Asset generation reads `shared/theme.js` for brand colors. If theme.js is missing, this step fails.

## Step 4 — Transcribe dashboard from DESIGN-LOCK.md

If `.cv/<app_id>/DESIGN-LOCK.md` exists AND `DESIGN-LOCK.md.dashboard.panels` is non-empty, transcribe a Dashboard Studio v2 XML file. Read [references/dashboard-transcription.md](references/dashboard-transcription.md) for the exact template.

Outputs:

- `default/data/ui/views/<app_id>_overview.xml`
- Updated `default/data/ui/nav/default.xml` (with `<view name="<app_id>_overview" default="true" />`)

If no dashboard is defined in the lock (e.g., standalone mode), skip this step.

## Step 5 — Package

### Classic format

```bash
APP_DIR="<absolute path to app dir>"
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
  --exclude='*.tar.gz' \
  --exclude='src' \
  "$APP_NAME"
```

ALWAYS use absolute paths. `COPYFILE_DISABLE=1` is mandatory on macOS.

### Extension format

```bash
cd <app_dir>
yarn package
```

This produces `<app_dir>/<app_id>.spl`.

### Both format

Run both. The two artifacts coexist.

## Step 6 — Verify archive

```bash
# Classic
tar tzf "${APP_NAME}.tar.gz" | head -1
# Must be: ${APP_NAME}/
tar tzf "${APP_NAME}.tar.gz" | grep '\.tar\.gz' && echo "ERROR: nested archive!" && exit 1
SIZE=$(wc -c < "${APP_NAME}.tar.gz")
[ "$SIZE" -lt 1000 ] && echo "ERROR: archive too small ($SIZE bytes)" && exit 1
echo "OK — $SIZE bytes"

# Extension
ls -la <app_dir>/*.spl
unzip -l <app_dir>/*.spl | head -30
unzip -p <app_dir>/*.spl "*/default/visualizations.conf" | grep framework_type
# Must show: framework_type = studio_visualization
```

## Step 7 — Report

```
Build complete.

  Format:    classic | extension | both
  Artifact:  /full/path/to/<app_id>.tar.gz [(+ .spl)]
  Size:      XX KB
  Vizs:      <viz1>, <viz2>, ...
  Dashboard: <app_id>_overview (or "none" in standalone mode)

Install: Upload via Splunk Web → Manage Apps → Install from File
Restart: Required for static images to be served correctly
```

## Step 8 — Diagnose (only fires on validation failure)

When `validate.sh` exits 1, load [references/diagnostic-rules.md](references/diagnostic-rules.md) — the 54-rule reference matrix. For each FAIL code reported by validate.sh, look up the rule and report:

- Rule ID and summary
- Why it fails
- Concrete fix steps

Example diagnostic output:

```
FAIL B10 detected in formatter.html.

Rule: {{VIZ_NAMESPACE}} required in all name= attrs

What it means:
  Splunk replaces {{VIZ_NAMESPACE}} with the actual namespace at load time.
  Hardcoding the namespace (e.g., name="myapp.myviz.field") breaks when the
  app is renamed or when the viz is embedded in another app.

Fix:
  In <file>, change:
    name="<actual_app_id>.<viz_name>.<key>"
  to:
    name="{{VIZ_NAMESPACE}}.<key>"
```

## Auto-invocation rules

- Full pipeline (cv-scope → cv-sketch → cv-create → cv-build): cv-build auto-runs after cv-create
- Iteration mode (cv-create --viz ...): cv-build is NOT auto-run; the user should sanity-check the iterated viz first
- Standalone mode: cv-build is optional (user can package later)

## What cv-build does NOT do

- ❌ Does not write viz source code (cv-create)
- ❌ Does not make design decisions (cv-sketch)
- ❌ Does not run AST validation (removed in v6)
- ❌ Does not score design quality (removed in v6)
- ❌ Does not auto-repair formatter mistakes (removed in v6 — fixed at source by tighter templates)

## References

- [Dashboard transcription](references/dashboard-transcription.md) — XML envelope + dashboard JSON template
- [Diagnostic rules](references/diagnostic-rules.md) — 54 rules across FATAL / BROKEN / REJECTED / INTERACTIVE / COSMETIC severities; load-on-demand only when validation fails
- [Generate assets](references/generate-assets.md) — what the script produces, how brand colors are read from theme.js
