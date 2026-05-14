# Field test — ds-couture v2.7.2, CISO Daily Controls scenario

**Date:** 2026-04-29
**Plugin version under test:** splunk-dashboards 2.7.2
**Tester:** Lyder + Claude
**Purpose:** Validate v2.7.1 patches (Scope Check, brand-collision tree, aesthetic-flavor vocabulary) against a fresh non-REMA scenario before committing to v2.8.0 architectural work.

---

## Test scenario

> Build an executive cybersecurity overview for a CISO. Splunk back-end. Corporate brand color is red. CISO checks during morning brief on a 27" monitor. Tone: premium, confident, not "AI-generic SOC wall".

Chosen because it forces:
- Brand-status color collision (red brand × red=critical)
- Aesthetic-flavor commit on executive archetype (not industrial like REMA)
- Design Context Protocol completion (4 of 5 inputs partial → forces gate to fire)
- Persona that doesn't match any pre-defined template

---

## Locked Design Context

| Input | Value |
|---|---|
| Audience | CISO, 27" desk monitor, indoor office daylight, daily morning brief |
| Time-on-screen | 3-5 min daily |
| Job-to-be-done | Validate that controls (EDR, SIEM, patching) are operating |
| Tone (3 concrete) | authoritative, quiet, selvsikker (confident) |
| Tone (meta) | premium |
| Anti-references | Not AI-generic SOC wall; not rainbow-pie cybersec dashboards |
| Brand color | #C8102E (red corporate) — locked default after user confused turkis/red |
| Brand wordmark | "ACME" (test placeholder) |
| Brand secondary | Derived (cool-blue) — user did not supply |

## Locked design decisions

| Decision | Value | Source |
|---|---|---|
| Persona | CISO Daily Controls (new, hybrid Sarah-role × Yuki-job) | ds-ref-personas fallback procedure |
| Archetype | Executive summary, controls-status flavor | ds-ref-archetypes |
| Canvas | 1440 × 960 | ds-ref-archetypes (laptop/desk monitor row) |
| Theme | Light | ds-ref-personas (Yuki theme bias) |
| Aesthetic flavor | Refined | ds-couture flavor table (matches all 4 tone words) |
| Density | Low (selvsikker → fewer-larger-panels) | ds-ref-brand tone-word translation |
| Brand collision treatment | Step 4 — wordmark-only + 4px accent stripe | ds-ref-brand collision tree |

## Panel mix (deviates intentionally from canonical exec-summary)

- 4-KPI strip (top): active critical incidents, EDR coverage %, patch compliance %, alerts triaged today vs target
- 1 trend (line): incident count over 14 days
- 1 controls-status grid (table or singlevalueicon grid): controls × status (compliant/degraded/non-compliant)
- 1 footer markdown: escalation channels, on-call, runbook link

Drops vs canonical:
- No pie/donut (anti-pattern reflex unless ≤6 slices and meaningful part-of-whole)
- Top-N status table swapped for controls-status grid

---

## Field-test notes (live)

### #1 — Stance + refusal pattern fires hard
Loading ds-couture immediately produced refusal urge to skip Design Context. The "you are the designer in the room" stance is enough motivation. **Gate works.**

### #2 — No internal-consistency check between input turns
User said brand was "rød" then answered Q4 with "Turkis". I caught it because both were short messages adjacent to each other. Under heavier conversational load, the contradiction would slip past. **Candidate v2.8.0:** design-brief.md schema treats brand-hex as a single-value field that gets updated explicitly — drift between turns becomes auditable.

### #3 — "Three concrete brand words" rule is good but exception-handling is implicit
User wanted 4 tone words. Skill demands 3. I made a tactical collapse (3 concrete + 1 meta). The collapse is sensible but undocumented in the skill. **Candidate v2.8.0:** explicit rule in ds-couture for "what to do when user gives 4 tone words" — either drop fuzzy-categories (premium, modern, clean) or treat one as meta-direction.

### #4 — Persona fallback procedure works because it overlaps Design Context
"When the user names a NEW persona" extraction asks 5 attributes. Those 5 overlap heavily with the 5 Design Context inputs already captured. So the fallback is effectively free — no new questions needed. **Good design** — gates that reuse data instead of re-asking.

### #5 — Brand-collision tree assumes secondary + neutral are always available
Steps 1 and 2 of the priority order require brand-secondary and brand-neutral. User supplied only primary. Tree fell straight to step 3 or 4. Both safe, but steps 1 and 2 (the "best" outcomes) are inaccessible when only primary is known. **Candidate v2.8.0:** Design Context Protocol should actively prompt for brand-secondary + brand-neutral when primary is a collision-color (red/orange/amber/yellow). Or design-brief.md schema marks them as `<missing>` so the gap is visible.

