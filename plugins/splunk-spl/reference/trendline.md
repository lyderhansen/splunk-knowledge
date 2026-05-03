# trendline — compute moving averages

Source: Splunk Search Reference 10.2.0

## Syntax

    | trendline (<trendtype><period>(<field>) [AS <newfield>])...

Multiple trendline calculations can be chained in a single command.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `trendtype` | Yes | — | `sma` (simple), `ema` (exponential), or `wma` (weighted) |
| `period` | Yes | — | Window size: integer between 2 and 10000 |
| `field` | Yes | — | Numeric field to average |
| `AS newfield` | No | `<trendtype><period>(<field>)` | Output field name |

### Trend type formulas

- **SMA** — simple average over the last N values (equal weight)
- **WMA** — weighted average; more recent values weighted higher
- **EMA** — exponential: `EMA(t) = alpha * EMA(t-1) + (1 - alpha) * field(t)` where
  `alpha = 2 / (period + 1)`; reacts faster to recent changes than SMA

## Examples

### Smooth a timechart event count

    index=main | timechart span=1h count
    | trendline sma5(count) AS trend

### Multiple trendlines in one pass

    index=main | timechart span=1h count
    | trendline sma5(count) AS sma5 ema10(count) AS ema10

### Overlay on a monthly bar chart

    index=bar | stats count BY date_month
    | trendline sma2(count) AS trend
    | fields * trend

### Weighted moving average for a latency metric

    index=apm | timechart span=5m avg(latency_ms) AS latency
    | trendline wma7(latency) AS wma_latency

## Gotchas

- **First `period - 1` values are null** — a `sma5` produces no value for the first 4 data
  points. Downstream `eval` or `where` on the trend field must handle null.
- **Inputs must be ordered** — `trendline` assumes rows are in time order (as produced by
  `timechart`). Unsorted input produces meaningless results.
- **Period must be 2–10000** — a period of 1 is invalid. For a no-smoothing passthrough,
  use `eval` to copy the field.
- **EMA is sensitive to the starting value** — the first non-null EMA is just the first
  field value, with no warmup period. Short series may show startup bias.

## Tips

- Use `sma` for simple smoothing where all past values matter equally.
- Use `ema` or `wma` when recent data should outweigh older values (e.g., latency alerts).
- Pair with `timechart` and a line visualization for a trend overlay on time-series panels.

## See also

- `timechart.md` — typical source of the time-ordered input
- `predict.md` — forward-looking value prediction
- `streamstats.md` — `window=N avg()` for rolling calculations with more control
