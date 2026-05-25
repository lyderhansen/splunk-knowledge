# generate_assets.js — what it produces

The asset generator reads `<app_id>/shared/theme.js` for brand colors and produces three sets of PNG assets.

## Outputs

| File | Size | Purpose |
|---|---|---|
| `static/appIcon.png` | 36×36 | Splunk Manage Apps icon — accent color background + white app initial |
| `static/appIcon_2x.png` | 72×72 | Retina version of appIcon.png |
| `appserver/static/images/bg_gradient.png` | 1920×1080 | Branded gradient background for dashboard composition |
| `appserver/static/visualizations/<viz>/preview.png` | 116×76 | Per-viz preview thumbnail shown in formatter dropdown |

## Brand colors source

The script `require()`s `<app_id>/shared/theme.js` and reads:

- `DARK.bg` — gradient background base
- `DARK.accent` — accent color for icons and gradient direction
- `DARK.panel` — gradient secondary color

If theme.js is missing, the script exits 1 with an error.

## Gradient background generation

The 1920×1080 background uses `DARK.bg` as the base color and adds a radial gradient with `DARK.accent` at 8% opacity in the top-left quadrant. This produces a subtle branded surface without overpowering the dashboard content.

If `DESIGN-LOCK.md.dashboard.background.gradient_spec` is set, the script uses those values instead of the theme defaults.

## App icon generation

The 36×36 icon is a solid `DARK.accent` background with the app's first letter (uppercase, white) centered using the bitmap font from generate_assets.js. The 72×72 version is the same content at 2× scale.

If the app_id has multiple words separated by underscores, the first letter of the first word is used (`redbull_racing_viz` → `R`).

## Per-viz preview generation (v6 simplification)

In v5.7, generate_assets.js had 10 hand-rolled silhouette functions (one per viz type: KPI, gauge, bar, grid, line, etc.). Each produced a stylized icon-like silhouette.

In v6, this is replaced with a single renderer:

1. Brand-tinted background (`DARK.panel` color)
2. Accent-color bar at the bottom (12% of height)
3. First letter of the viz name in accent color, centered

The simplification removes ~400 lines of code while producing previews that are equally distinguishable in Splunk's UI (where they appear at small sizes and are mostly distinguished by name+color, not by silhouette shape).

If a user wants custom preview thumbnails, they can replace the generated `preview.png` after build — the script does not overwrite existing files unless invoked with `--force`.

## When the script runs

cv-build invokes generate_assets.js in Step 3 (after validation, before dashboard transcription). It should always succeed for valid apps; the only common failure is `shared/theme.js` missing or having a parse error.

## Manual invocation

```bash
node ${CLAUDE_PLUGIN_DIR}/scripts/generate_assets.js <app_dir>
```

This is useful for refreshing assets after editing theme.js without running the full cv-build pipeline.