### #6 — `premium` collapse aligns with brand-skill's dead-category rejection
Brand-skill flags "premium / modern / clean / minimal" as dead categories that must be rejected. My pre-collapse to 3-concrete + 1-meta saved the brand-skill from having to fire its rejection mechanism. Lucky alignment but worth codifying — if user supplies a dead-category word, ds-couture should auto-treat as meta and ask for a concrete replacement.

### #7 — "fortsett" (continue) after 4 checkpoint questions = defaults must be applied
Natural user response to a multi-question checkpoint is "fortsett" → agent must apply defaults. Acceptable IF defaults are logged in an artifact the user can audit later. Without persistence, the assumptions vanish into context. **Strongest argument for v2.8.0 design-brief.md as mandatory artifact.**

---

### #8 — Light-theme status palette fails AA-normal for warning + ok
`#D4820A` warning (3.7:1) and `#2B9E44` ok (3.5:1) on `#FAFAF7` canvas both fail WCAG AA-normal. Skill flags this with "pair with darker text label". Risk: under context pressure agent uses the color alone and skips the pair. **Candidate v2.8.0:** Scope Check should add a gate verifying every status-token use has redundant encoding (label + icon).

### #9 — Series palette is N/A for refined low-density
Our 6-panel exec dashboard has 0 multi-series viz (one trend with single line, controls-grid is a status-coloured table, no scatter/multi-bar/stack). Series-palette decision becomes irrelevant. ds-ref-color implicitly assumes multi-series is the normal case. **Candidate v2.9.0:** ds-ref-visual-encoding should explicitly state "if panel-mix has 0 multi-series viz, skip the series-palette decision entirely". Avoids unnecessary cognitive overhead.

### #10 — Editorial recipe pairs reject-listed Inter as body
Typography skill's Editorial recipe: "Spectral display + Inter body". Inter is on reflex_fonts_to_reject. Reject-list note says "Refuse them as the **display** half of any pairing" — so body Inter is technically allowed. But the rejection rationale ("appears in 80%+ of generated dashboards") applies regardless of role. **Candidate v2.8.1+ patch:** clarify whether reject-list applies to body only / display only / both, with examples. For our test we used Refined (Sectra+Söhne), so it didn't bite.

### #11 — Panel-as-card pattern not described in layout-grid
Refined-light canonical (Stripe/Notion-style) is "every panel = white card on warm canvas, R_CARD=8". ds-ref-layout-grid only describes "background-rectangle behind a cluster of panels" depth-pattern. Risk: under pressure agent does inconsistent depth (some panels carded, some flat) — auto-reject per Scope Check. **Candidate v2.9.0:** layout-grid explicitly names "panel-as-card" as a depth pattern tagged refined-flavor canonical.

### #12 — Scope Check #3 (consistent panel cards) actually fires
This is the strictest gate (no waiver allowed). Forced explicit decision: ALL panels carded OR NO panels carded. Without this gate I would have probably done "KPI-strip as one card + rest flat" — which the gate explicitly flags as worse than no depth at all. **Gate works**.

---

### #13 — Visual-encoding consult skipped because choices were obvious
Workflow tree mandates "Visual encoding (per panel) → ds-ref-visual-encoding + ds-pick-viz". For our exec-controls panel mix (4× singlevalue, 1× line, 1× table, 2× markdown) every choice was determined by panel intent. Loading the encoding skill would burn ~3000 tokens for zero new information. I skipped it. **Risk:** under context pressure, agents will rationalize skipping when choices are NOT actually obvious. **Candidate v2.8.0:** workflow-tree gets explicit "skip if unambiguous" guidance for visual-encoding step OR mandates always-load even when redundant. Ambiguity = inconsistent gate application.

### #14 — Slop Test #5 caught flat KPI hierarchy
Pre-Slop-Test design had 4 equal-sized KPIs (326×160 each). The archetype-conditional matrix flags "uniform-size KPI row" as `slop` for exec, `OK` for SOC. Resolution: promote KPI 1 to hero (434×160 at FS_KPI_HERO 72px), KPIs 2-4 supporting (290×160 at FS_KPI_MAJOR 48px). Math worked out exactly: 434 + 3×290 + 3×24 = 1376. **Gate works** — caught a real visual bug.

### #15 — Scope Check #2 caught missing section headers
Zone 2 (KPI strip) and Zone 3 (Trend + Controls) are both ≥2-panel clusters. Both lacked descriptive markdown above. Fix: add 2 markdown panels with section headers (`## Today's Posture` + `## Trend & Control Health`), ~50px each, total +100px vertical. Footer zone or bottom margin absorbs the cost. Without this gate, the dashboard would have read as panels-without-narrative. **Gate works.**

