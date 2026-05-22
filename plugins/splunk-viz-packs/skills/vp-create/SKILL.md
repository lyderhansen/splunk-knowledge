---
name: vp-create
description: "Builds and packages Splunk custom visualization apps — flat AMD compilation, post-build validation, and tarball packaging ready for Splunk install."
when_to_use: "Use when building, validating, or packaging a viz app. Triggers on 'build app', 'package tarball', 'deploy viz', 'validate build', 'create tarball'."
disable-model-invocation: false
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
- [ ] Step 3b: Generate assets (icons, previews, gradient background)
- [ ] Step 3c: Generate dashboard with ALL vizs
- [ ] Step 4: Package tarball
- [ ] Step 5: Verify archive
- [ ] Step 6: Report completion
```

(If format=extension, Steps 1 and 4 change — see Step 1 (Extension API) and Step 4 (Extension API) below)

## Step 1: Build (flat AMD)

```bash
node ${CLAUDE_SKILL_DIR}/scripts/build_flat.js /path/to/app
```

This inlines theme.js into each viz and wraps as AMD module.

### Step 1 (Extension API): Build with yarn

When format=extension (from visual language):

```bash
cd /path/to/app
yarn install
yarn build
```

This runs the webpack/rollup bundler configured in package.json (scaffolded by visualization-js-template.md). Produces visualization.js in each viz directory. Do NOT run build_flat.js — it is Classic-only.

## Step 2: Validate

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/validate_viz.sh /path/to/app
```

CRITICAL: Do NOT package if validation fails. Fix and re-validate.

> For Extension API vizs, validation checks config.json instead of formatter.html. Full Extension validation rules are defined in Phase 31.

## Step 3: Fix failures

For B10, B9, B5, B7, B20 — the repair loop in validate_viz.sh auto-fixes
these. If auto-repair fails, see vp-viz SKILL.md STOP section for namespace
rules and formatter attribute requirements.

For F3 (ES5 violations) — replace const/let/arrow functions with var/function.
See vp-debug references/fatal-rules.md F3 for ES5 conversion patterns.

After fixing, re-run build (step 1) then validate (step 2).

## Step 3b: Generate app icons and previews (MANDATORY)

```bash
node ${CLAUDE_SKILL_DIR}/scripts/generate_assets.js /path/to/app
```

Reads `shared/theme.js` for brand colors. Writes:
- `static/appIcon.png` (36x36) and `static/appIcon_2x.png` (72x72) — accent color background + white initial letter
- `appserver/static/visualizations/<viz>/preview.png` (116x76) per viz — brand-colored silhouette per viz type
- `appserver/static/images/bg_gradient.png` (1920x1080) — branded gradient background for dashboard composition

If Node.js is unavailable, validation will report FAIL A01-A04 on missing/placeholder assets.

## Step 3c: Generate dashboard with ALL vizs (MANDATORY)

**STOP: Do NOT proceed to dashboard generation unless Step 2 (validate_viz.sh) exited with
zero FAIL for ALL vizs. If any viz has outstanding FAIL codes, fix them first (Step 3),
re-build (Step 1), and re-validate (Step 2) until clean.**

MUST LOAD before writing dashboard JSON:
1. **[references/dashboard-json-template.md](references/dashboard-json-template.md)** — exact JSON structure, WRONG patterns, viz type format, z-order rules. Read this FIRST.
2. **`vp-design/references/dashboard-composition.md`** — visual hierarchy, depth recipes, background treatment.
3. **Conditional — ds-int-tabs** (`plugins/splunk-dashboard-studio/skills/ds-int-tabs/SKILL.md`) — Load this before writing ANY dashboard JSON if EITHER condition is true: (a) the viz inventory from vp-design has 7 or more vizs, OR (b) the user explicitly requested a tabbed layout. The condition is evaluated from the viz inventory established in vp-design — do not recount at generation time. (per D-07/D-08)
4. **[references/dashboard-interactivity.md](references/dashboard-interactivity.md)** — drilldown token flows, input controls, defaults block wiring, domain time defaults. Load before writing ANY dashboard JSON. (per INT-01/INT-02/INT-03)

**Requirements:**

1. **One panel per viz** — enumerate viz directories: `ls appserver/static/visualizations/`
   Each directory is one viz panel. No viz may be omitted.
2. **Panel viz type** — use `{app_id}.{viz_name}` format directly. NOT `"custom"` +
   `customVizId`, NOT `"splunk.custom.{app_id}.{viz_name}"`.
3. **Demo search** — each panel uses `| inputlookup {pack_id}_demo_{viz_name}.csv`
   (matches the demo CSV created during vp-viz). NOT `| makeresults`.
