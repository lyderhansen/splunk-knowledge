# sistats — summary-indexing version of stats

Source: Splunk Search Reference 10.2.0

## Syntax

    | sistats [allnum=<bool>] [delim=<string>]
        (<stats-agg-term> | <sparkline-agg-term>)
        [BY <field-list>]

Syntax is identical to `stats`. See `stats.md` for full function reference.

## Description

`sistats` is the summary-indexing version of `stats`. Use it in scheduled searches to populate a summary index with pre-aggregated statistics. Report against the summary index later with the regular `stats` command using the **exact same search string**, substituting `stats` for `sistats`.

**Use in scheduled searches for summary indexing** — not useful in ad hoc searches.

## Examples

### Scheduled: aggregate avg delay by date_hour

    ... | sistats avg(*lay) BY date_hour | collect index=mysummary

### Report against the summary index

    index=mysummary | stats avg(*lay) BY date_hour

### Daily count and bytes by host (scheduled)

    index=web sourcetype=access_combined
    | sistats count, sum(bytes) AS total_bytes BY host
    | collect index=summary_web

## Gotchas

- **Use si* vs standard**: use `sistats` only in scheduled searches writing to a summary index. Use `stats` for immediate, ad hoc aggregations.
- **`collect` must follow** — `sistats` alone does not write to the summary index.
- **Implicit wildcard deprecated** — `| sistats avg` (without a field) is treated as `| sistats avg(*)` but this syntax is officially deprecated. Always be explicit: `| sistats avg(*)`.
- **Exact same string when reporting** — the downstream `stats` search must use the identical function and BY clause as the `sistats` population search for correct re-aggregation.
- **Memory settings** — two `limits.conf` settings control the memory/performance trade-off for `sistats` searches; adjust if searches are consistently slow.

## Tips

- Summary-indexed `sistats` dramatically reduces search time for long-horizon reports (e.g. 90-day trend dashboards) by replacing raw event scans with pre-aggregated summary rows.
- The summary index stores intermediate aggregation state, not final values — `stats` re-aggregates correctly across multiple `sistats` summary events.

## See also

- `stats.md` — the standard version; full function reference
- `sichart.md`, `sitimechart.md`, `sitop.md`, `sirare.md` — other si* commands
- `collect.md` — write si* results to a summary index
- `overlap.md` — audit summary index coverage
