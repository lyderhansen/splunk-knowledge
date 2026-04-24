---
name: ds-polish
description: Use this skill to lift a Splunk Dashboard Studio dashboard from "functional AI output" to "deliberate, operator-ready." Takes a dashboard.json (inside a workspace or any file path) and applies the fix catalog derived from ds-design-principles — canvas background, KPI card rectangles, semantic polarity on status KPIs, unit inference, default values on inputs, drilldown stubs, and the other Slop-Test criteria. Writes polish-report.md documenting every change. Run after ds-create, before ds-validate.
---

# ds-polish — Lift a dashboard out of AI-slop territory

## When to use

- **After `ds-create`** — the JSON is correct but generic. `ds-polish` is the deliberate-intent pass before `ds-validate`.
- **After `ds-review`** — review flags problems; polish applies the fixes review identified.
- **On any legacy dashboard** — point it at a `dashboard.json` or `dashboard.xml` outside a workspace to bring an older dashboard up to the current principles.

## What ds-polish is (and what it is not)

`ds-polish` is NOT a visual linter. `ds-validate` is the linter.

`ds-polish` is a **deliberate-intent pass** that applies the catalog of fixes derived from the `ds-design-principles` reflex-defaults, absolute-bans, and Slop-Test sections. It modifies the dashboard in place and writes a `polish-report.md` that records exactly what changed and why.

## Input / output contract

**Input** (one of):
- A workspace path containing a `build/dashboard.json` (preserves workspace state).
- A direct file path to `dashboard.json` or `dashboard.xml` (edits the file in place; writes report alongside).

**Output**:
- The dashboard file, mutated with polish fixes applied.
- `polish-report.md` in the same directory, listing every fix under three buckets:
  - **Applied** — Claude auto-applied the fix with high confidence.
  - **Suggested** — Claude proposed a fix but could not apply without user confirmation (e.g., choosing semantic polarity for an ambiguous metric name).
  - **Flagged** — Claude detected a problem that needs human judgment (e.g., picking drilldown targets).

## Two modes

### Inside a workspace
- Read `build/dashboard.json`.
- Write polish-report to the workspace root.
- Do NOT advance the workspace state (polish does not own a pipeline transition). The next call — `ds-validate` — owns the transition from `built` to `validated`.

### Outside a workspace
- Accept any file path.
- Edit the file in place (preserve a `.bak` copy on first run).
- Write `polish-report.md` alongside the edited file.

## Required context before polishing

Polish choices depend on archetype and audience. Before applying fixes:

1. **Read `ds-design-principles`** — the fix catalog below is derived from it; confirm the reflex-defaults, absolute-bans, and Slop-Test sections are loaded.
2. **Identify the archetype** — from the dashboard title, panel mix, or by asking the user. Archetype drives theme and KPI-hierarchy decisions.
3. **Confirm the theme** — dark, dark-NOC, or light. Derived from archetype + viewing context.

If any of these is unknown, ask the user before running the fix catalog.

## The fix catalog

Each fix has a confidence bucket — one of:

- **APPLIED** — Claude auto-applies with high confidence. The report records what changed.
- **SUGGESTED** — Claude proposes the fix but waits for user confirmation. Partial-auto when safe heuristics exist.
- **FLAGGED** — Claude detects the problem but the fix requires human judgment. Recorded in the report only.

### Fix 1: Canvas background missing — APPLIED

- **DETECT**: `layout.options.backgroundColor` absent, or set to the Splunk default grey.
- **FIX**: Set `layout.options.backgroundColor` to `#0b0c0e` (dark), `#000000` (dark-NOC/wall), or `#FAFAF7` (light) — chosen from the archetype and audience.
- **CONFIRMATION**: Auto-apply once archetype is known. If archetype is unknown, ask the user first — do not guess.

### Fix 2: KPI row missing background rectangle — APPLIED

- **DETECT**: Three or more adjacent `splunk.singlevalue` / `splunk.singlevalueicon` / `splunk.markergauge` panels at the same `y` coordinate with no `splunk.rectangle` entry rendering behind them.
- **FIX**: Insert a `splunk.rectangle` entry into `layout.structure` **before** the KPI panel entries (earlier = renders behind) with `fillColor: PANEL`, `strokeColor: PANEL_STROKE`, `rx: 8`. Size it to extend 10 px beyond the KPI block on all sides.
- **CONFIRMATION**: Auto-apply when the layout uses `absolute` type. Skip silently on `grid` / `tab` layouts — shapes are ignored there.

### Fix 3: Uniform KPI `majorColor` across a row — SUGGESTED

- **DETECT**: Every `splunk.singlevalue` in a row uses the same static `majorColor` (classic symptom: all `#006D9C`).
- **FIX**: Classify each KPI's polarity and emit per-KPI `majorColor`:
  - Up-is-bad (errors, latency, queue depth) → threshold-colored red via DOS, static `#DC4E41` if single threshold.
  - Down-is-bad (uptime, success rate) → threshold-colored green / amber / red.
  - Neutral informational counts → static `#006D9C`.
