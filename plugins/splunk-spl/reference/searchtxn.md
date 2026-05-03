# searchtxn — efficiently find transaction events from a predefined type

Source: Splunk Search Reference 10.2.0.

## Syntax

    | searchtxn <transaction-name> [max_terms=<int>] [use_disjunct=<bool>] [eventsonly=<bool>] <search-string>

`searchtxn` is a generating command — it must appear at the start of a search with a leading pipe.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `transaction-name` | Yes | — | Name of a transaction type stanza defined in `transactiontypes.conf` |
| `search-string` | Yes | — | Search terms to find matching events within the transaction |
| `eventsonly` | No | `false` | If `true`, return matching events without grouping into transactions |
| `max_terms` | No | 1000 | Max unique field values collected per field; lower = faster, favors recent values |
| `use_disjunct` | No | `true` | If `true`, terms in `search-string` are OR'd for the initial event scan |

## How it works

1. Splunk searches for events matching the `search-string` and the transaction type's base search.
2. From those events, all field values for the transaction's `fields=` fields (e.g., `qid`, `pid`) are collected.
3. A comprehensive search is constructed to find all events belonging to any of those transactions.
4. Finally, `| transaction name=<type>` groups the events.

## Examples

### Find all email transactions to root from a specific sender

    | searchtxn email to=root from="David Smith"

### Retrieve events only without grouping into transactions

    | searchtxn purchase_flow eventsonly=true checkout_complete

### Limit field value collection for performance

    | searchtxn web_session max_terms=100 error

## Gotchas

- **Requires `transactiontypes.conf` setup** — the transaction type must be defined before this command is useful. In Splunk Cloud, this requires a private app.
- **Only works for field-based transactions** — `searchtxn` groups by matching field values (e.g., session ID), not by time ordering or proximity. Use `transaction` directly for time-based grouping.
- **`max_terms` limits recall** — with a low `max_terms` setting, older transactions may be missed; the command favors more recent values.
- **`use_disjunct=true` broadens the initial scan** — this improves recall but can increase search cost; set `use_disjunct=false` to require all terms.
- **Generating command** — must start with `|`; cannot follow other SPL commands.

## See also

- `transaction.md` — inline transaction grouping without a predefined type
