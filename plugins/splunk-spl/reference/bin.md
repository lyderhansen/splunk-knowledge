# bin — group values into discrete buckets

Source: Splunk Search Reference 8.2.12, page 212. Alias: `bucket`.

## Syntax

    | bin [<bins-options>...] <field> [AS <newfield>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field | yes | — | Field to bucket |
| span | no | auto | Bucket size (e.g., `span=1h`, `span=100`) |
| bins | no | — | Target number of buckets (Splunk picks best span) |
| minspan | no | — | Minimum span when using `bins` |
| start | no | — | Override bucket start value |
| end | no | — | Override bucket end value |
| AS newfield | no | overwrites field | Output field name |

## Examples

### Time bucketing

```spl
index=main | bin span=1h _time | stats count by _time
```

### Numeric bucketing

```spl
index=main | bin span=100 bytes AS byte_range | stats count by byte_range
```

## Gotchas

- **Alias:** `bucket` and `bin` are the same command.
- **Auto-span with bins:** `| bin bins=10 bytes` lets Splunk pick a nice span to produce ~10 buckets. The actual count may differ.

## See also

- `timechart.md` — auto-bins time for charting
- `chart.md` — aggregation with binned axis
