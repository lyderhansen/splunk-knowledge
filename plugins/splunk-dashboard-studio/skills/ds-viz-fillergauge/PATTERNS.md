# splunk.fillergauge — verified patterns

20 panels rendered and visually QA'd in `ds_viz_fillergauge_dark` /
`ds_viz_fillergauge_light`. Patterns 1–12 cover the option matrix;
13–20 are KPI bank packing patterns.

## 1. Default vertical, low value (22)

```json
{ "type": "splunk.fillergauge", "dataSources": { "primary": "ds_low" } }
```

Bar fills 22% from bottom. No options set.

## 2. Default vertical, mid value (58)

Same options as #1. Fill reaches the middle.

## 3. Default vertical, high value (94)

Same options as #1. Bar nearly full.

## 4. Horizontal orientation

```json
{ "options": { "orientation": "horizontal" } }
```

Reads left-to-right. Use for KPI rows where labels need horizontal
space.

## 5. Static green fill

```json
{ "options": { "gaugeColor": "#33FF99" } }
```

## 6. Static amber fill

```json
{ "options": { "gaugeColor": "#FFB627" } }
```

Side-by-side with #5 proves it's a single fill, not banded.

## 7. Dynamic threshold colour (low good, high bad)

```json
{
  "options": {
    "gaugeColor": "> primary | seriesByName('value') | lastPoint() | rangeValue(thresholds)"
  },
  "context": {
    "thresholds": [
      { "to": 50,             "value": "#33FF99" },
      { "from": 50, "to": 80, "value": "#FFB627" },
      { "from": 80,           "value": "#FF2D95" }
    ]
  }
}
```

Fill flips colour on threshold (green < 50, amber 50–80, red > 80).

## 8. Disk-used inverse thresholds

Same pattern as #7 but inverted (high = bad for disk usage).

```json
"thresholds": [
  { "to": 60,             "value": "#33FF99" },
  { "from": 60, "to": 85, "value": "#FFB627" },
  { "from": 85,           "value": "#FF2D95" }
]
```

## 9. Quota progress with upstream scaling

`maxValue` doesn't exist on fillergauge. Re-scale upstream:

```spl
| stats sum(orders) AS orders
| eval value = round(orders / 1000 * 100)
| table value
```

640 orders / 1000 quota → `value=64`, fillergauge renders 64%.

## 10. Percentage display modes

```json
{
  "options": {
    "labelDisplay": "percentage",
    "valueDisplay": "percentage"
  }
}
```

With 0–100 scale, percentage and number render identically. Mode
becomes meaningful when source units differ from gauge scale.

## 11. No-chrome — pure visual fill

```json
{
  "options": {
    "labelDisplay": "off",
    "valueDisplay": "off"
  }
}
```

Strips axis labels and value readout. Bar shape is the only signal.
Useful inside a custom KPI card.

## 12. Custom tick interval + panel tint

```json
{
  "options": {
    "majorTickInterval": 25,
    "backgroundColor": "#1A2440"
  }
}
```

`majorTickInterval` is **pixels**, not values — `25` means tick every
25 px along gauge axis.

## 13–16. 4-up vertical bank — CPU/MEM/DISK/NET

Four 200 × 200 vertical gauges, transparent chrome, severity-coloured
fills. Together reads as one host snapshot.

```json
{
  "options": {
    "gaugeColor": "#33FF99",
    "labelDisplay": "off",
    "valueDisplay": "off",
    "backgroundColor": "transparent"
  }
}
```

Layout: blocks at `y: 1380, h: 200, w: 200`, `x` stepping
`16 → 216 → 416 → 616`. Panel `title` carries each metric label since
`labelDisplay: "off"`.

Tile colours: `#33FF99` / `#FFB627` / `#FF2D95` / `#7AA2FF` for
CPU/MEM/DISK/NET respectively.

## 17–20. Stacked horizontal queue panel

Four 220 × 150 horizontal gauges stacked vertically with 8 px gap,
sharing severity-coloured fills (ingest / search / indexer /
forwarder queues).

Layout: blocks at `x: 856, w: 220, h: 150`, `y` stepping
`1380 → 1538 → 1696 → 1854` (158 px row = 150 tile + 8 gap).

Same `options` as #13–16 but with `orientation: "horizontal"`.

## Threshold colouring — semantics

`splunk.fillergauge` does NOT have `gaugeRanges`. The `gaugeColor`
DOS expression with `rangeValue` is the canonical pattern (see
pattern 7).

**Threshold semantics:**

- `to: X` is **exclusive** (`< X`).
- `from: X` is **inclusive** (`>= X`).
- Top-down evaluation; first match wins.

Always disjoint, gap-free buckets. Overlapping
`[{to:70}, {from:50, to:80}, {from:70}]` makes the second bucket
unreachable. Gaps `[{to:50}, {from:60}]` route values 50–59 to no
bucket → fallback to theme primary (typically purple).