4. **Background** — use `bg_gradient.png` (generated in Step 3b) as `splunk.image` at z=0
   in the structure array. Path: `/static/app/{app_id}/images/bg_gradient.png`.
5. **Canvas size** — `"width": 1920, "height": 1080` minimum.
6. **Drilldown wiring — ALL viz panels** — For every custom viz panel (`{app_id}.{viz_name}` type),
   add BOTH of the following (omitting either causes clicks to fail silently):
   - `"drilldown": "all"` inside the panel's `options` block
   - An `eventHandlers` array with a `drilldown.setToken` handler mapping `click.value` to a
     named token (e.g. `selected_item`). Wire that token to a `defaults.tokens.default` entry
     with value `"*"` (per INT-03).
   Built-in viz panels (splunk.area, splunk.line, etc.) also get `"drilldown": "all"` in options
   if they are meant to be interactive. See references/dashboard-interactivity.md Section 1.

**Output files:**
- Dashboard JSON: `appserver/static/dashboards/{pack_id}_overview.json`
- Dashboard XML wrapper: `default/data/ui/views/{pack_id}_overview.xml`

XML wrapper format (Dashboard Studio v2):
```xml
<dashboard version="2" theme="dark">
  <label>{Pack Display Name} Overview</label>
  <definition><![CDATA[ { ... dashboard JSON here ... } ]]></definition>
</dashboard>
```

**Panel count verification (DSB-02):** After writing the dashboard JSON, count viz
directories in `appserver/static/visualizations/` and count panels with `{app_id}.*` type
in the JSON. These two counts MUST be equal. If they differ, a viz was missed — add the
missing panel before proceeding.

**Nav bar update:** Set `default='true'` on `{pack_id}_overview` in
`default/data/ui/nav/default.xml`.

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

### Step 4 (Extension API): Package with yarn

When format=extension:

```bash
cd /path/to/app
yarn package
```

This produces an .spl file (Splunk package) in the app directory. Do NOT use manual COPYFILE_DISABLE=1 tar — yarn package handles the correct archive structure for Extension API apps.

## Step 5: Verify archive

```bash
tar tzf "${APP_NAME}.tar.gz" | head -1
# Must be: ${APP_NAME}/

tar tzf "${APP_NAME}.tar.gz" | grep '\.tar\.gz' && echo "ERROR: nested archive!" && exit 1

SIZE=$(wc -c < "${APP_NAME}.tar.gz")
[ "$SIZE" -lt 1000 ] && echo "ERROR: archive too small ($SIZE bytes)" && exit 1
echo "OK — $SIZE bytes"
```

### Step 5 (Extension API): Verify .spl

```bash
ls -la /path/to/app/*.spl
# Must exist and be > 1KB
```

## Step 6: Completion output

```
Viz pack ready for install

  File: {{PACK_ID}}.tar.gz
  Path: /full/absolute/path/to/{{PACK_ID}}.tar.gz
  Size: XX KB
  Vizs: viz1, viz2, viz3
  Dashboard: {pack_id}_overview (contains all {N} vizs)

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
- [ ] App icons generated (step 3b — run generate_assets.js; static/appIcon.png exists, 36x36, >100 bytes)
- [ ] Preview.png generated per viz (step 3b — run generate_assets.js; each viz dir has preview.png at 116x76, >100 bytes)
- [ ] Gradient background generated (step 3b — run generate_assets.js; appserver/static/images/bg_gradient.png exists, 1920x1080, > 1000 bytes)
- [ ] Tarball > 1KB
- [ ] No nested .tar.gz in archive
- [ ] Top-level dir matches app name
- [ ] build in app.conf incremented
- [ ] No src/ or node_modules/ in archive
- [ ] No .DS_Store or ._* files
- [ ] Nav bar exists (default.xml)
- [ ] Dashboard exists (default/data/ui/views/{pack_id}_overview.xml present)
- [ ] Dashboard references ALL vizs (panel count == viz directory count in appserver/static/visualizations/)
- [ ] Nav bar default view set to dashboard ({pack_id}_overview)
- [ ] Light theme tested (themeMode=light in formatter, verify text is readable)
- [ ] Dashboard has branded title panel (splunk.markdown viz_title at y <= 200 in structure)
- [ ] ds-int-tabs loaded before dashboard JSON if pack has 7+ vizs or tabs requested
- [ ] Drilldown tokens have defaults (INT-03 — every token set via eventHandlers has a defaults.tokens.default entry with value "*")
- [ ] Drilldown wired on every custom viz panel (options.drilldown: "all" + eventHandlers setToken — not just example panels)
- [ ] Time range input declared and placed in layout.globalInputs
- [ ] (Extension only) yarn build succeeded without errors
- [ ] (Extension only) .spl file exists and > 1KB
- [ ] (Extension only) config.json present per viz (not formatter.html)
```
