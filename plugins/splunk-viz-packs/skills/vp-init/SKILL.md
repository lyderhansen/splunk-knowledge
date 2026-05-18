---
name: vp-init
description: "Starts a Splunk custom visualization pack build. Gathers app name, brand context, tone, font strategy, data source, viz inventory, then routes to the right workflow."
when_to_use: "Use when starting a new viz pack from scratch. Triggers on 'new viz pack', 'start viz project', 'build splunk vizs', 'custom visualization app', 'themed viz suite'."
disable-model-invocation: false
arguments: [app-name, brand]
argument-hint: "[app-name] [brand-description]"
---

# vp-init — start a viz pack build

## Quick start

If arguments provided: `/vp-init my_pack "Nike - bold, kinetic"`
Fill in what was given, then ask the remaining questions.

Otherwise, ask ALL 7 questions below. These feed directly into vp-design's design context — skipping any means the user gets asked twice.

### 1. App name
Lowercase with underscores. Used as Splunk app ID and directory name.
Example: `nike_training_club`, `hospital_ops_viz`

### 2. Brand / domain
Short description of brand identity AND industry/use case.
Example: "Nike Training Club — bold, kinetic, volt on black, fitness domain"

### 3. Tone — 3 committable words
NOT "modern" or "clean" — those are dead categories. Push for specificity.
Example: "kinetic, defiant, electric" or "clinical, precise, reassuring"

### 4. Font strategy
1-2 fonts max. Base64 embedded in viz CSS. System fonts = zero overhead.
Example: "Barlow Condensed for display, monospace for values" or "system sans-serif only"

### 5. Data source

**Demo CSV (recommended, default):**
- Fastest path — viz works immediately after install
- Production SPL can be added later
- No Splunk access required during development

**Production data:**
- Requires Splunk MCP for data discovery
- Load `spl-gotchas` from splunk-spl before writing queries
- Recommended only if you already know your data schema

### 6. Viz inventory
Which vizs does this pack need? Can be specific names, general categories, or "let Claude decide."
vp-design step 3b will research the domain's visual language and propose domain-unique viz types — at least 2 vizs that could not exist outside this industry.
Example: "KPI hero + whatever fits the domain" or "6 vizs, you pick"
Recommended: 4-6 for a balanced suite, max 8.

### 7. Dashboard included?
- **Always yes.** Every viz pack ships with a Dashboard Studio JSON dashboard that showcases all vizs. This is mandatory — vp-create Step 3c generates it automatically.

## Pipeline — FOLLOW THIS EXACT ORDER

The viz pack is NOT done until ALL 4 stages complete. Do NOT skip any stage.

```
STAGE 1: DESIGN (load vp-design)
  → Brand research, palette, mood, viz inventory
  → Domain visual language step 3b (2+ domain-unique vizs)
  → Output: design brief

STAGE 2: CODE (load vp-viz)
  → Write shared/theme.js, then each viz (formatter + source)
  → Build with build_flat.js after all vizs
  → Output: built viz app directory

STAGE 3: VALIDATE + PACKAGE (load vp-create)
  → Step 2: validate_viz.sh (MUST pass with 0 FAIL)
  → Step 3b: generate_assets.js (icons + previews + gradient bg)
  → Step 3c: generate Dashboard Studio JSON with ALL vizs
  → Step 4: package tarball
  → Output: installable .tar.gz

STAGE 4: VERIFY
  → Tarball > 1KB, single top-level dir
  → Dashboard includes all viz types
  → Nav bar points to dashboard
```

**CRITICAL:** Stage 3 (vp-create) is where most failures happen. You MUST load the vp-create skill — do NOT package from memory. The dashboard JSON template and composition rules are in vp-create's references.

Write all viz code INLINE (same context). Do NOT dispatch subagents for code generation.

## Hand-off to vp-design

When routing to vp-design, pass ALL collected context so it does NOT re-ask:

```
Design context (from vp-init):
  Brand:     {answer to Q2}
  Tone:      {answer to Q3}
  Fonts:     {answer to Q4}
  Inventory: {answer to Q6}
  Dashboard: {answer to Q7}
```

vp-design should verify these 5 fields are present and skip its own Q&A if they are.

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
