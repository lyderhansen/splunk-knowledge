# mpreview — preview raw metric data points

Source: Splunk Search Reference 8.2.12, page 411.

## Syntax

    | mpreview index=<string> [filter=<expression>]

## Examples

```spl
| mpreview index=my_metrics | head 20
```

## See also

- `mstats.md` — aggregate metric data
- `msearch.md` — alias for mpreview
