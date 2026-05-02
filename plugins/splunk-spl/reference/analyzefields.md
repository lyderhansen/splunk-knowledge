# analyzefields — analyze field predictive strength

Source: Splunk Search Reference 8.2.12, page 185.

## Syntax

    | analyzefields classfield=<field>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| classfield | yes | — | Target field to predict |

## Examples

```spl
index=main | analyzefields classfield=action | sort -count
```

## See also

- `fieldsummary.md` — field statistics
- `correlate.md` — field correlation
