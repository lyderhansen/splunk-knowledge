# transaction — group events into transactions

Source: Splunk Search Reference 8.2.12, page 595.

## Syntax

    | transaction <field-list> [maxspan=<timespan>] [maxpause=<timespan>] [startswith=<filter>] [endswith=<filter>] [maxevents=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field-list | no | — | Fields that define the transaction (events with same values are grouped) |
| maxspan | no | -1 (unlimited) | Max total duration of a transaction |
| maxpause | no | -1 (unlimited) | Max gap between events in a transaction |
| startswith | no | — | Filter expression that starts a new transaction |
| endswith | no | — | Filter expression that ends a transaction |
| maxevents | no | 1000 | Max events per transaction |

## Examples

### Group by session ID

```spl
index=main | transaction session_id maxspan=1h maxpause=5m
| table session_id, duration, eventcount
```

### Start/end patterns

```spl
index=main | transaction session_id startswith="action=login" endswith="action=logout"
```

## Gotchas

- **Slow and memory-intensive:** Loads all events into memory. 10-100x slower than `stats` alternative. This is trap #18.
- **Prefer stats pattern:** `| stats min(_time) AS start, max(_time) AS end, count, values(action) AS actions by session_id | eval duration = end - start`
- **Only use when you need:** `maxpause` (gap-based grouping), `startswith`/`endswith`, or access to raw events within each group.
- **Creates `duration` and `eventcount`:** Automatically computed for each transaction.

## See also

- `stats.md` — faster alternative for most transaction use cases
- `searchtxn.md` — search pre-defined transaction types
- `concurrency.md` — find concurrent events
