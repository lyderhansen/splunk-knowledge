# multisearch — run multiple streaming searches simultaneously

Source: Splunk Search Reference 10.2.0

## Syntax

    | multisearch <subsearch1> <subsearch2> [<subsearch3>]...

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `subsearch` | Yes (min 2) | — | Streaming searches enclosed in square brackets. Requires `search` keyword inside. |

## Usage

`multisearch` is an event-generating command and must start with a leading pipe. It runs each
subsearch in parallel on indexers, then interleaves (merges) the events into a single stream.
Only **streaming** commands are allowed inside each subsearch: `search`, `eval`, `where`,
`fields`, `rex`, etc. Transforming commands (`stats`, `chart`) are not permitted inside.

Subsearch events are not subject to the normal subsearch result-count limits because the
results are streamed, not buffered first.

**Peer exclusion does not work with multisearch.** The command always connects to all indexers.
Use `append` with `| noop search_optimization=false` if you need to exclude a peer.

## Examples

### Merge events from two indexes

    | multisearch
        [search index=web_logs sourcetype=access_combined]
        [search index=security sourcetype=firewall]
    | stats count by sourcetype, host

### Add distinguishing fields per subsearch

    | multisearch
        [search index=a | eval src_index="a"]
        [search index=b | eval src_index="b"]
    | stats count by src_index, host

### Three-way merge with field filtering

    | multisearch
        [search index=main host=web01 | fields _time, host, status]
        [search index=main host=web02 | fields _time, host, status]
        [search index=main host=web03 | fields _time, host, status]
    | stats count by host, status

## Gotchas

- **Streaming commands only** — placing a transforming command (e.g. `stats`) inside a
  subsearch causes the search to fail. Use `union` if you need transformed subsearches.
- **No peer exclusion** — `NOT splunk_server=myServer` inside a multisearch subsearch is
  silently ignored. All peers are queried regardless.
- **No subsearch row limit** — unlike `[search ...]` subsearches used inline, `multisearch`
  streams results and is not capped at `maxout` rows. Large result sets are possible.
- **Field collisions** — if subsearches emit the same field names with different meanings,
  events are interleaved without warning. Use `eval` to add a marker field.
- **Splunk may auto-convert `append`** — the search optimizer can internally rewrite
  `append` as `multisearch`. Add `| noop search_optimization=false` if you need the
  original `append` behavior.

## Tips

- Prefer `multisearch` over `append` for pure merges — it runs subsearches in parallel and is
  faster for large data volumes.
- Use `union` when subsearches need transforming commands or when peer exclusion matters.

## See also

- `union.md` — flexible alternative that supports transforming commands in subsearches
- `append.md` — sequential two-search combine (single subsearch only)
- `join.md` — combine results on a shared key field
