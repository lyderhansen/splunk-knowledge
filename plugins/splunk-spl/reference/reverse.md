# reverse — reverse the order of search results

Source: Splunk Search Reference 8.2.12, page 480.

## Syntax

    | reverse

## Parameters

No parameters. `reverse` takes no arguments.

`reverse` flips the order of the current result set end-to-end. The last event becomes the first, and the first becomes the last. It does not re-sort by any field value — it simply inverts the current sequence.

## Examples

### Basic: flip chronological order

    index=app sourcetype=app_logs
    | sort 0 _time
    | reverse

Equivalent to `| sort 0 -_time` on the full result, but avoids a second sort pass when the data is already sorted.

### Convert tail output to read top-to-bottom

    index=security
    | stats count by src_ip
    | sort 0 count
    | tail 10
    | reverse

Returns the 10 lowest-count IPs displayed from lowest to highest (ascending) rather than reversed.

### Flip a pre-sorted table for display

    index=inventory
    | stats latest(_time) AS last_seen by host
    | sort 0 last_seen
    | reverse
    | head 20

## Gotchas

- **`reverse` only inverts the existing order** — it does not sort by any field. If the input order is non-deterministic (e.g. raw events from a distributed search), the reversed output is equally non-deterministic. Always `sort` before `reverse` if order matters.

- **Not a substitute for `sort -field`** — `| sort 0 -count` and `| sort 0 count | reverse` are functionally identical but `| sort 0 -count` is cleaner and more explicit. Use `reverse` primarily when you already have a sorted result and want to invert it without re-stating the sort criteria.

- **Memory** — like `sort`, `reverse` holds the full result set on the search head. On very large result sets, prefer `sort 0 +field` or `sort 0 -field` directly.

## See also

- `sort.md` — order events by one or more fields; use instead of `reverse` on unsorted data
- `head.md` — take first N events; combine with `reverse` to simulate `tail`
- `tail.md` — take last N events directly
