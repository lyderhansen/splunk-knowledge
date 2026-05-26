# Standalone mode — one-shot a single viz with no lock file

When cv-create runs and no `DESIGN-LOCK.md` exists in `.cv/<app_id>/` (or in cwd), it's in standalone mode. The user wants one viz, fast, without the full pipeline.

## When standalone mode fires

cv-create is in standalone mode when:

- No `.cv/<app_id>/DESIGN-LOCK.md` exists AND
- The user's prompt describes one viz (e.g., *"make me a horizontal F1-style position board, 20 rows, gold accents, dark navy"*)

The user can also explicitly request: `cv-create --standalone "<viz description>"`.

## Workflow

```
Step 1: Inline mini-Stage-A
Step 2: Synthesize a one-viz mini-lock in memory
Step 3: Write the minimal app scaffold (if not present)
Step 4: Generate the viz files (boilerplate + render + formatter + CSV)
Step 5: Report
```

## Step 1: Inline mini-Stage-A

Even in standalone, the commitment block discipline still applies. But it's compressed and presented inline rather than written to a separate file.

Tell the user:

```
Before I write the viz, I need a few quick commitments:

Brand essence (3 concrete words; NOT 'modern/clean/elegant'):
  → <ask>

Reference physical object (one is enough for standalone):
  → <ask>

Display font (NOT from the reflex list: Inter, DM Sans, Fraunces, etc.):
  → <ask, suggest 1-2 if user is unsure>

Primary brand color (hex):
  → <ask; default to a brand-credible guess if user is unsure>

Theme (dark | light | both):
  → <ask; default both>
```

If the user already provided these in their prompt, skip the questions. If they say *"you pick"* on any of them, make a credible choice and STATE IT before proceeding (transparency).

## Step 2: Synthesize a one-viz mini-lock

Build an in-memory mini-lock from the mini-Stage-A answers + the user's viz description. The mini-lock has the SAME schema as a full lock but with one entry in `vizs[]`.

For `visual_reference_html`, generate a brief inline HTML+CSS block (~30-50 lines) representing the viz. This becomes the visual contract — paste it as a comment above `_renderDark` and `_renderLight` in the viz source.

Example mini-lock for the F1 position board example:

```yaml
project:
  app_id: f1_position_board       # derived from user's description
  display_name: F1 Position Board
  version: 1.0.0
  format: classic                  # standalone defaults to Classic

global:
  brand:
    primary: "#1E40C8"
    accent: "#F5C518"
  palette_dark:
    bg: "#060E1F"
    panel: "#0C1B3A"
    text: "#E8ECF0"
    text_dim: "#8B9DC3"
    series: ["#F5C518","#3671C6","#A855F7","#00D26A","#DB0032"]
  palette_light:
    bg: "#FAFBFC"
    panel: "#FFFFFF"
    text: "#0C1B3A"
    series: ["#D4A50A","#1E40C8","#7B2FB8","#008844","#B0001F"]
  typography:
    display:
      family: "Barlow Condensed"
      fallback: "Impact, sans-serif"
    mono:
      family: "JetBrains Mono"
      fallback: "SF Mono, monospace"
  commitments:
    hero_archetype: data-wall
    domain_unique: "20-row driver delta board with team-colored interval bars"
    anti_references:
      - "generic table with stripe rows"

vizs:
  - name: position_board
    type: bars
    data_contract:
      required:
        - { field: position, type: number, example: 1 }
        - { field: driver, type: string, example: "VER" }
        - { field: gap_s, type: number, example: 0.0 }
    visual_spec:
      shape_language: "horizontal-bars-with-driver-tag"
      geometry:
        row_count: 20
        row_height_ratio: 0.045   # of panel h
        bar_height_ratio: 0.65     # of row h
      fills:
        bars:
          type: linear_gradient
          from: "#F5C518"
          to: "#3671C6"
        background:
          type: solid
          base: "#0C1B3A"
        background_light:
          type: solid
          base: "#FFFFFF"
          overlay: none
      typography:
        driver_tag: { family: display, weight: 700, transform: uppercase, color: text }
        gap_value: { family: mono, weight: 500, transform: none, color: text_dim }
    visual_reference_html: |
      <div class="board">
        <div class="row"><span class="pos">P1</span><span class="driver">VER</span><div class="bar" style="width: 0%; background:linear-gradient(90deg,#F5C518,#3671C6)"></div><span class="gap">LEADER</span></div>
        <div class="row"><span class="pos">P2</span><span class="driver">NOR</span><div class="bar" style="width: 12%; background:linear-gradient(90deg,#F5C518,#3671C6)"></div><span class="gap">+3.421s</span></div>
        <!-- ... -->
      </div>
      <style>
        .board { font-family: 'Barlow Condensed', Impact, sans-serif; background:#0C1B3A; padding:16px; }
        .row { display:flex; align-items:center; gap:12px; height:18px; margin-bottom:2px; }
        .pos { width:32px; color:#8B9DC3; font-family: 'JetBrains Mono', monospace; }
        .driver { width:40px; color:#E8ECF0; font-weight:700; text-transform:uppercase; }
        .bar { height:12px; flex:1; }
        .gap { width:80px; color:#8B9DC3; font-family: 'JetBrains Mono', monospace; text-align:right; }
      </style>
```

This mini-lock is held in memory (not written to disk) unless the user later expands to a full pack.

## Step 3: Write the minimal scaffold

