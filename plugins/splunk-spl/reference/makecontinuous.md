# makecontinuous — fill gaps in a field to make it continuous

Source: Splunk Search Reference 8.2.12, page 384.

## Syntax

    | makecontinuous <field> [span=<timespan>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field | yes | — | Field to make continuous (usually `_time`) |
| span | no | auto | Gap-filling interval |

## Examples

```spl
index=main | timechart span=1h count | makecontinuous _time span=1h
```

## Gotchas

- **Does not fill values:** Only adds missing time buckets — the value fields will be null. Use `fillnull value=0` after to set zero-count buckets.

## See also

- `timechart.md` — usually handles continuity via `cont=true`
- `fillnull.md` — fill null values in added rows
