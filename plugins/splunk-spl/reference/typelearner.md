# typelearner — generate suggested event types (deprecated)

Source: Splunk Search Reference 10.2.0

**Deprecated as of Splunk Enterprise 5.0.** The command still functions but may be
removed in a future version. Use `findtypes` for new development.

## Syntax

    | typelearner [<grouping-field>] [maxlen=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `grouping-field` | No | `punct` | Field used to initially group events before merging similar groups |
| `maxlen` | No | 15 | Number of characters from `grouping-field` to examine; negative value = use entire field |

## What it does

Takes search results and produces a list of potential event-type searches by grouping
events on punctuation patterns (`punct` field by default) and then unifying and
merging similar groups. The output is a ranked list of search expressions that could
be registered as Splunk event types via Settings > Event types.

The command does not create event types automatically — it only suggests searches.
A human must review the suggestions and manually create the knowledge objects.

## Example

### Discover event type patterns in syslog

```spl
index=main sourcetype=syslog | head 1000 | typelearner
```

### Use a custom grouping field

```spl
index=app sourcetype=json_events | head 5000 | typelearner message
```

### Compare with the recommended replacement

```spl
index=main sourcetype=syslog | head 1000 | findtypes
```

## Gotchas

- **Deprecated — use `findtypes` instead:** `findtypes` is the modern replacement,
  produces better suggestions, and is under active development. `typelearner` is no
  longer updated and may disappear in a future Splunk release.

- **Suggestions only — no automatic creation:** The output is a list of proposed search
  strings, not actual event type objects. You must manually create each event type in
  Settings > Event types. Many teams discover `typelearner` output and mistake it for
  already-applied knowledge.

- **Large result sets are silently sampled:** `typelearner` internally limits the
  number of events it analyzes. Very large result sets are sampled, so passing tens of
  thousands of events does not improve suggestion quality proportionally. Use `| head`
  to feed a representative sample of 1,000–5,000 events.

- **`punct`-based grouping misses semantic similarity:** The default grouping on
  punctuation patterns (`punct`) groups events by structure rather than meaning. Two
  events with the same message but different punctuation are grouped separately; two
  events with very different messages but the same punctuation end up in the same
  group. This produces suggestions that may not align with meaningful event types.

## Tips

- Run on a representative sample of 1,000–5,000 events for best results.
- Review the suggested searches in the Search bar before creating event types to
  confirm they match the intended event population.

## See also

- `findtypes.md` — the recommended modern replacement
- `typer.md` — apply existing event types to search results
