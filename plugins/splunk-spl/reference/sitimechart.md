# sitimechart — summary-indexing version of timechart

Source: Splunk Search Reference 10.2.0

## Syntax

    | sitimechart
        [sep=<string>]
        [partial=<bool>]
        [cont=<bool>]
        [limit=<int>]
        [agg=<stats-agg-term>]
        [<bin-options>...]
        <single-agg> [BY <split-by-clause>]
        | <eval-expression> BY <split-by-clause>

Syntax is identical to `timechart`. See `timechart.md` for full parameter descriptions.

## Description

`sitimechart` is the summary-indexing version of `timechart`. Use it in scheduled searches to populate a summary index with pre-aggregated time-series statistics. Report against the summary index later with the regular `timechart` command using the **exact same search string**, substituting `timechart` for `sitimechart`.

**Use in scheduled searches for summary indexing** — not useful in ad hoc searches.

## Examples

### Scheduled: avg CPU by host per hour

    index=os sourcetype=cpu
    | sitimechart avg(cpu_pct) BY host
    | collect index=summary_os

### Report against the summary index

    index=summary_os | timechart avg(cpu_pct) BY host

### Used with prjob for distributed acceleration

    | prjob [search index=myindex
        | eventstats count by user, source
        | where count > 10
        | sitimechart max(count) by source
        | timechart max(count) by source]

## Gotchas

- **Use si* vs standard**: use `sitimechart` only in scheduled searches writing to a summary index. Use `timechart` for immediate results.
- **`collect` must follow** — `sitimechart` alone does not write to the summary index.
- **Exact span matters** — when reporting with `timechart`, use the same `span=` value that was used in `sitimechart` to get correct time bucket alignment.
- **Partial buckets** — if `partial=true` (the default in `timechart`), the most recent incomplete time bucket may appear in summary results. This can cause slightly inflated final-bucket values until the next full run.

## Tips

- `sitimechart` is the recommended approach for high-frequency dashboard timechart panels that cover multi-week or multi-month windows — schedule it to run hourly or daily and report against the summary index.
- Also supported by `prjob` for parallel reduce processing in distributed environments.

## See also

- `timechart.md` — the standard version; full parameter reference
- `sichart.md`, `sistats.md`, `sitop.md`, `sirare.md` — other si* commands
- `collect.md` — write si* results to a summary index
- `overlap.md` — audit summary index coverage