### #16 — Scope Check #4 forced waiver instead of implicit rejection
For exec daily-brief, tabs were the obvious-skip option. The gate forced explicit consideration AND a written waiver: "tabs considered and rejected because exec daily-brief benefits from predictable single-view repetition; tab-navigation breaks the 3-5 min scan budget." Same outcome, but reasoning now documented. **Audit trail value = real. Gate works as designed.**

### #17 — "Saturated reds across multiple panels" rule conflates decorative vs semantic
Slop Test matrix flags this as `slop` for exec. But status-red firing simultaneously on 2-3 panels (incidents, EDR, patch, controls) IS the legitimate signal when state is genuinely degraded. The rule's intent is to prevent decorative-red abuse, not to prevent legitimate-multi-status-red signaling. Current rule is too binary. **Candidate v2.9.0:** refine to distinguish decorative-red (banned) from semantic-red-firing (acceptable when state warrants). Or add archetype-specific guidance for control-validation flavors.

---

### #18 — CRITICAL: hand-off bypass produces broken dashboards
I built dashboard.json directly from ds-couture's design without consulting `ds-create` or `ds-viz-markdown`. The deployed dashboard rendered raw HTML as text in markdown panels — slop visible in seconds when user opened it. **Three concrete bugs:**
- Raw HTML (`<div style="…">`) inside `markdown` field — `splunk.markdown` strips/escapes HTML
- Used arbitrary CSS font stack (`'GT Sectra', Charter, Georgia, serif`) — Studio enforces 7-value enum (`Splunk Platform Sans` / `Splunk Data Sans` / `Splunk Platform Mono` / `Arial` / `Helvetica` / `Times New Roman` / `Comic Sans MS`)
- Used pixel `fontSize` (`32px`, `22px`) — Studio enforces enum (`extraSmall` / `small` / `default` / `large` / `extraLarge`)

**Fix required reload of `ds-viz-markdown` and rewrite of all 4 markdown panels.**

**This is the strongest possible argument for v2.8.0 architecture.** ds-couture must NEVER be allowed to hand off directly to deployment without ds-create as the implementation gate. Design-brief.md is necessary but not sufficient — there must be an enforced ds-create step that consults ds-viz-* skills for option-level correctness.

### #20 — Third ref/platform inconsistency: yAxisAbbreviation
`ds-ref-typography` k/M/B abbreviations table says use `none` to force exact values on tables/exec-KPIs. Splunk schema rejects `none` — valid values are `auto`, `off`, DOS expression, or token. **Same pattern as #19**: ref-skill recommends platform-impossible value. Sessions accumulated three inconsistencies (#19 typography fontFamily, #19 brand `<style>` block, #20 yAxisAbbreviation) — all caught only at deploy-time, none caught by the Slop Test or Scope Check. **Reinforces the v2.7.3 patch recommendation.**

### #19 — CRITICAL: skill-internal inconsistency between ref and viz layers
The Refined recipe in `ds-ref-typography` recommends `GT Sectra display + Söhne body` font pairing. `ds-ref-brand` writes:

> "If the brand font is a paid type foundry license (Sectra, Söhne, Suisse, Druk), the customer's company almost certainly has a licensed copy somewhere. Ask the user to surface the .woff/.otf file and reference it from a markdown `<style>` block as the brand-font-stack."

`ds-viz-markdown` says explicitly:

> "Raw HTML (`<div>`, `<style>`, `<script>`) — stripped/escaped."

**The skills recommend a strategy the platform forbids.** Reference layer (ds-ref-typography, ds-ref-brand) is decoupled from platform reality (ds-viz-markdown). Every refined/editorial-flavor dashboard with brand fonts inherits this bug.

This is **not an issue with v2.7.2 content** — it's a structural problem with how the ref-skills evolved without grounding in the viz-skills. **Candidate v2.8.0 must include cross-skill consistency check** OR the ref skills need to declare "consult ds-viz-X to confirm implementability" footers.

**Concrete impact for THIS test:**
- The "premium / authoritative / quiet" tone-mapping → Refined flavor → GT Sectra recommendation was unreachable
- Closest fallback within Splunk's enum: `Times New Roman` (only allowed serif)
- The aesthetic flavor commitment partially collapses because the typographic vocabulary is constrained beyond what ds-couture's brief assumes
- Field test result: dashboard works but the typography is generic-serif, not "boardroom premium"

**Implication for the v2.8.0 design-brief.md schema:** the typography section must be pinned against the splunk.markdown enum BEFORE the design brief locks. Currently it locks against ds-ref-typography's free-text recommendations — those are aspirational-design, not implementable-design.

---

## Final test result

