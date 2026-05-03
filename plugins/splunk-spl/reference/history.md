# history — return search history for the current app

Source: Splunk Search Reference 10.2.0

## Syntax

    | history [events=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `events` | No | false | When `true`, returns history as raw events (supports field inspection/highlighting). When `false`, returns a structured table. |

## Output fields (when events=false)

| Field | Description |
|---|---|
| `_time` | Time the search was started |
| `search` | The full search string |
| `api_et` | Earliest time of the API call |
| `api_lt` | Latest time of the API call |
| `event_count` | Count of events returned (for retrieving searches) |
| `result_count` | Count of results (for transforming searches) |
| `scan_count` | Number of events scanned at index level |
| `exec_time` | Execution time (seconds, Unix epoch) |
| `is_realtime` | 1 if real-time search, 0 if historical |

## Examples

### List recent searches as a table

    | history | table _time, search, exec_time, result_count

### Find long-running searches

    | history | where exec_time > 60 | table _time, exec_time, search

### Return history as raw events for field inspection

    | history events=true

## Gotchas

- **App-scoped only** — `history` returns the search history for the current application context only. Switching apps changes the results. There is no cross-app history view via this command.
- **Current user only** — by default the command returns only the history for the user running the search, not all users. Use the audit index (`index=_audit`) for cross-user activity reporting.
- **Not a substitute for audit logging** — `history` is a convenience view; it may miss searches that were cancelled before completing. Use `index=_audit action=search` for compliance-grade audit trails.

## Tips

- Pipe `| history` into `| eval search_len = len(search)` to find unusually long or complex queries.
- Use `| history | rex field=search "index=(?<target_index>\w+)"` to see which indexes are most frequently queried.

## See also

- `audit.md` — full audit trail via `index=_audit`
