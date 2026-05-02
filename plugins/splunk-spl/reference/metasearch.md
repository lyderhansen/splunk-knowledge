# metasearch — retrieve event metadata without scanning event data

Source: Splunk Search Reference 10.2.0

## Syntax

    | metasearch [<logical-expression>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `logical-expression` | No | all indexes | Boolean expression filtering by index, sourcetype, source, host, or other metadata fields |

The logical expression supports: comparison operators (`=`, `!=`, `<`, `<=`, `>`, `>=`), `NOT`, `OR`, time modifiers (`earliest=`, `latest=`), and standard search modifiers (index, sourcetype, source, host).

## Output fields

`metasearch` returns one row per unique metadata combination with these fields:

| Field | Description |
|---|---|
| `host` | Hostname or IP of the device that generated the events |
| `index` | Index name |
| `source` | Source identifier (filename, input, etc.) |
| `sourcetype` | Data format / source type |
| `splunk_server` | Splunk instance that holds the data |
| `_time` | Timestamp associated with the metadata |

## Usage

`metasearch` is an event-generating command (leading `|`). It reads metadata only — it does **not** return event content or `_raw` fields. Use it to discover which index/sourcetype/source/host combinations exist before writing a full search.

It is far faster than a regular search because it does not scan event data at all.

## Examples

### List all sourcetypes in a specific index

    | metasearch index=main
    | stats count by sourcetype
    | sort - count

### Find which hosts have data in multiple indexes

    | metasearch index=main OR index=security
    | stats dc(index) AS idx_count by host
    | where idx_count > 1

### Verify a specific source exists before running an expensive search

    | metasearch index=firewall sourcetype=palo_alto source="/var/log/firewall.log"
    | stats count by host

### Scoped time window: check for recent data ingestion gaps

    | metasearch index=main earliest=-1h latest=now
    | stats max(_time) AS last_seen by host
    | where last_seen < relative_time(now(), "-30m")

## Gotchas

- **Does not return event data** — `metasearch` returns metadata rows, not raw events. The `_raw` field is not available. Piping `metasearch` results to event-oriented commands like `rex` or `spath` has no useful effect.
- **Results may not reflect real-time ingestion** — metadata is maintained by the indexer and may lag slightly behind actual data availability, especially for very recent events.
- **Limited logical expression syntax** — not all SPL search expressions are valid in `metasearch`. Complex field comparisons that work in `search` may not parse correctly here. Stick to `index=`, `sourcetype=`, `source=`, `host=`, and time modifiers.
- **Not equivalent to `metadata`** — `metadata` provides richer information like `totalCount`, `firstTime`, and `recentTime`. Use `metadata` when you need event counts or time range summaries; use `metasearch` when you need boolean existence checks.

## See also

- `metadata.md` — richer metadata with event counts and first/last event timestamps
- `search.md` — full event search when you need `_raw` data
- `tstats.md` — fast indexed-field queries with statistical aggregation
