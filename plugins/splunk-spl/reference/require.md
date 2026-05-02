# require — fail the search if the preceding pipeline returns zero results

Source: Splunk Search Reference 8.2.12, page 474.

## Syntax

    | require

## Parameters

No parameters. `require` takes no arguments.

When `require` is placed in a pipeline, it causes the entire search to fail (return an error) if the commands preceding it returned zero events or results. In a subsearch, it causes the parent search to fail when the subsearch returns no results.

## Examples

### Guard against empty subsearch generating a catch-all filter

Without `require`, an empty subsearch `[search ...]` expands to an empty `OR` clause, which Splunk may interpret as "match everything" — a dangerous false positive:

    index=firewall action=deny
        [search index=watchlist threat_level=high
         | require
         | fields src_ip]

If the watchlist is empty, the outer search fails rather than silently returning all firewall deny events.

### Guard a costly external lookup from running on zero events

    index=orders
    | stats count by order_id
    | require
    | lookup order_enrichment_api.py order_id OUTPUT customer_name, region

### Guard inside a chained pipeline

    index=alerts
    | search severity=critical
    | require
    | sendemail to="soc@example.com" sendresults=true

The email is only sent if there are critical alerts; zero results abort the search before `sendemail` runs.

## Gotchas

- **`require` cannot be used in real-time searches** — it is valid only in historical searches. Using it in a real-time search produces an error at search time.

- **Failing a search is not the same as filtering** — `require` does not filter events; it is an all-or-nothing gate. Either all preceding results continue downstream, or the entire search is aborted. Do not use it as a conditional filter.

- **Subsequent commands do not run on failure** — when `require` aborts, commands after it in the pipeline (lookups, alerts, `sendemail`, custom commands) are skipped. This is the primary use case: preventing side effects from zero-result searches.

## See also

- `search.md` — filter events; does not abort the search on zero results
- `where.md` — filter events with eval expressions
