# tail — return the last N events from the pipeline

Source: Splunk Search Reference 8.2.12, page 567.

## Syntax

    | tail [<N>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<N>` | No | 10 | Number of events to return from the bottom of the result set |

`tail` buffers the entire result set and returns the last N events. It is the counterpart to `head`.

## Examples

### Basic: most recent 20 raw events

    index=app sourcetype=app_logs
    | tail 20

### Last N from a sorted table

    index=web sourcetype=access_combined
    | stats count by clientip
    | sort 0 count
    | tail 5

Returns the 5 clients with the lowest event count (bottom 5 after ascending sort).

### Paginate: rows 11-20 via head + tail

    index=web
    | stats count by uri
    | sort 0 -count
    | head 20
    | tail 10

## Gotchas

- **`tail` requires all events in memory** — it is a dataset-processing command that must buffer the full result set on the search head before it can return the last N. For large result sets, use `sort 0 -_time | head N` instead, which is more efficient because it leverages the sort order early.

- **Default is 10** — a bare `| tail` without a number returns only 10 events, same as `head`.

- **`tail` on unsorted data is non-deterministic** — on distributed searches, event order from indexers is not guaranteed. Sort first if the "last" events need to be the chronologically latest.

## See also

- `head.md` — return the first N events; also supports `while` conditional mode
- `sort.md` — order events before slicing with `tail`
- `reverse.md` — flip result order to turn a `tail` into a `head` (or vice versa)
