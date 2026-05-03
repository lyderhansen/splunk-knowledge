# audit — return audit trail events (REMOVED in 10.2)

Source: Splunk Search Reference 8.2.12, page 210.
**Status: Removed in Splunk Enterprise 10.2.** Not present in the 10.2 Search Reference.

## What it did (8.2.12 and earlier)

    | audit

Returned events from the local `_audit` index showing search activity, user logins, and configuration changes.

## Replacement pattern

Search the `_audit` index directly. All audit events are still written there; the `audit` command just provided a wrapper.

### Basic audit search

    index=_audit
    | table _time, user, action, search_id, info

### Count audit events by user and action

    index=_audit
    | stats count BY user, action
    | sort -count

### Find searches run in the last 24 hours

    index=_audit earliest=-24h action=search
    | table _time, user, search, total_run_time

### Detect login failures

    index=_audit action=login info=failed
    | stats count BY user, clientip
    | sort -count

## Key `_audit` fields

| Field | Description |
|---|---|
| `user` | Splunk user who performed the action |
| `action` | Type of action: `search`, `login`, `logout`, `edit`, etc. |
| `info` | Outcome: `granted`, `failed`, `completed`, etc. |
| `search_id` | SID of the search that triggered this audit event |
| `total_run_time` | Runtime in seconds (for search actions) |
| `clientip` | Client IP address for login events |

## Gotchas

- **Use `index=_audit` directly** — the `audit` command wrapper is gone in 10.2; all previous `| audit` searches must be rewritten.
- **`_audit` requires `can_use_splunk_internal_indexes` capability** — non-admin users may not see this index without explicit role grants.
- **Audit events are not real-time** — there can be a short delay before audit events appear in `_audit`.

## See also

- `history.md` — search history for the current user
- `search.md` — general search syntax
