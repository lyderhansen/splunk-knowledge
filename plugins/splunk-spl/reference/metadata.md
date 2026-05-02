# metadata — return index metadata

Source: Splunk Search Reference 8.2.12, page 402.

## Syntax

    | metadata type=<sources|sourcetypes|hosts> [index=<string>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| type | yes | — | `sources`, `sourcetypes`, or `hosts` |
| index | no | all | Specific index to query |

## Examples

```spl
| metadata type=sourcetypes index=main
| sort -totalCount
| head 20
```

## Gotchas

- **Fast but approximate:** Reads metadata, not events. Counts may not be exact for very recent data.

## See also

- `dbinspect.md` — detailed index info
- `eventcount.md` — event counts only
- `walklex.md` — indexed terms
