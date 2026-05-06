# splunk-dashboards plugin — consolidated progress

Top-level tracker for the entire plugin. Per-category detail lives in:

- [skills/viz/PROGRESS.md](skills/viz/PROGRESS.md) — 26 visualization skills + 1 router + 1 disambiguation.
- [skills/interactivity/PROGRESS.md](skills/interactivity/PROGRESS.md) — 6 interactivity skills.
- [skills/viz/REVIEW.md](skills/viz/REVIEW.md) — end-of-iteration review for viz skills (2026-04-25).
- [skills/QA-PLAN.md](skills/QA-PLAN.md) — visual-QA walkthrough plan for the deployed dashboards.
- [KNOWN-ISSUES.md](KNOWN-ISSUES.md) — Dashboard Studio platform limitations (not plugin bugs).

## Plugin layout

```
skills/
  pipeline/        11 action skills (init → data → design → build → ship → iterate)
  reference/        3 reference skills (ds-syntax, ds-viz, ds-design-principles)
  viz/             27 viz skills + ds-pick-viz router + REVIEW.md + PROGRESS.md
  interactivity/    6 interactivity skills + 2 test dashboards + PROGRESS.md
  design/           empty placeholder — see "Wave C" below
```

## Status snapshot (2026-04-28 PM)

### Wave A — visual QA: COMPLETE ✅

All 27 deployed dashboards (dark) confirmed clean by user. QA is
dark-only; light variants are auto-generated on deploy by
`make_light.py` (color-remap) and aren't visually walked.

| Layer         | Skills                           | Dark dashboards | SKILL.md | QA (dark) |
| ------------- | -------------------------------- | --------------- | -------- | --------- |
| viz           | 26 + 1 router + 1 disambiguation | **25**          | 28/28    | **26/26 ✅** |
| interactivity | 6                                | **2**           | 6/6      | **6/6 ✅**  |
| reference     | 3                                | n/a             | 3/3      | n/a       |
| pipeline      | 11                               | n/a             | 11/11    | n/a       |
| design        | 0 (empty placeholder)            | n/a             | n/a      | n/a       |
| **Total**     | **47** skills                    | **27** dashboards (× 2 dark/light = 54 XML files in container) | **48/48** | **32/32 ✅** |

Legend for QA: ✅ user-confirmed clean · 🟡 in progress (fixed, awaiting re-QA) · ⬜ not started.

### What's deployed in `splunk-knowledge-testing`

All 27 dashboard pairs (54 XML files) are live in the test app. Direct
file path inside the container:

```
/opt/splunk/etc/apps/splunk-knowledge-testing/local/data/ui/views/
```

## What's left to do

### Wave A — visual QA: ✅ COMPLETE (2026-04-28 PM)

All 27 dashboards (dark) closed clean by user. The closing work:


| #   | Dashboard (dark)                | Outstanding QA work                                                                                                                                                                                                                                       |
| --- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `ds_viz_map_dark`            | Bench expanded 10 → 15 panels. Panel 4 (bubble) reworked to `geostats` pattern. Panel 5 (choropleth) fixed to use full English country names. Panel 9 replaced with the canonical "Bubble Type Map - Data Colors" example using `dataValues` token. SKILL.md gained 17 gotchas including marker+bubble multi-layer-stack bug. |
| 2   | `ds_viz_choropleth_svg_dark` | Bench expanded 4 → 9 panels. Panel 7 (World continents) redrawn with proper equirectangular projection and ~25-50 hand-traced coastline vertices per continent. New `SVG-AUTHORING.md` companion file documents the full SVG-side authoring pattern. All 6 data sources converted from `ds.test` → `ds.search`. |
| 3   | `ds_interactivity_core_dark` | §1 token echo + §2 inputs proof converted to markdown panels (Q7). GFM tables dropped — bullet-list form (Q9). `\|s` filter applied to free-text + dynamic dropdowns (Q10). A/B/C visibility panels unified to same row (Q11). `defaults.tokens.default` block added (Q4). 11 QA findings closed in total (Q1-Q11). |
| 4   | `ds_interactivity_tabs_dark` | Tab switching + tab-scoped inputs verified.                                                                                                                                                                                                                |

### Wave B — plugin polish

**Status:** ⬜ not started.


