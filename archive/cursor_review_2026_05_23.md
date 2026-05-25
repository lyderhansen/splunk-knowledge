# Critical Review — `splunk-viz-packs` plugin

**Reviewer:** Cursor / Claude Opus 4.7
**Date:** 2026-05-23
**Scope:** `plugins/splunk-viz-packs/` — all 6 skills, references, scripts, vendored deps, top-level files
**Method:** Read every SKILL.md, sampled large reference files, diffed scripts, traced cross-references, verified file existence for cited paths
**Disclaimer:** No changes were made to any file during this review. Section 6 lists items I am genuinely uncertain about.

---

## 0. Table of contents

1. [Big-picture verdict](#1-big-picture-verdict)
2. [Severity P0 — these will hurt users today](#2-severity-p0--these-will-hurt-users-today)
3. [Severity P1 — design / architectural problems](#3-severity-p1--design--architectural-problems)
4. [Severity P2 — content / UX issues](#4-severity-p2--content--ux-issues)
5. [What I genuinely like](#5-what-i-genuinely-like)
6. [Open questions / things I don't know](#6-open-questions--things-i-dont-know)
7. [One-paragraph summary](#7-one-paragraph-summary)
8. [Suggested fix order](#8-suggested-fix-order-not-prescriptive)
9. [What's overkill — judged against the actual goal](#9-whats-overkill--judged-against-the-actual-goal)

---

## 1. Big-picture verdict

There's a **real product** here — branded Splunk viz generation is a coherent goal, the validators encode hard-won knowledge, the design vocabulary (mood → palette → effects) is thoughtful, and the workflow (init → design → viz → create) makes sense. The author clearly built this iteratively against real test cases.

But the plugin is suffering from **architectural debt that mirrors the development process itself**. Many problems below come from a single root cause: the GSD/phase-based development workflow (visible in the workspace rules) **bled into shipped content**. The plugin reads like a journal of its own construction.

The other root cause: **scope creep without consolidation**. The plugin grew from "build one viz" to "design a pack + write code + build + package + dashboard + lint + score + repair + demo data + assets + Extension API" without a corresponding refactor of how that knowledge is organized.

---

## 2. Severity P0 — these will hurt users today

### 2.1 The plugin ships 12 MB of `node_modules`
- `skills/vp-viz/scripts/vendor/node_modules/` is **1750 files / 12 MB / 27 packages**.
- The `package.json` declares only 3 direct deps (`acorn`, `ajv`, `cheerio`) — the other 24 are transitive.
- Includes `undici` (HTTP client), `iconv-lite`, `whatwg-encoding`, `parse5-parser-stream` — none of which a static HTML/JS linter strictly needs.
- This conflicts with the plugin's own stated principle in `CLAUDE.md`:
  > *"Zero user deps: Plugins must work with zero external dependencies for end users"*
- A marketplace install pulls all 12 MB into every user's `~/.claude/plugins/cache/` even though most users will never use the AST validator.

**Verification commands:**
```bash
cd plugins/splunk-viz-packs
du -sh skills/vp-viz/scripts/vendor/node_modules     # → 12M
find skills/vp-viz/scripts/vendor/node_modules -type f | wc -l  # → 1750
ls skills/vp-viz/scripts/vendor/node_modules | wc -l            # → 27
```

### 2.2 1500-line script duplicated verbatim across two skills
- `generate_assets.js` is **byte-identical** in both `vp-viz/scripts/` and `vp-create/scripts/` (MD5 confirmed). That's 3000 shipped lines for one logical script.
- `build_flat.js` is duplicated similarly (the `vp-create` copy differs only by a single comment line).
- Only `validate_viz.sh` in `vp-create/` is implemented correctly — as a thin delegation wrapper to the canonical one in `vp-viz/scripts/`. Apply that same pattern to the others, or move everything to one canonical `scripts/` directory at the plugin root.

**Verification:**
```bash
md5 skills/vp-viz/scripts/generate_assets.js skills/vp-create/scripts/generate_assets.js
# Both: 0c8c0731413e60fb530e96ca357b9b29

diff skills/vp-viz/scripts/build_flat.js skills/vp-create/scripts/build_flat.js
# Only difference: one line of comment
```

### 2.3 ~4000 lines of test code shipped to users
- `test_*.js` and `test_*.sh` total **4122 lines** in `vp-viz/scripts/`.
- Files: `test_check_contrast.js`, `test_check_design.js`, `test_generate_assets.js`, `test_repair_findings.js`, `test_score_design.js`, `test_validate_ast.js`, `test_validate_dash.js`, `test_validate_viz_integration.sh`.
- Tests belong in CI/dev, not in the user-facing bundle. Users pay tokens (when an agent scans the plugin directory) and disk space for code they will never execute.

### 2.4 YAML frontmatter is inconsistent and includes non-standard fields

| Skill | Frontmatter fields used |
|---|---|
| `vp-init` | name, description, when_to_use, disable-model-invocation, arguments, argument-hint |
| `vp-create` | name, description, when_to_use, disable-model-invocation, allowed-tools |
| `vp-debug` | name, description, when_to_use, **paths** (custom) |
| `vp-design` | name, description, when_to_use |
| `vp-recipes` | name, description, when_to_use |
| `vp-viz` | name, description, when_to_use, **effort** (custom), allowed-tools |

Observations:
- `arguments`, `argument-hint` are slash-command fields, not skill fields.
- `paths`, `effort` are not part of the official skill spec as far as I know (flagged in Section 6).
- `when_to_use` is in addition to `description`. Anthropic's progressive-disclosure model only loads `description` until a skill triggers. **If the runtime ignores `when_to_use`, the actual triggering descriptions become very generic** and overlap heavily (see 2.5).
- `disable-model-invocation: false` is the default — explicit `false` is a no-op.

### 2.5 Trigger overlap will misroute conversations

All these are listed as triggers in different skills and they collide:

| User says... | Skills that claim it |
|---|---|
| "build viz" | `vp-viz` AND `vp-create` |
| "themed viz suite" | `vp-init` AND `vp-design` |
| "formatter template" / "formatter not working" | `vp-viz` AND `vp-debug` |
| "build app" / "build splunk vizs" | `vp-init` AND `vp-create` |

When a user says *"build me a viz pack"*, the runtime has no clear way to pick `vp-init` over `vp-viz`. The README's "Quick start" says start at `vp-init`, but trigger overlap means a wrong skill could load first and try to write code without the design context.

---

## 3. Severity P1 — design / architectural problems

### 3.1 Content is duplicated across 3+ locations

Concrete examples I verified:

| Concept | Where it appears |
|---|---|
| `tintNeutral()` function | `vp-recipes/SKILL.md` inline + `vp-design/references/design-principles.md` DPR-02 + `vp-recipes/references/texture-recipes.md` |
| Typography 3-tier formula (hero/body/whisper) | `vp-recipes/SKILL.md` inline + `vp-design/references/design-principles.md` DPR-01 + `vp-design/references/consistency-grid.md` CON-03 + `vp-recipes/references/typography-recipes.md` |
| Pre-code checklist | `vp-viz/SKILL.md` (12 inline items) + `vp-viz/references/pre-code-checklist.md` (43 items — superset) |
| Dashboard JSON canonical structure | `vp-create/references/dashboard-json-template.md` + `vp-design/references/dashboard-composition.md` + workspace rule `splunk-dashboard-studio.mdc` (same content!) + `ds-create` in dashboard-studio plugin |
| ES5 visualization_source.js template | `vp-viz/SKILL.md` (~180 lines inlined) + `vp-viz/references/visualization-js-template.md` (298 lines) |
| Mood guidance | `vp-design/references/mood-and-design.md` (concept) + `vp-recipes/references/mood-recipes.md` (code) — split is reasonable but not signposted |

The maintenance hazard: if the `tintNeutral` formula changes, three places need updating. The token waste: agent loads the same formula multiple times. The risk: rules drift out of sync silently.

### 3.2 References reach across skill boundaries with deep relative paths

- `vp-viz/SKILL.md` links to 6 files via `../../vp-design/...` and `../../vp-recipes/...`.
- `vp-viz/references/viz-blueprints.md` has **16 separate links to `../../vp-design/references/design-principles.md`** — once per blueprint section. That's a smell. Either lift the rule into the blueprints file, or aggregate into a single header reference.
- A "MUST-LOAD for every viz" block in `vp-viz/SKILL.md` lists files from **two other skills** (`vp-design` and `vp-recipes`). That defeats the purpose of having separate skills — every viz invocation effectively loads all three skills' references.
- These relative paths are fragile. If anyone restructures `skills/`, every cross-link breaks silently.

### 3.3 `vp-viz/SKILL.md` is at the 500-line redline

- 486 lines. Anthropic's official guidance is **<500 lines** for SKILL.md.
- Two competing "STOP" sections (top + bottom) reduce clarity.
- 180-line ES5 template inlined is the main bulk — and that template already exists as a separate reference file (`visualization-js-template.md`, 298 lines). Either inline OR reference, not both.
- Recommendation: move template + checklists out, leave a thin SKILL.md that routes to references.

### 3.4 Internal "Phase N" / "test NN" references leak everywhere

Phrases I found in shipped content:
- "This has failed in test25 AND test26" (`vp-viz/SKILL.md` line 26)
- "Validation rules are defined in Phase 31" (`vp-create/SKILL.md` line 55)
- "Phase 18: accentColor removed" (`vp-viz/SKILL.md` lines 185, 190)
- "Phase 8 check" (×16+ in `design-principles.md`)
- "Phase 6 addition, Plan 03" (×3 in `consistency-grid.md`)
- "Phase 9 only — do not load in Phase 6/7" (`vp-viz/references/canvas-recipes.md`)
- "Brand reference mappings (from tests 21-28)" (`vp-design/SKILL.md` line 193)
- "Phase 6: depth/texture effects extracted to..." (`mood-recipes.md` line 3)

These are meaningless to a fresh agent invocation. They're internal commit history. Worse, they sometimes act as **partial documentation** (e.g., "see Phase 31 for validation rules") that points nowhere a user can resolve.

### 3.5 Documentation / reality mismatches

| Claim | Reality |
|---|---|
| README: version 4.1.0 | plugin.json: version 5.7.0 |
| README: "14 blueprints across 10 categories" | `viz-blueprints.md` has 17 entries |
| README: "Design scoring: 4 dimensions (hierarchy, whitespace, brand, emotion)" | `score_design.js` scores 5 dimensions (gradient, typography, spacing, color, animation) |
| README: 7 questions in vp-init | vp-init asks 8 questions |
| vp-init hand-off passes 6 fields | Asked 8 questions (drops app name + data source) |
| plugin.json description: "50+ validation checks (B1-B23, D1-D11, E1-E5, F1-F12)" | `check_design.js` implements D01, D03, D05, D08-D11 (7 checks, with gaps at D02/D04/D06/D07) |
| vp-debug: "54 rules" | Math checks out (12+23+8+11) but R-rules and I-rules reference content was not sampled to verify |
| plugin.json description: "Extension API ESM .spl" output | README never mentions Extension API at all |

### 3.6 Two broken `feedback_*.md` references

- `vp-viz/SKILL.md` line 86: *"See: feedback_light_theme_contrast.md"*
- `viz-blueprints.md` line 55: *"(memory: feedback_viz_store_config_fields.md)"*

Neither file exists anywhere in the plugin (`find . -name 'feedback_*.md'` returns nothing). They look like author session notes that were never converted to durable docs.

### 3.7 The "STOP" / inline-critical pattern is overused

In `vp-viz/SKILL.md` alone:
- Top: "STOP — read this first (failed in every test)" — Dashboard Studio type rule.
- Bottom: "STOP — after all vizs are written" — load vp-create.
- Middle: "CRITICAL SUBSET (12 most-failed rules)" — boxed in a code fence.
- Then "Quick rules — the 15 that matter most" — yet another priority-1 list.
- Then "Light theme verification" — also marked critical.

Five priority-1 lists in one SKILL. By Anthropic's writing-style guidance ("explain the why in lieu of heavy-handed musty MUSTs"), this is exactly the failure mode: when everything is critical, nothing is.

### 3.8 Workflow numbering is broken

- `vp-design` workflow steps: 1, 2, 3, **3b**, 4, 5, 6, 7, 8 — the `3b` reveals "we added this later and didn't renumber".
- `vp-create` workflow: 1, 2, 3, **3b**, **3c**, 4, 5, 6 — same pattern.

Not dealbreakers but they signal "grew without consolidation".

---

## 4. Severity P2 — content / UX issues

### 4.1 `vp-debug`'s `paths` field is speculative

- YAML says `paths: "*/visualizations/*/visualization_source.js, */visualizations/*/formatter.html"` with the description claiming **"Loaded automatically when editing viz source files"**.
- I don't know whether any current Claude or Cursor runtime honors a `paths:` field in skill frontmatter (flagged in Section 6). **If this is invented/aspirational, the auto-load claim is false** and users will be surprised when vp-debug doesn't appear during edits.

### 4.2 The grep fallback in `validate_viz.sh` covers less than the AST path

- When Node or vendored modules are missing, the validator falls back to ~80 lines of grep-based checks vs. the much richer AST path (~340 lines of orchestration plus the AST scripts).
- This means users without Node get a fundamentally weaker validation — but the SKILL.md says "validate_viz.sh MUST pass with 0 FAIL". Two different definitions of "passing" depending on environment.
- The script has 14 section headers labeled `# --- PHASE 2 ---`, `# --- PHASE 3 ---`, etc. (internal development phases leaking into operational code).

### 4.3 vp-recipes splits "basic" vs "advanced" recipes arbitrarily

- vp-recipes top says: *"Basic recipes are in `vp-viz/references/canvas-recipes.md`. This skill has advanced patterns."*
- But `tintNeutral` (in vp-recipes' "Top 5 inline") is also in vp-design's `design-principles.md` and in vp-recipes' `texture-recipes.md`.
- Where does a viz pull `tintNeutral` from? Three locations exist; the agent will pick whichever appears first in its context. Not deterministic.

### 4.4 "Aesthetic flavors — pick ONE" has no selection rubric

- vp-design lists 10 flavors with one-line "when to use" — but no decision tree.
- Brutalist vs Industrial vs Brutally-minimal sound similar; Editorial vs Refined sound similar; Luxury vs Soft-pastel could overlap for hospitality.
- Without a tiebreaker, the agent will pick whichever sounds best to its training-data bias.

### 4.5 Brand mapping table has 5 entries hardcoded

The "Brand reference mappings" table in vp-design lists Cloudflare, Hospital, Patagonia, Porsche, Stripe with their cornerRadius/fill/etc. attributes. For any other brand, the agent has no precedent to pattern-match against. This table will get stale and isn't extensible.

### 4.6 `vp-init`'s hand-off context drops fields it collected

- Asks 8 questions: Target format, App name, Brand/domain, Tone, Font strategy, Data source, Viz inventory, Dashboard included.
- Hand-off block to vp-design passes only 6: Format, Brand, Tone, Fonts, Inventory, Dashboard.
- App name and data source are collected but never explicitly forwarded. vp-design has to re-ask or infer them.

### 4.7 Description optimization not done

- Per Anthropic's skill-authoring guidance, descriptions are the primary trigger mechanism and should be slightly "pushy".
- Current descriptions are technically accurate but lean dry/descriptive (*"Builds and packages Splunk custom visualization apps..."*) rather than pushy (*"Make sure to use this skill whenever the user mentions..."*).
- Combined with trigger overlap (2.5), the routing decisions are fragile.

---

## 5. What I genuinely like

Because being critical cuts both ways — this is real, not sycophantic:

- **`vp-debug` is the best-organized skill** — clear flowchart, severity tiers, "console noise to IGNORE" section is excellent (saves chasing red herrings), quick-fix lookup table is clean.
- **The DPR / CON / ECR / D-NN rule numbering system** is a strong idea — it lets you cross-reference design intent to code patterns to validator outputs. It just isn't applied consistently and leaks "Phase N" metadata.
- **`getOption()` two-path lookup** (namespaced + bare key) is a load-bearing insight from real bugs.
- **`hexFromSplunk()`** for handling integer color values is exactly the kind of platform-specific gotcha that justifies the plugin existing.
- **The validator's AST/grep fallback strategy** is good resilience design even if the gap between the two paths is too wide.
- **`auto-field-patterns.md`** is tight, focused, and example-driven — good model for what other references should look like.
- **CSV-lookup demo data over `| makeresults`** is the correct discipline and is consistently enforced.
- **Inline-code-generation rule** (*"don't dispatch viz code to subagents"*) is the kind of hard-won meta-instruction that's worth its place.
- **`vp-recipes/SKILL.md` overall structure** — top-5 inline, the rest in references — is the right progressive-disclosure shape.

---

## 6. Open questions / things I don't know

I want to be explicit about uncertainty rather than guessing:

1. **Does any current Claude runtime honor `paths:` in skill frontmatter?** `vp-debug` depends on this for its "auto-load on edit" claim. I don't know. Worth testing.
2. **Does Cursor's skill loader merge `description` + `when_to_use` for triggering, or use only `description`?** This determines whether half the trigger phrases work at all.
3. **Was the 12 MB `node_modules` bundle a deliberate choice** (e.g., to avoid asking users to run `npm install` on first use)? If yes, that's a defensible trade-off worth documenting; if it's accidental from `npm install` running locally and being committed, it's a much bigger problem.
4. **Are R-rules (R1-R8) and I-rules (I1-I2) actually documented in their reference files?** I sampled `fatal-rules.md` headers only — I didn't verify the R/I reference content.
5. **Is the Extension API path actually working end-to-end?** Many `(if format=extension...)` branches exist but I didn't trace a complete extension build.
6. **Are the per-viz blueprint sections in `viz-blueprints.md` accurate?** I read the first ~120 lines of a 605-line file.
7. **What's the `paths:` field meant to do** if it isn't loaded automatically? Possibly informational only?

---

## 7. One-paragraph summary

The plugin's core IP — the design vocabulary, the Splunk gotchas encoded in validators, the workflow shape — is genuinely valuable. The problems are almost entirely structural: development metadata leaked into shipped content, content was duplicated rather than consolidated as the plugin grew, dependencies inflated by a factor of ~9 over what's necessary, and the skill boundaries don't match the actual responsibility split (every viz needs content from three skills, breaking progressive disclosure). A focused refactor — single canonical scripts directory, single source of truth per concept, cleanup of "Phase N" leaks, consolidation of overlapping references, slimming `vp-viz/SKILL.md` below the 500-line line — would likely keep the value while substantially improving how it lands for users.

---

## 8. Suggested fix order (not prescriptive)

A possible sequencing if you want to tackle this incrementally. Each step is independently shippable.

### Phase A — Stop the bleeding (low risk, high impact)
1. **Decide `node_modules` strategy** (P0 §2.1) — either:
   - (a) Document a one-time `cd plugins/splunk-viz-packs/skills/vp-viz/scripts/vendor && npm install --omit=dev` step and `.gitignore` the bundle, OR
   - (b) Keep bundled but prune transitive deps that aren't strictly needed (e.g., audit whether `cheerio` can be swapped for `node-html-parser` for a smaller footprint).
2. **De-duplicate scripts** (P0 §2.2) — move `generate_assets.js` and `build_flat.js` to a single canonical location (suggest `plugins/splunk-viz-packs/scripts/`) and replace the duplicates with delegation wrappers matching the existing `validate_viz.sh` pattern.
3. **Move tests out of shipped bundle** (P0 §2.3) — relocate to `plugins/splunk-viz-packs/tests/` (or repo-root `tests/`) and exclude from any future tarball.
4. **Fix the version mismatch** (P1 §3.5) — README and plugin.json must agree.

### Phase B — Routing reliability
5. **Audit YAML frontmatter** (P0 §2.4) — pick one schema based on what the runtime actually honors, apply uniformly across all 6 skills. Remove `disable-model-invocation: false` no-ops and any non-standard fields (or confirm they work and document why).
6. **Deconflict trigger phrases** (P0 §2.5) — give each skill non-overlapping trigger sets. Rewrite descriptions in the slightly-pushy style Anthropic recommends.
7. **Fix `vp-init` hand-off** (P2 §4.6) — pass all 8 collected fields, not 6.

### Phase C — Consolidate duplicated content
8. **Pick one canonical home per concept** (P1 §3.1) — e.g.:
   - `tintNeutral` → only in `texture-recipes.md`, others link to it.
   - Typography 3-tier formula → only in `typography-recipes.md`.
   - ES5 visualization_source.js template → only in `visualization-js-template.md`; `vp-viz/SKILL.md` references it instead of inlining 180 lines.
   - Dashboard JSON template → reconcile `dashboard-json-template.md` vs `dashboard-composition.md` vs the workspace rule.
9. **Slim `vp-viz/SKILL.md` to <300 lines** (P1 §3.3) — outcome of step 8 should make this natural.
10. **Eliminate the cross-skill MUST-LOAD pile** (P1 §3.2) — either merge `vp-design/references/design-principles.md` content into `vp-viz/references/`, or restructure so `vp-viz` doesn't need to load 6 files from sibling skills.

### Phase D — Clean up internal leaks
11. **Strip "Phase N" / "test NN" references** (P1 §3.4) — global find/replace across all `.md` files. Where they were placeholders for content ("see Phase 31"), either fill in the real content or remove the dangling reference.
12. **Either find/recreate the `feedback_*.md` files or remove the references** (P1 §3.6).
13. **Strip "PHASE 2/3/4/5" section labels from `validate_viz.sh`** (P2 §4.2) — replace with descriptive names.
14. **Renumber workflows to remove 3b/3c** (P1 §3.8).

### Phase E — Sharpen content
15. **Reduce STOP/CRITICAL noise** in `vp-viz/SKILL.md` (P1 §3.7) — keep one top STOP, demote the rest to normal sections.
16. **Add a selection rubric for aesthetic flavors** (P2 §4.4) — a decision tree or 2-question filter.
17. **Make the brand-mapping table extensible** (P2 §4.5) — either remove the hardcoded 5 brands or document how to add new ones.
18. **Reconcile documentation claims with reality** (P1 §3.5) — fix the README counts and the plugin.json description so they match what the code does.
19. **Decide what `vp-debug`'s `paths:` field should do** (P2 §4.1) — either prove it auto-loads and keep the claim, or remove the claim.
20. **Widen the grep fallback in `validate_viz.sh`** (P2 §4.2) — or document explicitly that without Node, validation is best-effort.

---

## 9. What's overkill — judged against the actual goal

**Restated goal:** *a great plugin that creates a full custom viz pack for Splunk — branded, themed, ES5-correct, installs cleanly, looks intentional.*

With that lens, here's what's pulling weight vs. what's just there. Sections A and B are the targets if you want to slim the plugin to its core value.

### A. Clear overkill — should be cut or radically simplified

#### A1. `score_design.js` (204 lines + 327 lines of tests)
Scores a viz on 5 dimensions / 100 points. The implementation: count `createLinearGradient` calls (0/1/2+ → 0/10/20 pts), count distinct `px` font sizes in source, count `w *` / `h *` patterns as "dynamic spacing", count distinct `fillStyle =` assignments, check for `requestAnimationFrame`.

**This is theater.** A viz with 3 random gradients, 4 unrelated font sizes, and a `setInterval` gets a perfect score. A simple, intentional viz with one purposeful gradient and clean typography scores worse. The script measures **proxies for effort**, not quality. No designer would trust this number. No agent should act on it.

What it actually achieves: a number that goes up when the agent adds more visual noise. That's the opposite of the design discipline `vp-design` is preaching ("Strip colors test", "Five-second story").

**Recommendation:** Delete. Or replace with a 30-line script that flags hard violations only (`flat fillStyle on data elements`, `no responsive font sizing`, `accent used as data fill`) — which `check_design.js` already does.

#### A2. `repair_findings.js` (233 lines)
Auto-fixes B5, B7, B9, B10, B20 in `formatter.html` and dashboard XML — i.e., it patches the agent's own output after the agent already wrote it wrong.

If the templates in `vp-viz/SKILL.md` are correct and the agent follows them, **these violations shouldn't exist in the first place**. The repair loop is compensating for upstream authorship failure with downstream mechanical fixes.

The cheaper fix: make the formatter templates so unambiguous that B5/B7/B9/B10/B20 never get generated. The templates already exist inline in the SKILL. If they're being violated, the answer is "tighten the templates and examples", not "ship a Cheerio-based HTML rewriter".

**Recommendation:** Delete, or keep as an opt-in `--repair` flag with no expectation it's part of the normal path.

#### A3. The whole AST validator stack (12 MB / 27 npm packages)
`validate_ast.js` (400) + `validate_dash.js` (397) + `check_design.js` (260) + `check_contrast.js` (150) + `repair_findings.js` (233) = **1440 lines of validation code** backed by `acorn` + `cheerio` + `ajv` + 24 transitive deps.

Engineered like a CI gate for a 50-person team. Deployed for a one-person hobby plugin. The grep fallback already in `validate_viz.sh` covers most of what matters: hardcoded namespaces, wrong attribute names, `define()` vs `require()`, missing `type="custom"`, missing `themeMode` default. That's ~80 lines of grep catching the load-bearing 10 mistakes.

The AST tree-walk catches additional edge cases — but at the cost of 12 MB of deps and a Node prereq.

**Recommendation:** Either:
- **(a) Drop the AST path entirely.** Lean on grep checks for the 15 high-frequency mistakes. Plugin shrinks 12 MB. Validation becomes "good enough" instead of "exhaustive" — the right trade for a marketplace skill.
- **(b) Keep AST path but make it opt-in.** Document `npm install` as a one-time step for power users. Plugin ships clean; users who want strict mode install their own deps.

#### A4. Extension API support across all skills
49 mentions of "format=extension" across 13 files (counted with grep). Every workflow step has an `(if format=extension...)` branch. Two template paths, two build commands, two validation modes, two package commands.

But the README never mentions it. The `plugin.json` description does, with no user-facing documentation, no example, no quickstart. It's half-shipped.

Honest question: **how many actual viz packs have you built with `format=extension`?** If the answer is 0 or 1, this is speculative code carrying real complexity tax — every SKILL.md got 30% bigger to accommodate something barely used.

**Recommendation:** Either commit to Extension API as a first-class path (write the README section, ship real examples, test end-to-end) or pull it back into a separate `vp-viz-extension` skill / experimental flag, and stop forking every workflow step.

#### A5. Mood × Aesthetic Flavor — two overlapping taxonomies
**9 moods** in `mood-and-design.md`: Precision, Power, Speed, Trust, Luxury, Playful, Futuristic, Organic, Minimal.

**10 aesthetic flavors** in `vp-design/SKILL.md`: Brutalist, Editorial, Refined, Playful, Industrial, Luxury, Soft-pastel, Retro-futuristic, Organic-natural, Brutally-minimal.

Overlaps verified by reading both tables:
- **Luxury** appears in both
- **Playful** appears in both
- **Organic** ≈ **Organic-natural**
- **Minimal** ≈ **Brutally-minimal**
- **Industrial** ≈ **Power**

The agent now has to commit to ONE flavor AND ONE mood, and they cross-product without resolution rules. Paralysis-inducing. Most production brand-design skills use **one taxonomy of ~6 archetypes**. Two overlapping taxonomies of 9-10 each is academic.

**Recommendation:** Pick one. Keep "mood" (maps directly to colors/fonts/effects). Drop "aesthetic flavor" (vibe word with no operational hook). Or merge into 5-7 distinct slots.

#### A6. 21 viz blueprints (605 lines)
README says 14. `viz-blueprints.md` has 21 sections. `vp-viz/SKILL.md` says explicitly: *"These blueprints show WHAT each viz type expresses... They are NOT templates to copy verbatim."* So they're inspiration. But 600 lines of inspiration for 21 viz types is a lot to carry. In practice an agent picks ~5 of these per pack and the other 16 are dead weight.

**Recommendation:** Keep the 8-10 highest-value blueprints (KPI, ring gauge, line chart, bar list, heat grid, status matrix, sparkline, table). Drop the long tail. Canvas is unconstrained — the agent can invent niche types without a blueprint.

#### A7. The whole vendored `package.json` story
`package.json` declares 3 deps but ships 27 packages. `undici` (HTTP client), `iconv-lite`, `whatwg-encoding`, `parse5-parser-stream`, `safer-buffer` — none of which a static linter strictly needs.

If keeping the AST path (per A3), at least audit what's actually `require()`d and prune. `npm install --omit=optional --omit=dev` would likely cut several.

### B. Mild overkill — keep but trim

#### B1. `generate_assets.js` (1500 lines hand-rolled PNG encoder)
Generates app icons, viz previews, gradient backgrounds in pure Node with no `canvas` npm dep. Impressive engineering. But:

- The 10 viz preview silhouette functions (`drawKpiSilhouette`, `drawGaugeSilhouette`, etc.) are decoration. Splunk shows them in the formatter dropdown. A 116×76 PNG of the brand accent color with the viz name in white type does the same job.
- The gradient background generator IS useful (non-flat backgrounds need a PNG).
- The app icon IS useful (36×36 with brand letter).

**Recommendation:** Keep gradient bg + app icon. Replace the 10 silhouette functions with a single "type label" renderer. Probably halves the file.

#### B2. `dashboard-composition.md` (600 lines)
A separate skill's worth of content stuffed into a reference. Overlaps with `dashboard-json-template.md`, `dashboard-interactivity.md`, AND the workspace rule `splunk-dashboard-studio.mdc`. **Four locations** have dashboard composition guidance.

**Recommendation:** Either consolidate into one canonical location, or delegate entirely to the `splunk-dashboard-studio` plugin's `ds-couture` skill — which exists for exactly this. `splunk-viz-packs` shouldn't be doing dashboard design; it should hand off.

#### B3. The DPR/CON/ECR/D-NN rule numbering system
Four separate rule families: DPR-01..10, CON-01..05, ECR-01..09, D01..D11. Plus the 54 vp-debug rules (F1-F12, B1-B23, R1-R8, I1-I2, C1-C9). **Five rule numbering systems** for the agent to track.

Coherent in the author's head, noise in the agent's context.

**Recommendation:** Collapse to one ID space. Either "design rules" (DPR-*) or "FAIL codes" (B/F/R/I/C). The others can quietly disappear.

#### B4. `formatter-patterns.md` (602 lines)
Splunk formatter has ~5 control types worth showing (text, radio, color picker, theme selector, section wrapper). `vp-viz/SKILL.md` already shows all 5 inline with full templates. Another 600 lines of "patterns" is mostly variations the agent can derive.

**Recommendation:** Trim to <200 lines. Canonical templates + 2-3 worked examples per section.

#### B5. `edge-cases.md` (598 lines, 9 ECR rules)
Empty state, single-row guard, pagination math, safeStr/safeNum, ctx.save/restore, hexFromSplunk, hover guard, escapeHtml XSS, Extension API. Most are 2-line patterns that could live in the visualization template.

Example: ECR-01 (empty state) is a 40-line function template. Could be ONE line in the main template: `if (!data || !data.rows || data.rows.length === 0) { return this._drawEmpty(); }` and a `_drawEmpty` stub. Same for safeStr/safeNum — already in the template.

**Recommendation:** Inline the patterns into the main visualization template. This file becomes "reasons we did it this way" (~150 lines).

### C. Pulling its weight — keep as-is

- **`vp-debug` overall structure** — flowchart + severity tiers + "console noise to ignore". Genuinely diagnostic, no redundancy.
- **`hexFromSplunk()`, `getOption()`, `safeStr/safeNum`, `detectTheme()`** — the load-bearing platform glue. Each one corresponds to a real Splunk gotcha you'd otherwise discover the hard way.
- **`build_flat.js`** — small (110 lines), does one thing (inline theme.js, wrap as AMD). Replaces webpack for this specific use case.
- **The `visualization_source.js` template** — the ES5 boilerplate, `formatData`, `updateView`, `reflow`, `destroy`. Content is correct and necessary.
- **`auto-field-patterns.md`** — 158 focused lines, no fluff.
- **`vp-init` workflow** — gathers context once, hands off. Right shape. (Just needs §4.6 bugs fixed.)
- **CSV-lookup demo data discipline** — correct, consistent, well-defended.
- **`COPYFILE_DISABLE=1` + macOS hygiene** — small, critical, well-placed in packaging.

### D. The blunt summary

If I had to predict where the "great plugin that creates a full custom viz pack" actually lives, it's a much thinner version:

| Dimension | Current | Slimmed target |
|---|---|---|
| Skills | 6 | 3 (merge vp-init + vp-design; keep vp-viz; merge vp-create + vp-debug → vp-build; fold vp-recipes into vp-viz/references/) |
| Skill + reference lines | ~9300 | ~2000 (cut overlapping taxonomies, trim blueprints to 8-10, inline edge cases, dedup tintNeutral/typography) |
| Script lines | ~9400 | ~400 (`build_flat.js` + slim `generate_assets.js` + grep `validate_viz.sh`. No AST, no scoring, no auto-repair) |
| Bundled `node_modules` | 12 MB / 27 pkgs | 0 MB |
| Formats supported | Classic + Extension (half) | Classic only (Extension returns with real examples and demand) |

**Result:** same job, ~10% of current footprint, zero broken trigger phrases / dead refs / "Phase 31" leaks.

The harder shift this requires: trusting the **templates and examples** to do the work, and accepting that the **validator can be "good enough"** instead of exhaustive. The current plugin has been built as if the agent will make every possible mistake and needs to be caught after the fact. The slimmer plugin would be built as if the agent will follow strong examples and produce correct code the first time.

That's actually the bet Anthropic's skill model is built on: **invest in the templates and the reasoning, not the post-hoc enforcement.**

---

## Appendix A — Files and line counts referenced in this review

```
SKILL.md files (total 1332 lines):
  vp-create/SKILL.md         260
  vp-debug/SKILL.md          125
  vp-design/SKILL.md         210
  vp-init/SKILL.md           128
  vp-recipes/SKILL.md        123
  vp-viz/SKILL.md            486   ← over the 500-line guidance line

Reference files (total 7963 lines):
  vp-create/references/dashboard-interactivity.md   279
  vp-create/references/dashboard-json-template.md   181
  vp-debug/references/broken-rules.md               128
  vp-debug/references/fatal-rules.md                366
  vp-debug/references/interactive-cosmetic.md       223
  vp-debug/references/rejected-rules.md             119
  vp-design/references/consistency-grid.md          170
  vp-design/references/dashboard-composition.md     600
  vp-design/references/design-principles.md         252
  vp-design/references/domain-templates.md          190
  vp-design/references/mood-and-design.md           145
  vp-design/references/viz-novelty-scores.md        115
  vp-recipes/references/all-patterns.md             185
  vp-recipes/references/animation-recipes.md        519
  vp-recipes/references/depth-recipes.md            246
  vp-recipes/references/mood-recipes.md             407
  vp-recipes/references/texture-recipes.md          167
  vp-recipes/references/typography-recipes.md       155
  vp-viz/references/auto-field-patterns.md          158
  vp-viz/references/canvas-recipes.md               498
  vp-viz/references/conf-templates.md               234
  vp-viz/references/config-json-template.md         194
  vp-viz/references/edge-cases.md                   598
  vp-viz/references/formatter-patterns.md           602
  vp-viz/references/pre-code-checklist.md            95
  vp-viz/references/theme-template.md               234
  vp-viz/references/visualization-js-template.md    298
  vp-viz/references/viz-blueprints.md               605

Scripts (total 9433 lines):
  vp-create/scripts/build_flat.js          111   ← near-duplicate of vp-viz version
  vp-create/scripts/generate_assets.js    1498   ← BYTE-IDENTICAL to vp-viz version
  vp-create/scripts/validate_viz.sh         10   ← delegation wrapper (good pattern)
  vp-viz/scripts/build_flat.js             110
  vp-viz/scripts/check_contrast.js         150
  vp-viz/scripts/check_design.js           260
  vp-viz/scripts/generate_assets.js       1498
  vp-viz/scripts/repair_findings.js        233
  vp-viz/scripts/score_design.js           204
  vp-viz/scripts/validate_ast.js           400
  vp-viz/scripts/validate_dash.js          397
  vp-viz/scripts/validate_viz.sh           440
  vp-viz/scripts/test_*.{js,sh}           4122   ← should not ship
```

## Appendix B — Bundled npm packages (27 total)

```
acorn                 ajv                  boolbase
cheerio               cheerio-select       css-select
css-what              dom-serializer       domelementtype
domhandler            domutils             encoding-sniffer
entities              fast-deep-equal      fast-uri
htmlparser2           iconv-lite           json-schema-traverse
nth-check             parse5               parse5-htmlparser2-tree-adapter
parse5-parser-stream  require-from-string  safer-buffer
undici                whatwg-encoding      whatwg-mimetype
```

Declared as direct deps in `package.json`: `acorn`, `ajv`, `cheerio` (3 of 27).

---

*End of review.*
