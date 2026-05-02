# arules — find association rules between field values

Source: Splunk Search Reference 8.2.12, page 205.

## Syntax

    | arules <field-list> [sup=<float>] [conf=<float>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field-list | yes | — | Comma-separated fields to analyze |
| sup | no | 0.1 | Min support (0-1) |
| conf | no | 0.8 | Min confidence (0-1) |

## Examples

```spl
index=web | arules url, user, action
```

## See also

- `associate.md` — simpler field pair analysis
- `cofilter.md` — co-occurrence filtering
