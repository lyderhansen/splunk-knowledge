# eventstats — add aggregated statistics to each event without collapsing results

Source: Splunk Search Reference 8.2.12, page 291.

## Syntax

    | eventstats [allnum=<bool>] <stats-func>(<field>) [AS <alias>]... [BY <field-list>]

The aggregation is computed over all events (or per BY group) and the result is added as a new
field to every event. The original events and all their original fields are preserved.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `stats-func(field)` | Yes | — | One or more aggregation functions (same set as `stats`) |
| `AS alias` | No | function expression | Rename the output field |
| `BY field-list` | No | (none) | Compute the aggregate per group; each event gets the aggregate for its own group |
| `allnum` | No | false | If true, compute numeric stats only when ALL values in the group are numeric |

## Examples

### Flag events slower than the group average

    index=web sourcetype=access_combined
    | eventstats avg(bytes) AS avg_bytes by host
    | eval slow = if(bytes > avg_bytes * 2, "yes", "no")

### Compute a percentage share per event

    index=orders sourcetype=order_complete
    | eventstats sum(order_total) AS total_revenue by region
    | eval pct_share = round(order_total / total_revenue * 100, 1)

### Dashboard-specific pattern: outlier detection

Attach group-level statistics to raw events so a downstream `where` can filter anomalies
without losing context fields:

    index=web sourcetype=access_combined
    | eventstats avg(response_time) AS avg_rt,
                 stdev(response_time) AS stdev_rt
               by host
    | eval zscore = round((response_time - avg_rt) / stdev_rt, 2)
    | where abs(zscore) > 3
    | table _time, host, response_time, avg_rt, zscore

## Gotchas

- **`eventstats` is a dataset processing command** — it requires the full result set before
  it can compute aggregates, so it runs on the search head. Avoid placing it early in a
  pipeline with a large event count; filter first, then call `eventstats`.

- **Only one BY clause per `eventstats` call** — chain multiple `eventstats` calls if you
  need aggregates at different grouping levels (e.g., per host and per overall).

- **`allnum=true` silently skips mixed-type groups** — if a group contains any non-numeric
  value in the target field, the aggregate is NULL for every event in that group.
  Default `allnum=false` performs numeric aggregation on numeric values and ignores strings.

## See also

- `stats.md` — like eventstats but collapses events into summary rows
- `streamstats.md` — running/window aggregates that process events in order
- `timechart.md` — time-bucketed aggregation
