# audit — return audit trail events

Source: Splunk Search Reference 8.2.12, page 210.

## Syntax

    | audit

Returns events from the local audit index showing search activity.

## Examples

```spl
| audit | stats count by user, action | sort -count
```

## See also

- `history.md` — search history
