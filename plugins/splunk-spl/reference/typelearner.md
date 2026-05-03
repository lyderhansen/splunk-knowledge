# typelearner — generate suggested event types (deprecated)

Source: Splunk Search Reference 10.2.0

**Deprecated as of Splunk Enterprise 5.0.** The command still functions but may be removed in a future version. Use `findtypes` for new development.

## Syntax

    | typelearner [<grouping-field>] [maxlen=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `grouping-field` | No | `punct` | Field used to initially group events |
| `maxlen` | No | 15 | Number of characters of the grouping field to examine |

## What it does

Takes search results and produces a list of potential event-type searches by grouping events on punctuation patterns (`punct` field by default) and then merging similar groups. The result is a ranked list of search expressions that could become event types.

## Example

    index=main sourcetype=syslog | head 1000 | typelearner

## Gotchas

- **Deprecated — use `findtypes` instead.** `findtypes` is the modern replacement and produces better suggestions.
- Results are only suggestions; you must manually create the actual event type knowledge objects.
- Analyzing only the first 5000 events by default; very large result sets are silently sampled.

## See also

- `findtypes.md` — the recommended replacement
- `typer.md` — apply existing event types to search results
