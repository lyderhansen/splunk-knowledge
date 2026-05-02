# eventcount — return event count per index

Source: Splunk Search Reference 8.2.12, page 288.

## Syntax

    | eventcount [summarize=<bool>] [index=<string>]...

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| summarize | no | true | If false, show per-index counts |
| index | no | all | Specific index(es) to count |

## Examples

```spl
| eventcount summarize=false index=main index=security
```

## See also

- `metadata.md` — richer metadata
- `dbinspect.md` — bucket-level detail
