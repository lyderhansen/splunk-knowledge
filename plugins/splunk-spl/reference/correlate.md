# correlate — calculate field correlation matrix

Source: Splunk Search Reference 8.2.12, page 252.

## Syntax

    | correlate [type=<string>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| type | no | inclusion | `inclusion` (co-occurrence) or `change` (value change correlation) |

## Examples

```spl
index=main | fields src, dest, action, user | correlate
```

## See also

- `associate.md` — field-pair association strength
- `contingency.md` — two-field co-occurrence table
