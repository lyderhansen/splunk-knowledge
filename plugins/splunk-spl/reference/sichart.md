# sichart — summary-indexing version of chart

Source: Splunk Search Reference 10.2.0

## Syntax

    | sichart
        [sep=<string>]
        [format=<string>]
        [cont=<bool>]
        [limit=<int>]
        [agg=<stats-agg-term>]
        (<stats-agg-term> | <sparkline-agg-term> | "("<eval-expression>")")...
        [BY <field> [<bins-options>] [<split-by-clause>]]
        | [OVER <field> [<bins-options>] [BY <split-by-clause>]]

Syntax is identical to `chart`. See `chart.md` for full parameter descriptions.

## Description

`sichart` is the summary-indexing version of `chart`. Use it in scheduled searches to populate a summary index with pre-aggregated chart statistics. Report against the summary index later with the regular `chart` command using the **exact same search string**, substituting `chart` for `sichart`.

**Use in scheduled searches for summary indexing** — this command is not useful in ad hoc searches.

## Examples

### Populate a summary index with avg(foo) by bar

    ... | sichart avg(foo) by bar | collect index=mysummary

### Report against the summary index later

    index=mysummary | chart avg(foo) by bar

### Scheduled search: chart error rates by host over time

    index=web sourcetype=access_combined
    | sichart count(eval(status>=500)) AS errors by host
    | collect index=summary_web

## Gotchas

- **Use si* vs standard**: use `sichart` only in scheduled searches writing to a summary index. For normal searches, use `chart` directly — `sichart` output is not human-readable visualization data.
- **Exact same search string required** — the reporting search (`chart ...`) must use the identical aggregation expression as the `sichart` population search, or the results will be incorrect.
- **`collect` must follow** — `sichart` alone does not write to the summary index. You must pipe its output to `| collect index=<name>`.

## Tips

- Prefer `sichart` over post-processing raw events in dashboards — summary-indexed charts load in milliseconds versus seconds or minutes for raw searches.
- Pair with `| overlap` to periodically verify there are no gaps or duplicates in the summary index.

## See also

- `chart.md` — the standard version; full parameter reference
- `sistats.md`, `sitimechart.md`, `sitop.md`, `sirare.md` — other si* commands
- `overlap.md` — audit summary index coverage
- `collect.md` — write si* results to a summary index
