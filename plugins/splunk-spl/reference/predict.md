# predict — predict future values from time series

Source: Splunk Search Reference 10.2.0

## Syntax

    | predict <field>... [AS <newfield>]
              [algorithm=LL|LLT|LLP|LLP5|LLB|BiLL]
              [future_timespan=<num>]
              [holdback=<num>]
              [period=<num>]
              [correlate=<field>]
              [suppress=<field>]
              [upper<int>=<field>]
              [lower<int>=<field>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field` | yes | — | One or more numeric fields from a `timechart` to predict |
| `AS <newfield>` | no | — | Rename the predicted output field; specify once per field |
| `algorithm` | no | LLP5 | Forecasting algorithm (see table below) |
| `future_timespan` | no | 5 | Number of future time-steps to forecast |
| `holdback` | no | 0 | Number of trailing data points to withhold for validation |
| `period` | no | auto | Seasonality period in data points (e.g., `7` for weekly data with daily span) |
| `correlate` | no | — | Second time series for bivariate algorithms (`LLB` only; required for LLB) |
| `suppress` | no | — | Hide one predicted field from output (for multivariate searches) |
| `upper<int>` | no | `upper95(...)` | Field name for the upper confidence bound at `<int>`% confidence |
| `lower<int>` | no | `lower95(...)` | Field name for the lower confidence bound at `<int>`% confidence |

## Algorithms

| Algorithm | Type | Description |
|---|---|---|
| `LL` | Univariate | Local level — no trend, no seasonality. Min 2 data points. |
| `LLT` | Univariate | Local level + trend. No seasonality. Min 3 data points. |
| `LLP` | Univariate | Local level + seasonality. Requires `period` or enough data to auto-detect. |
| `LLP5` | Univariate | Weighted average of LLT and LLP — best general-purpose default. |
| `LLB` | Bivariate | Uses a second time series to predict the first (requires `correlate=`). |
| `BiLL` | Bivariate | Predicts both time series simultaneously using their covariance. |

## Usage

`predict` must be preceded by `timechart`. It requires time-series data. Do not use `cont=false` with
the preceding `timechart` — that removes missing-value rows, which distorts periodicity detection.
The span unit for `timechart` must be seconds or higher; subsecond spans are not supported.

Output adds `prediction(<field>)`, `upper95(prediction(<field>))`, and `lower95(prediction(<field>))`
columns by default.

## Examples

### Forecast daily web access for the next 7 days

```spl
sourcetype=access_combined_* | timechart span=1d count(file) AS count
| predict count future_timespan=7
```

### Validate model accuracy with holdback

```spl
index=main | timechart span=1h count
| predict count future_timespan=10 holdback=10
```

### Weekly seasonal forecast with explicit period

```spl
index=sales | timechart span=1d sum(revenue) AS revenue
| predict revenue algorithm=LLP period=7 future_timespan=14
    upper90=upper lower90=lower
```

## Gotchas

- **Must follow `timechart`** — `predict` requires a regular time series. Piping from `stats` or `chart`
  will produce an error or meaningless output.
- **Default `algorithm=LLP5`, not `LLP`** — in 10.x the default changed from `LLP` to `LLP5`. Existing
  searches that relied on the old default may produce different results.
- **`maxsearches=0` does NOT disable `map` limit** (unrelated to predict, but a common confusion when
  building forecast pipelines with `map`).
- **`cont=false` breaks periodicity** — do not set `cont=false` on the upstream `timechart`; missing time
  buckets must be present (with null values) for the Kalman filter to work correctly.
- **LLP errors if data is not periodic** — `LLP` returns an error when no periodicity is detected.
  Use `LLP5` (the default) for resilience, or specify `period=` explicitly.
- **Confidence intervals are probabilistic, not guaranteed** — roughly 5% of actual values are expected to
  fall outside the 95% confidence band by definition.

## Tips

- Use `holdback=N future_timespan=N` to back-test the model against the last N known data points.
- Visualize with a line chart showing the actual field, `prediction(...)`, `upper95(...)`, and `lower95(...)`
  as separate series for a clear confidence-band view.

## See also

- `trendline.md` — simple moving averages (simpler than `predict` for trend lines)
- `x11.md` — seasonal decomposition of time series
