# Architecture Patterns — v5.2.0 Smart Vizs & Domain Identity

**Project:** splunk-knowledge / splunk-viz-packs
**Researched:** 2026-05-18
**Milestone scope:** Auto-field discovery, domain-first ideation, accent architecture fix,
mandatory dashboard, and preview PNG contrast fix.

---

## How the Five Changes Integrate with the Existing Pipeline

The v5.2.0 features are not isolated additions. They form a dependency chain that threads
from design-time (vp-design) through code-generation (vp-viz) through packaging (vp-create).
The changes must be built in a specific order because each upstream change creates contract
guarantees that downstream changes rely on.

---

## Existing Pipeline Structure

```
vp-init  ->  vp-design  ->  vp-viz (per viz, inline)  ->  vp-create
               |               |                            |
           domain-templates  viz-blueprints.md         generate_assets.js
           mood-and-design   canvas-recipes.md          validate_viz.sh
           design-principles formatter-patterns.md      check_design.js
           consistency-grid  edge-cases.md
           dashboard-composition
           viz-novelty-scores
```

Data flows forward: vp-design produces the DESIGN BRIEF and VISUAL LANGUAGE block, which
vp-viz reads when writing each viz's `_render()` and formatter. vp-create consumes the
finished app directory — it does not read the brief or know about individual viz decisions.

---

## Change 1: Auto-Field Discovery

### What changes
`viz-blueprints.md` currently lists hardcoded field names in each viz's "Data contract"
section (e.g. `valueField`, `labelField`). The `formatData()` and `updateView()` templates
in `vp-viz/SKILL.md` hard-read named columns via `colIdx[fieldName]`.

Auto-field discovery means: when no explicit field mapping is provided, the viz reads
`data.fields` at runtime and plots all numeric columns as series, using field names as
labels. The formatter still exposes field-name overrides — they become optional, not
required.

### Where the change lives

**Primary: `viz-blueprints.md`** — add a new subsection per viz type alongside the existing
data contract. The existing contract (explicit named fields) stays as the "configured path."
The new section describes the "auto path": iterate `data.fields`, detect numerics, assign
series colors from a palette derived from brand primaries (not accent — see Change 3).

**Secondary: `vp-viz/SKILL.md`** — add one code pattern to the `formatData()` block showing
two-path field resolution:

```javascript
// Auto-field pattern: detect numeric columns if no explicit mapping
var numericFields = [];
for (var i = 0; i < fields.length; i++) {
    var sample = safeNum(rows[0] ? rows[0][i] : null, null);
    if (sample !== null) { numericFields.push({ name: fields[i].name, idx: i }); }
}
// Fall back: if explicit config field not found in colIdx, use numericFields[0]
```

**Not changing:** `validate_viz.sh`, `check_design.js`, `canvas-recipes.md`. The auto-field
pattern is a code-generation guidance change, not a validation rule change.

### Dependency
Requires Change 3 (accent vs. series separation) to be defined first. When a viz
auto-discovers N numeric columns, it needs to know which color palette to assign each
series. If the accent/series model is not defined, the generated code will default to
repeating `t.accent` for all series — the exact bug this milestone fixes.

---

## Change 2: Domain-First Viz Ideation

### What changes
`vp-design/SKILL.md` Step 4 currently says "Viz inventory — from domain templates or
custom." This allows skipping domain research and jumping straight to generic types
(gauge, KPI, bar). The fix: insert an explicit domain-research step before viz type
selection.

### Where the change lives

**Primary: `vp-design/SKILL.md`** — the workflow block gains one step between "Design
direction" and "Viz inventory":

```
3.  Design direction         -> palette, typography, aesthetic
3b. Domain visual language   -> research how this industry displays data
                                 Produce: 2-3 domain-specific viz concepts
                                 before touching domain-templates.md defaults
4.  Viz inventory            -> FROM domain research output, verified against novelty scores
```

The new step must produce a written "domain concept sketch": a 2-3 sentence statement of
what a specialist in this industry would expect to see, and what would surprise them. This
sketch then constrains the viz inventory selection.

**Secondary: `domain-templates.md`** — add a "domain visual language" note per domain
(F1, SOC, retail, healthcare, NOC) describing industry precedents: what shapes and metaphors
professionals in that domain recognize, and which generic viz types are over-used there.
These notes seed the domain concept sketch step without requiring external research.

**Not changing:** `vp-viz/SKILL.md`, `viz-blueprints.md`, `viz-novelty-scores.md`. The
novelty scoring system already soft-blocks lazy inventories; this change adds upstream
ideation discipline so violations are avoided before scoring, not corrected after.

### Dependency
Independent of Change 1 and Change 3. Can be built in any phase. For release cohesion it
shares Phase 2 with Change 1 — both make vizs smarter, one at design time, one at code time.

