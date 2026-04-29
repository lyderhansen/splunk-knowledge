# splunk.timeline — gotchas

## 1. `category` and `duration` must be DOS, not plain field names

```json
"category": "> primary | seriesByName('host')"     // ✅
"category": "host"                                  // ❌ rejected
```

Without the `>` prefix the validator rejects the option or the viz
silently picks the wrong field.

## 2. Lane order is alphabetical on category field

`seriesColors[0]` maps to the first lane in **alphabetical** order. If
you want a specific colour for `"alert"`, count where `"alert"` falls
alphabetically and place its colour accordingly.

For fixed semantic mapping (red = "failed"), use `dataColors +
matchValue` instead.

## 3. `seriesColors` must be array, not CSV

Same schema rule as `splunk.sankey`. Validator rejects
`"#aaa,#bbb"` with `must be array / must match pattern "^>.*"`.

## 4. Categorical Timeline pattern needs full-row width

Compound multi-colour stripes need horizontal space to breathe.
Half-width panels collapse the bars into unreadable mush. **Always
`w: 1408`** in a 1440-grid layout for Categorical Timeline panels.

## 5. `resultLimit` is hard truncation, not top-N

It picks the first N rows in source order. If you want top-N by time
or severity, sort in SPL first:

```spl
| sort -severity | head 50
```

…then let the timeline render the 50 largest.

## 6. `duration` of 0 forces a circle

Useful when you have a duration column but specific events are
instantaneous. Mix freely with non-zero durations in the same data
source.

## 7. `legendDisplay` default is `"off"`

Most other charts default to a visible legend; timeline doesn't. Set
it explicitly when you want the legend.

## 8. Dense events cluster but stay interactive

The viz handles 40+ events on a single lane reasonably well, but
readability degrades fast. Prefer:

- `splunk.column` when counts matter.
- Splitting lanes more aggressively.

## 9. No `dataValuesDisplay`, `yAxis*`, or annotation support

Timeline is intentionally simple. For richer features use
`splunk.line` with timestamps on the x-axis.

## 10. `dataColorConfig` uses `to` exclusive, `from` inclusive

Same semantics as `singlevalue` thresholds. Top-down evaluation. Use
disjoint, gap-free buckets to avoid silent boundary bugs:

```json
// ✅ disjoint, gap-free
[{ "to": 60 }, { "from": 60, "to": 80 }, { "from": 80 }]
```

## 11. Timeline is documented at help.splunk.com, NOT in the 10.4 PDF

If you grep the 10.4 PDF for timeline options, you won't find them.
The current canonical reference is the 10.3.2512 page at help.splunk.com.

## 12. `_time` is mandatory

Without `_time`, the timeline has no x-axis source. Always include it
in the SPL output, even synthetic.
