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

**Root cause (per user, 2026-04-24):** `splunk.singlevalueicon.icon`
expects a KV-store URI pointing at an SVG uploaded to Splunk's
internal store, not a free-text icon name. Example valid value:

```
splunk-enterprise-kvstore://icon-check__e29f784a-31a2-4544-813f-efce24d5be32.svg
```

The UUID is generated when the SVG is uploaded. There is no built-in
named icon dictionary in Dashboard Studio v2 — names like
`check-circle`, `alarm`, `warning` render as literal "?".

**Fix path (deferred — complex):**
1. Bundle a small set of canonical SVGs (check, alert, warning, info)
   in the plugin.
2. Extend `ds-deploy` to upload these to the target Splunk's KV store
   via a REST call at install time.
3. Rewrite each icon-using template's `icon` field with the
   generated `splunk-enterprise-kvstore://...` URI post-upload.

This is a multi-step lifecycle change (upload → record UUID →
substitute into template), not a simple value swap.

**Workaround:** Drop the icon entirely — `splunk.singlevalueicon` still
renders the value + background color + title as a plain status tile.
This is what we'll do in Track B until the upload pipeline is built.

**Track:** Deferred. Separate mini-project, not in Track B.

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
