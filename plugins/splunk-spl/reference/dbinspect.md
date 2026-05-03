# dbinspect — return index bucket information

Source: Splunk Search Reference 10.2.0

## Syntax

    | dbinspect [index=<wc-string>]...
                [span=<int>[<timescale>]]
                [timeformat=<string>]
                [corruptonly=<bool>]
                [cached=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `index` | no | main | Index to inspect; supports wildcards (`*`); repeatable for multiple indexes |
| `span` | no | — | Time span for bucketing results; omit to get per-bucket detail rows |
| `timeformat` | no | `%m/%d/%Y:%H:%M:%S` | Format for the `modTime` field |
| `corruptonly` | no | false | When true, checks every bucket for corruption and returns only corrupt ones |
| `cached` | no | false (non-SmartStore) / true (SmartStore) | When true, reads statistics from the bucket manifest rather than the bucket itself |

## Fields returned (no span specified)

| Field | Description |
|---|---|
| `bucketId` | `<index>~<id>~<guid>` |
| `endEpoch` | Timestamp of the newest event in the bucket (Unix epoch) |
| `eventCount` | Number of events in the bucket |
| `guId` | GUID of the indexer that hosts the bucket |
| `hostCount` | Number of unique hosts in the bucket |
| `id` | Local bucket ID on the originating indexer |
| `index` | Index name |
| `modTime` | Last modification timestamp (formatted by `timeformat`) |
| `path` | File-system path to the bucket |
| `rawSize` | Raw data size in bytes before compression |
| `sizeOnDiskMB` | Compressed bucket size in MB |
| `sourceCount` | Number of unique sources |
| `sourceTypeCount` | Number of unique sourcetypes |

## Examples

### Summarize event counts and bucket counts for an index

```spl
| dbinspect index=main
| stats sum(eventCount) AS total_events, dc(bucketId) AS buckets
```

### Inspect all non-internal indexes using a wildcard

```spl
| dbinspect index=*
| stats sum(eventCount) AS events, sum(sizeOnDiskMB) AS disk_mb by index
| sort -disk_mb
```

### Detect corrupt buckets (slow — warns before running)

```spl
| dbinspect index=main corruptonly=true
| table bucketId, path, eventCount
```

## Gotchas

- **`corruptonly=true` is slow** — it inspects every bucket individually; the command itself warns that
  "this search might be slow and will take time." Not supported on SmartStore indexes.
- **Cluster peer results** — on an indexer cluster, `dbinspect` returns results from primary buckets and
  replicated copies on peer nodes, so `bucketId` values may appear multiple times.
- **`index=*` includes internal indexes** — to limit to non-internal indexes only, use `index=*` and then
  filter with `| search NOT index=_*`.
- **`span` changes output shape** — when `span` is specified, the output is a time-bucketed summary, not
  the per-bucket detail rows shown above.

## Tips

- Combine with `convert ctime(endEpoch)` to render `endEpoch` as a human-readable timestamp.
- Use `dbinspect` for capacity planning: track `sizeOnDiskMB` per index over time.

## See also

- `metadata.md` — lighter, faster index metadata (sources, hosts, sourcetypes)
- `eventcount.md` — quick event count per index
