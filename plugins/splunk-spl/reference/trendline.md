# trendline — compute moving averages

Source: Splunk Search Reference 8.2.12, page 611.

## Syntax

    | trendline <trendtype><period>(<field>) [AS <newfield>]

Where `trendtype` is `sma` (simple), `ema` (exponential), or `wma` (weighted).

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| trendtype | yes | — | `sma`, `ema`, or `wma` |
| period | yes | — | Window size (number of data points) |
| field | yes | — | Field to average |

## Examples

```spl
index=main | timechart span=1h count | trendline sma5(count) AS trend
```

## See also

- `predict.md` — future value prediction
- `streamstats.md` — `window=N avg()` for custom rolling calculations
