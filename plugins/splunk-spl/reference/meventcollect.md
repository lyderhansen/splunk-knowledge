# meventcollect — write metric events on indexers

Source: Splunk Search Reference 8.2.12, page 407.

## Syntax

    | meventcollect index=<string> [prefix_field=<field>] [split=<bool>]

Similar to `mcollect` but runs on indexers for better performance with large-scale metric ingestion.

## See also

- `mcollect.md` — search-head-side metric collection
- `mstats.md` — query metric data
