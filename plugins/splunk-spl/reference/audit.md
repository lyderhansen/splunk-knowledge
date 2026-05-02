# audit — return audit trail events (REMOVED in 10.2)

Source: Splunk Search Reference 8.2.12, page 210.
**Status: Removed in Splunk Enterprise 10.2.** Not present in the 10.2
Search Reference. Use `index=_audit` directly instead.

## Syntax (8.2.12 and earlier)

    | audit

Returned events from the local audit index showing search activity.

## Replacement

```spl
index=_audit | stats count by user, action | sort -count
```

## See also

- `history.md` — search history
