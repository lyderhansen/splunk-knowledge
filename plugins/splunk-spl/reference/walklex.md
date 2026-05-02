# walklex — list indexed terms from tsidx

Source: Splunk Search Reference 8.2.12, page 642.

## Syntax

    | walklex index=<string> type=<field|term> [prefix=<string>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| index | yes | — | Index to inspect |
| type | yes | — | `field` (indexed fields) or `term` (indexed values) |
| prefix | no | — | Filter to terms starting with this prefix |

## Examples

```spl
| walklex index=main type=field | stats count
```

## See also

- `metadata.md` — higher-level metadata
- `tstats.md` — search indexed fields
