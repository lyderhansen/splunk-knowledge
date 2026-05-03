# delete — permanently mark events as deleted

Source: Splunk Search Reference 10.2.0.

## WARNING: IRREVERSIBLE OPERATION

**Deletion cannot be undone.** Events marked as deleted are permanently hidden from all searches. To recover deleted data you must re-index the original data sources. There is no undo.

## Syntax

    <search> | delete

No parameters. Marks every event returned by the preceding search as deleted.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| (none) | — | — | No parameters; operates on all events in the current result set |

## Output fields

The command outputs a summary table, not the deleted events:

| Field | Description |
|---|---|
| `splunk_server` | Indexer or search head that processed the deletion |
| `index` | Index from which events were deleted |
| `deleted` | Count of events marked deleted |
| `errors` | Error count (normally 0) |

## Usage

- Requires the `can_delete` role (the `delete_by_keyword` capability). The admin role does NOT have this by default.
- Always run the search without `| delete` first and verify the event count is exactly what you intend.
- Events are marked deleted but remain on disk until the bucket rolls to frozen. Use the `clean` CLI command to reclaim disk space.
- Cannot be used after centralized streaming commands: `head`, `streamstats`, some modes of `dedup`, and some modes of `cluster`.
- Cannot be used in real-time searches.
- If events have a field literally named `index` (in addition to the default), use `eval index="<index_name>"` before `delete`.

## Examples

### Step 1: verify before deleting

Always check your results first:

    index=insecure | regex _raw = "\d{3}-\d{2}-\d{4}"
    | stats count

### Step 2: delete only after confirmation

    index=insecure | regex _raw = "\d{3}-\d{2}-\d{4}" | delete

### Delete events matching a keyword

    index=imap invalid | delete

## Gotchas

- **No undo** — once marked deleted, data is gone from search. Re-indexing is the only recovery path.
- **Disk space is NOT reclaimed** — `delete` only hides events. Use `splunk clean eventdata` from the CLI to physically remove bucket data.
- **Cannot follow centralized streaming commands** — `index=myindex ... | head 100 | delete` will fail. Remove `head` or any centralized streaming command before piping to `delete`.
- **SPL safeguards trigger** — Splunk Web will warn you that this is a risky command before running it.
- **Role check** — create a dedicated account with `can_delete` role; do not attach it to everyday admin accounts.

## See also

- `search.md` — verify your filter before deleting
- `regex.md` — pattern-based event selection