---

## Change 3: Accent Architecture Fix (DPR-03b)

### What changes
`design-principles.md` DPR-03 currently says "Never use a flat solid fill for
data-carrying elements — use gradient fills." This rule does not distinguish between accent
color and series colors. Generated code has been using `t.accent` as the fill for all data
elements regardless of whether they are highlights or series data.

The correct model:
- **Accent (`t.accent`)** — highlight color. Used for: the single most important element
  on screen, interactive hover state, threshold breach indicator. Maximum one element per
  draw cycle.
- **Series colors** — palette derived from brand primaries, NOT from accent. Each series
  gets a distinct hue at similar lightness to the brand primary, rotated 30-45 degrees
  around the hue wheel.

### Where the change lives

**Primary: `design-principles.md`** — DPR-03 gains a clarification subsection DPR-03b:

```
Accent vs. series (DPR-03b):
- t.accent is for EMPHASIS -- the one element that must pop. One per frame.
- Multi-series fills derive from brand primaries rotated around the hue wheel
  at 30-45 degree steps, NOT from accent.
- Accent at full saturation on more than 1 element per frame = visual noise.
- Position is explicit: choose which series or element gets accent.
  Do not default to "first series = accent, rest = dimmed accent."
```

**Secondary: `vp-viz/SKILL.md` pre-code checklist** — replace the single accent line with
two explicit items:
```
[ ] Accent: t.accent on ONE highlight element per frame (hover, threshold breach, hero bar)
[ ] Series: multi-series fills use brand-primary-derived hue rotation, NOT t.accent repeats
```

**Secondary: `formatter-patterns.md`** — add a note in the "Color and style" section that
`seriesColor1`, `seriesColor2`, etc. are SEPARATE controls from `accentColor`. Any viz with
multiple data series needs both sets of color pickers.

**Not changing:** `check_design.js` D-checks, `validate_viz.sh`. This is a semantic usage
rule. No automated check can reliably detect accent-vs-series confusion without knowing the
rendering intent of the specific viz.

### Dependency
This change is upstream of Change 1. It must be built first. Auto-field discovery generates
multi-series code, and that code needs the accent/series color model to be defined.

**Build order: Change 3 before Change 1.**

---

## Change 4: Mandatory Dashboard in vp-create

### What changes
`vp-create/SKILL.md` currently ends at "Step 6: Report completion." There is no step that
requires a dashboard to be present, and no checklist item that verifies all vizs are on a
dashboard. Generated packs have shipped without any dashboard, or with only one viz
included.

### Where the change lives

**Primary: `vp-create/SKILL.md`** — insert Step 3c after the existing Step 3b:

```
## Step 3c: Generate dashboard with ALL vizs (MANDATORY)

Load ds-create from splunk-dashboard-studio.

Requirements:
- Dashboard JSON must include one panel for EVERY viz in the pack
- Use bg_gradient.png as the dashboard background (generated in step 3b)
- Dashboard canvas: "width": 1920, "height": 1080 minimum
- Each panel type: {app_id}.{viz_name} -- see vp-viz STOP section for format
- Dashboard file: default/data/ui/views/{pack_id}_dashboard.xml (XML wrapper)
  + appserver/static/dashboards/{pack_id}.json (Studio JSON)

Verify: load ds-create, enumerate appserver/static/visualizations/ directory,
confirm dashboard JSON has one panel per viz directory found.
```

**Secondary: packaging checklist** at bottom of `vp-create/SKILL.md` — add three items:
```
- [ ] Dashboard exists (default/data/ui/views/*.xml present)
- [ ] Dashboard references ALL vizs (count panels == count viz dirs)
- [ ] Nav bar default view set to dashboard XML name
```

**Not changing:** `vp-design/SKILL.md`, `vp-viz/SKILL.md`, `validate_viz.sh`. The dashboard
requirement is a packaging completeness gate, not a design or code rule.

### Dependency
Terminal step. Depends on all vizs being fully built and validated (Steps 1-3b complete).
No other change depends on Change 4 output.

**Build order: Change 4 is last.**

---

## Change 5: Preview PNG Fix (generate_assets.js)

### What changes
`generate_assets.js` has a `VIZ_TYPE_KEYWORDS` array with 8 types (~50 keywords). Vizs
with domain-specific names (`ers_gauge`, `attack_flow`, `tyre_compound`, `bed_occupancy`,
`pipeline_flow`) fall through to the `'kpi'` default, producing identical KPI silhouettes
for all unrecognized types.

Additionally, silhouette shapes are rendered using brand accent at low alpha, which produces
near-invisible shapes on dark brand-colored backgrounds.

Two sub-problems:

