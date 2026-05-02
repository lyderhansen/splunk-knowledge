# gentimes — generate time-range results

Source: Splunk Search Reference 8.2.12, page 329.

## Syntax

    | gentimes start=<MM/DD/YYYY[:HH:MM:SS]> [end=<MM/DD/YYYY[:HH:MM:SS]>] [increment=<timespan>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| start | yes | — | Start date/time |
| end | no | now | End date/time |
| increment | no | 1d | Time step between events |

## Examples

### Date spine for gap-filling

```spl
| gentimes start=01/01/2026 end=01/31/2026 increment=1d
| eval _time = strttime
| eval date = strftime(_time, "%Y-%m-%d")
```

## Gotchas

- **US date format:** Uses `MM/DD/YYYY`, not ISO 8601. Easy to confuse month/day.
- **Creates `starttime` and `strttime` fields:** Not `_time`. Map manually if needed.

## See also

- `makeresults.md` — generate arbitrary events
- `makecontinuous.md` — fill gaps in existing results
