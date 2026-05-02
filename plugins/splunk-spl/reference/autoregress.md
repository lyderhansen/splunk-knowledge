# autoregress — create lag fields for autoregression

Source: Splunk Search Reference 8.2.12, page 210.

## Syntax

    | autoregress <field> [p=<int>-<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field | yes | — | Field to create lag values for |
| p | no | 1-1 | Lag range (e.g., `p=1-3` creates field_p1, field_p2, field_p3) |

## Examples

```spl
index=main | timechart span=1h count | autoregress count p=1-3
```

## See also

- `streamstats.md` — `current=f` for previous-value access
- `delta.md` — difference between current and previous
