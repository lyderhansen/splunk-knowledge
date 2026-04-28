# splunk-dashboards plugin — consolidated progress

Top-level tracker for the entire plugin. Per-category detail lives in:

- [`skills/viz/PROGRESS.md`](skills/viz/PROGRESS.md) — 26 visualization skills + 1 router + 1 disambiguation.
- [`skills/interactivity/PROGRESS.md`](skills/interactivity/PROGRESS.md) — 6 interactivity skills.
- [`skills/viz/REVIEW.md`](skills/viz/REVIEW.md) — end-of-iteration review for viz skills (2026-04-25).
- [`skills/QA-PLAN.md`](skills/QA-PLAN.md) — visual-QA walkthrough plan for the 27 deployed dashboards.
- [`KNOWN-ISSUES.md`](KNOWN-ISSUES.md) — Dashboard Studio platform limitations (not plugin bugs).

## Plugin layout

```
skills/
  pipeline/        11 action skills (init → data → design → build → ship → iterate)
  reference/        3 reference skills (ds-syntax, ds-viz, ds-design-principles)
  viz/             27 viz skills + ds-pick-viz router + REVIEW.md + PROGRESS.md
  interactivity/    6 interactivity skills + 2 test dashboards + PROGRESS.md
  design/           empty placeholder — see "Wave C" below
```

## Status snapshot (2026-04-28)

### What works end-to-end

| Layer | Skills | Test dashboards deployed | SKILL.md complete | QA closed |
|-------|--------|--------------------------|--------------------|-----------|
| viz | 26 + 1 router + 1 disambiguation | 25 × 2 (dark + light) = **50** | 28/28 | 22/26 ✅ &nbsp; 4/26 🟡 |
| interactivity | 6 | 2 × 2 = **4** | 6/6 | 2/6 ✅ &nbsp; 4/6 🟡 |
| reference | 3 | n/a (reference-only) | 3/3 | n/a |
| pipeline | 11 | n/a (process skills) | 11/11 | n/a |
| design | 0 | n/a (empty placeholder) | n/a | n/a |
| **Total** | **47** skills | **54** dashboards | **48/48** | 24/32 closed |

Legend for QA: ✅ user-confirmed clean · 🟡 in progress (fixed, awaiting re-QA) · ⬜ not started.

### What's deployed in `splunk-knowledge-testing`

All 27 dashboard pairs (54 XML files) are live in the test app. Direct
file path inside the container:

```
/opt/splunk/etc/apps/splunk-knowledge-testing/local/data/ui/views/
```

## What's left to do

### Wave A — close visual QA on what's deployed (highest priority)

**Status:** 🟡 in progress.

Run through `skills/QA-PLAN.md` end-to-end. Most viz dashboards are
already user-confirmed clean from earlier rounds; the gap is:

| # | Dashboard | Outstanding QA work |
|---|-----------|---------------------|
| 1 | `ds_viz_map_dark` / `_light` | Re-verify panel 4 (bubble), panel 5 (choropleth), panel 9 (Bubble Type Map - Data Colors) after geo-round redeploy. |
| 2 | `ds_viz_choropleth_svg_dark` / `_light` | Verify panel 7 (World continents) shows recognisable equirectangular silhouettes after the path-redraw. |
| 3 | `ds_interactivity_core_dark` / `_light` | Re-verify §1 token echo + §2 inputs proof after the markdown conversion (Q7). Verify §5 visibility paneller toggle correctly with `defaults.tokens.default` initialisation. |
| 4 | `ds_interactivity_tabs_dark` / `_light` | Verify tab switching, tab-scoped inputs. |

Light-mode for all 27 dashboards is also ⬜ (only dark has been
walked). Light QA = sweep, not deep walk: "is it readable on the
light background?".

After QA, fill in QA columns to ✅ in the per-category PROGRESS.md
files.

### Wave B — plugin polish

**Status:** ⬜ not started.

