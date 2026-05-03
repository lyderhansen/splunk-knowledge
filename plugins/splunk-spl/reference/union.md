# union — combine multiple datasets

Source: Splunk Search Reference 10.2.0

## Syntax

    | union [maxtime=<int>] [maxout=<int>] [timeout=<int>]
             <dataset> [<dataset>...]

    <dataset>  ::=  <subsearch> | <dataset-type>:<dataset-name>

`union` is a dataset processing command that merges results from two or more
datasets. It automatically interleaves results by `_time` when processing streaming
datasets in parallel. Named datasets use the form `datamodel:`, `savedsearch:`, or
`inputlookup:`.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `dataset` | Yes | — | Two or more subsearches `[...]` or named datasets |
| `maxtime` | No | 60 | Max seconds to run each subsearch before finalizing |
| `maxout` | No | 50000 | Max results per subsearch (sourced from `limits.conf [searchresults] maxresultrows`) |
| `timeout` | No | 300 | Seconds to cache subsearch results |

## Examples

### Combine firewall and auth logs by source IP

```spl
| union
    [search index=network sourcetype=firewall | stats count by src]
    [search index=security sourcetype=auth | stats count by src]
| stats sum(count) AS total by src
```

### Union three indexes with a high row limit

```spl
| union maxout=1000000
    [search index=web_us]
    [search index=web_eu]
    [search index=web_apac]
| stats count by host
```

### Union with named saved search

```spl
| union
    [search index=prod earliest=-1h | stats count by host]
    savedsearch:baseline_host_counts
| stats sum(count) AS total by host
```

### Efficient streaming union (same pipeline syntax)

```spl
index=web
| union
    [search index=mobile]
    [search index=api]
```

## Gotchas

- **Like SQL UNION ALL — no deduplication:** `union` appends all results from all
  datasets without removing duplicates. An event that appears in two subsearches will
  appear twice in the output. Use `| dedup` after `union` if you need unique rows.

- **Per-subsearch `maxout` limit is 50,000 by default:** Each subsearch is independently
  capped at 50,000 results. In a 3-subsearch union with default settings you get at
  most 150,000 rows. Increase `maxout` explicitly for large unions — but be aware of
  memory impact on the search head.

- **Streaming vs. non-streaming subsearches affect where union runs:** If all
  subsearches are distributable streaming, `union` behaves like `multisearch` and runs
  on indexers. If any subsearch contains a centralized streaming command (e.g., `head`,
  `tail`, `sort`), that subsearch is processed on the search head and its `maxout` cap
  of 50,000 applies to the non-streaming portion, potentially truncating results further.

- **Field alignment uses null-fill:** If different subsearches return different fields,
  the combined result set includes all fields. Rows from a subsearch that lacks a field
  receive a null value for it. Downstream commands like `stats` or `table` must account
  for these nulls.

- **Subsearch timeout applies independently:** Each subsearch has its own `maxtime`
  clock (default 60 seconds). If a subsearch exceeds this, it is finalized with partial
  results — no error is raised by default.

## Tips

- When all your datasets are streaming (no `head`, `tail`, or `sort` in subsearches),
  `union` is more efficient than `append` because it runs in parallel on indexers.
- Use `| stats sum(count) AS count by <field>` after `union` to aggregate counts from
  multiple subsearches that each ran `stats count`.

## See also

- `append.md` — simpler two-search combine (sequential, search-head only)
- `multisearch.md` — parallel streaming alternative for streaming datasets
- `set.md` — set operations: `union`, `diff`, `intersect` (with deduplication)
