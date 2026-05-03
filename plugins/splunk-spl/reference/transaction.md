# transaction — group events into transactions

Source: Splunk Search Reference 10.2.0

## Syntax

    | transaction [<field-list>] [name=<transaction-name>]
                  [maxspan=<timespan>] [maxpause=<timespan>] [maxevents=<int>]
                  [startswith=<filter-string>] [endswith=<filter-string>]
                  [connected=<bool>] [keeporphans=<bool>] [keepevicted=<bool>]
                  [mvlist=<bool>] [mvraw=<bool>] [delim=<string>]

Events are processed in reverse chronological order internally. The resulting
transaction events expose `duration` (seconds between first and last event) and
`eventcount` (number of events grouped).

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field-list` | No | — | Fields that define a transaction; events with matching values are grouped |
| `name` | No | — | Reference a pre-defined stanza in `transactiontypes.conf` |
| `maxspan` | No | -1 (unlimited) | Max total duration (seconds, minutes, hours, days) of a transaction |
| `maxpause` | No | -1 (unlimited) | Max allowed gap between consecutive events |
| `maxevents` | No | 1000 | Max events per transaction |
| `startswith` | No | — | Search or `eval()` expression that opens a new transaction |
| `endswith` | No | — | Search or `eval()` expression that closes a transaction |
| `connected` | No | true | If `false`, events without matching fields still join the open transaction |
| `keeporphans` | No | false | Keep events not part of any transaction; tagged with `_txn_orphan=1` |
| `keepevicted` | No | false | Output evicted (LRU-flushed) transactions; tagged with `closed_txn=0` |
| `mvlist` | No | false | When `true`, field values within a transaction are stored as multivalue lists |
| `delim` | No | ` ` (space) | Delimiter between field values in multivalue rendering |

## Examples

### Group by session ID with time constraints

```spl
index=web sourcetype=access_combined
| transaction session_id maxspan=1h maxpause=5m
| table session_id, duration, eventcount
```

### Start/end pattern (login/logout)

```spl
index=auth sourcetype=syslog
| transaction user startswith="action=login" endswith="action=logout" maxspan=8h
| eval duration_min = round(duration/60, 1)
| table user, duration_min, eventcount
```

### Preferred stats alternative for most cases

```spl
index=web sourcetype=access_combined
| stats min(_time) AS start, max(_time) AS end,
        count AS eventcount,
        values(uri_path) AS pages
    by session_id
| eval duration = end - start
```

## Gotchas

- **Slow and memory-intensive — 10–100x slower than `stats`:** `transaction` loads all
  matching events into memory on the search head and groups them there. For high-volume
  searches this is significantly more expensive than equivalent `stats` alternatives.
  This is trap #18 in the Splunk performance anti-patterns list.

- **`maxspan`/`maxpause` require sorted input:** The docs note that events must be in
  descending chronological order for time constraints to work correctly. Always ensure
  events arrive in order or add `| sort -_time` before `transaction` when using these
  options.

- **`maxevents=1000` (default) silently truncates:** Transactions with more than 1,000
  events are closed after hitting the limit, even if no other constraint is met. Raise
  `maxevents` explicitly for session-heavy data.

- **`connected=true` (default) can miss events:** If an event arrives that shares the
  grouping field but none of the field values match an open transaction, it opens a
  NEW transaction rather than being appended. Understand your data's key field
  cardinality before relying on `connected=true`.

- **`duration` is zero for single-event transactions:** When only one event matches a
  group, `duration=0`. This is expected but can skew aggregations on the `duration`
  field.

- **Raw event text is concatenated:** The `_raw` field of the output transaction event
  is the raw text of all member events concatenated together. This can create very long
  `_raw` values that slow display and further processing.

## When to use `transaction` vs. `stats`

Use `transaction` only when you specifically need:
- `maxpause` (gap-based grouping that stats cannot express)
- `startswith`/`endswith` pattern-based transaction boundaries
- Access to individual raw events within each group

Otherwise use the `stats` pattern — it is dramatically faster.

## See also

- `stats.md` — faster alternative for session/group aggregation
- `concurrency.md` — find concurrent overlapping events
- `searchtxn.md` — apply pre-defined transaction types from configuration
