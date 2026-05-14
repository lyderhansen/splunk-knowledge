# Critique — SOC Command Center

**Verdict**: SLOP
**Score**: 8/12 effective (1 absolute-ban failure)
**Generated**: 2026-04-24
**Source**: test01/soc_command_center.xml
**Archetype**: soc (big-screen wall display, self-declared)
**Theme**: dark (custom navy `#0A0E27` with cyan/red accents)

## Summary

The dashboard gets the big things right: SOC archetype is committed, dark theme fits the 24/7 wall audience, canvas background is set to a deliberate navy, searches are time-bounded through `defaults.dataSources`, and severity in the alerts table is paired with a text column so the row-color coding is not the sole differentiator.

Three things tip it into SLOP territory. The pie chart of attack categories renders seven slices — one past the absolute ban. The KPI row has two broken semantic signals: **Blocked Attacks** uses `#FF8C38` (high/critical orange) for a metric where "more is better," and **MTTR** uses `#00E5FF` (informational cyan) for a metric that is up-is-bad and SLA-sensitive. And the alerts table has no drilldown — an operator cannot click through from a critical alert row to an investigation view.

The SOC-wall stylistic choices (all-caps titles, neon accents, per-panel `backgroundColor` instead of layered rectangles) are intentional and internally consistent. Those are design choices, not slop. Fix the three items above and the dashboard clears the Slop Test.

## Scorecard

### PASS — Check 1: Archetype committed
Evidence: Panel mix is classic SOC — 4 status KPIs + geo map + threat-level gauge + severity pie + severity timeline + recent alerts table. No exec/analytical contamination.

### PASS — Check 2: Theme derived from audience
Evidence: Dark theme aligns with 24/7 SOC wall audience. Custom navy `#0A0E27` + cyan `#00E5FF` + red `#FF3B5C` reads as deliberate branding, not default.

### PASS — Check 3: Canvas `backgroundColor` set
Evidence: `layout.options.backgroundColor: "#0A0E27"`. Not absent, not Splunk default grey.

### FAIL — Check 4: KPI row has semantic polarity
Evidence: Per-KPI `majorColor` values:
- `viz_sv_threats` — `#FF3B5C` (red). Up-is-bad. Semantically correct.
- `viz_sv_blocked` — `#FF8C38` (orange). Up-is-good (more blocked = better). **Wrong polarity** — orange signals warning, not success.
- `viz_sv_systems` — `#00FFA3` (green). Down-is-bad. Semantically correct.
- `viz_sv_mttr` — `#00E5FF` (cyan). Up-is-bad with SLA threshold. **Wrong polarity** — cyan reads as informational; MTTR should be threshold-colored green → amber → red.

Impact: Two of four KPIs tell the wrong story at a glance. An operator scanning the wall will not register "blocked attacks are up" as positive; they'll read the orange as an alert. `ds-polish` Fix 3 can propose a corrected polarity map.

### N/A — Check 5: KPI row has visual hierarchy
Evidence: All four KPIs uniform at `w=455, h=180`. For SOC wall dense-grid, uniform KPI tiles are a legitimate archetype choice — the hero is the geo map (`w=1200, h=380`), not a single KPI. This check does not apply.

### FAIL — Check 6: Every table has a drilldown
Evidence: `viz_alerts` (`splunk.table`) has no `drilldown.link`, no `drilldown.setToken`, no custom action. An operator sees ten critical alerts and cannot click through to investigate.

Impact: Must be fixed before deploy. `ds-polish` Fix 7 will flag this with a recommended drilldown target (e.g., `/app/search/search?q=host=$row.host$ severity=$row.severity$`).

### PASS — Check 7: Every input has a default value
Evidence: `input_global_trp` has `defaultValue: "-24h@h,now"`. Only input on the dashboard; all covered.

### PASS — Check 8: Every search is time-bounded
Evidence: `defaults.dataSources.ds.search.options.queryParameters.earliest/latest` bind to `$global_time.earliest$` and `$global_time.latest$`. Propagates to every search. (The `makeresults`-based queries don't use time meaningfully, but the correct binding pattern is in place for when real data replaces the synthetic.)

### FAIL — Check 9: Series colors come from a categorical palette
Evidence:
- `viz_pie` `seriesColors`: `["#FF3B5C", "#FF8C38", "#F8BE34", "#B66DFF", "#00E5FF", "#7B56DB", "#00FFA3"]`. `#F8BE34` is the reserved **semantic warning yellow**. Attack Categories (Phishing, Malware, etc.) are *categorical*, not ordered severity — using the warning yellow for category 3 ("Brute Force") is a semantic leak.
- `viz_timeline` `seriesColorsByField` maps severity → red/orange/yellow/green. This is defensible — the field is literal severity, and the colors map to status. Not a leak.

Impact: Pie palette should use `SERIES_CATEGORICAL_10` or `SERIES_STUDIO_20`. `ds-polish` Fix 3 (conceptually) or a manual swap.

### PASS — Check 10: Color paired with icon / label / shape
Evidence: Alerts table colors rows by `_color_rank` mapped from `severity` — and the `severity` column is visible in the table. Row color has a text backup. KPIs use text labels (ACTIVE THREATS, etc.) and units (live, min, of 2850) so color alone never carries the meaning.

### FAIL — Check 11: Pie charts have ≤ 6 slices (ABSOLUTE BAN)
Evidence: `ds_categories` produces 7 rows (Phishing, Malware, Brute Force, DDoS, SQL Injection, XSS, Insider Threat). One over the 6-slice ceiling.

Impact: **This is an absolute-ban failure — disqualifying regardless of the total score.** `ds-polish` Fix 9 will propose either swap to horizontal bar (sorted descending) or aggregate to Top 6 + "Other".

### PASS — Check 12: Panel titles ≤ 40 chars, title case
Evidence: All panel titles ≤ 40 chars (longest is 33). All use consistent UPPER CASE rather than Title Case. UPPER CASE deviates from the default `ds-design-principles` convention, but it is consistent, intentional, and matches SOC-wall typographic convention where legibility at distance outweighs casing rules. Style choice, not slop.

### PASS — Check 13: Depth via layered rectangles
Evidence: Header bar uses `viz_bg_header` (`splunk.rectangle`) for the title strip. KPI and chart panels use per-panel `backgroundColor: "#151B3A"` which provides the card effect without requiring separate rectangle entries. Alternative pattern to stacked rectangles; achieves the same visual outcome.

## Absolute ban failures

- **Check 11 — Pie with > 6 slices**: `viz_pie` renders 7 categories. Overrides the total score and downgrades verdict to SLOP. Must be fixed before deploy.

## Next action

Route to **`ds-polish`** — all three blocking issues (uniform/wrong KPI polarity, missing drilldown on alerts table, pie slice overflow) are catalog-covered:

- Fix 3 (SUGGESTED) — propose corrected polarity for `viz_sv_blocked` and `viz_sv_mttr`.
- Fix 7 (FLAGGED) — flag missing drilldown on `viz_alerts` with recommended target.
- Fix 9 (SUGGESTED) — propose pie swap or Top-6 aggregation for `viz_pie`.

Re-run `ds-critique` after polish. The dashboard should clear to MIXED (polarity + pie fixed, drilldown pending user action) or PASS (all three resolved).

Style choices worth keeping through polish: all-caps titles, navy-cyan-red palette, neon accents, per-panel card backgrounds. These are deliberate and fit the audience — polish should not overwrite them.
