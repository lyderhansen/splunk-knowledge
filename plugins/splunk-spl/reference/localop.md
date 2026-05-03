# localop — force subsequent commands to run on the search head

Source: Splunk Search Reference 10.2.0

An orchestrating command with no parameters. When inserted into a pipeline, all commands that follow `localop` execute only on the local search head, not on remote indexer peers. Useful for operations that must have access to local files, lookup tables, or knowledge objects that are not replicated to indexers.

## Syntax

    | localop

## Parameters

None.

## What it does

In a distributed Splunk deployment, many streaming and transforming commands are automatically pushed down to run on indexers for performance. `localop` overrides this behavior for everything that follows it in the pipeline, keeping all subsequent processing on the search head. It has no effect in a single-instance deployment.

Technically, `localop` forces subsequent commands into the reduce phase of the map-reduce execution model. All partial results from indexer peers are forwarded to the search head before the next command runs.

## Examples

### Lookup that only exists on the search head

```spl
index=main error
| localop
| lookup local_asset_lookup ip OUTPUT owner
| stats count by owner
```

### Force local inputlookup

```spl
| localop
| inputlookup large_reference_table.csv
| where region="EMEA"
```

### Reduce first, then sort locally

```spl
index=firewall
| stats count by src_ip
| localop
| sort - count
| head 20
```

### Force local iplocation

```spl
FOO BAR | localop | iplocation clientip
```

## Gotchas

- **Performance penalty if placed too early** — inserting `localop` before event-reducing commands (search terms, `stats`, `where`) forces all raw events from all indexers to the search head before any reduction. This can saturate the network and overwhelm the search head. Always reduce events first, then use `localop`.
- **Does not affect subsearches** — `localop` applies only to the current pipeline context. Subsearches (inside `[...]`) and `append` pipelines are not affected.
- **No-op in single-instance Splunk** — on a standalone instance there are no indexer peers, so `localop` does nothing. It can safely be left in without side effects.
- **Cannot be used inside subsearches** — placing `localop` inside a subsearch produces an error or is silently ignored depending on version.
- **Not the fix for "distributed search broken"** — if a lookup or command behaves unexpectedly in distributed search, first check whether the knowledge object (lookup file, custom command) is properly replicated or installed on all search peers. Using `localop` as a workaround hides the real problem.

## Tips

`localop` is the right tool when a `lookup` references a CSV file that genuinely only exists on the search head (e.g., a locally managed allowlist), or when a custom search command is installed only on the search head and not on indexers. If the lookup is replicated via a knowledge bundle, `localop` is not needed.

## See also

- `redistribute.md` — push subsequent commands to indexers (opposite of `localop`)
- `lookup.md` — field lookup command, often used with `localop`