1. **Keyword coverage** — domain-specific viz names not recognized
2. **Contrast** — silhouette rendered with too-low alpha against the gradient background

### Where the change lives

**Primary: `generate_assets.js`** — two independent code changes:

Keyword expansion — add a `'flow'` type category and domain terms to existing types:
```javascript
{ type: 'flow',  keywords: ['flow', 'pipeline', 'funnel', 'stage', 'attack_flow',
                             'patient_flow', 'pipeline_flow', 'process', 'kill_chain'] },
{ type: 'gauge', keywords: [...existing..., 'ers', 'tyre', 'threat', 'triage',
                             'resource', 'capacity', 'ers_gauge', 'needle', 'speedometer'] },
{ type: 'grid',  keywords: [...existing..., 'health', 'status', 'service', 'severity',
                             'occupancy', 'department', 'bed'] },
{ type: 'bars',  keywords: [...existing..., 'leaderboard', 'horizontal', 'ranking',
                             'podium', 'position_board'] },
```

Contrast fix — replace the low-alpha accent silhouette with full-opacity white:
```javascript
// Before: silhouette at withAlpha(accent, 0.3) -- invisible on dark brand bg
// After:  silhouette at rgb(255, 255, 255) -- always readable on any brand color
```

White at full opacity reads against any brand background color (the background is always a
dark-to-medium gradient from the brand palette). This is a deliberate UX choice: preview
images exist to show viz shape at a glance, not to show brand color.

**Not changing:** `vp-create/SKILL.md`. The generate_assets.js invocation is already Step
3b. The fix is entirely within the script itself.

### Dependency
The contrast fix is independent of everything — ship in Phase 1. The keyword expansion
benefits from knowing what domain-specific viz names Change 2 produces, so it ships in
Phase 2 after domain-templates.md domain visual language notes are written.

---

## Component Boundaries After v5.2.0

| Component | v5.1.0 Responsibility | v5.2.0 Delta |
|-----------|----------------------|--------------|
| `vp-design/SKILL.md` | Brand research, palette, viz inventory, design brief | + domain-first ideation step 3b |
| `domain-templates.md` | Domain viz inventories (5 domains) | + domain visual language precedent notes per domain |
| `design-principles.md` | DPR-01 through DPR-10 canvas rules | + DPR-03b accent-vs-series separation clause |
| `viz-blueprints.md` | 16 viz type blueprints with data contracts | + auto-field path per type alongside explicit path |
| `vp-viz/SKILL.md` | Code templates, checklist, quick-rules | + auto-field formatData() pattern, + accent/series checklist item |
| `formatter-patterns.md` | 4-section formatter template | + seriesColor pickers separate from accentColor note |
| `vp-create/SKILL.md` | Build, validate, package workflow | + Step 3c mandatory dashboard, + 3 checklist items |
| `generate_assets.js` | PNG silhouettes, app icons, gradient bg | + expanded VIZ_TYPE_KEYWORDS, + white-silhouette contrast |
| `validate_viz.sh` | B-code and F-code validation gate | No change |
| `check_design.js` | D-code aesthetic gate | No change |
| `build_flat.js` | AMD bundler | No change |

---

## Dependency Order for Phases

The five changes form two dependency chains and one independent track:

```
Chain A (sequential):
  Change 3  (accent/series separation in design-principles.md)
      |
      v  provides color model for multi-series code
  Change 1  (auto-field in viz-blueprints.md + vp-viz/SKILL.md)
      |
      v  all vizs now auto-discoverable, app directory complete
  Change 4  (mandatory dashboard in vp-create/SKILL.md)

Chain B (parallel to Chain A):
  Change 2  (domain ideation in vp-design + domain-templates.md)

Independent (split across phases):
  Change 5a  contrast fix in generate_assets.js  -- Phase 1
  Change 5b  keyword expansion in generate_assets.js  -- Phase 2
             (keyword list informed by Change 2 domain types)
```

**Recommended phase grouping:**

Phase 1 — Foundation (no inter-phase dependencies):
- Change 3: DPR-03b in design-principles.md
- Change 5a: white silhouette contrast fix in generate_assets.js

Phase 2 — Smart field handling (depends on Phase 1 color model):
- Change 1: auto-field pattern in viz-blueprints.md + vp-viz/SKILL.md
- Change 2: domain-first ideation in vp-design/SKILL.md + domain-templates.md
- Change 5b: keyword expansion in generate_assets.js

Phase 3 — Packaging completeness (depends on all vizs being fully specified):
- Change 4: mandatory dashboard step + checklist in vp-create/SKILL.md

---

## Data Flow Across Phases

