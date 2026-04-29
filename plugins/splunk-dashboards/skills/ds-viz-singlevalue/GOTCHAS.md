# splunk.singlevalue — gotchas

## 1. `trendColor` does NOT auto-flip on +/-

Default is theme font colour for both directions. For red-down /
green-up, drive `trendColor` with a DOS expression:

```json
"trendColor": "> trendValue | rangeValue(trendThresholds)",
"context": {
  "trendThresholds": [
    { "to": 0,    "value": "#FF2D95" },
    { "from": 0,  "value": "#33FF99" }
  ]
}
```

…or accept the monochrome look.

## 2. `shouldAbbreviateTrendValue` does NOT abbreviate the major value

The headline keeps full precision; only the trend number is
abbreviated. If you want the headline abbreviated too, do it in SPL:

```spl
| eval mrr_label = case(mrr >= 1000000, round(mrr/1000000,1)."M", ...)
```

## 3. `rangeValue` thresholds are top-down with `from` inclusive, `to` exclusive — overlapping buckets silently break

```json
// BUG — looks like RAG, but value 65 hits red, 70 hits amber (not red)
[{"to": 70}, {"from": 70, "to": 90}, {"from": 90}]
```

```json
// FIX — disjoint, gap-free, top-down-safe
[{"to": 60}, {"from": 60, "to": 80}, {"from": 80}]
```

Boundary cases:

- `to: 60` matches `< 60`. The value 60 itself does NOT match this bucket.
- `from: 60, to: 80` matches `60 <= x < 80`. The value 60 lands here, 80 does not.
- `from: 80` matches `>= 80`. The value 80 lands here.

**Always verify with at least one demo value per bucket** (e.g. 20, 60,
95 against thresholds 60 / 80) — otherwise you're not actually
exercising the middle bucket on render.

## 4. `numberPrecision: 0` does NOT round the headline if the underlying value is fractional

It just suppresses decimal display. The trend delta IS rounded by
`numberPrecision`. To round the headline, do it in SPL.

## 5. Single-row data sources need BOTH `trendDisplay: "off"` AND `sparklineDisplay: "off"`

Otherwise the engine tries `delta(-2)` from a one-point series and
renders `--` or empty.

## 6. Dynamic `backgroundColor` requires explicit `majorColor`

When the tile flips dark, the default theme font colour is unchanged,
so a dark-on-dark tile becomes unreadable. Always lock `majorColor` to
a high-contrast value (`"#FFFFFF"` for dark theme, `"#000000"` for
light) when driving `backgroundColor` dynamically.

## 7. `majorFontSize` ignores panel resize

Once you set explicit pixel size, the engine will NOT resize on panel
resize. Skip it unless you have a fixed-size KPI strip.

## 8. `majorValue` and `sparklineValues` are independent

`majorValue` controls the headline; `sparklineValues` controls the
chart. By default they read from the same series, but you CAN drive
them from different fields/searches if needed (rare).

## 9. `sparklineAreaColor` blends at 20% opacity

Pick a saturated stroke colour and let the engine handle the fill —
manually picking a faded fill colour usually looks muddier than
default behaviour.

## 10. `unit` does NOT format the value

`unit: "%"` does NOT multiply by 100. If your raw value is `0.987`,
display it with `numberPrecision: 1` and SPL `| eval pct = pct * 100`,
or set `unit: ""` and convert in SPL.