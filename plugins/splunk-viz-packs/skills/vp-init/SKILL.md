---
name: vp-init
description: "Starts a Splunk custom visualization pack build. Gathers app name, brand context, data source, and viz count, then routes to the right workflow."
when_to_use: "Use when starting a new viz pack from scratch. Triggers on 'new viz pack', 'start viz project', 'build splunk vizs', 'custom visualization app', 'themed viz suite'."
disable-model-invocation: true
arguments: [app-name, brand]
argument-hint: "[app-name] [brand-description]"
---

# vp-init — start a viz pack build

## Quick start

If arguments provided: `/vp-init my_pack "Nike - bold, kinetic"`

Otherwise, ask these 4 questions:

### 1. App name
Lowercase with underscores. Used as Splunk app ID and directory name.
Example: `nike_training_club`, `hospital_ops_viz`

### 2. Brand / domain
Short description. Drives palette, fonts, and viz selection.
Example: "Nike Training Club — bold, kinetic, volt on black"

### 3. Data source

**Demo CSV (recommended, default):**
- Fastest path — viz works immediately after install
- Production SPL can be added later
- No Splunk access required during development

**Production data:**
- Requires Splunk MCP for data discovery
- Load `spl-gotchas` from splunk-spl before writing queries
- Recommended only if you already know your data schema

### 4. Viz count
- **1 viz:** skip vp-couture, load vp-viz directly
- **2-8 vizs:** load vp-couture for design brief first
- Recommended: 3-5 for a balanced suite

## Routing

```
Single viz (count = 1):
  → vp-viz (code) → vp-create (package)

Multi-viz pack (count > 1):
  → vp-couture (design) → vp-viz (code per viz) → vp-create (package)

Production data (any count):
  → Add: spl-gotchas before savedsearches.conf

Dashboard included:
  → Add: ds-create from splunk-dashboard-studio
```

Write all viz code INLINE (same context). Do NOT dispatch subagents for code generation.

## Cross-plugin dependencies

Building a viz pack produces 3 artifact types. Each has its own plugin:

| Artifact | Plugin | Key skill |
|---|---|---|
| Viz source (JS/HTML) | splunk-viz-packs | vp-viz |
| Dashboard JSON | splunk-dashboard-studio | ds-create |
| SPL queries | splunk-spl | spl-gotchas |

## Optional Splunk app dependencies

| App | When needed |
|---|---|
| `icon_library` | Material Symbols icons in dashboards |
| `infographic_shapes` | Gradient shapes, glow effects |
