# splunk-custom-viz

A Claude Code / Cursor plugin for building installable Splunk custom visualization apps from a short brand description. HTML-first design workflow; designer-grade output; both Classic AMD and Extension API output formats.

**Version:** 6.0.0

## What it does

You describe a brand and domain in 2-3 sentences. The plugin:

1. Gathers context with 5 questions (`cv-scope`)
2. Writes a single-file HTML mockup you can open in a browser (`cv-sketch`)
3. Ports the mockup to ES5 Canvas Splunk vizs (`cv-create`)
4. Validates and packages as `.tar.gz` (Classic) or `.spl` (Extension API) (`cv-build`)

**Input:** brand + domain + tone (free-text, ~2 sentences is enough)
**Output:** installable Splunk app with light + dark themes; Classic (`.tar.gz`) and/or Extension API (`.spl`) per scope

## Skills

| Skill | Job | Output |
|---|---|---|
| `cv-scope` | gather brand/domain/tone/format/inventory | scope context block |
| `cv-sketch` | produce HTML mockup + visual contract | `mockup.html` + `DESIGN-LOCK.md` |
| `cv-create` | port lock to Splunk Canvas code | `<app_id>/` source files |
| `cv-build` | validate, package, debug | `<app_id>.tar.gz` and/or `<app_id>.spl` |

## Quick start

```
cv-scope
  → answer 5 questions (or skip ones already in your prompt)
cv-sketch
  → open the generated mockup.html in a browser; approve or ask for changes
cv-create
  → Canvas code generated for every viz in the lock
cv-build
  → installable archive produced
```

`cv-create` also works standalone (one viz, no mockup step) and supports natural-language iteration (`cv-create --viz <name> "make the gauge segments wider"`).

## Install

```
/install-plugin lyderhansen/splunk-knowledge/plugins/splunk-custom-viz
```

## Key rules

- ES5 only in viz source (Splunk's AMD constraint)
- HTML mockup is the design source-of-truth; Canvas port is mechanical translation
- Light + dark themes are independent render paths, not inversions
- 0 MB bundled dependencies (grep-based validation, no node_modules)

## Replaces

`splunk-viz-packs` v5.x — use `splunk-custom-viz` for new projects. v5.x remains installable for legacy users.
