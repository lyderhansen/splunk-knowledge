# makeresults — generate empty events

Source: Splunk Search Reference 8.2.12, page 388.

## Syntax

    | makeresults [count=<int>] [annotate=<bool>] [splunk_server=<string>] [splunk_server_group=<string>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| count | no | 1 | Number of events to generate |
| annotate | no | false | Add `splunk_server` field to each result |

## Examples

### Mock data for dashboard development

```spl
| makeresults count=10
| eval _time = _time - (random() % 86400)
| eval status = case(random() % 10 < 7, "ok", random() % 10 < 9, "warn", 1==1, "critical")
| eval value = random() % 100
```

### Single-row KPI placeholder

```spl
| makeresults
| eval total_orders = 1234, revenue = 45678.90
```

## Gotchas

- **Only creates `_time`:** Events have only `_time` set to current time. All other fields must be added via `eval`.
- **Generating command:** Must be the first command in the pipeline (or preceded by `|`).

## See also

- `gentimes.md` — generate time-range events
- `inputlookup.md` — load existing data