| Task                                      | File(s)                                   | Notes                                                                                                                                                                                                  |
| ----------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Update README "stubs" claim               | `README.md`                               | The 2.4.0 README says viz/interactivity skills are stubs — they're complete now. Bump to 2.4.1 and rewrite the "work in progress" note.                                                                |
| Refresh `viz/REVIEW.md`                   | `skills/viz/REVIEW.md`                    | Last review was 2026-04-25 and listed interactivity as deferred. Write new dated review reflecting completed state.                                                                                    |
| Add today's findings to `KNOWN-ISSUES.md` | `KNOWN-ISSUES.md`                         | Q1–Q11 from interactivity QA (visibility nesting, isSet portability, multiselect `\|s`, drilldown array, free-text needs `\|s` too, GFM-tables not rendered in markdown, etc.) plus geo findings (multi-layer marker+bubble unreliable, geo_countries keys on full names). |
| Frontmatter hygiene                       | 9 older viz skills                        | Standardise `version` / `verified_against` / `test_dashboards` keys across all 26 viz skills. Audit by `grep -L "verified_against:" skills/viz/ds-viz-*/SKILL.md`.                                     |
| Fix `ds-design-principles` frontmatter    | `reference/ds-design-principles/SKILL.md` | First line is currently malformed (`## name:` instead of inside `---` block). Verify intent then fix.                                                                                                  |


### Wave C — content extension (after QA + polish)

**Status:** ⬜ not started.

#### `interactivity/` — 4 new skills

User selected all four for prioritisation:


| Skill                      | Why                                                                                                                                                              | Test dashboard?                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `ds-cross-panel-filtering` | Master-detail is **the** most common interactivity pattern; today it's spread across `ds-tokens` + `ds-drilldowns` + `ds-visibility` without a dedicated recipe. | Yes — small new bench `ds_interactivity_xpanel`.       |
| `ds-search-chaining`       | `ds.chain` (subsearch / pipeline-style chained searches) — mentioned in `ds-syntax` but no dedicated skill.                                                      | Yes — extend existing or new `ds_interactivity_chain`. |
| `ds-conditional-spl`       | Tokens inside SPL: `eval if($tok$=...)`, `inputlookup` with token-driven file, `where` + `match()` patterns.                                                     | Reuse `ds_interactivity_core` (add §6).                |
| `ds-token-lifecycle`       | When tokens initialise / invalidate, `unset` from drilldowns, default values, persistence — a debugging skill.                                                   | Reuse `ds_interactivity_core` (add §7).                |


#### `design/` — split `ds-design-principles` into 3 skills

User chose the split. Plan:


| Skill                        | Source content                                                                                                                | Notes                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `design/ds-archetypes`       | "Four canonical layouts" section of `ds-design-principles`, expanded per-archetype.                                           | Most-used part of the principles skill — deserves standalone.                          |
| `design/ds-anti-patterns`    | "10 reflex defaults to reject" section, expanded with examples.                                                               | Currently the single best part of the principles skill.                                |
| `design/ds-spacing-and-grid` | Pixel-grid math, gap-between-panels, hierarchy spacing. Spread today between `ds-design-principles` and `pipeline/ds-polish`. | Genuinely new content — write from scratch using the polish-skill checklist as a base. |


`reference/ds-design-principles` itself becomes a thin index pointing to
the three split skills. Don't delete it — it's the entry point a lot of
external prompts will reach for.

### Wave D — long-term cleanup


| Task                                  | File(s)                                 | Notes                                                                                                                                            |
| ------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Retire `reference/ds-viz`             | `reference/ds-viz/SKILL.md` (935 lines) | Per the 2.5.0 roadmap in README. All 26 per-viz skills are complete; the monolith is now documentation debt.                                     |
| Add `reference/ds-spl-for-dashboards` | new                                     | Splunk SPL conventions specific to dashboard authoring: `stats` over `transaction`, `sparkline()`, `geostats` vs `tstats`, `iplocation`, `geom`. |
| Add `reference/ds-color-palettes`     | new                                     | Canonical RAG/qualitative/sequential/diverging palettes as JSON fragments — currently spread out in `ds-design-principles`.                      |
| Add `reference/ds-themes`             | new                                     | Document `make_light.py` color-mapping logic, when to start dark vs light, COLOR_MAP customisation.                                              |


## How to read this document

- **For QA-walk:** open `skills/QA-PLAN.md` and follow waves 1–7 in the
Splunk UI; tick QA columns in the per-category PROGRESS.md as you go.
- **For "what should I work on next":** Wave A first, then B, then C.
Wave D is opportunistic.
- **For "where is X documented":** the per-category PROGRESS.md files
have per-skill rows; the `REVIEW.md` files have end-of-iteration
summaries.

## Recent commits (refactor/skill-split branch)

Run `git log --oneline -10` for the live list. As of last update:

```
03c5111 QA round 4: fix |s on free-text, drop GFM-tables in markdown, unify A/B/C layout
c0881c5 interactivity: convert §1 token echo + §2 inputs proof to markdown panels
8d959d9 ref(ds-syntax): document expressions, containerOptions.visibility, fix DOS table
fd02425 interactivity QA round: visibility + drilldown + multiselect schema fixes
ce634da viz QA pass (geo + table family): real-world fixes from live testing
```