```
Phase 1 produces:
  design-principles.md: accent = one highlight, series = brand-primary palette
  generate_assets.js:   white silhouettes, readable on all brand backgrounds

Phase 2 consumes Phase 1:
  vp-design domain ideation (step 3b)   -> produces domain concept sketch
  domain concept sketch                 -> constrains viz inventory selection
  viz inventory                         -> fed into vp-viz formatData() planning
  formatData() auto-field pattern       -> uses series color model from Phase 1

Phase 2 produces:
  vp-viz: two-path formatData() (explicit config OR auto numeric detection)
  domain-templates.md: domain visual language notes (5 domains)
  generate_assets.js: expanded VIZ_TYPE_KEYWORDS covering domain-specific names

Phase 3 consumes Phase 2:
  All viz names in app dir (settled after auto-field and domain types are defined)
  vp-create Step 3c: reads appserver/static/visualizations/ to enumerate viz names
  ds-create: writes dashboard JSON with one panel per viz

Phase 3 produces:
  vp-create: mandatory dashboard step guaranteeing ALL vizs in final app
```

---

## Files That Change: Complete List

### Skills layer (markdown files Claude reads at generation time)

| File | Change | Size concern |
|------|--------|-------------|
| `plugins/splunk-viz-packs/skills/vp-design/SKILL.md` | +1 workflow step 3b, ~15 lines | Safe; currently well under 500 |
| `plugins/splunk-viz-packs/skills/vp-design/references/design-principles.md` | +DPR-03b subsection, ~12 lines | Safe |
| `plugins/splunk-viz-packs/skills/vp-design/references/domain-templates.md` | +domain visual language notes per domain, ~40 lines | Safe |
| `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` | +auto-field formatData block, +accent checklist item, ~20 lines | Approach 500; measure before adding |
| `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` | +auto-field path per viz type, ~5 lines x 16 = ~80 lines | Risk: may need split to auto-field-patterns.md |
| `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` | +seriesColor pickers note, ~8 lines | Safe |
| `plugins/splunk-viz-packs/skills/vp-create/SKILL.md` | +Step 3c (~25 lines), +3 checklist items | Safe; currently short |

### Scripts (Node.js, executed during build)

| File | Change |
|------|--------|
| `plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js` | Expanded VIZ_TYPE_KEYWORDS, white-silhouette fill logic |

### Explicitly not changing

- `validate_viz.sh` — no new B/F codes needed for these features
- `check_design.js` — accent/series rule is semantic, not automatable
- `build_flat.js` — AMD bundler is unaffected
- `vp-init/SKILL.md` — entry point routing unchanged
- `vp-debug/SKILL.md` — debug skill unaffected
- Any `plugin.json` — internal reference changes only, no new skill names

---

## Size Risk: viz-blueprints.md

The largest single risk is viz-blueprints.md growing too large. It is a reference file
(not a SKILL.md), so the 500-line hard limit does not technically apply, but large reference
files reduce the progressive-disclosure benefit that the v4.0.0 restructure achieved.

Adding ~5 lines per type for auto-field paths across 16 types = ~80 new lines. Before
writing, check the current line count. If viz-blueprints.md is already over 300 lines,
extract the auto-field patterns to a NEW reference file:

`references/auto-field-patterns.md` — one entry per viz type showing field detection logic.

Then add one line per type in viz-blueprints.md:
```
Auto-field path: see auto-field-patterns.md #{viz_name}
```

This keeps each reference file focused and avoids the structural bloat that forced the
v4.0.0 rewrite.

---

## Anti-Patterns to Avoid

### Putting domain-first ideation inside vp-viz
The domain ideation step belongs in vp-design, not vp-viz. vp-viz is code-generation scope
only. Mixing design reasoning into the code skill would push vp-viz/SKILL.md past 500 lines
and break the design/code separation that makes progressive disclosure work.

### Adding a new D/B validation code for accent/series confusion
The accent-vs-series rule is semantic: a checker cannot know whether `t.accent` on the
first series is intentional (single-series chart, accent as the data color is fine) or a
bug (five series all using the same accent hue). Do not add D-09 or similar. Keep this as
guidance in design-principles.md, not an automated gate.

### Dispatching the mandatory dashboard step to a subagent
vp-create has `disable-model-invocation: true` for packaging steps. The mandatory dashboard
step (Step 3c) calls ds-create. That call must happen in the same Claude context as the
rest of vp-create execution. The CLAUDE.md "inline viz code, no subagents" constraint
applies equally to dashboard generation inside the packaging workflow.

### Making auto-field the only field resolution path
Auto-field is an opt-out default, not a replacement for explicit field mapping. The formatter
still exposes field name controls. If the user configures a field name, the explicit path
takes priority via the existing `getOption()` two-path pattern. Removing explicit field
controls would break SPL queries that use specific column names already in production.
