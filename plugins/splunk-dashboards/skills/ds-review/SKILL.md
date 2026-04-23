---
name: ds-review
description: Use this skill to audit a Splunk Dashboard Studio dashboard against authoring best practices — panel count and cognitive load, viz-type consistency, drilldown coverage, token reuse, accessibility (color contrast, dark/light compatibility), and SPL performance hints. Operates on any dashboard.json or dashboard.xml inside or outside a workspace and writes review.md with findings and suggested ds-update invocations.
---

# ds-review — Audit a dashboard against best practices

## When to use

- After `ds-deploy` (post-ship audit).
- Before touching a legacy dashboard a user hands you — get a quick read on what's wrong before editing.
- After any `ds-update` that introduced substantial changes.

## Review dimensions

**See `ds-design-principles`** for the canonical dashboard archetypes and the "Common antipatterns" list — many of the checks below are direct applications of those principles.

### 1. Panel count and density

- **Too many panels** (more than ~12): overloaded, likely hiding signal.
- **Too few** (fewer than ~3): probably not useful as a standalone dashboard.
- **Density**: sum of panel `w × h` vs. layout area — low density wastes screen, very high density overflows.

### 2. Visualization appropriateness

Check each panel's `viz_type` against the shape of its data (see `ds-viz` for recommendations):

- `splunk.pie` with > 6 categories — flag (unreadable).
- `splunk.singlevalue` driven by a query returning many rows — flag (only first row shown).
- Time-series data rendered as `splunk.bar` or `splunk.pie` — flag (misleading).
- `splunk.choropleth` without a geographic field — flag.

### 3. Drilldowns

- Panels with rich data (tables, timelines) without drilldowns — suggest adding.
- Drilldown targets that don't exist — flag (also caught by ds-validate, repeat here if present).

### 4. Tokens

- Input declared but never referenced by any dataSource — flag (dead input).
- SPL references a token that's declared but only given a default value — info (works, but consider giving the user the option to change it).

### 5. Accessibility

- Custom colors in `majorColor`, `ranges`, etc. — cross-check against theme. Hard-coded dark colors on a light theme (or vice versa) reduce legibility.
- Text with very low contrast — if present in `description`, flag.

### 6. SPL performance

- Queries starting with `search` or `index=* *` — flag (full-index scans).
- Queries without `earliest` / `latest` bounds at the dashboard level — suggest setting `defaults` or a global timerange input.
- Use of `join` or `append` on large datasets — suggest `tstats` or subsearch redesign.

### 7. Polish scorecard (Aurora)

`ds-review` produces a weighted **Polish score (0–10)** measuring ten dimensions:

1. Aurora theme applied (vs. unstyled Splunk default)
2. KPI row wrapped in rectangle card (`card-kpi` pattern active)
3. Hero KPI identified and sized correctly when present
4. Sparklines on every singlevalue backed by a time-series SPL
5. Compare-to-previous-period active on at least one time chart
6. Section-zones used when panel count > 6
7. No chart exceeds 8 series
8. Semantic colors used on status KPIs (red for failure, green for healthy, etc.)
9. Panel gutter minimum 20 px
10. Panel titles ≤ 40 characters

Each dimension returns pass/partial/fail and contributes to the weighted score. Findings appear in `review.md` under `## Polish scorecard` with per-dimension hits and suggested `ds-update` commands for gaps.

Implementation: `src/splunk_dashboards/aurora_score.py` (sub-plan 13).

## Output

Write findings to `review.md` in the workspace (or to the directory of the input file when operating standalone):

```markdown
# Dashboard Review: <title>

Generated: <ISO date>
Source: <path to dashboard.json/xml>

## Summary

- Errors: N (blocking)
- Warnings: N (should fix)
- Info: N (suggestions)

## Findings

### [warning] panel-count-high
<N> panels on the dashboard. Consider splitting into two dashboards or hiding secondary panels behind a drilldown.

### [info] spl-no-timerange
`dataSources.ds_3` query has no earliest/latest bound. Consider adding a `input.timerange` and referencing `$<token>.earliest$`.

## Suggested ds-update invocations

- Add a time range input to the dashboard (see finding "spl-no-timerange")
- Drop panel `viz_p9` — barely used real estate (see "panel-count-high")
```

## How to invoke

Inside a workspace (reads `dashboard.json`, writes `review.md` next to it):

```bash
# No dedicated CLI yet — ds-review is skill-driven.
# Claude reads the file, analyzes it, writes review.md.
```

Standalone (path to file):

```bash
# Same — Claude reads the given path and writes review.md in the same directory.
```

## After review

Hand the findings to the user. For each actionable one, offer a specific `ds-update` command that would fix it. Do not advance workspace state; `ds-review` is read-only.
