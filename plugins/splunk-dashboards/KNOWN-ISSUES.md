# Known Issues — splunk-dashboards plugin

Tracked bugs, polish gaps, and deferred work. Items here are known and
explicitly deferred — not things we forgot.

---

## Dashboard Studio platform limitations (not plugin bugs)

### `splunk.singlevalueicon` icon field needs a KV-store URI

`splunk.singlevalueicon.icon` expects a KV-store URI pointing at an SVG
uploaded to Splunk's internal store, not a free-text icon name. Example
valid value:

```
splunk-enterprise-kvstore://icon-check__e29f784a-31a2-4544-813f-efce24d5be32.svg
```

The UUID is generated when the SVG is uploaded. There is no built-in
named icon dictionary in Dashboard Studio v2 — names like
`check-circle`, `alarm`, `warning` render as literal "?" on the
dashboard canvas.

**When writing dashboards by hand:** drop the `icon` field on
`splunk.singlevalueicon`. The tile still renders the value + background
color + title as a plain status tile, which is usually what you want.

**If you genuinely need icons:** the full fix is a multi-step lifecycle
change: bundle SVGs in the plugin, upload them to the target Splunk's
KV store via REST at install time, record the generated UUIDs, and
substitute them into the dashboard's JSON before deploy. Not in scope
for v2.0.

### Numeric precision on `splunk.singlevalue`

`splunk.singlevalue` defaults to integer formatting when no
`numberPrecision` / `numberFormat` is set — Splunk rounds `2.1` → `2`.

**When writing dashboards by hand:** if the metric has meaningful
decimals, set:

```json
"numberPrecision": 1
```

or the more flexible `formatByType` pattern with
`{"number": {"precision": 1}}`.