- **Slop Test:** 13/13 after KPI-hierarchy fix (+ 1 commit at hand-off for time-bounded SPL)
- **Scope Check:** 6/6 after section-header fix + 1 documented waiver (tabs)
- **Implementation Test:** FAILED on first deployment (HTML-in-markdown), PASSED after consulting ds-viz-markdown
- **Output:** dashboard live at `splunk-knowledge-testing/acme_daily_controls_v1`, but brand typography degraded to `Times New Roman` (only allowed serif in Studio)

## Findings classified by severity

### CRITICAL (must fix before next field test)
- **#18** — ds-couture must enforce hand-off to ds-create; direct-to-JSON bypass produces broken Studio output (HTML-in-markdown, wrong fontFamily, pixel-fontSize). The hand-off protocol section in ds-couture currently SAYS to hand off — but doesn't enforce it. Under context pressure, the implementer (me, in this case) skipped ds-create entirely.
- **#19** — ds-ref-typography Refined recipe (GT Sectra + Söhne) and ds-ref-brand `<style>` block guidance contradict ds-viz-markdown's 7-enum fontFamily and HTML-stripping. Reference layer recommends platform-impossible strategies. Every refined/editorial dashboard with brand fonts inherits this bug.

### IMPORTANT (target v2.8.0 architectural work)
- **#2** — design-brief.md schema must include explicit brand-hex field with drift-detection between turns
- **#5** — Design Context Protocol should actively prompt for brand-secondary + brand-neutral when primary is collision-color
- **#7** — when user replies "fortsett" mid-checkpoint, defaults must be persisted in design-brief.md (audit trail)
- **#8** — Scope Check should add a 7th gate verifying every status-token use has redundant encoding (label + icon)
- **#13** — workflow-tree needs explicit "consult always" or "skip if obvious" rule for visual-encoding step

### NICE-TO-HAVE (target v2.8.1+ or v2.9.0)
- **#3** — explicit rule in ds-couture for "what to do when user gives 4 tone words" (drop fuzzy / treat as meta)
- **#6** — auto-treat dead-category words (premium, modern, clean, minimal) as meta and prompt for concrete replacement
- **#9** — ds-ref-visual-encoding explicit "skip if 0 multi-series viz" rule
- **#10** — typography reject-list disambiguation: applies to display only / body only / both
- **#11** — ds-ref-layout-grid name "panel-as-card" as canonical refined-flavor depth pattern
- **#17** — refine "saturated reds" rule to distinguish decorative vs semantic firing

### WORKED-AS-DESIGNED (positive findings)
- **#1** — stance + refusal-pattern produced immediate gate-firing
- **#4** — persona fallback procedure efficiently reused Design Context inputs
- **#12** — Scope Check #3 (consistent panel cards) forced explicit all-or-nothing decision
- **#14** — Slop Test #5 caught real KPI-hierarchy bug
- **#15** — Scope Check #2 caught structural omission
- **#16** — Scope Check #4 produced documented waiver

## Diagnosis (revised after deployment failure)

**v2.7.2 gates fire correctly DURING design** but **the hand-off-to-implementation step is unprotected**, which let me ship a broken dashboard. The Slop Test and Scope Check both passed against the design brief — but the design brief's typography choices (paid foundry fonts, HTML-style markdown) were never validated against Splunk Studio's actual constraints.

**Two failure clusters identified:**

### Cluster A — Architectural (the v2.8.0 lever)
Five findings (#2, #5, #7, #8, #18) all argue for the same structural fix: design-brief.md as enforced artifact + ds-create as enforced hand-off step. Currently both are voluntary. Under pressure, both get skipped.

### Cluster B — Skill-graph integrity (NEW, didn't surface in REMA)
One finding (#19) reveals a deeper problem: the reference skills (ds-ref-typography, ds-ref-brand) recommend strategies the platform skills (ds-viz-markdown) explicitly forbid. The skill-graph has no consistency-check between layers. This isn't a v2.8.0 architectural fix — it's a v2.8.0+ skill-content cleanup that requires auditing every ref skill against every relevant viz skill.

**Recommendation revised:**
1. **v2.7.3 patch** (urgent): fix the ds-ref-typography font-pairing list to use only Splunk's 7 enum values, OR explicitly mark current entries as "aspirational, fallback in implementation". Same for ds-ref-brand's `<style>` block guidance — call it out as not-supported-in-Studio.
2. **v2.8.0 architectural work** (planned): design-brief.md artifact + ds-create as enforced hand-off + ds-scope-check as separate skill (per existing seeds doc).
3. **v2.8.0+ skill-graph audit** (new): cross-check every ref skill recommendation against every viz skill constraint. Add machine-readable "consults" / "implementable-via" cross-references.

---

## Open at this point

- (none — test complete)
