# Requirements — Milestone v6.1 HANDOFF Harvest

**Milestone goal:** Harvest the proven-in-production lessons from two real-brand v6.0.8 builds (Cisco UC and Asus ROG) into skills, references, and validators so the next pack does not repeat the same caught mistakes.

**Source inputs:** `tests/test51_cucm/HANDOFF.md` (21 items) + `tests/test52_asus_rog/HANDOFF.md` (~12 items) — both gitignored but readable in the local working tree.

**Target plugins:** `splunk-custom-viz` (cv6, currently v6.0.8) · `splunk-spl` (currently v1.2.0) · `splunk-dashboard-studio` (currently v3.5.0). No work in splunk-viz-packs or splunk-admin this milestone.

**Plugin language:** English only per CLAUDE.md.

---

## v6.1 Requirements

### Validator Hardening (`scripts/validate.sh`)

- [ ] **VAL-01**: User running `validate.sh` on a viz with a color-picker that is `opt(...)`-read but never reaches a `ctx.*` call sees a FAIL with code `K1b` and a message naming the unused picker key (test52 Correction #23 — extends K1 to verify the value reaches a draw call, not just that it's read)
- [ ] **VAL-02**: User running `validate.sh` on a viz with a text-input that is `opt(...)`-read but never reaches a `ctx.*` call sees a FAIL with code `K5` and a message naming the unused text-input key (test51 Correction #15 — text-input wired-to-render contract, parallel to VAL-01). Code `K5` was chosen because `K2` is already in use for the `invalidateUpdateView`-in-RAF check (KNOWN-CORRECTIONS #4).
- [ ] **VAL-03**: User running `validate.sh` on a viz whose source declares a font family in `ctx.font = '... "<family>", ...'` that has no matching `@font-face { font-family: "<family>"` block in the viz's `visualization.css` sees a FAIL with code `K6` (test52 Correction #26 — declared font has a matching `@font-face`). Code `K6` was chosen because `K3` is already in use for the bare-string-token-default check (KNOWN-CORRECTIONS #1).
- [ ] **VAL-04**: User running `validate.sh` against a merged parent-app directory sees a FAIL with code `K7` if any `"type": "<x>.<viz_name>"` in a dashboard XML has `<x>` not equal to the parent app's `[package] id` in `app.conf` (test52 Correction #24 — cross-app viz type consistency). Code `K7` keeps the new validator block sequential after K1b/K5/K6.
- [ ] **VAL-05**: User running `validate.sh` on a viz with the new checks active sees the existing fallback families `sans-serif` / `monospace` / `serif` / `system-ui` / `Inter` / `Arial` / `Helvetica` exempt from K6, and existing K1 / K2 / K3 / B / R / F families still fire correctly (no regression sweep across every in-repo viz pack)

### Font Embedding Pipeline (`splunk-custom-viz/scripts/` + `cv-create`)

- [ ] **FONT-01**: User running `cv-create` on a viz pack whose `shared/theme.js` declares brand fonts in `global.typography` sees each declared font downloaded as woff2 from Google Fonts (or equivalent source) and base64-encoded as `@font-face` blocks at the top of every viz's `visualization.css` — fonts actually load inside the Splunk iframe (test52 Correction #26)
- [ ] **FONT-02**: User running the new `scripts/embed_fonts.sh` (or equivalent helper) against an existing viz pack idempotently rewrites each viz's `visualization.css` with `@font-face` blocks — safe to re-run, no duplicates
- [ ] **FONT-03**: User running `cv-create/SKILL.md` Step 2 sees an explicit substep that calls the font-embedding pipeline after `theme.js` is written, before the per-viz emission loop begins

### Cross-App Merge Ergonomics (`cv-build` or new `cv-merge`)

- [ ] **MERGE-01**: User running `cv-build --merge-into <parent_app>` (or invoking a new `cv-merge` skill) on a viz pack at `rog_telemetry_viz/` sees every `"type": "rog_telemetry_viz.<viz>"` reference rewritten to `"type": "<parent_app>.<viz>"` across all dashboard XMLs and `savedsearches.conf`, viz directories copied under the parent app's `appserver/static/visualizations/`, and lookups copied under the parent app's `lookups/` (test52 Correction #24)
- [ ] **MERGE-02**: User reviewing the merged parent-app tarball sees `validate.sh K4` pass — no cross-app type mismatches survive the merge
- [ ] **MERGE-03**: User reading `cv-build/references/dashboard-transcription.md` finds an explicit "Cross-app merge" section documenting the namespace migration

### cv-sketch Slop Test Additions (`cv-sketch/SKILL.md` Stage D + `references/quality-bar.md`)

- [ ] **SKETCH-01**: User running `cv-sketch` Stage D on a mockup containing a concentric-arc viz sees the Slop Test fail (or warn) if any arc start/end point does not sit on the same circle within 0.1px tolerance — symptom is two disconnected colored segments (test52 Correction #22)
- [ ] **SKETCH-02**: User reading `cv-sketch/references/quality-bar.md` finds an SVG arc geometry section with a tiny inline JS helper that computes endpoints from `start_angle + sweep_angle + radius`, plus the trig-endpoint rule for future arc-based vizs
- [ ] **SKETCH-03**: User running `cv-sketch` Stage D on a mockup that overlays small (<32px) markdown text on a background shape sees the Slop Test warn against the pattern, with the working alternative (colored dot + label embedded in the section title) named (test51 Gap G2)

### Working Patterns Codified (`cv-create/references/`, `cv-sketch/references/`, `ds-couture/SKILL.md`)

- [ ] **PATTERN-01**: User reading `cv-create/references/canvas-port-rules.md` finds Rule 9 "Compute multi-row layouts bottom-up, not top-down" with the working JavaScript snippet from test51 (legend → caption → value → gauge), plus a clear "Symptom: elements collide at small panel heights" callout (test51 Pattern A)
- [ ] **PATTERN-02**: User reading `cv-create/references/canvas-port-rules.md` finds a "Rule 5 implementation pattern" section describing the shared `_render<X>(ctx, data, t, w, h, opt, isLight)` helper pattern — both `_renderDark` and `_renderLight` delegate to one helper with `if (!isLight)` branches for theme-conditional effects (test52 Section 3 working pattern)
- [ ] **PATTERN-03**: User reading `splunk-dashboard-studio/skills/ds-couture/SKILL.md` finds a "Multi-audience apps" sub-section with the three-flavor matrix (C-suite editorial light · Operations refined dark · Specialist industrial black) as a recommended starting template for multi-dashboard apps (test51 Pattern D)
- [ ] **PATTERN-04**: User reading `cv-sketch/references/stage-a-commitment.md` finds an explicit note that the Stage A anti-references list MUST be persisted into `DESIGN-LOCK.md.global.commitments.anti_references` so `cv-create` can re-read it mid-port as a defense mechanism (test52 Section 3 working pattern)

### SPL Reference Debt (`splunk-spl/`)

- [ ] **SPL-01**: User reading `splunk-spl/skills/spl-gotchas.md` finds a new numbered trap covering `relative_time(now(), "0")` failing on the All-time picker preset, with the required `case()` wrapper pattern (test51 Correction #16)
- [ ] **SPL-02**: User reading `splunk-spl/reference/multisearch.md` finds an explicit "DOES NOT WORK with inputlookup" warning, with the `append + discriminator field` working alternative (test51 Correction #17)
- [ ] **SPL-03**: User reading `splunk-spl/reference/stats.md` finds an explicit trap for `stats round(avg(field), N)` invalid syntax with the post-stats `eval` correction pattern (test51 Correction #18)
- [ ] **SPL-04**: User reading `splunk-spl/skills/spl-gotchas.md` finds a "Wide → tall reshape without `untable`" recipe using `makemv + mvexpand + case`, with the test52 canonical example (single rig latest row → component-row radar) (test52 Correction #25)
- [ ] **SPL-05**: User reading `splunk-spl/skills/spl-gotchas.md` finds a "Token substitution safety" section warning that tokens are dumb string substitution, with the `case()` wrapper pattern for any function that requires a specific format (test51 Gap G4)

### Dashboard Studio Reference Debt (`splunk-dashboard-studio/`)

- [ ] **DS-01**: User reading `splunk-dashboard-studio/skills/ds-viz-fillergauge.md` Quick Start sees the 100 px minimum panel height called out, with the recommended container card height of ≥ 124 (gauge 100 + label 20 + padding 4) (test51 Correction #19)
- [ ] **DS-02**: User reading `splunk-dashboard-studio/skills/ds-viz-area.md` Quick Start sees the `stackMode` enum restricted to `auto / stacked / stacked100` (or DOS expression / token), with `"default"` explicitly called out as invalid (test51 Correction #20)
- [ ] **DS-03**: User reading `splunk-dashboard-studio/references/ds-ref-pitfalls.md` finds DS-01 and DS-02 added to the per-viz traps matrix, plus the markdown-overlay anti-pattern from SKETCH-03 surfaced as a cross-reference
- [ ] **DS-04**: User reading `splunk-dashboard-studio/skills/ds-data-explore/SKILL.md` finds the `relative_time` All-time `case()` wrapper called out when wrapping `inputlookup`-based SPL with a time-picker filter (test51 Correction #16 dashboard-side)
- [ ] **DS-05**: User reading `splunk-dashboard-studio/references/ds-ref-anti-patterns.md` finds the number-inside-circle / small-markdown-on-shape badge pattern added as a named anti-pattern with the working alternative (test51 Gap G2)
- [ ] **DS-06**: User reading any `cv-build`-generated report finds the 3-step refresh checklist (reinstall app → hit `/_bump` → hard-refresh browser) replacing the old "Restart: Required for static images" line (test51 Gap G1)

### Formatter Section-Label Consistency (`vp-viz` + `cv-build`) — added 2026-06-23 from live DS debugging

- [ ] **FMT-01**: User reading `vp-viz/SKILL.md` "Formatter structure" + `vp-viz/references/formatter-patterns.md` sees ONLY the three standard Classic `section-label` values (`Data configurations` / `Data display` / `Color and style`); the non-standard "Effects" section is removed and its toggles (showAmbientLight, showVignette, showGlow, accentColor picker) folded into `Color and style` — resolves the contradiction with cv-create's authoritative rule (formatter-emission.md)
- [ ] **FMT-02**: User reading the `vp-viz` STOP / pre-code checklist (`references/pre-code-checklist.md`) sees the EXACT-3-label rule enforced as a check (it currently enforces only namespace/type rules); the "4 sections when Animation/Effects present" line is corrected
- [ ] **FMT-03**: User DEBUGGING a viz finds a symptom-first rule in `cv-build/references/diagnostic-rules.md`: "Formatter controls missing in Dashboard Studio config panel" → cause: non-standard `<form>` section-label → fix: use exactly `Data configurations` / `Data display` / `Color and style` (today the rule only lives in cv-create's emission reference, invisible when debugging)
- [ ] **FMT-04**: Both `vp-viz` and `cv-build` state explicitly that this rule applies to ANY Classic custom viz embedded in Dashboard Studio, including hand-authored vizs not produced by cv-create
- [ ] **FMT-05**: The Extension API `editorConfig` path (`vp-viz/references/config-json-template.md` "Effects" label) is investigated on a live viz; the finding is documented (whether the 3-label constraint applies to Extension API too) and the "Effects" editorConfig label is either confirmed safe and kept, or corrected — NOT blindly renamed
- [ ] **FMT-06**: Companion DS custom-viz gotchas verified/strengthened: (a) namespace dual-read documented as the 3-way probe (getPropertyNamespaceInfo ns+key → short `<app>.<viz>.<key>` → bare key) with the SXML long-key form `display.visualizations.custom.<app>.<viz>.<key>` stated alongside the short-key dashboard form; (b) preview.png auto-discovery semantics stated (ships at `appserver/static/visualizations/<viz>/preview.png`, Splunk auto-discovers with no `visualizations.conf` reference, picker tile blank if missing)

### Extension API Correctness + Master/Detail (`cv-create/references/extension-api.md`) — added 2026-06-27 from runtime-verified DS-native POC

Source: `ds_master_detail_test/HANDOVER-ds-native-master-detail.md` (verified live on Splunk Enterprise 10.4.0). Contradicts official Splunk docs and our current reference.

- [ ] **EXT-01**: User reading `extension-api.md` sees the corrected `dataContract` shape `{ requiredDataSources:[...], optionalDataSources:[...] }`; the current invented `{ primary:{ required, optional } }` form is removed
- [ ] **EXT-02**: User reading `extension-api.md` sees that direct `triggerDrilldown({action:'setToken'})` is INERT on 10.4, and the working token path: viz emits `triggerDrilldown({ action:'custom.click', payload })` (event type MUST end in `.click`), dashboard maps via `drilldown.setToken` eventHandler `tokens:[{token, key}]`, config.json needs `showDrilldown:true`+`hasEventHandlers:true`
- [ ] **EXT-03**: User reading `extension-api.md` sees the flat payload-key contract (eventHandler `key` = flat `payload[key]`, not nested path → emit whole row as flat dotted `row.<field>.value` keys), the three working `key` forms (`value`/`name`/`row.<field>.value`), and flat token readback (`tokens.submitted.<name>` string) vs object authoring (`defaults.tokens.default` = `{ "<name>": { "value": "…" } }`)
- [ ] **EXT-04**: User reading `extension-api.md` finds the named-secondary-datasource + in-panel master/detail pattern: `optionalDataSources:["detail"]`, dashboard `dataSources:{primary, detail}`, both delivered columnar via `addDataSourcesListener`, click→token→detail-rerun→listener loop
- [ ] **EXT-05**: User reading `extension-api.md` finds datasource-less rendering (`requiredDataSources` is a hint, not a render gate), `canSetTokens` corrected (array form, not gating), and `editorConfig` corrected to array-of-`{label, layout}` — which RESOLVES FMT-05 (Extension API editorConfig labels are free; the 3-label constraint is Classic-only)
- [ ] **EXT-06**: User reading `extension-api.md` (or a cv-build authoring note) finds how to author without the interactive `@splunk/create` CLI: copy template build/packager verbatim, patch `package.mjs` to bundle `package/default/data` (ship a DS dashboard in the app), and the `type` = `<appId>.<vizDirName>` gotcha

---

## Out of Scope (v6.1)

Explicit exclusions with reasoning:

- **Phase 45 (session reduction) and Phase 46 (cv-oneshot)** — moved from v6.0 to v6.2+. Both are orthogonal to HANDOFF Harvest theme. Address separately so phase boundaries stay clean.
- **Any rework of Phase 44 chunked emission contract** — validated in production across 7,400+ lines of emitted source. Leave alone.
- **New viz types or new cv-* skills not directly tied to the HANDOFFs** — keep the milestone scoped to documented findings.
- **splunk-viz-packs work** — legacy plugin, no v6.x changes planned. **EXCEPTION (2026-06-23):** Phase 53 re-includes vp-viz for the formatter section-label contradiction fix only — the bug lives in vp-viz and cannot be fixed elsewhere. No other vp-* changes.
- **splunk-admin work** — no HANDOFF findings touch it.
- **Tarball-level patches to test51_cucm or test52_asus_rog deliverables** — those are per-build v1.1 follow-ups, not skill-level harvests.

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| VAL-01 | Phase 47 | Mapped |
| VAL-02 | Phase 47 | Mapped |
| VAL-03 | Phase 47 | Mapped |
| VAL-04 | Phase 47 | Mapped |
| VAL-05 | Phase 47 | Mapped |
| FONT-01 | Phase 48 | Mapped |
| FONT-02 | Phase 48 | Mapped |
| FONT-03 | Phase 48 | Mapped |
| MERGE-01 | Phase 49 | Mapped |
| MERGE-02 | Phase 49 | Mapped |
| MERGE-03 | Phase 49 | Mapped |
| SKETCH-01 | Phase 50 | Mapped |
| SKETCH-02 | Phase 50 | Mapped |
| SKETCH-03 | Phase 50 | Mapped |
| PATTERN-01 | Phase 50 | Mapped |
| PATTERN-02 | Phase 50 | Mapped |
| PATTERN-03 | Phase 50 | Mapped |
| PATTERN-04 | Phase 50 | Mapped |
| SPL-01 | Phase 51 | Mapped |
| SPL-02 | Phase 51 | Mapped |
| SPL-03 | Phase 51 | Mapped |
| SPL-04 | Phase 51 | Mapped |
| SPL-05 | Phase 51 | Mapped |
| DS-01 | Phase 52 | Mapped |
| DS-02 | Phase 52 | Mapped |
| DS-03 | Phase 52 | Mapped |
| DS-04 | Phase 52 | Mapped |
| DS-05 | Phase 52 | Mapped |
| DS-06 | Phase 52 | Mapped |
| FMT-01 | Phase 53 | Mapped |
| FMT-02 | Phase 53 | Mapped |
| FMT-03 | Phase 53 | Mapped |
| FMT-04 | Phase 53 | Mapped |
| FMT-05 | Phase 53 | Mapped |
| FMT-06 | Phase 53 | Mapped |
| EXT-01 | Phase 54 | Mapped |
| EXT-02 | Phase 54 | Mapped |
| EXT-03 | Phase 54 | Mapped |
| EXT-04 | Phase 54 | Mapped |
| EXT-05 | Phase 54 | Mapped |
| EXT-06 | Phase 54 | Mapped |

**Total: 41 requirements** across 9 categories (5 VAL · 3 FONT · 3 MERGE · 3 SKETCH · 4 PATTERN · 5 SPL · 6 DS · 6 FMT · 6 EXT).
