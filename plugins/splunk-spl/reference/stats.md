# stats — aggregate events into summary statistics

Source: Splunk Search Reference 8.2.12, page 535.

## Syntax

    | stats <stats-func>(<field>) [AS <alias>]... [BY <field-list>]

Multiple aggregation functions can appear in a single `stats` call, separated by commas.
The `BY` clause is optional; omitting it produces a single summary row over all events.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `stats-func(field)` | Yes | — | One or more aggregation functions |
| `AS alias` | No | function expression | Rename the output field |
| `BY field-list` | No | (none) | Group by one or more fields; one row per distinct combination |
| `dedup_splitvals` | No | false | Remove duplicate values in multivalue BY fields |

## Aggregation functions reference

| Function | Returns | Notes |
|---|---|---|
| `count` | Event count | `count(field)` counts non-null only; `count` counts all events |
| `dc(field)` | Distinct count | Approximate for very large datasets; use `estdc()` to reduce memory |
| `avg(field)` | Mean value | |
| `sum(field)` | Sum | |
| `min(field)` | Minimum value | |
| `max(field)` | Maximum value | |
| `median(field)` | Median (50th percentile) | |
| `range(field)` | max - min | |
| `stdev(field)` | Sample standard deviation | |
| `var(field)` | Sample variance | |
| `perc95(field)` | 95th percentile | Also `perc50`, `perc99`, `perc<N>` for any N |
| `exactperc95(field)` | Exact 95th percentile | Higher memory cost than `perc95` |
| `values(field)` | Multivalue: sorted unique values | Deduplicates; can be memory-intensive |
| `list(field)` | Multivalue: all values in order | Keeps duplicates; preserves encounter order |
| `earliest(field)` | Value at earliest `_time` | Time-ordered; prefer over `first()` |
| `latest(field)` | Value at latest `_time` | Time-ordered; prefer over `last()` |
| `first(field)` | First value encountered | NOT time-ordered — arbitrary |
| `last(field)` | Last value encountered | NOT time-ordered — arbitrary |
| `mode(field)` | Most frequent value | |
| `rate(field)` | Per-second rate of change | 10.2+ |
| `rate_avg(field)` | Average rate per second | 10.2+ |
| `rate_sum(field)` | Sum of per-second rates | 10.2+ |
| `earliest_time(field)` | Epoch time of earliest value | Returns epoch, not the value itself |
| `latest_time(field)` | Epoch time of latest value | Returns epoch, not the value itself |
| `per_day(field)` | Rate per day | 10.2+ |
| `per_hour(field)` | Rate per hour | 10.2+ |
| `per_minute(field)` | Rate per minute | 10.2+ |
| `per_second(field)` | Rate per second | 10.2+ |
| `estdc(field)` | Estimated distinct count | Lower memory than `dc()` |
| `estdc_error(field)` | Error bound for `estdc()` | |
| `sumsq(field)` | Sum of squares | |
| `stdevp(field)` | Population standard deviation | vs `stdev` which is sample |
| `varp(field)` | Population variance | vs `var` which is sample |
| `upperperc95(field)` | Upper 95th percentile | Also `upperperc<N>` |
| `sparkline(agg, span)` | Inline sparkline for tables | e.g. `sparkline(avg(cpu), 1h)` |

## Examples

### Basic: count events by field

    index=web sourcetype=access_combined
    | stats count by status, host

### Multi-function aggregation

    index=web sourcetype=access_combined
    | stats count,
            dc(clientip)          AS unique_clients,
            avg(bytes)            AS avg_bytes,
            perc95(bytes)         AS p95_bytes,
            sum(bytes)            AS total_bytes,
            earliest(_time)       AS first_seen,
            latest(_time)         AS last_seen,
            values(uri_path)      AS endpoints
        by host

### Conditional count with eval expression

Count only events that match a condition inside `stats`:

    index=web sourcetype=access_combined
    | stats count(eval(status=="404"))   AS error_404,
            count(eval(status=="200"))   AS success,
            count                        AS total
        by host

### Dashboard-specific pattern: KPI single value

Feed a single-value visualization a pre-aggregated number:

    index=orders sourcetype=order_complete
        earliest=-24h@h latest=now
    | stats count AS orders_today,
            sum(order_total) AS revenue_today,
            dc(customer_id)  AS unique_customers
    | eval revenue_fmt = "$" . tostring(round(revenue_today, 2), "commas")

## Gotchas

- **`stats` removes all original fields** — the output contains only the aggregation
  results and the `BY` fields. Every other field from the incoming events is dropped.
  If you need to preserve the original fields and add aggregated columns alongside them,
  use `eventstats` instead.

- **`first()`/`last()` are NOT time-ordered** — they return the first/last value in
  processing order, which is arbitrary and will differ between runs. Always use
  `earliest(field)` and `latest(field)` when you need the chronologically first or last
  value. This is a documented Splunk gotcha (page 539).

- **NULL values in BY fields are silently dropped** — if a `BY` clause field is null
  for an event, that event is excluded from all result groups. It does not appear as a
  row with an empty or "null" label. Use `fillnull value="unknown" <field>` before
  `stats` if you need to count null-group events.

- **Wildcards are not allowed in BY field names** — `| stats count BY source*` is
  invalid syntax. You must name each BY field explicitly.

- **`values()` and `list()` are memory-intensive** — avoid on high-cardinality fields.
  For distinct count only, prefer `dc()` or `estdc()`.

- **`dc()` is approximate** — for large datasets Splunk uses a probabilistic algorithm.
  Use `exactperc` variants when precision matters more than speed.

- **One BY clause per stats** — you can have many aggregation functions but only one
  `BY` clause. If you need different grouping dimensions, chain multiple `stats` calls
  or use `eventstats` with different `BY` fields.

- **Aggregation functions cannot be wrapped in math/eval functions inline** — `| stats
  round(avg(field), 1) AS x` errors with "The argument 'round(avg(field), N)' is invalid".
  `stats` does not allow an aggregation function to be nested inside another function in the
  same clause. Round (or otherwise transform) in a separate `eval` after the `stats`:

  ```spl
  # WRONG
  | stats round(avg(field), 1) AS x
  # RIGHT
  | stats avg(field) AS x | eval x=round(x, 1)
  ```

## See also

- `eventstats.md` — like stats but preserves all original events
- `timechart.md` — stats aggregation bucketed by time
- `chart.md` — stats aggregation with row/column split
