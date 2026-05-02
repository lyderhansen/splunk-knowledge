# delete — mark events as deleted

Source: Splunk Search Reference 8.2.12, page 266.

## Syntax

    | delete

No parameters. Marks all events in the current result set as deleted.

## Gotchas

- **Requires `can_delete` role capability.** Most users don't have this.
- **Not physically removed:** Events are marked as deleted but remain on disk until the bucket rolls to frozen and is physically removed.
- **No undo:** Deletion cannot be reversed. The events are permanently hidden from searches.
- **DANGEROUS:** Always test your search with `| stats count` first to verify you're targeting the right events.

## See also

- `search.md` — verify your filter before deleting
