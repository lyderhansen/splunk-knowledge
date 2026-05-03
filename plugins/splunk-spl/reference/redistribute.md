# redistribute — parallel reduce processing on indexers

Source: Splunk Search Reference 10.2.0.

> **CAUTION:** `redistribute` is documented as an internal, unsupported, experimental command. For production use, prefer the `prjob` command which provides equivalent functionality with a simpler interface and automatic placement.

## Syntax

    | redistribute [num_of_reducers=<int>] [BY <field-list>]

Must appear before the first supported non-streaming command in the search.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `num_of_reducers` | No | 50% of indexer pool (max 4) | Number of indexers to repurpose as intermediate reducers |
| `BY field-list` | No | — | Fields to group by; must match the `BY` clause of the downstream aggregation |

## Supported downstream commands

`redistribute` only accelerates streaming commands and these non-streaming commands:
`stats`, `tstats`, `streamstats`, `eventstats`, `sichart`, `sitimechart`, and `transaction` (single-field only).

## Usage

Splunk normally uses a two-phase map-reduce: index → reduce at search head. `redistribute` inserts a third phase where a subset of indexers act as intermediate reducers, reducing load on the search head for high-cardinality aggregations.

- Use only once per search.
- Place immediately before the first high-cardinality non-streaming command.
- Requires distributed search with indexers configured as intermediate reducers.
- Cannot be combined with `prjob` in the same search.

## Examples

### Accelerate a high-cardinality stats

    index=myindex | redistribute BY host
    | stats count, sum(bytes) BY host

### Auto-assign reducers

    index=myindex | redistribute | stats dc(clientip) BY uri_path

### Preferred alternative: prjob

    index=myindex | prjob | stats count BY host

`prjob` automatically determines where to place the redistribute operation.

## Gotchas

- **Unsupported/experimental** — Splunk documentation marks this as internal. It may change or be removed without notice.
- **Requires infrastructure configuration** — indexers must be configured as intermediate reducers in `server.conf`; this does not work out of the box.
- **Only one `redistribute` per search** — adding a second one is silently ignored or causes errors.
- **BY clause must match downstream aggregation** — mismatched BY fields produce incorrect results without warning.
- **Prefer `prjob`** — in 10.2, `prjob` provides the same capability with automatic placement and is officially supported.

## See also

- `localop.md` — force local execution on search head (opposite direction)
- `stats.md` — primary command accelerated by redistribute
