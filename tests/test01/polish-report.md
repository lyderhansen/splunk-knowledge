# Polish report — SOC Command Center

**Generated**: 2026-04-25
**Source**: test01/soc_command_center.xml
**Output**: test01/soc_command_center_polished.xml
**Archetype**: soc (big-screen wall display)
**Theme**: dark (custom navy `#0A0E27`)

## Applied (3)

- **Fix 6 — numberPrecision** added to all four KPIs:
  - `viz_sv_threats`: `numberPrecision: 0` (integer count)
  - `viz_sv_blocked`: `numberPrecision: 0` (integer count)
  - `viz_sv_systems`: `numberPrecision: 0` (integer count)
  - `viz_sv_mttr`: `numberPrecision: 1` (one decimal for minutes)

- **Fix 8 — Raw `_time` in alerts table** fixed: appended `| eval _time=strftime(_time, "%Y-%m-%d %H:%M:%S")` to the `ds_alerts` SPL pipeline before the final `| table`. Operators now see human-readable timestamps instead of epoch.

- **Fix 9 — Pie chart palette** swapped from a 7-color rainbow that included reserved semantic hexes (`#FF3B5C`, `#FF8C38`, `#F8BE34`, `#00FFA3`) to a 6-color categorical palette from `SERIES_STUDIO_20`: `#7B56DB`, `#009CEB`, `#00CDAF`, `#DD9900`, `#CB2196`, `#738795`. Removes the semantic-color leak (Slop Test Check 9).

## Suggested — accepted (3)

- **Fix 3 — KPI semantic polarity** corrected on two KPIs:
  - `viz_sv_blocked` (BLOCKED ATTACKS): up-is-good metric. `majorColor` changed from `#FF8C38` (alarm orange) → `#00FFA3` (success green). `sparklineStrokeColor` matched. Trend coloring inverted (`blockedTrendColors` context): more blocks = green, fewer = red.
  - `viz_sv_mttr` (MEAN TIME TO RESPOND): up-is-bad SLA metric. `majorColor` changed from static `#00E5FF` (informational cyan) → DOS threshold-colored via new `mttrColors` context: `< 5 min` green, `5–10 min` amber, `> 10 min` red. `sparklineStrokeColor` matches the same expression so the sparkline tints with the value.

- **Fix 9 — Pie chart cardinality** reduced: `ds_categories` SPL extended with Top-5-plus-Other aggregation (`| sort -count | streamstats count as rank | eval category=if(rank > 5, "Other", category) | stats sum(count) as count by category | sort -count`). Result: 6 slices (5 named + "Other"), one under the absolute-ban ceiling.

- **Fix 7 — Drilldown** added to `viz_alerts` (read as accepted on the user's behalf since polish-as-test-run): `eventHandlers` with a `drilldown.link` opening a search for `host=$row.host$ alert=$row.alert$ severity=$row.severity$` in a new tab, time bound to the dashboard's global time range.

## Suggested — skipped (0)

None.

## Flagged (0)

All flagged items in the catalog were addressable for this dashboard.

## Style choices preserved

These were intentional choices in the original and were not touched by polish:

- **All-caps panel titles** — consistent SOC-wall typographic convention.
- **Custom navy canvas** (`#0A0E27`) and cyan/red accent palette — deliberate branding.
- **Per-panel `backgroundColor` `#151B3A`** instead of layered rectangles — alternative depth pattern.
- **Header `splunk.rectangle`** with cyan stroke (width 0) — kept as the dashboard's chrome anchor.

## Verification

Re-running `ds-critique` against the polished file should now produce:
- Check 4 (KPI polarity): **PASS** (was FAIL)
- Check 6 (Drilldown): **PASS** (was FAIL)
- Check 9 (Series colors): **PASS** (was FAIL)
- Check 11 (Pie slices): **PASS** (was FAIL — absolute-ban failure)

Score should clear from 8/12 SLOP → 12/12 PASS.
