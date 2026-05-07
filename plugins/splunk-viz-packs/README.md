# splunk-viz-packs

A Claude Code / Cursor plugin for building themed Splunk custom visualization apps — branded Canvas 2D viz suites with shared design tokens, webpack bundling, and AppInspect-ready packaging.

**Version:** 2.2.0

## What it does

Takes brand context (palette, fonts, tone) and a domain (F1, SOC, healthcare, retail) and produces an installable Splunk app with 5-8 custom visualizations sharing one design token system.

**Input:** brand + domain + tone
**Output:** `.tar.gz` ready for Splunk Cloud or Enterprise

## Skills

```
skills/
  vp-init              entry point · routes to the right skill based on intent
  vp-couture           design orchestrator · brand research → palette → viz inventory → build
  vp-create            scaffolding · app structure, theme.js, webpack, conf files, packaging
  vp-viz               per-viz builder · Canvas 2D source, formatter, CSS, harness
  vp-ref-gotchas       hard rules · FATAL/BROKEN/REJECTED/COSMETIC severity, tiered checklist
  vp-ref-patterns      Canvas recipes · shapes, effects, mood recipes, data rendering principles
```

## Quick start

```
vp-init → vp-couture → vp-create → vp-viz (×N) → vp-create (build + package)
```

1. **vp-init** — identifies intent, routes to couture or create
2. **vp-couture** — design brief (brand research, palette, viz inventory, quality gate)
3. **vp-create** — scaffolds app directory, theme.js, webpack config, conf files
4. **vp-viz** — writes each visualization_source.js with Canvas 2D rendering
5. **vp-create** — builds webpack, packages tarball, prints install path

## Model selection

| Task | Model |
|---|---|
| Design, planning, critique | **Opus** |
| Code, scaffolding, packaging | **Sonnet** |

## Key rules

- **ES5 only** — no const/let/arrow/template literals in viz source
- **Unique rendering per brand** — no copy-paste-recolor
- **Every setting configurable** via formatter.html
- **CSV lookups** for demo data (not makeresults)
- **1920×1080 minimum** canvas size
- **`backgroundColor: transparent`** on all custom viz panels
- **`COPYFILE_DISABLE=1`** when packaging on macOS
- **Increment `build`** in app.conf on every update

## Viz type inspiration

14 blueprints across 10 categories — but you're not limited to these. Canvas 2D can draw anything. Invent new viz types when the data calls for it.

KPI tile, ring gauge, status chip, live ticker, leaderboard, process flow, donut, heat grid, spark strip, radar chart, needle gauge, status matrix, waterfall, horizontal bar list.

## Design quality

- **Design scoring:** 4 dimensions (hierarchy, whitespace, brand, emotion) scored 1-10
- **Anti-AI checklist:** 11 tells that make output look AI-generated
- **Typographic tension:** hero/body/whisper 3-tier with ≥4:1 ratio
- **Mood recipes:** ambient light, glass panels, noise texture, data glow, vignette, accent lines

## Dependencies

| Plugin | Required? |
|---|---|
| `splunk-spl` | Required — SPL in data sources |
| `splunk-dashboard-studio` | Recommended — dashboard JSON schema |
| `icon_library` Splunk app | Optional — Material Symbols icons |
| `infographic_shapes` Splunk app | Optional — gradient shapes, progress bars |