| Task | File(s) | Notes |
|------|---------|-------|
| Update README "stubs" claim | `README.md` | The 2.4.0 README says viz/interactivity skills are stubs — they're complete now. Bump to 2.4.1 and rewrite the "work in progress" note. |
| Refresh `viz/REVIEW.md` | `skills/viz/REVIEW.md` | Last review was 2026-04-25 and listed interactivity as deferred. Write new dated review reflecting completed state. |
| Add today's findings to `KNOWN-ISSUES.md` | `KNOWN-ISSUES.md` | Q1–Q8 from interactivity QA (visibility nesting, isSet portability, multiselect \|s, drilldown array, etc.) plus geo findings (multi-layer marker+bubble unreliable, geo_countries keys on full names). |
| Frontmatter hygiene | 9 older viz skills | Standardise `version` / `verified_against` / `test_dashboards` keys across all 26 viz skills. Audit by `grep -L "verified_against:" skills/viz/ds-viz-*/SKILL.md`. |
| Fix `ds-design-principles` frontmatter | `reference/ds-design-principles/SKILL.md` | First line is currently malformed (`## name:` instead of inside `---` block). Verify intent then fix. |

### Wave C — content extension (after QA + polish)

**Status:** ⬜ not started.

#### `interactivity/` — 4 new skills

User selected all four for prioritisation:

| Skill | Why | Test dashboard? |
|-------|-----|-----------------|
| `ds-cross-panel-filtering` | Master-detail is **the** most common interactivity pattern; today it's spread across `ds-tokens` + `ds-drilldowns` + `ds-visibility` without a dedicated recipe. | Yes — small new bench `ds_interactivity_xpanel`. |
| `ds-search-chaining` | `ds.chain` (subsearch / pipeline-style chained searches) — mentioned in `ds-syntax` but no dedicated skill. | Yes — extend existing or new `ds_interactivity_chain`. |
| `ds-conditional-spl` | Tokens inside SPL: `eval if($tok$=...)`, `inputlookup` with token-driven file, `where` + `match()` patterns. | Reuse `ds_interactivity_core` (add §6). |
| `ds-token-lifecycle` | When tokens initialise / invalidate, `unset` from drilldowns, default values, persistence — a debugging skill. | Reuse `ds_interactivity_core` (add §7). |

#### `design/` — split `ds-design-principles` into 3 skills

User chose the split. Plan:

| Skill | Source content | Notes |
|-------|----------------|-------|
| `design/ds-archetypes` | "Four canonical layouts" section of `ds-design-principles`, expanded per-archetype. | Most-used part of the principles skill — deserves standalone. |
| `design/ds-anti-patterns` | "10 reflex defaults to reject" section, expanded with examples. | Currently the single best part of the principles skill. |
| `design/ds-spacing-and-grid` | Pixel-grid math, gap-between-panels, hierarchy spacing. Spread today between `ds-design-principles` and `pipeline/ds-polish`. | Genuinely new content — write from scratch using the polish-skill checklist as a base. |

`reference/ds-design-principles` itself becomes a thin index pointing to
the three split skills. Don't delete it — it's the entry point a lot of
external prompts will reach for.

### Wave D — long-term cleanup

| Task | File(s) | Notes |
|------|---------|-------|
| Retire `reference/ds-viz` | `reference/ds-viz/SKILL.md` (935 lines) | Per the 2.5.0 roadmap in README. All 26 per-viz skills are complete; the monolith is now documentation debt. |
| Add `reference/ds-spl-for-dashboards` | new | Splunk SPL conventions specific to dashboard authoring: `stats` over `transaction`, `sparkline()`, `geostats` vs `tstats`, `iplocation`, `geom`. |
| Add `reference/ds-color-palettes` | new | Canonical RAG/qualitative/sequential/diverging palettes as JSON fragments — currently spread out in `ds-design-principles`. |
| Add `reference/ds-themes` | new | Document `make_light.py` color-mapping logic, when to start dark vs light, COLOR_MAP customisation. |

## How to read this document

- **For QA-walk:** open `skills/QA-PLAN.md` and follow waves 1–7 in the
  Splunk UI; tick QA columns in the per-category PROGRESS.md as you go.
- **For "what should I work on next":** Wave A first, then B, then C.
  Wave D is opportunistic.
- **For "where is X documented":** the per-category PROGRESS.md files
  have per-skill rows; the `REVIEW.md` files have end-of-iteration
  summaries.

## Recent commits (refactor/skill-split branch)

```
8d959d9 ref(ds-syntax): document expressions, containerOptions.visibility, fix DOS table
fd02425 interactivity QA round: visibility + drilldown + multiselect schema fixes
ce634da viz QA pass (geo + table family): real-world fixes from live testing
9f94f6e viz(QA pass 2026-04-27): table sparkline data-density + 8 viz follow-ups
e91d2d3 viz(single-value family): QA pass + icon-form / compact-gauge fixes
```
