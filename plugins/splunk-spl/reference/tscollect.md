# tscollect — write results to tsidx for tstats

Source: Splunk Search Reference 8.2.12, page 613.

## Syntax

    | tscollect [namespace=<string>] [squashcase=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| namespace | no | — | Namespace for the tsidx files |
| squashcase | no | false | If true, lowercase all field names |

## Examples

```spl
index=main | stats count by src, dest, action | tscollect namespace=my_summary
```

Later search with tstats:
```spl
| tstats count FROM sid=my_summary by src
```

## See also

- `tstats.md` — search tsidx files
- `collect.md` — write to summary index (different mechanism)
