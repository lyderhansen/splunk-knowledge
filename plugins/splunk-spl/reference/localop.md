# localop — force subsequent commands to run on the search head

Source: Splunk Search Reference 10.2.0

An orchestrating command with no parameters. When inserted into a pipeline, all commands that follow `localop` execute only on the local search head, not on remote indexer peers. Useful for operations that must have access to local files, lookup tables, or knowledge objects that are not replicated to indexers.

## Syntax

    | localop

## Parameters

None.

## What it does

In a distributed Splunk deployment, many streaming and transforming commands are automatically pushed down to run on indexers for performance. `localop` overrides this behavior for everything that follows it in the pipeline, keeping all subsequent processing on the search head. It has no effect in a single-instance deployment.

## Examples

    index=main error | localop | lookup local_asset_lookup ip OUTPUT owner | stats count by owner

    | localop | inputlookup large_reference_table.csv | where region="EMEA"

    index=firewall | stats count by src_ip | localop | sort - count | head 20

## Gotchas

- **Performance penalty**: Pulling raw events to the search head before `localop` defeats the purpose of distributed search. Place event-reducing commands (search terms, `where`, `stats`) before `localop` wherever possible.
- `localop` applies only to the search pipeline on the search head — it does not affect subsearches or append pipelines.
- In non-distributed (single-instance) Splunk, `localop` is a no-op and can be safely removed.
- Cannot be used inside subsearches.

## Tips

`localop` is the right tool when a `lookup` references a CSV file that only exists on the search head, or when a custom search command is installed only locally. Avoid using it to "fix" mysterious distributed-search behavior — first check whether the real issue is a missing knowledge object on indexers.

## See also

- `redistribute.md` — push subsequent commands to indexers (opposite of localop)
- `lookup.md` — field lookup command, often used with localop
