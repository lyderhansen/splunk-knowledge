# What's overkill in `splunk-viz-packs` — judged against the actual goal

**Reviewer:** Cursor / Claude Opus 4.7
**Date:** 2026-05-23
**Companion to:** `cursor_review_2026_05_23.md` (full critical review)
**Method:** Read every SKILL.md, sampled large reference files, diffed scripts, traced cross-references, verified counts with grep

---

## 0. Table of contents

1. [The lens](#1-the-lens)
2. [Section A — Clear overkill, should be cut or radically simplified](#2-section-a--clear-overkill-should-be-cut-or-radically-simplified)
3. [Section B — Mild overkill, keep but trim](#3-section-b--mild-overkill-keep-but-trim)
4. [Section C — Pulling its weight, keep as-is](#4-section-c--pulling-its-weight-keep-as-is)
5. [The blunt summary](#5-the-blunt-summary)
6. [The bigger architectural shift this points to](#6-the-bigger-architectural-shift-this-points-to)
7. [Honest second-pass — calibrating my confidence](#7-honest-second-pass--calibrating-my-confidence)

> **Read §7 before acting on Sections A and B.** It marks which recommendations I'd defend strongly, which I'd defend with caveats, and which are probably wrong or overconfident. The strong opinions in §A and §B stay on record, but §7 is the more honest take.

---

## 1. The lens

**Restated goal:** *a great plugin that creates a full custom viz pack for Splunk — branded, themed, ES5-correct, installs cleanly, looks intentional.*

With that lens, here's what's pulling weight vs. what's just there. Sections A and B below are the targets if you want to slim the plugin to its core value. Section C is the load-bearing content that earns its place.

---

## 2. Section A — Clear overkill, should be cut or radically simplified

### A1. `score_design.js` (204 lines + 327 lines of tests)

Scores a viz on 5 dimensions / 100 points. The actual implementation:
- Count `createLinearGradient` calls (0/1/2+ → 0/10/20 pts)
- Count distinct `px` font sizes in source
- Count `w *` / `h *` patterns as "dynamic spacing"
- Count distinct `fillStyle =` assignments
- Check for `requestAnimationFrame`

**This is theater.**

A viz with 3 random gradients, 4 unrelated font sizes, and a `setInterval` gets a perfect score. A simple, intentional viz with one purposeful gradient and clean typography scores worse. The script measures **proxies for effort**, not quality. No designer would trust this number. No agent should act on it.

What it actually achieves: a number that goes up when the agent adds more visual noise. That's the opposite of the design discipline `vp-design` is preaching (*"Strip colors test"*, *"Five-second story"*).

**Recommendation:** Delete. Or replace with a 30-line script that flags hard violations only (`flat fillStyle on data elements`, `no responsive font sizing`, `accent used as data fill`) — which `check_design.js` already does.

---

### A2. `repair_findings.js` (233 lines)

Auto-fixes B5, B7, B9, B10, B20 in `formatter.html` and dashboard XML — i.e., it patches the agent's own output after the agent already wrote it wrong.

If the templates in `vp-viz/SKILL.md` are correct and the agent follows them, **these violations shouldn't exist in the first place**. The repair loop is compensating for upstream authorship failure with downstream mechanical fixes.

The cheaper fix: make the formatter templates so unambiguous that B5/B7/B9/B10/B20 never get generated. The templates already exist inline in the SKILL. If they're being violated, the answer is "tighten the templates and examples", not "ship a Cheerio-based HTML rewriter".

**Recommendation:** Delete, or keep as an opt-in `--repair` flag with no expectation it's part of the normal path.

---

### A3. The whole AST validator stack (12 MB / 27 npm packages)

`validate_ast.js` (400) + `validate_dash.js` (397) + `check_design.js` (260) + `check_contrast.js` (150) + `repair_findings.js` (233) = **1440 lines of validation code** backed by `acorn` + `cheerio` + `ajv` + 24 transitive deps.

Engineered like a CI gate for a 50-person team. Deployed for a one-person hobby plugin.

The grep fallback already in `validate_viz.sh` covers most of what matters:
- hardcoded namespaces
- wrong attribute names
- `define()` vs `require()`
- missing `type="custom"` on color pickers
- missing `themeMode` default

That's ~80 lines of grep catching the load-bearing 10 mistakes. The AST tree-walk catches additional edge cases — but at the cost of 12 MB of deps and a Node prereq.

**Recommendation:** Two options:

**(a) Drop the AST path entirely.** Lean on grep checks for the 15 high-frequency mistakes. Plugin shrinks 12 MB. Validation becomes "good enough" instead of "exhaustive" — the right trade for a marketplace skill.

**(b) Keep AST path but make it opt-in.** Document `npm install` as a one-time step for power users. Plugin ships clean; users who want strict mode install their own deps.

---

### A4. Extension API support across all skills

**49 mentions of "format=extension" across 13 files** (counted with grep). Every workflow step has an `(if format=extension...)` branch. Two template paths, two build commands, two validation modes, two package commands.

But:
- The README never mentions Extension API.
- The `plugin.json` description does, with no user-facing documentation, no example, no quickstart.

It's half-shipped.

Honest question: **how many actual viz packs have you built with `format=extension`?** If the answer is 0 or 1, this is speculative code carrying real complexity tax — every SKILL.md got ~30% bigger to accommodate something barely used.

**Recommendation:** Either commit to Extension API as a first-class path (write the README section, ship real examples, test end-to-end) or pull it back into a separate `vp-viz-extension` skill / experimental flag, and stop forking every workflow step.

---

### A5. Mood × Aesthetic Flavor — two overlapping taxonomies

**9 moods** in `mood-and-design.md`:
> Precision, Power, Speed, Trust, Luxury, Playful, Futuristic, Organic, Minimal

**10 aesthetic flavors** in `vp-design/SKILL.md`:
> Brutalist, Editorial, Refined, Playful, Industrial, Luxury, Soft-pastel, Retro-futuristic, Organic-natural, Brutally-minimal

Overlaps verified by reading both tables:

| Mood | Aesthetic flavor | Overlap? |
|---|---|---|
| Luxury | Luxury | **identical** |
| Playful | Playful | **identical** |
| Organic | Organic-natural | near-duplicate |
| Minimal | Brutally-minimal | near-duplicate |
| Power | Industrial | conceptual overlap |

The agent now has to commit to ONE flavor AND ONE mood, and they cross-product without resolution rules. **Paralysis-inducing.**

Most production brand-design skills use **one taxonomy of ~6 archetypes**. Two overlapping taxonomies of 9-10 each is academic.

**Recommendation:** Pick one. Keep "mood" (maps directly to colors/fonts/effects via the lookup tables that already exist). Drop "aesthetic flavor" (vibe word with no operational hook). Or merge into 5-7 distinct slots.

---

### A6. 21 viz blueprints (605 lines)

The README says 14. `viz-blueprints.md` actually has 21 sections.

`vp-viz/SKILL.md` says explicitly:
> *"These blueprints show WHAT each viz type expresses... They are NOT templates to copy verbatim."*

So they're inspiration. But **600 lines of inspiration for 21 viz types** is a lot to carry. In practice, an agent picks ~5 of these per pack and the other 16 are dead weight in the context window.

**Recommendation:** Keep the 8-10 highest-value blueprints:
- KPI tile
- Ring gauge
- Line chart
- Bar list / horizontal bars
- Heat grid
- Status matrix
- Sparkline
- Data table

Drop the long tail (live ticker, waterfall, radar, network, multi-channel composite, etc). Canvas is unconstrained — the agent can invent niche types without a blueprint.

---

### A7. The whole vendored `package.json` story

`package.json` declares **3 deps** (`acorn`, `ajv`, `cheerio`) but ships **27 packages** because `npm install` brought in everything transitively.

Examples of bundled-but-suspect:
- `undici` — HTTP client
- `iconv-lite` — character encoding conversion
- `whatwg-encoding` — browser encoding standard
- `parse5-parser-stream` — streaming HTML parsing
- `safer-buffer` — Buffer polyfill for old Node

A static viz-source linter does **not need** streaming HTML parsing or HTTP fetch. Either the deps were chosen too broad, or `npm install --omit=optional --omit=dev` would prune most of these.

**Recommendation:** If keeping the AST path (per A3), at least audit what's actually `require()`d and prune. Likely cuts the bundle by 50%+.

---

## 3. Section B — Mild overkill, keep but trim

### B1. `generate_assets.js` (1500 lines of hand-rolled PNG encoder)

Generates app icons, viz previews, and gradient backgrounds in pure Node with no `canvas` npm dep. Impressive engineering. But:

- **The 10 viz preview silhouette functions** (`drawKpiSilhouette`, `drawGaugeSilhouette`, `drawBarsSilhouette`, etc.) are decoration. Splunk shows them in the formatter dropdown. A 116×76 PNG of the brand accent color with the viz name in white type does the same job — and a designer wouldn't tell the difference.
- **The gradient background generator IS useful** — non-flat dashboard backgrounds need a PNG.
- **The app icon IS useful** — 36×36 with brand letter, real value.

**Recommendation:** Keep gradient bg + app icon. Replace the 10 silhouette functions with a single "type label" renderer that draws the viz name in the brand accent color. Probably halves the file.

---

### B2. `dashboard-composition.md` (600 lines)

A separate skill's worth of content stuffed into a reference file. Overlaps with **four other locations** that all have dashboard composition guidance:

1. `vp-create/references/dashboard-json-template.md`
2. `vp-create/references/dashboard-interactivity.md`
3. The workspace rule `splunk-dashboard-studio.mdc`
4. The `splunk-dashboard-studio` plugin's `ds-couture` skill (which exists for exactly this)

**Recommendation:** Either consolidate into one canonical location, or delegate entirely to `ds-couture`. `splunk-viz-packs` shouldn't be doing dashboard design — it should hand off to the dashboard plugin.

---

### B3. The DPR / CON / ECR / D-NN rule numbering system

Four separate rule families maintained in parallel:
- **DPR-01..10** — design principles
- **CON-01..05** — consistency
- **ECR-01..09** — edge cases
- **D01..D11** — validator codes (with gaps at D02, D04, D06, D07)

Plus the 54 vp-debug rules (F1-F12, B1-B23, R1-R8, I1-I2, C1-C9).

**Five rule numbering systems** for the agent to track. Some cross-reference each other (*"DPR-03 enforced by D01"*). Coherent in the author's head; noise in the agent's context.

**Recommendation:** Collapse to one ID space. Either "design rules" (DPR-* covers it) or "FAIL codes" (B/F/R/I/C covers it). The other numbering systems can quietly disappear.

---

### B4. `formatter-patterns.md` (602 lines)

The Splunk formatter has maybe 5 control types worth showing:
- text input
- radio toggle
- color picker
- theme selector
- section wrapper

`vp-viz/SKILL.md` already shows all 5 inline with full templates. Another 600 lines of "patterns" is mostly variations and combinations the agent can derive from the canonical examples.

**Recommendation:** Trim aggressively to <200 lines. Keep canonical templates + 2-3 worked examples per section.

---

### B5. `edge-cases.md` (598 lines, 9 ECR rules)

ECR-01 through ECR-09 cover: empty state, single-row guard, pagination math, safeStr/safeNum, ctx.save/restore, hexFromSplunk, hover guard, escapeHtml XSS, Extension API differences.

Most are 2-line patterns that could live in the visualization template itself.

**Example:** ECR-01 (empty state) is a 40-line function template. It could be ONE line in the main template:
```javascript
if (!data || !data.rows || data.rows.length === 0) {
    return this._drawEmpty();
}
```
plus a `_drawEmpty` stub. Same for safeStr/safeNum — those are already in the template.

**Recommendation:** Inline the patterns into the main visualization template. This file becomes "reasons we did it this way" (~150 lines), not "instructions to copy 9 functions".

---

## 4. Section C — Pulling its weight, keep as-is

These are doing the work the plugin actually needs:

- **`vp-debug` overall structure** — flowchart + severity tiers + "console noise to ignore". Genuinely diagnostic, no redundancy.
- **`hexFromSplunk()`, `getOption()`, `safeStr/safeNum`, `detectTheme()`** — the load-bearing platform glue. Each one corresponds to a real Splunk gotcha you'd otherwise discover the hard way.
- **`build_flat.js`** — small (110 lines), does one thing (inline `theme.js`, wrap as AMD). Replaces webpack for this specific use case.
- **The `visualization_source.js` template** — ES5 boilerplate, `formatData`, `updateView`, `reflow`, `destroy`. Content is correct and necessary. (Even if duplicated between SKILL.md and the reference file — that's a §3.1 problem in the main review, not an overkill problem.)
- **`auto-field-patterns.md`** — 158 focused lines on auto-discovery. No fluff. Good model for what other references should look like.
- **`vp-init` workflow** — gathers context once, hands off. Right shape. (Just needs §4.6 bugs in the main review fixed.)
- **CSV-lookup demo data discipline** — correct, consistent, well-defended throughout.
- **`COPYFILE_DISABLE=1` + macOS hygiene** — small, critical, well-placed in the packaging step.

---

## 5. The blunt summary

If I had to predict where the "great plugin that creates a full custom viz pack" actually lives, it would be a much thinner version:

| Dimension | Current | Slimmed target |
|---|---|---|
| **Skills** | 6 | **3** — merge vp-init + vp-design (gather context → design brief) into `vp-design`. Keep `vp-viz` for code generation. Merge vp-create + vp-debug into `vp-build` (package + diagnose). Drop `vp-recipes` as a separate skill — fold top-5 patterns into `vp-viz`, move rest to `vp-viz/references/recipes/`. |
| **Skill + reference lines** | ~9300 | **~2000** — cut overlapping mood/flavor taxonomies (A5), trim blueprints to 8-10 (A6), inline edge-case patterns into the main template (B5), dedup tintNeutral/typography/formatter content across files. |
| **Script lines** | ~9400 | **~400** — `build_flat.js` + slimmed `generate_assets.js` (icon + gradient bg only, per B1) + grep-based `validate_viz.sh`. No AST (A3), no scoring (A1), no auto-repair (A2). |
| **Bundled `node_modules`** | 12 MB / 27 pkgs | **0 MB** |
| **Formats supported** | Classic + Extension (half) | **Classic only** — Extension returns when there's actual user demand and at least one shipped reference example (A4). |
| **Rule numbering systems** | 5 (DPR, CON, ECR, D, FAIL codes) | **1** — collapse to one ID space (B3). |
| **Taxonomies for design direction** | Mood (9) × Aesthetic flavor (10) | **1** — keep mood, drop aesthetic flavor (A5). |

**Result:** same job done, ~10% of current footprint, zero broken trigger phrases, dead references, or "Phase 31" leaks.

---

## 6. The bigger architectural shift this points to

The current plugin has been built **defensively** — as if the agent will make every possible mistake and needs to be caught after the fact. Hence:
- 1440 lines of validators
- Auto-repair script for malformed output
- 5 rule numbering systems
- 100-point design score
- 43-item pre-code checklist
- 9 edge-case rules
- 600-line dashboard composition guide

The slimmer plugin would be built around **strong templates and clear examples** — and would accept that the validator can be "good enough" instead of exhaustive.

The harder shift this requires:
1. **Trust the templates** to do the work. If the template is wrong, fix the template, don't ship a post-hoc repair.
2. **Accept "good enough" validation.** Catch the 10 highest-frequency mistakes with grep. Skip the long-tail AST analysis.
3. **Reduce, don't add.** Every new rule, validator, or score increases the cognitive load on the agent and the context tax on every invocation. Removing content is often the right move.
4. **Let Canvas freedom do the work.** The plugin's best property is that Canvas 2D lets the agent invent. Don't smother that with 21 blueprints and 5 taxonomies.

That's actually the bet **Anthropic's skill model is built on:** *invest in the templates and the reasoning, not the post-hoc enforcement.* The current plugin currently isn't taking that bet. Taking it would unlock the slimmer, sharper, faster version of itself.

---

## 7. Honest second-pass — calibrating my confidence

Asked directly *"are you sure about these recommendations?"* — and the honest answer is **no, not all of them.** Some I'd defend strongly, some I'd defend with caveats, and a few I'm probably wrong about or overconfident on. This section reframes the recommendations above with that calibration.

### 7.1 What I'd defend strongly (high confidence)

#### The dependency cleanup story (A3 + A7)
- 12 MB of `node_modules` shipped to every user is a real cost.
- 27 packages from 3 declared deps is a real symptom of unpruned transitives.
- The grep fallback existing means the AST path isn't load-bearing — it's a nice-to-have.

**Confident the cleanup should happen.** Less sure whether option (a) "drop AST entirely" or option (b) "make it opt-in" is right. That depends on how often the AST catches things grep doesn't — which I didn't measure. I described it as "edge cases" but I don't actually know what fraction of real-world failures the AST catches that grep misses.

#### Duplication of `generate_assets.js` byte-for-byte
- MD5 confirmed. No defensible reason to ship the same 1500 lines twice. High confidence.

#### Tests in shipped bundle
- Tests don't belong in a marketplace install. High confidence.

#### "Phase N" / "test NN" / `feedback_*.md` leaks
- Objectively meaningless to a fresh agent invocation. They're development metadata. High confidence they should be cleaned up.

#### Trigger overlap
- Verified the overlapping phrases by reading them. The overlap is real. The remedy (deconflict triggers, make descriptions pushier) is standard skill-authoring practice.

### 7.2 What I'd defend with caveats (medium confidence)

#### A1 — Delete `score_design.js`
- My critique stands: the script measures proxies for effort, not quality. A viz with random gradients scores well.
- **But:** I don't know what role the score actually plays in your workflow. If it's just an informational printout at the end of `validate_viz.sh --score` that you eyeball, the harm is small. If it's gating decisions or training the agent's choices, the harm is bigger.
- **Honest position:** "Delete" is too strong if you find it useful as a vibe-check. "Don't trust it as a quality gate" is the right framing.

#### A2 — Delete `repair_findings.js`
- I argued *"if the templates were good enough, you wouldn't need this."*
- **But:** I don't know your actual failure rate. If you've measured that even with strong templates the agent still produces B5/B7/B10 violations in 20% of runs (because agents drift), then a downstream repair is a pragmatic safety net, not theater.
- The repair script exists *because* you saw it fail repeatedly. I dismissed that empirical evidence too quickly.
- **Honest position:** Keep it, but track *how often* it's actually invoked. If invocation rate drops below 5% as templates get sharper, then delete. If it stays high, the templates aren't actually as airtight as I implied.

#### A6 — Trim 21 blueprints to 8-10
- I argued *"the long tail is dead weight."*
- **But:** I sampled only ~120 lines of the 605-line file. I don't actually know how good the "long tail" blueprints are. If `radar` or `waterfall` or `multi-channel composite` has insights nobody else captures, cutting them would lose knowledge.
- I was pattern-matching on "files are big = trim them" without reading the content.
- **Honest position:** Audit the bottom 11 blueprints individually for content density before cutting. Some might be 30 lines of unique insight; those should stay.

#### A5 — Drop "aesthetic flavor", keep "mood"
- The overlap is real (verified).
- **But:** I picked "drop flavor, keep mood" based on a 10-second read. The actual content of "Brutalist" vs "Power" or "Editorial" vs "Trust" might have meaningful differences I missed.
- **Honest position:** Pick one is right. Which one to pick deserves more than a snap judgment.

#### Slimmed plugin shape — 3 skills instead of 6
- I argued for merging vp-init+vp-design, keeping vp-viz, merging vp-create+vp-debug.
- **But:** I'm guessing at the right boundaries without having actually built anything with this plugin. The current 6-skill split presumably came from real friction points (e.g., maybe vp-debug got separated because users hit debug situations frequently and needed a focused entry point).
- **Honest position:** *"Skills can probably be consolidated"* — yes. *"Specifically 3 skills with these exact merges"* — that's me designing on the back of a napkin.

### 7.3 What I'm probably wrong about or overconfident on

#### A4 — Extension API is "barely used, half-shipped"
- I based this on *"the README doesn't mention it"* and *"49 mentions but no examples."*
- **But:** I don't know if you're actively building toward Extension API support as the future, with current viz packs being the "Classic-only" baseline. If you have a roadmap where Extension takes over in 6 months, ripping it out now would be exactly wrong.
- The branching is messy *now*, but that might be the cost of a transitional architecture.
- **Honest position:** *"Extension API needs to be either fully shipped or fully removed"* is right. *"Remove it now"* might be wrong if you're planning to lean in.

#### B5 — Inline edge-case patterns into the main template
- I argued *"ECR-01 could be one line: `if (!data) return this._drawEmpty();`"*
- **But:** the reason `edge-cases.md` is 598 lines isn't *just* the function templates — it includes the *reasoning* for each pattern: "Why null-guard before String()", "Why `_lastGoodData` cache exists", "Why escapeHtml on innerHTML but not Canvas fillText."
- That reasoning is exactly the kind of *"explain the why"* content that Anthropic's skill-authoring guidance says you should keep.
- I conflated "long file" with "low-value file." That was sloppy.
- **Honest position:** Keep the reasoning, just inline the function templates into the main viz template so they're not separately stated. The file shrinks but doesn't disappear.

#### B3 — Collapse 5 rule numbering systems to 1
- I called it *"noise in the agent's context."*
- **But:** the cross-references (DPR-03 → D01 → B5) actually let the agent trace from intent ("use gradient fills") to enforcement ("the validator will fail if you don't") to debug ("the error code means X"). That's genuinely useful traceability.
- Collapsing them would lose that.
- **Honest position:** The numbering systems are fine *if* they're applied consistently and cross-referenced cleanly. The actual problem is gaps (D02, D04, D06, D07 missing) and inconsistent application, not the existence of multiple ID spaces.

#### B4 — Trim `formatter-patterns.md` to <200 lines
- Same critique as A6: I sampled the file's section count (13 sections in 602 lines = ~46 lines per section), not its content. That's actually reasonable for *"here's the canonical template + 2-3 worked examples."*
- **Honest position:** Probably fine as-is. I was pattern-matching on file size again.

#### The "build defensively vs build around templates" architectural framing
- I made this sound like a clean dichotomy. It isn't.
- Real software typically needs *both* — good templates AND post-hoc safety nets. The mature position is *"templates that are 90% good enough, plus targeted safety nets for the highest-frequency failures."*
- The current plugin might be over-indexed on safety nets, but my framing implied *"delete all the safety nets"* — too aggressive.
- **Honest position:** *"Shift the balance toward templates"* — yes. *"Eliminate post-hoc enforcement"* — no.

### 7.4 The meta-issue with my recommendations

Looking back over both review files, I see a pattern worth flagging: **I was much more confident about quantitative problems (line counts, file sizes, MD5 matches, mention counts) than qualitative ones (whether content is valuable, whether a separation is meaningful, whether a feature is "half-shipped").**

The quantitative findings are mostly trustworthy because I verified them with shell commands. The qualitative judgments — *"blueprint X is dead weight"*, *"Extension API is barely used"*, *"this rule system is noise"* — are based on:
- Sampling small fractions of large files
- Pattern-matching against best-practice norms
- No knowledge of your actual usage data, failure rates, or roadmap

I dressed those judgments up with confident language (*"**This is theater.**"*, *"**Honest question: how many actual viz packs...**"*) that overstated my certainty.

### 7.5 What you should actually do with the recommendations

A more honest framing for the suggested fixes:

| Confidence | Recommendations |
|---|---|
| **High — just do these** | De-dup `generate_assets.js`, move tests out of bundle, fix YAML inconsistency, deconflict triggers, strip "Phase N" leaks, fix broken `feedback_*.md` refs, reconcile README vs `plugin.json` counts, slim `vp-viz/SKILL.md` below 500 lines. |
| **Medium — worth investigating before acting** | Drop the AST stack OR document `npm install` as opt-in (A3), audit transitive deps (A7), decide Extension API fate (A4), pick one design taxonomy (A5), trim `generate_assets.js` silhouettes if you don't care about them (B1), measure `repair_findings.js` invocation rate before deleting (A2), audit blueprint long tail before cutting (A6). |
| **Low — these are my guesses, treat as starting points** | Specific 6→3 skill consolidation, "delete `score_design.js`" wholesale, collapsing rule numbering systems (B3), inlining all edge cases (B5), the "build defensively vs build around templates" dichotomy. |

The high-confidence items are mostly mechanical cleanups based on verified facts. The lower-confidence items are design judgments where my opinion is one input among many — **your knowledge of usage, failure rates, and roadmap should weigh more heavily than my snap reading of the plugin.**

### 7.6 If I were starting from this review

I'd treat the high-confidence row as a checklist and just work through it. I'd treat the medium row as questions to answer with data before deciding (e.g., *"how often does `repair_findings.js` actually fire?"*, *"have any users shipped an Extension API pack?"*). And I'd treat the low row as conversation starters with anyone else who has opinions on the plugin's direction, not as recommendations to action directly.

---

*End of overkill assessment. See `cursor_review_2026_05_23.md` for the full P0/P1/P2 critique, broken-link audit, file inventory, and 20-step suggested fix order.*
