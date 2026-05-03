# typer — apply event type definitions to search results

Source: Splunk Search Reference 10.2.0

## Syntax

    | typer [eventtypes=<string>] [maxlen=<unsigned-integer>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `eventtypes` | No | (all) | Comma-separated list of event type names to restrict matching; accepts wildcards; if all listed types are invalid, `typer` is disabled |
| `maxlen` | No | 10000 | Number of characters from the start of each event to evaluate for event type matching; decrease to improve performance on very long events |

## Description

`typer` evaluates configured event type definitions against each result and adds the `eventtype` field, which lists all matching event type names as a multivalue field. It is a distributable streaming command — it can run on indexers.

You must have event types configured in Splunk (via Settings → Event Types or `eventtypes.conf`) for `typer` to return any values. If no event types are defined, `typer` adds the field but it will be empty.

## Examples

### Add event type field to all results

    index=main | typer | table _time, eventtype, _raw

### Filter to a specific set of event types

    index=security | typer eventtypes="authentication,*fail*"
    | where isnotnull(eventtype)
    | stats count by eventtype

### Limit evaluation to first 500 characters (faster on large events)

    index=logs | typer maxlen=500

### Find events matching no event type (unclassified events)

    index=main | typer | where isnull(eventtype) | head 100

## Gotchas

- **Event types must be pre-configured** — `typer` only applies types that already exist in `eventtypes.conf`. It does not discover or suggest types. Use `findtypes` for discovery.
- **`maxlen` truncates evaluation** — if an event type pattern matches text that appears after position `maxlen` in the event, `typer` will miss the match. Increase `maxlen` if you see unexpectedly unclassified events.
- **Multivalue output** — `eventtype` is a multivalue field. If you `| table eventtype`, values appear as a comma-separated list. Use `| mvexpand eventtype` to get one row per event type.
- **Performance** — `typer` evaluates all enabled event type regex patterns against every event. On large result sets with many complex event types this can be slow. Use the `eventtypes=` filter to limit evaluation scope.

## Tips

- Use `| typer | stats count by eventtype` as a quick audit of which event types are actively matching in an index.
- The `maxlen` default (10000) can be changed globally in `limits.conf` under the `[typer]` stanza.

## See also

- `findtypes.md` — suggest new event type definitions based on search results
- `eventtypes.md` — list configured event types via SPL
