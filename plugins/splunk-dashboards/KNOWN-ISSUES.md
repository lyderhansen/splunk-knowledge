# Known Issues — splunk-dashboards plugin

Tracked bugs, polish gaps, and deferred work. Items here are known and
explicitly deferred — not things we forgot. Each entry links to the
most recent commit that observed it.

When starting Track B/C, read this file first and roll applicable fixes
into the relevant sub-plan so nothing slips.

---

## Aurora v1.1 — observed on Splunk Enterprise 10.2.1, 2026-04-24

### Flagship: aurora_noc_wall — icons render as "?"

**Observed:** `splunk.singlevalueicon` tiles display the numeric value
correctly (after `majorValue` binding was added in 967d012) but the
icon slot renders as a literal "?" instead of the expected symbol.

**Screenshots:** 4 tiles all affected — `check-circle`, `warning`,
`alarm`. Pattern: numeric value shows fine, icon slot is always "?".

**Hypothesis:** The icon names we used (`check-circle`, `alarm`) are
from the `@splunk/react-icons` package, but Dashboard Studio v2's
built-in icon set accepts a smaller dictionary. The reference docs
(splunk-dashboard-studio skill) list examples `alert`, `check`, `warning`
— suggesting our names map to names that don't exist.

**Likely fix:**
- `check-circle` → `check`
- `alarm` → `alert`
- `warning` → keep (already matches)

Need to confirm the exact valid dictionary for Dashboard Studio v2. An
alternative path: use a base64-encoded inline SVG via the `icon` field
if it accepts data URIs (some viz types do).

**Workaround:** Drop the icon entirely — `splunk.singlevalueicon` still
renders the value + background color + title as a plain status tile.

**Track:** Fix in Track B when polishing status-tile pattern.

---

### Flagship: aurora_exec_hero — Churn decimal precision lost

**Observed:** Churn value is `2.1` in the SPL (`| eval churn=2.1`) but
renders as `2%` on the dashboard — the `.1` is truncated.

**Hypothesis:** `splunk.singlevalue` defaults to integer formatting when
no `numberPrecision` / `numberFormat` is set. Splunk rounds 2.1 → 2.

**Likely fix:** add to `viz_churn.options`:
```json
"numberPrecision": 1
```
Or the more flexible `formatByType` pattern with `{"number": {"precision": 1}}`.

**Track:** Fix in Track B when revisiting exec-hero or when introducing
a `precision-aware-kpi` pattern.

---

## Deferred from v1.0

### Theme mutable fields (T10-2 I-1)

`Theme` dataclass is `frozen=True` but `series_colors` (list) and
`semantic_colors` (dict) are mutable. A caller doing
`get_theme('pro').series_colors.append('#FFFFFF')` mutates the
registered theme. Low-priority latent footgun; promote to tuples +
frozendict when we need to.

### N/A-as-pass in scorecard (T13-4)

`aurora_score.evaluate()` treats N/A rules as passing, so an empty
dashboard scores ~9.2/10. The threshold was raised in the test to
`<9.5` as a stopgap. Proper fix: exclude N/A rules from the weighted
sum rather than counting them as passes.

### aurora-pipeline-smoke

Dashboard exists on the test Splunk instance but has no corresponding
template file in this repo — it was a one-off hand-crafted for testing.
Screenshots showed "###" in Failures/p95 fields (field-name mismatch).
Not addressable without the source; leaving the deployed dashboard as-is.
