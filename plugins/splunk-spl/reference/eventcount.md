# eventcount — return event count per index

Source: Splunk Search Reference 10.2.0

## Syntax

    | eventcount
      [index=<string>]...
      [summarize=<bool>]
      [report_size=<bool>]
      [list_federated_remote=<bool>]
      [list_vix=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `index` | No | default index | Index name or wildcard pattern. Repeat to include multiple indexes, e.g. `index=* index=_*` |
| `summarize` | No | `true` | If `false`, splits counts by index and also returns `provider` and `server` columns |
| `report_size` | No | `false` | If `true`, adds an index size column in bytes |
| `list_federated_remote` | No | `false` | If `true` with `summarize=false`, returns counts from federated remote deployments |
| `list_vix` | No | `true` | If `false`, excludes virtual indexes from results |

## Usage

`eventcount` is a report-generating command and must be the first command in a search (leading `|`). Time range pickers have **no effect** — all events across all time are counted regardless of the selected time window.

## Examples

### Count all events across every index

    | eventcount summarize=false index=* index=_*

### Count events in specific indexes only

    | eventcount summarize=false index=main index=security index=audit

### Report index sizes alongside event counts

    | eventcount summarize=false report_size=true
    | eval size_mb = round(sizeOnDiskMB, 2)
    | sort - count

### Quick total across all indexes

    | eventcount
    | rename count AS total_events

## Gotchas

- **Time range is ignored** — the time range picker and `earliest`/`latest` modifiers do not filter results. `eventcount` always reports the total across all stored data.
- **Default index only when no `index=` is specified** — without an explicit `index=` argument, the command returns counts for the default index, not all indexes. Use `index=* index=_*` to include internal indexes.
- **Cannot exclude indexes** — `index!=foo` is not valid syntax. There is no mechanism to exclude specific indexes from results.
- **Summarize=true hides per-index detail** — with the default `summarize=true`, you get a single aggregate count. Set `summarize=false` to see per-index breakdown.

## See also

- `metadata.md` — richer metadata including `sourcetype`, `source`, `host`, first/last event times
- `dbinspect.md` — bucket-level storage detail
- `tstats.md` — fast indexed-field queries that also work without a time range constraint
