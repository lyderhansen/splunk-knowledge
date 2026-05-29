# Phase 44: Chunked Code Emission in cv-create - Pattern Map

**Mapped:** 2026-05-26
**Files analyzed:** 4 (1 script + 3 SKILL/reference docs)
**Analogs found:** 4 / 4

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `plugins/splunk-custom-viz/scripts/boilerplate_emit.js` | utility (code-emit script) | transform (args → stdout template) | (same file — self-modifying) + `plugins/splunk-custom-viz/scripts/validate.sh` (grep sentinel consumer) | exact (template edit) |
| `plugins/splunk-custom-viz/skills/cv-create/SKILL.md` | skill workflow (full-pipeline orchestration) | sequential checkpoint loop | `plugins/splunk-custom-viz/skills/cv-build/SKILL.md` (sequential Step 1-7 with stop-on-FAIL) + `plugins/splunk-custom-viz/scripts/validate.sh` (per-viz `for f in ... done` loop) | exact (sibling skill, same plugin) |
| `plugins/splunk-custom-viz/skills/cv-create/references/standalone-mode.md` | skill reference (one-shot per-viz sequence) | same per-viz sequence, single iteration | `plugins/splunk-custom-viz/skills/cv-create/references/iteration-mode.md` (one-viz update workflow) | exact (sibling reference, same skill) |
| `plugins/splunk-custom-viz/skills/cv-create/references/iteration-mode.md` | skill reference (delta-target Edit workflow) | targeted Edit between anchors | (self — already enumerates Step 7 re-render) + `plugins/splunk-custom-viz/skills/cv-build/SKILL.md` Step 8 diagnostic loop | exact (sibling) |

## Pattern Assignments

### `plugins/splunk-custom-viz/scripts/boilerplate_emit.js` (utility, template emit)

**Analog 1 (self):** The file's existing `_renderDark` / `_renderLight` stub at lines 188-206 — the exact insertion site for `CV-RENDER-DARK-BEGIN/END` and `CV-RENDER-LIGHT-BEGIN/END` sentinels (D-02).

**Current emission shape (`scripts/boilerplate_emit.js` lines 188-206):**

```javascript
    '    // === CREATIVE PORT — AGENT FILLS THESE TWO FUNCTIONS ===\n' +
    '    //\n' +
    '    // Translate visual_reference_html [data-theme="dark"] CSS into Canvas calls.\n' +
    '    // Source-of-truth: the HTML block pasted as a comment above this function\n' +
    '    // by cv-create. Do NOT paraphrase from memory — re-read the CSS.\n' +
    '    //\n' +
    '    _renderDark: function(ctx, data, t, w, h, opt) {\n' +
    '        t = this._resolveTheme(t, opt);  // ← MUST be first line (Rule 7)\n' +
    '        // TODO: implement per visual_reference_html [data-theme="dark"]\n' +
    '    },\n' +
    '\n' +
    '    // Translate visual_reference_html [data-theme="light"] CSS into Canvas calls.\n' +
    '    // This is a DIFFERENT code path. Light is NOT a dimmed dark.\n' +
    '    // Read DESIGN-LOCK visual_spec.fills.background_light for which effects to skip.\n' +
    '    //\n' +
    '    _renderLight: function(ctx, data, t, w, h, opt) {\n' +
    '        t = this._resolveTheme(t, opt);  // ← MUST be first line (Rule 7)\n' +
    '        // TODO: implement per visual_reference_html [data-theme="light"]\n' +
    '    },\n' +
```

