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

### 7. Visual polish checklist

Review the dashboard against the design principles (see `ds-design-principles`) and call out gaps:

- Canvas background set on `layout.options.backgroundColor` (dashboards should not render on Splunk's unstyled default gray).
- KPI row has depth — a `splunk.rectangle` rendered behind the KPIs for card effect (first in `layout.structure`).
- Hero KPI identified and sized correctly when one exists (2.5× body-KPI size, FS_KPI_HERO font).
- Sparklines on every singlevalue backed by time-series SPL.
- Compare-to-previous-period overlay on at least one time chart when the user cares about trend direction.
- Section zones used when panel count > 6 (splunk.rectangle + splunk.markdown header per zone).
- No chart exceeds 8 series (limit clutter and legend overflow).
- Semantic colors on status KPIs (red for failure, green for healthy, amber for warning) — verify hex values against the `ds-design-principles` status palette.
- Panel gutter minimum 20 px; 20 px canvas margins.
- Panel titles ≤ 40 characters; Title Case.

Write each finding as `[warning]` (gap that reduces polish) or `[info]` (suggestion) — none of these are blocking.

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
