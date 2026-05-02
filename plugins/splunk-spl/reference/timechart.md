# timechart — time-series aggregation with _time as the X-axis

Source: Splunk Search Reference 8.2.12, page 568.

## Syntax

    | timechart [span=<span-length>] [bins=<int>]
                [limit=<int>] [useother=<bool>] [usenull=<bool>]
                [cont=<bool>] [partial=<bool>]
                <stats-func>(<field>) [AS <alias>]...
                [BY <split-by-field>]

`timechart` is a transforming command. `_time` is always the X-axis. Each row in the output
represents one time bucket. An optional `BY` field splits the results into multiple series
(columns).

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `stats-func(field)` | Yes | — | One aggregation function per series |
| `BY field` | No | (none) | Split results into one series per distinct field value |
| `span=<span-length>` | No | auto | Size of each time bucket; e.g. `1h`, `5m`, `1d`, `1mon` |
| `bins=<int>` | No | 100 | Max number of bins; ignored if `span` is specified |
| `limit=<int>` | No | top10 | Max distinct BY-field values to show; `limit=0` for all |
| `useother=<bool>` | No | true | Merge non-shown series into an "OTHER" series |
| `usenull=<bool>` | No | true | Include events missing the BY field as a "NULL" series |
| `cont=<bool>` | No | true | Fill time gaps (true) or skip empty buckets (false) |
| `partial=<bool>` | No | true | Retain partial bins at the start and end of the time range |

## Span units

| Unit | Valid syntax |
|---|---|
| Seconds | `s`, `sec`, `secs`, `second`, `seconds` |
| Minutes | `m`, `min`, `mins`, `minute`, `minutes` |
| Hours | `h`, `hr`, `hrs`, `hour`, `hours` |
| Days | `d`, `day`, `days` |
| Weeks | `w`, `week`, `weeks` |
| Months | `mon`, `month`, `months` |
| Quarters | `q`, `qtr`, `quarter` |

## Examples

### Event count by sourcetype over time

    index=web sourcetype=access_combined
    | timechart span=1h count by sourcetype limit=10 useother=f

### p95 response time per host

    index=web sourcetype=access_combined
    | timechart span=5m perc95(response_time) AS p95_rt by host

### Dashboard-specific pattern: single-series KPI trend

Feed a line/area chart for a single numeric metric:

    index=orders sourcetype=order_complete
    | timechart span=1d sum(order_total) AS daily_revenue

## Gotchas

- **`limit` and the "OTHER" series** — by default `timechart` shows only the top 10
  series by area under the curve and groups the rest into "OTHER". Use `limit=0` to
  show all series and `useother=f` to suppress the OTHER bucket entirely.

- **Do not use `span=86400s` or `span=1440m` for daily bins** — these do not align to
  midnight in the user's timezone. Use `span=1d` which snaps to day boundaries.

- **`bins` and `span` are mutually exclusive** — if both are specified, `span` wins and
  `bins` is ignored.

- **Field names starting with `_` get prefixed with `VALUE_`** — when a BY clause produces
  a column whose name begins with an underscore (e.g. splitting by `index`), Splunk prepends
  `VALUE_` to distinguish it from internal fields.

## See also

- `stats.md` — aggregation without a time axis
- `chart.md` — aggregation with an arbitrary X-axis field
- `eventstats.md` — adds time-series context back to raw events
