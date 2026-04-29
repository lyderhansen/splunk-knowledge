# splunk.singlevalueicon — full options reference

16 options total. Singlevalue minus sparkline, plus 4 icon-specific.
`backgroundColor` default differs (`"transparent"` vs theme bg).

## Icon group (4 — unique to singlevalueicon)

| Option | Type | Default | Purpose |
|---|---|---|---|
| `icon` | `"default"` \| `splunk-enterprise-kvstore://<name>__<UUID>.svg` | `"default"` | The icon. Two valid forms only. |
| `iconColor` | hex / theme token / DOS | theme accent | Icon stroke / fill. Splunk-uploaded SVGs use `currentColor`. Custom SVGs need `stroke="currentColor"` (or `fill="currentColor"`). |
| `iconOpacity` | number 0–1 | `1` | Icon transparency. Use `0.3`–`0.5` for decorative. |
| `iconPosition` | `"before"` \| `"after"` | `"before"` | Icon left or right of value. |

## Value group (8 — same as singlevalue)

| Option | Type | Default | Purpose |
|---|---|---|---|
| `majorValue` | number / DOS | first numeric cell | The big number. |
| `majorValueField` | string | first numeric column | Pick a column. |
| `majorColor` | hex / theme / DOS | theme primary text | Number colour. Use DOS for thresholds. |
| `majorFontSize` | number (px) | auto | Lock for tile consistency. |
| `numberPrecision` | int ≥ 0 | `0` | Decimal places. |
| `unit` | string | — | Unit prefix/suffix. |
| `unitPosition` | `"before"` \| `"after"` | `"after"` | Side of number. |
| `underLabel` | string | — | Label below number. |

## Trend group (3)

| Option | Type | Default | Purpose |
|---|---|---|---|
| `trendDisplay` | `"absolute"` \| `"percent"` \| `"off"` | `"absolute"` | Delta vs first point. |
| `trendColor` | hex / theme | theme | Trend text colour. |
| `shouldAbbreviateTrendValue` | boolean | `false` | Compact deltas. |

## Chrome group (1)

| Option | Type | Default | Purpose |
|---|---|---|---|
| `backgroundColor` | hex / theme / `"transparent"` / DOS | `"transparent"` | Tile background. **Default differs from `splunk.singlevalue`.** |
| `shouldUseThousandSeparators` | boolean | `true` | Comma separators. |

## What singlevalueicon does NOT support

- **No sparkline.** All `sparkline*` options silently ignored. Use
  `splunk.singlevalue`.
- **No `underLabelFontSize`** (auto).
- **No `trendFontSize`** (auto).
- **No legend, axes, `dataValuesDisplay`** (same as `singlevalue`).
- **No native panel `title` / `description`** — confirmed against
  10.2 docs. The editor explicitly excludes this viz from
  Title/Description fields. Setting them on the viz object is
  silently ignored. Workaround: paired `splunk.markdown` panel above
  each icon panel.

## Layout convention with header markdown

```
Header markdown: h: 56  (2 lines default-size markdown)
Gap:            4 px
Icon panel:     h: 160
Total slot:     220
```

Three panels per row, row stride `236` (220 slot + 16 gap).

If you don't need a per-panel description, drop second markdown line
and shrink header to `h: 32` — icon then gets back to `h: 184`.

Even though `title` / `description` don't render, **leave them
populated** on the viz JSON object — source-view editing relies on
them, and a future Splunk release may light them up.

## Source

`docs/SplunkCloud-10.4.2604-DashStudio.pdf`. *Single value icon
options*.
