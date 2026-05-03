# msearch — alias for mpreview

Source: Splunk Search Reference 10.2.0

`msearch` is an exact alias for the `mpreview` command. All arguments, options, and behavior are identical. `msearch` exists for backward compatibility; `mpreview` is the canonical name as of Splunk 8.0.

## Syntax

    | mpreview [filter=<string>] [index=<index-name>]... [earliest=<time>] [latest=<time>]
               [target_per_timeseries=<int>] [chunk_size=<int>]

## When to use the alias

Use `mpreview` in all new searches. Encountering `msearch` in legacy saved searches or dashboards is normal — it continues to work unchanged.

## Example

    | msearch index=my_metrics filter="host=webserver1"

is exactly equivalent to:

    | mpreview index=my_metrics filter="host=webserver1"

## See also

- `mpreview.md` — full syntax, parameters, and examples
- `mstats.md` — aggregate metric data efficiently
- `mcatalog.md` — browse metric names and dimensions