**Pattern to insert (per D-02 sentinel pair, claude's-discretion on exact placement):** wrap each function body with `/* CV-RENDER-DARK-BEGIN */` … `/* CV-RENDER-DARK-END */`. The mandatory `t = this._resolveTheme(t, opt);` first line is a Canvas-port-rule (Rule 7) and is non-negotiable — sentinels go **around** the TODO body, leaving the `_resolveTheme` call as part of the wrapper outside the sentinel pair, OR the sentinels enclose the entire body including `_resolveTheme`. Choice is executor's, subject to D-02's requirement that the Edit's `old_string` be the begin/end pair with empty body between them and that `_resolveTheme` is preserved on re-emit.

**Args-validation pattern (lines 22-40) — pre-template guard, retained as-is:**

```javascript
var args = process.argv.slice(2);
if (args.length < 2) {
    process.stderr.write('Usage: boilerplate_emit.js <viz_name> <viz_namespace>\n');
    process.exit(2);
}

var vizName = args[0];
if (!/^[a-zA-Z0-9_-]+$/.test(vizName)) {
    process.stderr.write('Error: viz_name must match /^[a-zA-Z0-9_-]+$/ (got: ' + JSON.stringify(vizName) + ')\n');
    process.exit(2);
}
```

**Analog 2 (sentinel consumer):** `plugins/splunk-custom-viz/scripts/validate.sh` already greps for marker strings (e.g. `themeMode`, `define(`, `requestAnimationFrame`, `linear_gradient`). The sentinels are the same shape of grep target — see analog excerpts below for `grep -q` predicate pattern.

---

### `plugins/splunk-custom-viz/skills/cv-create/SKILL.md` (skill workflow, sequential per-viz loop)

**Analog 1:** `plugins/splunk-custom-viz/skills/cv-build/SKILL.md` — sibling skill with the same structure (numbered Step 1..N, code-fenced `bash`, stop-on-first-failure model, "Before you start — MANDATORY reading" prelude). The chunked emission rewrite must preserve cv-create's existing prose conventions.

**MANDATORY reading prelude pattern** — `cv-build/SKILL.md` lines 10-16 (mirror in cv-create lines 10-17). This block MUST stay intact during the rewrite per `<canonical_refs>` constraint:

```markdown
## Before you start — MANDATORY reading

Before validating or packaging, read:

1. **`../../KNOWN-CORRECTIONS.md`** (plugin root) — the 12 production-discovered corrections. The K1/K2/K3 grep checks in `validate.sh` enforce a subset of these. Diagnose validation failures by mapping the FAIL code back to the relevant correction.
2. **`../../references/splunk-viz-canon.md`** (plugin root) — the 26 canonical Splunk Canvas viz rules. The verification checklist at the bottom of canon (Step 4) overlaps with cv-build's validate step; both must pass.
```

**Workflow-block pattern** — `cv-build/SKILL.md` lines 22-32, mirrors cv-create lines 35-42 (existing). Use the same code-fenced numbered-step ASCII format:

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

**Stop-on-failure narrative pattern** — `cv-build/SKILL.md` line 71:

```markdown
If validation exits with non-zero (any FAIL), STOP. Do not package. Load [references/diagnostic-rules.md](references/diagnostic-rules.md), match the FAIL code to a rule, and report actionable fix steps.
```

This is the exact narrative shape D-07 requires ("Checkpoint failure mode = stop and report; user re-runs cv-create to resume"). Mirror this in cv-create's new per-viz checkpoint section.

**Step-3 existing per-viz loop scaffold** — `cv-create/SKILL.md` lines 72-150 (existing Step 3a/3b/3c/3d). This is the section being rewritten. The four substeps already exist; the change is making each a discrete, checkpoint-bounded tool call:

```markdown
## Step 3 — Write each viz

For each viz in `DESIGN-LOCK.md.vizs[]`:

### 3a. Emit boilerplate + MANDATORY annotation pair

​```bash
node ${CLAUDE_SKILL_PLUGIN_DIR}/../../scripts/boilerplate_emit.js <viz_name> <app_id>.<viz_name> > <app_id>/appserver/static/visualizations/<viz_name>/src/visualization_source.js
​```
...

### 3b. Fill `_renderDark` and `_renderLight`
...

### 3c. Write `formatter.html`
...

### 3d. Write `visualization.css`
```

**Analog 2 (per-viz iteration shape):** `plugins/splunk-custom-viz/scripts/validate.sh` lines 48-83 — the canonical "for each viz" shell loop in this plugin:

```bash
for f in "$APP_DIR"/appserver/static/visualizations/*/formatter.html; do
    [ -f "$f" ] || continue
    VIZ=$(basename "$(dirname "$f")")

    # B10 — VIZ_NAMESPACE required, no hardcoded namespace
    HARDCODED=$(grep -E 'name="[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+\.' "$f" 2>/dev/null | grep -cv '{{VIZ_NAMESPACE}}' || true)
    if [ "$HARDCODED" -gt 0 ]; then
        fail B10 "$VIZ: $HARDCODED hardcoded namespace(s) in formatter — use {{VIZ_NAMESPACE}}"
    fi
    ...
done
```

cv-create's per-viz progress loop (D-09) should describe the agent's behavior in the same `for each viz` shape, and the checkpoint predicate (D-06) reuses the same `[ -f ... ]` + `grep -q` predicates this script uses.

---

### `plugins/splunk-custom-viz/skills/cv-create/references/standalone-mode.md` (skill reference, one-shot per-viz)

**Analog:** Same file's existing Step 4 (lines 169-178) already says *"Same as full-pipeline Step 3"* — the rewrite extends that delegation to reference the new chunked sequence (D-08).

**Existing pattern** (lines 14-22) — keeps its own workflow ASCII block; insert the new per-viz checkpoint sequence inside Step 4:

```markdown
## Workflow

​```
Step 1: Inline mini-Stage-A
Step 2: Synthesize a one-viz mini-lock in memory
Step 3: Write the minimal app scaffold (if not present)
Step 4: Generate the viz files (boilerplate + render + formatter + CSV)
Step 5: Report
​```
```

**Existing delegation to full-pipeline** (lines 169-178) — the line that must be updated to reference the per-viz checkpoint sequence:

```markdown
## Step 4: Generate the viz files

Same as full-pipeline Step 3:

1. Run `boilerplate_emit.js` to get the skeleton
2. Paste the mini-lock's `visual_reference_html` as a comment above `_renderDark` and `_renderLight`
3. Fill `_renderDark` and `_renderLight` from the CSS
4. Write `formatter.html` from `visual_spec`
5. Write the demo CSV
```

Rewrite to: same five sub-steps, but with sentinel-anchored Edit calls (D-01) and an explicit "checkpoint" line at the end. Resume detection (D-03) does NOT apply in standalone (one-shot mode).

---

### `plugins/splunk-custom-viz/skills/cv-create/references/iteration-mode.md` (skill reference, delta-Edit workflow)

**Analog (self):** Step 7 (lines 102-118) already describes targeted re-emit of a single viz's source files. Sentinel anchors make the natural-language delta Edits cleaner because they give the agent a deterministic `old_string` anchor.

**Existing Step 7 pattern** (lines 102-118):

```markdown
## Step 7: Re-render the viz

Regenerate ONLY the affected viz's files:

- `<app_id>/appserver/static/visualizations/<viz_name>/src/visualization_source.js` (re-emit from boilerplate + new render functions):

​```bash
node ${CLAUDE_SKILL_PLUGIN_DIR}/../../scripts/boilerplate_emit.js <viz_name> <app_id>.<viz_name> \
    > <app_id>/appserver/static/visualizations/<viz_name>/src/visualization_source.js
​```
- `<app_id>/appserver/static/visualizations/<viz_name>/formatter.html` (re-emit if visual_spec changed)
- Theme.js — only re-emit if `global` tokens changed (unlikely in iteration)

PRESERVE:
- Other vizs' source files (untouched)
- Existing formatter VALUES (the user may have tweaked them in Splunk; don't overwrite)
- Demo CSV data (unless data_contract changed)
```

The rewrite (per D-08) changes the re-emit shape: instead of full re-emit-from-boilerplate, iteration mode can target the sentinel pair with an Edit whose `old_string` is the current render body between the sentinels and whose `new_string` is the updated body. This produces a cleaner delta because the Edit anchors are explicit. Same checkpoint (D-06) runs at the end.

**Confirmation-gate prose pattern** (lines 64-83) — the state-back-and-confirm shape iteration mode already uses. Mirror the progress-line `↻ [N/M] <viz_name>` style (D-09) inside iteration's per-viz delta application reports.

---

## Shared Patterns

### Pattern: Sentinel-as-grep-target

**Source:** `plugins/splunk-custom-viz/scripts/validate.sh` (multiple lines — `themeMode`, `_resolveTheme`, `define(`, `requestAnimationFrame`, `linear_gradient`)

**Apply to:** D-02 sentinel design + D-03 resume detection + D-06 checkpoint

The plugin's established pattern is "a substring is the predicate." Sentinel comments `CV-RENDER-DARK-BEGIN/END` and `CV-RENDER-LIGHT-BEGIN/END` are just more grep targets in the same shape `validate.sh` already uses.

Excerpts of the existing grep-predicate idiom:

```bash
# validate.sh line 72-76 — presence check
if grep -q 'themeMode' "$f"; then
    if ! grep -qE 'name="{{VIZ_NAMESPACE}}\.themeMode"[^>]*value="auto"' "$f"; then
        fail B20 "$VIZ: themeMode default must be \"auto\""
    fi
fi
```

```bash
# validate.sh line 177-180 — paired-presence check (a key references a consumer)
if ! grep -qE "opt\(['\"]${K}['\"]" "$SRC"; then
    fail K1 "$VIZ: color picker \"$K\" in formatter.html is not consumed by visualization_source.js (dead UI). Add to _resolveTheme(t, opt). See KNOWN-CORRECTIONS.md #2."
fi
```

D-04's "any non-whitespace content between begin/end sentinels" is the same grep-predicate shape. Concrete predicate the checkpoint and resume-detection use:

```bash
# Predicate composition for D-04 ("filled" threshold):
# 1. file exists
[ -f "$SRC" ] || return_fail
# 2. begin sentinel present
grep -q 'CV-RENDER-DARK-BEGIN' "$SRC" || return_fail
# 3. end sentinel present
grep -q 'CV-RENDER-DARK-END' "$SRC" || return_fail
# 4. non-whitespace content between them
awk '/CV-RENDER-DARK-BEGIN/,/CV-RENDER-DARK-END/' "$SRC" \
    | sed '1d;$d' | grep -q '[^[:space:]]' || return_fail
```

(Executor can express this inline in SKILL.md prose or in a tiny helper — D-09 leaves the shape to executor's discretion.)

### Pattern: "Before you start — MANDATORY reading" prelude

**Source:** `plugins/splunk-custom-viz/skills/cv-create/SKILL.md` lines 10-17 (and parallel in `cv-build/SKILL.md` lines 10-16, `cv-sketch/SKILL.md` line 40)

**Apply to:** cv-create SKILL.md rewrite — this block MUST remain intact

Per `<canonical_refs>`: *"cv-create reads this in 'Before you start'. Any change to the SKILL.md must keep the MANDATORY read intact."*

Existing cv-create prelude (lines 10-17):

```markdown
## Before you start — MANDATORY reading

Before writing any code, read these two files in order. They are the source of truth for what works in Splunk; deviating from them produces silent failures that ship to users.

1. **`../../KNOWN-CORRECTIONS.md`** (12 corrections, plugin root) — production-discovered bugs that override anything in reference docs. Every correction lists the symptom, the fix, and the validator check (when applicable).
2. **`../../references/splunk-viz-canon.md`** (1047 lines, 26 rules, plugin root) — the canonical Splunk Canvas 2D viz knowledge base. Independently battle-tested. KNOWN-CORRECTIONS references these rules by number (e.g. "Correction #7 enforces Rule 19").

If you remember these from a previous session, re-read them anyway — they change.
```

Re-emit verbatim. The rewrite is downstream of this block, not within it.

### Pattern: Visible-progress glyph trio

**Source:** `<specifics>` of CONTEXT.md: *"Visible progress prefix characters: ✓ ↻ ✗ (Unicode, three glyphs). Match the existing cv-build summary style."*

**Apply to:** D-09 per-viz progress output across all three cv-create modes

cv-build's summary style (`cv-build/SKILL.md` lines 178-189, plus `validate.sh` lines 308-323) uses `OK` / `FAIL` / `WARN` text codes (no Unicode glyphs yet). Phase 44 introduces the `✓ ↻ ✗` glyph trio specifically for cv-create progress lines per `<specifics>` — these are new but are explicitly framed as "match the existing cv-build summary style" (i.e., one short line per checkpoint event, no multi-line decoration).

Exact format from D-09:

```
✓ [N/M] <viz_name> — boilerplate + renderDark + renderLight + formatter + css
↻ [N/M] <viz_name> — already complete, skipping
✗ [N/M] <viz_name> — checkpoint failed: <reason>
```

### Pattern: Stop-on-first-failure, user resumes

**Source:** `plugins/splunk-custom-viz/skills/cv-build/SKILL.md` line 71

**Apply to:** D-07 checkpoint failure mode

```markdown
If validation exits with non-zero (any FAIL), STOP. Do not package. Load [references/diagnostic-rules.md](references/diagnostic-rules.md), match the FAIL code to a rule, and report actionable fix steps.
```

cv-create's equivalent (D-07): *"Print: `✗ [N/M] <viz_name> — checkpoint failed: <which predicate failed>` and exit. Resume detection (D-03) picks up cleanly on the next invocation. No retries, no skip-and-continue."*

Same shape. The cv-build prose is the prose pattern to copy.

### Pattern: KNOWN-CORRECTIONS entry shape (NOT modified this phase, but referenced)

**Source:** `plugins/splunk-custom-viz/KNOWN-CORRECTIONS.md` lines 9-56 (Correction 1 + Correction 2 — exemplars)

**Apply to:** Reference only. Phase 44 does NOT add a new correction. The `<canonical_refs>` block requires keeping the MANDATORY read intact — that's it. If a future phase wants to document the sentinel-emission contract as Correction #13+, it would follow this shape:

```markdown
## Correction N — <Title>

**Source:** <where it was discovered>

<one-paragraph description of the symptom and the fix>

​```javascript|json|bash
<concrete fix example>
​```

**Where it lives:** <file path where the rule is enforced>
**Validator:** <validate.sh check, if applicable>

---
```

No change needed in this phase — the existing entries are the format reference for any follow-up correction.

## No Analog Found

No files in scope lack an analog. Every modified file has a direct sibling-or-self analog in the same plugin:

- `boilerplate_emit.js` is self-analog (template-string edit inside an existing template)
- `cv-create/SKILL.md` mirrors `cv-build/SKILL.md` step-by-step structure
- `cv-create/references/standalone-mode.md` and `iteration-mode.md` are siblings of each other and delegate to the same Step-3 pattern

## Metadata

**Analog search scope:**
- `plugins/splunk-custom-viz/skills/cv-create/` (self)
- `plugins/splunk-custom-viz/skills/cv-build/` (sibling skill, same plugin)
- `plugins/splunk-custom-viz/skills/cv-sketch/` (sibling skill — checked for MANDATORY prelude shape)
- `plugins/splunk-custom-viz/scripts/` (validate.sh, boilerplate_emit.js)
- `plugins/splunk-custom-viz/` (KNOWN-CORRECTIONS.md, README.md)
- `plugins/splunk-custom-viz/tests/smoke/` (RUN.md — end-to-end manual flow)

**Files scanned:** 9 read in full or with targeted offset; 12 enumerated via Glob/ls.

**Pattern extraction date:** 2026-05-26
