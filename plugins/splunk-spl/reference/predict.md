# predict — predict future values from time series

Source: Splunk Search Reference 8.2.12, page 453.

## Syntax

    | predict <field> [AS <newfield>] [algorithm=<LLP|LLT|LLP5|LL>] [future_timespan=<int>] [holdback=<int>] [period=<int>] [upper<N>=<field>] [lower<N>=<field>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field | yes | — | Field to predict |
| algorithm | no | LLP | Prediction algorithm |
| future_timespan | no | 5 | Number of future data points to predict |
| holdback | no | 0 | Number of recent points to exclude (for validation) |
| period | no | — | Seasonality period |
| upper/lower | no | — | Confidence bound fields (e.g., `upper95`, `lower95`) |

## Examples

```spl
index=main | timechart span=1d count
| predict count AS predicted future_timespan=7 upper95=upper lower95=lower
```

## See also

- `trendline.md` — moving averages
- `x11.md` — seasonal decomposition
