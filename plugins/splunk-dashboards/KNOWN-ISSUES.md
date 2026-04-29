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

---

## Cloud vs Enterprise portability

### `isSet($tok$)` is Cloud-only (verified 2026-04-28)

The `isSet()` expression function is documented in Splunk Cloud
Platform 10.1.2507 dashboard-studio docs but is rejected by Splunk
Enterprise 10.2.x's expression parser:

```
S0201 Syntax error: "isSet" at position 0
```

**Portable form** (works on Cloud and Enterprise):

```json
{ "expressions": { "conditions": {
  "host_chosen": { "name": "host_chosen", "value": "$selected_host$ != \"\"" }
}}}
```

Pair with `defaults.tokens.default.<name>: { value: "" }` so undefined
tokens compare cleanly on first render.

---

## Dashboard Studio authoring gotchas (verified live, 2026-04-28)

Findings from live QA against `ds_interactivity_core` /
`ds_interactivity_tabs` and the geo viz benches. Each item is a
real-world trap that silently misbehaves rather than fails loudly.

### Visibility & expression language

#### Q1 — `visibility` must nest under `containerOptions`

Top-level `visibility: { ... }` on a panel is rejected with
`must NOT have additional properties`. The only valid form is
`containerOptions.visibility.{showConditions, hideConditions, ...}`.
Conditions live in dashboard-root `expressions.conditions.<id>`.

#### Q2 — Quoted tokens break parser at hyphens

Wrapping a token reference in quotes like `"$selected_host$" = "web-01"`
breaks at the hyphen with `S0201 Syntax error: "web" at position 5`.
The token reference must be bare:

```
$selected_host$ = "web-01"
```

Quote string literals on the right-hand side; never quote the token.

#### Q4 — Initialise tokens via `defaults.tokens.default`

Visibility expressions evaluating against undefined tokens render
unpredictably on first load. Always initialise in `defaults`:

```json
"defaults": { "tokens": { "default": {
  "selected_host": { "value": "" },
  "selected_action": { "value": "" }
}}}
```

### Token filters & SPL interpolation

#### Q5 — Multiselect into `IN(...)` requires `|s`

Default multiselect interpolation produces unquoted comma-joined
output (`200,404`), which SPL chokes on the moment a value contains
hyphen, space, or quote. The canonical pattern is:

```spl
| where field IN ($tok|s$) OR ("$tok$" = "*")
```

Studio v2 does NOT support Simple-XML's `valuePrefix` / `valueSuffix` /
`delimiter` properties — schema rejects them. `|s` is the only
replacement.

#### Q10 — Free-text and dynamic-dropdown values also need `|s`

Multi-word free-text input or dynamic-dropdown values containing
spaces or special chars break rendered SPL: `filter=multi word host`
is parser-invalid. Apply `|s` the same way you do for multiselect:

```
filter=$search_text|s$ host=$host_filter|s$
```

### Drilldowns

#### Q6 — `linkToDashboard.tokens` is an array, not a map

The map form `{ "form.host": "$row.host$" }` is silently dropped — the
link navigates but the target dashboard stays at default token values.
The verified shape is an array of `{token, value}`:

```json
"linkToDashboard": {
  "dashboard": "details",
  "tokens": [
    { "token": "host", "value": "$row.host$" },
    { "token": "action", "value": "$row.action$" }
  ]
}
```

### Markdown rendering

#### Q9 — `splunk.markdown` does NOT render GFM pipe-tables (10.2.x)

Pipe-tables render as raw `|`-separated text in Dashboard Studio's
markdown engine. Use bullet-list form instead:

```markdown
- **Field A** — value
- **Field B** — value
```

Token interpolation via `$tok$` in the markdown body IS supported.
Inline-code spans are useful to wrap token values whose content might
re-interpret as markdown formatting (`*`, `_`).

### Geographic visualizations

#### `splunk.map` multi-layer marker + bubble silently drops layers

Stacking marker + bubble on the same `splunk.map` panel is
unreliable — the second layer drops or renders sporadically. **Use
two separate `splunk.map` panels** for the choropleth + marker
combination after live verification.

#### `geo_countries` lookup keys on full English names, not ISO-2

The built-in `geo_countries` lookup expects full English country
names (`"United States"`, `"United Kingdom"`) — not ISO-2 codes
(`"US"`, `"GB"`). Convert in SPL before joining:

```spl
| lookup geo_countries featureCountry AS country
```

#### `splunk.map` bubble layer — `dataColors` token shape

The bubble layer's per-bubble color requires the explicit DOS form:

```
"dataColors": "> dataValues | rangeValue(markerColors)"
```

Setting `dataColors` to a static array (which works on `splunk.column`)
silently falls back to default theme colors.

#### `splunk.choropleth.svg` needs realistic projection

Stylised continent blobs render unreadably; use equirectangular
projection paths (~25–50 vertices per continent + graticule). See
`skills/ds-viz-choropleth-svg/SVG-AUTHORING.md` for the JSON-escaping,
path syntax, Inkscape/Illustrator workflows, and programmatic
generation patterns.

### Layout & sizing

#### Q11 — Markdown without `title` sizes differently than other panel types

A `splunk.markdown` panel with no `title` field renders with smaller
chrome than a `splunk.singlevalue` or `splunk.table` next to it on the
same row, breaking visual alignment. Always set a `title` (even if
empty) and unify `w`/`h` across siblings on the same row.

### Schema hygiene

#### `dataSource.name` regex enforced

`dataSource.name` (the human-readable display name, NOT the data
source key) is enforced by the editor against `^[A-Za-z0-9 \-_.]+$`.
Slashes, parentheses, and other punctuation are rejected on save.

### Bench authoring (Q7 / Q8)

These were one-time bench fixes during 2026-04-28 QA, not generalised
authoring gotchas — kept here for traceability:

- **Q7** — `splunk.singlevalue` / `splunk.table` driven by `eval msg=...`
  with empty-string token defaults produce malformed eval. Bench
  rewrote the affected panels to `splunk.markdown` with direct `$tok$`
  interpolation. Fix is bench-specific; the underlying issue is
  documented under Q4 (token initialisation) above.
- **Q8** — `dataSource.name` regex hygiene swept clean across all
  benches, no violations remained.
