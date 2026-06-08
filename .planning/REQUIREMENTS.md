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

---

## Out of Scope (v6.1)

Explicit exclusions with reasoning:

- **Phase 45 (session reduction) and Phase 46 (cv-oneshot)** — moved from v6.0 to v6.2+. Both are orthogonal to HANDOFF Harvest theme. Address separately so phase boundaries stay clean.
- **Any rework of Phase 44 chunked emission contract** — validated in production across 7,400+ lines of emitted source. Leave alone.
- **New viz types or new cv-* skills not directly tied to the HANDOFFs** — keep the milestone scoped to documented findings.
- **splunk-viz-packs work** — legacy plugin, no v6.x changes planned.
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

**Total: 29 requirements** across 7 categories (5 VAL · 3 FONT · 3 MERGE · 3 SKETCH · 4 PATTERN · 5 SPL · 6 DS).
