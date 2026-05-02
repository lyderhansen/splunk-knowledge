# localize — return time ranges where results were found

Source: Splunk Search Reference 8.2.12, page 376.

## Syntax

    | localize [maxpause=<timespan>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| maxpause | no | — | Max gap between events before starting a new time range |

## Examples

```spl
index=main sourcetype=syslog error | localize maxpause=30m
```

## See also

- `transaction.md` — group events by field values
