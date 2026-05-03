# localize — identify contiguous time regions containing events

Source: Splunk Search Reference 10.2.0.

## Syntax

    | localize [maxpause=<timespan>] [timeafter=<timespan>] [timebefore=<timespan>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `maxpause` | No | `1m` | Maximum gap between consecutive events before starting a new region |
| `timeafter` | No | `30s` | Expand each region's end time forward by this amount |
| `timebefore` | No | `30s` | Expand each region's start time backward by this amount |

## Output fields

Each output event represents one contiguous time region:

| Field | Description |
|---|---|
| `starttime` | Epoch start of the region (after `timebefore` expansion) |
| `endtime` | Epoch end of the region (after `timeafter` expansion) |
| `eventcount` | Number of events in the region |
| `duration` | Region duration in seconds |
| `density` | Events per second within the region |

## Usage

- `localize` is designed to be chained with `map` — each region is fed as a separate sub-search using `$starttime$` and `$endtime$` tokens.
- Regions are returned in descending time order (most recent first) for historical searches.
- Overlapping regions can result if `timeafter` or `timebefore` are larger than `maxpause`.

## Examples

### Find time regions with errors, then drill into each

    index=main error
    | localize maxpause=5m
    | map search="search failure starttimeu=$starttime$ endtimeu=$endtime$"

### Find transaction regions

    error | localize
    | map search="search starttimeu=$starttime$ endtimeu=$endtime$
        | transaction uid,qid maxspan=1h"

### Compute window size for each region

    index=syslog error
    | localize maxpause=30m
    | eval window_minutes = round(duration / 60, 1)
    | table starttime, endtime, eventcount, window_minutes

## Gotchas

- **Output is region metadata, not original events** — the incoming events are consumed; only region rows are returned.
- **Designed for `map` chaining** — using `localize` without `map` is possible but unusual; you get region metadata only.
- **Overlapping regions** — if `timebefore` or `timeafter` are larger than `maxpause`, adjacent regions will overlap, causing `map` to re-process some events multiple times.
- **Real-time search uses arrival order** — for real-time searches the ordering is data-arrival order, not time order.

## See also

- `map.md` — iterate over localize output to run per-region searches
- `transaction.md` — group related events into transactions by field values
