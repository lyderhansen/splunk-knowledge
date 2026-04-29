# splunk.pie — verified patterns

12 patterns rendered and visually QA'd on Splunk Enterprise 10.2.1 in
`ds_viz_pie_dark`. Data shape:

```spl
| stats sum(revenue) as revenue by region | sort - revenue
```

Always `| sort - <value>` — pie has no built-in sort.

## 1. Minimal — defaults

```json
{
  "type": "splunk.pie",
  "dataSources": { "primary": "ds_basic" },
  "options": {}
}
```

Splunk reads col 0 as label, col 1 as value, prints raw values.

## 2. `valuesAndPercentage` — executive default

```json
{
  "options": {
    "labelDisplay": "valuesAndPercentage"
  }
}
```

Adds `% of total` to each slice label. Most informative default for
executive dashboards. Reach for this 90% of the time.

## 3. `labelDisplay: "off"` — legend-only

```json
{
  "options": {
    "labelDisplay": "off"
  }
}
```

On-slice labels disappear; legend carries meaning. Use only when the
panel is too narrow for slice labels.

## 4. Donut — `showDonutHole`

```json
{
  "options": {
    "showDonutHole": true,
    "labelDisplay": "valuesAndPercentage"
  }
}
```

Cuts a centre hole. Donuts are easier to read than full pies — **arc
length** carries the message instead of **slice area**.

## 5. `seriesColorsByField` — semantic colour

```json
{
  "options": {
    "labelDisplay": "valuesAndPercentage",
    "seriesColorsByField": {
      "healthy":   "#33FF99",
      "degraded":  "#FFB627",
      "unhealthy": "#FF2D95",
      "unknown":   "#7AA2FF"
    }
  }
}
```

Pins colour to slice **label**, not slice index. Survives SPL field
reorders, filter changes, and `collapseThreshold`. Use whenever colour
means something.

## 6. `collapseThreshold` + `collapseLabel`

```json
{
  "options": {
    "collapseThreshold": 0.02,
    "collapseLabel": "Other",
    "labelDisplay": "valuesAndPercentage"
  }
}
```

Long-tail dataset with 12 categories. Anything below 2% folds into
`Other`. Default threshold (`0.01`) is too low for executive views.

## 7. Donut + collapseThreshold — executive overview

```json
{
  "options": {
    "showDonutHole": true,
    "collapseThreshold": 0.05,
    "collapseLabel": "Other",
    "labelDisplay": "valuesAndPercentage"
  }
}
```

The combination that works for almost any executive overview: donut +
5% threshold + percentage labels.

## 8. Two-slice donut — allow/block

```json
{
  "options": {
    "showDonutHole": true,
    "labelDisplay": "valuesAndPercentage",
    "seriesColorsByField": {
      "allowed": "#33FF99",
      "blocked": "#FF2D95"
    }
  }
}
```

Simplest possible breakdown. Use only when there are exactly two
categories and the headline is the percentage of one of them (block
rate, error rate, conversion).

## 9. Single-colour emphasis

```json
{
  "options": {
    "labelDisplay": "valuesAndPercentage",
    "seriesColors": [
      "#00D9FF",
      "#33B3D8",
      "#5A8DB7",
      "#7A6E97",
      "#8C5079"
    ]
  }
}
```

All slices share a single hue, varying lightness. Removes rainbow
effect when the message is the **shape** (one dominant slice + tail),
not category identity.

## 10. Chrome-stripped donut — KPI overlay

```json
{
  "options": {
    "showDonutHole": true,
    "labelDisplay": "off",
    "backgroundColor": "transparent"
  }
}
```

Strips chrome and labels — donut becomes pure shape. Pair with a
`splunk.singlevalue` overlay positioned over the donut hole for the
classic "big number with breakdown ring" pattern.

## 11. Aggressive `collapseThreshold: 0.10`

```json
{
  "options": {
    "collapseThreshold": 0.1,
    "collapseLabel": "Rest of world",
    "labelDisplay": "valuesAndPercentage"
  }
}
```

Only top three categories survive as own slices. Use when the
**top-N is the message**, not the long tail.

## 12. `labelDisplay: "values"` — counts only

```json
{
  "options": {
    "labelDisplay": "values"
  }
}
```

Default behaviour. Use when raw counts (revenue numbers, host counts)
are more meaningful than the proportions.