If the cwd is empty or no app dir exists, write the minimal scaffold:

```
<app_id>/
├── default/
│   ├── app.conf                       # 5 stanzas, version=1.0.0
│   ├── visualizations.conf            # one stanza for this viz
│   └── data/ui/nav/default.xml        # placeholder nav (no dashboard yet)
├── metadata/
│   └── default.meta                   # standard permissions
├── shared/
│   └── theme.js                       # generated from the mini-lock global
├── appserver/static/visualizations/<viz_name>/
│   ├── formatter.html
│   ├── src/visualization_source.js   # includes inline HTML/CSS contract
│   └── visualization.css
├── lookups/
│   └── <app_id>_demo_<viz>.csv
└── README/
    └── savedsearches.conf.spec
```

NO dashboard.xml in standalone (one viz, no pack-level dashboard).

If the cwd already contains an `<app_id>/` directory, only write the new viz files into it.

## Step 4: Generate the viz files

Standalone uses the **same per-viz sequence** as full-pipeline Step 3 (D-08): boilerplate (Bash) → Edit `_renderDark` body between `/* CV-RENDER-DARK-BEGIN */` … `/* CV-RENDER-DARK-END */` → Edit `_renderLight` body between `/* CV-RENDER-LIGHT-BEGIN */` … `/* CV-RENDER-LIGHT-END */` → Write `formatter.html` → Write `visualization.css`.

**Resume detection does NOT apply in standalone** — it is one-shot mode with exactly one viz, and the mini-lock is held in memory rather than on disk, so the resume predicate has nothing to read. The four-tool-call sequence always runs.

Refer to cv-create/SKILL.md Step 3.2 / 3.3 for the literal `old_string` / `new_string` shape of the sentinel-anchored Edits, and Step 3.6 for the per-viz checkpoint predicate (D-08 contract — single source of truth for the chunked mechanics).

Per-viz sequence:

1. **Run `boilerplate_emit.js`** (one Bash call) — generates the source file with the four sentinels in their canonical positions (Plan 01).

   ```bash
   node ${CLAUDE_SKILL_PLUGIN_DIR}/../../scripts/boilerplate_emit.js <viz_name> <app_id>.<viz_name> > <app_id>/appserver/static/visualizations/<viz_name>/src/visualization_source.js
   ```

2. **Paste the mini-lock's `visual_reference_html`** as a comment block ABOVE `_renderDark` and `_renderLight` (above each begin sentinel). Existing standalone behavior, preserved — this is the in-source visual contract.

3. **Edit the `_renderDark` body** between `/* CV-RENDER-DARK-BEGIN */` and `/* CV-RENDER-DARK-END */` (one Edit call). Translate the dark-theme CSS from `visual_reference_html` into Canvas calls; keep the sentinels in `new_string`.

4. **Edit the `_renderLight` body** between `/* CV-RENDER-LIGHT-BEGIN */` and `/* CV-RENDER-LIGHT-END */` (one Edit call). Light is a different code path, not a dimmed dark.

5. **Write `formatter.html`** from `visual_spec` (one Write call). Same minimum-10-controls + `{{VIZ_NAMESPACE}}` rules as full pipeline.

6. **Write `visualization.css`** (one Write call). One line: `.<app_id>-<viz_name>-viz { background: transparent; }`.

7. **Per-viz checkpoint** (D-06) — run the same five-predicate composition documented in cv-create/SKILL.md Step 3.6 against the on-disk files for this viz. On pass, print:

   ```
   ✓ [1/1] <viz_name> — boilerplate + renderDark + renderLight + formatter + css
   ```

   On fail, print and stop (D-07):

   ```
   ✗ [1/1] <viz_name> — checkpoint failed: <reason>
   ```

   `[1/1]` because standalone has exactly one viz. No retry; the user re-runs cv-create.

8. **Write the demo CSV** to `<app_id>/lookups/<app_id>_demo_<viz>.csv`.

## Step 5: Report

```
Viz written to <app_id>/.

Files created:
  - <app_id>/shared/theme.js
  - <app_id>/appserver/static/visualizations/<viz_name>/src/visualization_source.js
  - <app_id>/appserver/static/visualizations/<viz_name>/formatter.html
  - <app_id>/appserver/static/visualizations/<viz_name>/visualization.css
  - <app_id>/lookups/<app_id>_demo_<viz>.csv
  - <app_id>/default/app.conf       (if newly created)
  - <app_id>/default/visualizations.conf  (updated)

Next steps:
  - To package: run cv-build
  - To iterate: cv-create --viz <viz_name> "<instruction>"
  - To expand to a full pack: run cv-sketch (creates DESIGN-LOCK.md, then re-run cv-create)
```

## Constraints on standalone mode

- Classic format ONLY in standalone. Extension API requires the full pipeline (because Extension is more complex and the user should be intentional about choosing it).
- One viz only. If the user describes multiple vizs in their prompt, ask them to run `cv-sketch` for the full pipeline.
- No dashboard. Standalone is the "I want one Canvas viz fast" mode; the user can build their own dashboard around it.

## Inline mockup discipline

Even though standalone skips the separate `mockup.html` file, the discipline of "look at the CSS, port it to Canvas" still applies. The inline `visual_reference_html` block pasted as a comment in the source file IS the visual contract. Don't paraphrase from memory; re-read the comment block before writing `_renderDark` and `_renderLight`.
