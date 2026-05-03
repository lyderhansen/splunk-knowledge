# metadata — return index metadata

Source: Splunk Search Reference 10.2.0

## Syntax

    | metadata type=<hosts|sources|sourcetypes>
               [index=<wc-string>]...
               [splunk_server=<wc-string>]
               [splunk_server_group=<wc-string>]...
               [datatype=metric|event]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `type` | yes | — | One of `hosts`, `sources`, or `sourcetypes` |
| `index` | no | main | Index to query; supports wildcards; repeatable (e.g., `index=cs* index=na*`) |
| `splunk_server` | no | all peers | Distributed search peer to query (Splunk Enterprise only; omit on Cloud) |
| `splunk_server_group` | no | all groups | Limit to a named server group; supports wildcards (Enterprise only) |
| `datatype` | no | both | `metric` or `event` to restrict to a specific index type |

## Output fields

| Field | Description |
|---|---|
| `firstTime` | Timestamp of the first event seen for this value |
| `lastTime` | Timestamp of the most recent event seen |
| `recentTime` | Index-time of the last update to this value's entry |
| `totalCount` | Total number of events seen |
| `type` | The metadata type queried (`hosts`, `sources`, or `sourcetypes`) |
| (type column) | The actual value — e.g., a `host` name, `source` path, or `sourcetype` string |

## Examples

### List all sourcetypes in an index

```spl
| metadata type=sourcetypes index=main
| sort -totalCount
| head 20
```

### Find recently active hosts across multiple regional indexes

```spl
| metadata type=hosts index=cs* index=na* index=ap* index=eu*
| sort -recentTime
| head 50
```

### Find metric index sources

```spl
| metadata type=sources index=mymetrics datatype=metric
| sort -totalCount
```

### Identify stale sources (no data in 30 days)

```spl
| metadata type=sources index=main
| eval days_since = (now() - lastTime) / 86400
| where days_since > 30
| sort -days_since
| table source, lastTime, totalCount, days_since
```

## Gotchas

- **Counts are approximate for recent data** — metadata is stored as bucket-level aggregates. A bucket
  that spans a time boundary may be included or excluded based on whether any part of it falls in the
  selected time range, not event-by-event.
- **Default index is main only** — without `index=*`, only the `main` index is queried. Add `index=*` to
  scan all non-internal indexes, or `index=_*` for internal indexes.
- **Time range uses the Time Range Picker** — you cannot use `earliest=` / `latest=` modifiers in the
  search string itself; set the time range in the UI or via the search API.
- **Default result cap of 10,000 rows** — controlled by `maxresultrows` in the `[metadata]` stanza of
  `limits.conf`. Querying `type=sources` on a large environment may hit this limit.
- **Real-time searches are dangerous** — running `| metadata` in a real-time search that returns many
  results can quickly exhaust available memory on the search head.

## Tips

- Use `convert ctime(firstTime) AS first, ctime(lastTime) AS last` to render timestamps as human-readable
  strings.
- For quick source inventory checks in dashboards, pair with `timechart` using `lastTime` as the axis.

## See also

- `dbinspect.md` — detailed bucket-level index information
- `eventcount.md` — simple event counts per index
- `walklex.md` — enumerate indexed lexicon terms