- **CONFIRMATION**: Present a proposed polarity map derived from metric name heuristics (`error_`, `fail_`, `latency_` → up-is-bad; `uptime_`, `success_`, `availability_` → down-is-bad). User confirms before writing.

### Fix 4: Uniform KPI size — SUGGESTED

- **DETECT**: Every KPI in a row has identical `w` and `h`.
- **FIX**: Promote the anchor KPI (first by reading order, or the one flagged by the user) to hero size — `w` 1.5–2× the supporting KPIs, font scaled to `FS_KPI_HERO` (72 px).
- **CONFIRMATION**: Ask which KPI is the anchor. Do not assume leftmost is always the anchor — for SOC the criticality-severity KPI usually dominates even if it sits second.

### Fix 5: KPI missing `unit` — APPLIED

- **DETECT**: `splunk.singlevalue` panel with no `unit` option AND the SPL field name hints at a measurable quantity.
- **FIX**: Infer from field name:
  - `*_ms` / `latency*` / `response_time*` → `"ms"`
  - `*_rate` / `*_pct` / `*_percent` → `"%"`
  - `*_bytes` / `*_size` → `"B"` (with auto-scale)
  - `*_count` / `*_total` / raw counters → leave empty (no unit semantically).
- **CONFIRMATION**: Auto-apply when the heuristic is unambiguous. Flag when the field name gives no signal.

### Fix 6: KPI missing `numberPrecision` — APPLIED

- **DETECT**: `splunk.singlevalue` without `numberPrecision`.
- **FIX**: `0` for integer counts, `1` for latency in ms, `2` for rates and percentages. Default `0` if type is unknown.
- **CONFIRMATION**: Auto-apply.

### Fix 7: Table without drilldown — FLAGGED

- **DETECT**: `splunk.table` panel with no `drilldown.link`, no `drilldown.setToken`, and no custom action.
- **FIX**: Not auto-applied — drilldown targets depend on the rest of the app. Record a flag entry in `polish-report.md` recommending either `/app/search/search?q=<row-context>` or a token-set to filter a sibling panel.
- **CONFIRMATION**: User picks the drilldown target. `ds-polish` does not emit drilldown JSON speculatively.

### Fix 8: Raw `_time` in a table column — APPLIED

- **DETECT**: `splunk.table` panel whose SPL returns `_time` AND the panel has no `columnFormat` override for `_time` AND the SPL does not already contain `strftime(_time, ...)`.
- **FIX**: Append `| eval _time=strftime(_time, "%Y-%m-%d %H:%M:%S")` to the SPL as the final stage.
- **CONFIRMATION**: Auto-apply. Fallback: if the SPL uses `_time` downstream as an epoch value, emit `columnFormat` on the panel instead to avoid breaking the pipeline.

### Fix 9: Pie chart with more than 6 slices — SUGGESTED

- **DETECT**: `splunk.pie` whose upstream SPL produces > 6 rows AND contains no `| head N` or Top-N aggregation.
- **FIX**: Propose one of:
  - Swap `viz_type` to `splunk.bar` (horizontal, sorted descending).
  - Aggregate to Top 5 + `"Other"` in SPL (`| eventstats sum(count) as total | sort -count | streamstats count as rank | eval category=if(rank > 5, "Other", category) | stats sum(count) as count by category`) and keep pie.
- **CONFIRMATION**: User picks the strategy. `ds-polish` writes the chosen rewrite.

### Fix 10: Rainbow palette on ordered data — SUGGESTED

- **DETECT**: `seriesColors` (or `chart.seriesColorsByField`) on a field named `severity`, `priority`, `tier`, `level`, or similar, using more than two distinct hues.
- **FIX**: Replace with one of:
  - Sequential single-hue gradient (`#5F1A17` → `#8B2621` → `#B73530` → `#DC4E41` → `#F07F75` for severity 5→1).
  - The semantic palette mapped to the ordering (critical/high/warning/ok).
- **CONFIRMATION**: User confirms the field is ordered, not categorical. Do not auto-rewrite — misclassification is easy.

### Fix 11: Unbounded search — SUGGESTED

- **DETECT**: `ds.search` whose `query` lacks both `earliest=` and `latest=` AND whose `options.queryParameters.earliest` / `latest` do not reference the global time token.
- **FIX**: Add `options.queryParameters.earliest: "$global_time.earliest$"` and `options.queryParameters.latest: "$global_time.latest$"`.
- **CONFIRMATION**: Auto-apply if a `global_time` input exists on the dashboard. If no global time input exists, flag it — the dashboard is missing a time picker entirely.

### Fix 12: Input without default value — SUGGESTED

- **DETECT**: `input` of type `dropdown`, `multiselect`, or `text` without `options.defaultValue` AND the bound token has no `default`.
- **FIX**: Propose a default from:
  - Open filters → `"*"`.
  - Environment / region / tier → the most common value from a scan of the input's data source (if available).
  - Time range → `-24h@h` for operational, `-7d@d` for executive/analytical.
- **CONFIRMATION**: User confirms the proposed default before it is written.
