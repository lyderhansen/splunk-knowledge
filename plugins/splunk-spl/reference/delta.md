# delta — compute difference between current and previous values

Source: Splunk Search Reference 8.2.12, page 268.

## Syntax

    | delta <field> [AS <newfield>] [p=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field | yes | — | Numeric field to compute delta for |
| AS newfield | no | overwrites field | Output field name |
| p | no | 1 | Lag distance (p=2 compares with 2 events ago) |

## Examples

```spl
index=main | timechart span=1h count | delta count AS change
```

## See also

- `accum.md` — cumulative sum
- `streamstats.md` — more flexible running calculations
- `autoregress.md` — lag fields
