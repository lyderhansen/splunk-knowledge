# addinfo — add search metadata fields to every event

Source: Splunk Search Reference 10.2.0.

## Syntax

    | addinfo

No parameters. Adds five metadata fields to each event describing the current search context.

## Fields added

| Field | Description |
|---|---|
| `info_min_time` | Earliest time boundary of the search (epoch) |
| `info_max_time` | Latest time boundary of the search (epoch) |
| `info_sid` | Search ID (SID) of the running search |
| `info_search_time` | Epoch timestamp when the search was dispatched |
| `info_max_results` | Maximum result count configured for the search |

## Usage

- `addinfo` is a distributable streaming command — it runs on indexers alongside the data.
- Primarily used by Summary Indexing to stamp search context onto collected results.
- `info_max_time` is set to `+Infinity` when the time range is "All Time"; avoid comparing against it.

## Examples

### Compute the search window size

    index=main | addinfo
    | eval search_window_hours = round((info_max_time - info_min_time) / 3600, 1)
    | table _time, host, search_window_hours

### Detect hosts that have not sent a heartbeat within the search window

    ... | stats latest(_time) AS latest_time BY host
    | addinfo
    | eval latest_age = info_max_time - latest_time
    | fields - info_*
    | inputlookup append=t expected_hosts
    | fillnull value=9999 latest_age
    | dedup host
    | where latest_age > 42

Hosts with `latest_age > 42` have not sent a heartbeat in the last 42 seconds relative to the end of the search window.

### Tag summary index results with search context

    index=main sourcetype=access_combined
    | stats count BY host
    | addinfo
    | collect index=summary

## Gotchas

- **Do not use with "All Time"** — `info_max_time` is `+Infinity` for all-time searches; arithmetic against it produces `Infinity` or errors. Always specify an explicit time range.
- **`info_min_time` and `info_max_time` are epoch integers** — convert with `strftime` if you need human-readable output: `eval t = strftime(info_min_time, "%Y-%m-%d %H:%M:%S")`.
- **Fields are added to every event** — if you don't need them downstream, clean up with `| fields - info_*` to keep results tidy.
- **Not the same as `now()`** — `info_search_time` is when the search was dispatched, not the current clock time.

## See also

- `search.md` — the search that provides the time context
- `collect.md` — summary indexing using `addinfo` fields
