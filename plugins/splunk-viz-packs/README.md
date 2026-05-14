# splunk-viz-packs

A Claude Code / Cursor plugin for building themed Splunk custom visualization apps — branded Canvas 2D viz suites with shared design tokens, webpack bundling, and AppInspect-ready packaging.

**Version:** 4.1.0

## What it does

Takes brand context (palette, fonts, tone) and a domain (F1, SOC, healthcare, retail) and produces an installable Splunk app with 5-8 custom visualizations sharing one design token system.

**Input:** brand + domain + tone
**Output:** `.tar.gz` ready for Splunk Cloud or Enterprise

## Skills

```
skills/
  vp-init              entry point · gathers all context, routes to the right workflow
  vp-design            design orchestrator · brand research → palette → viz inventory → brief
  vp-viz               per-viz builder · Canvas 2D source, formatter, CSS, theme
  vp-create            build + package · flat AMD compilation, validation, tarball
  vp-debug             diagnostic reference · 54 rules (FATAL/BROKEN/REJECTED/COSMETIC)
  vp-recipes           Canvas recipes · shapes, effects, mood recipes, typography
```

## Quick start

```
vp-init → vp-design → vp-viz (×N) → vp-create (build + package)
```

1. **vp-init** — gathers all context (7 questions), routes to design or viz
2. **vp-design** — design brief (brand research, palette, viz inventory, quality gate)
3. **vp-viz** — writes each visualization_source.js with Canvas 2D rendering
4. **vp-create** — builds flat AMD, validates, generates icons/previews, packages tarball

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
