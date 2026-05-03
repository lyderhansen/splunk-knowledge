# findtypes — generate suggested event types

Source: Splunk Search Reference 10.2.0

Analyzes search results and produces a ranked list of candidate event type definitions.
At most 5000 events are analyzed. It is the modern, supported replacement for the
deprecated `typelearner` command.

Output includes a `search` field (suggested SPL string) and a `count` field (events matched
by that pattern).

## Syntax

    | findtypes [max=<int>] [notcovered] [useraw]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `max` | No | 10 | Maximum number of event type suggestions to return |
| `notcovered` | No | false | Return only events not already covered by an existing event type |
| `useraw` | No | false | Use `_raw` text for pattern analysis instead of extracted fields |

## Examples

### Basic: discover top 10 event types

    index=main sourcetype=syslog | head 5000 | findtypes

### Discover more candidates using raw text

    index=web_logs | head 5000 | findtypes max=20 useraw

### Find events not covered by existing event types

    index=main sourcetype=linux_secure | findtypes notcovered | table _raw

### Onboard a new data source

    index=new_source earliest=-24h
    | head 5000
    | findtypes max=30
    | table search, count
    | sort -count

## Gotchas

- **Hard cap of 5000 events analyzed** — `findtypes` will not analyze more than 5000
  events regardless of how many are in your result set. Pipe through `head 5000` explicitly
  when your search returns more, so you control which events are sampled.
- **Output is suggestions only** — the `search` values in the output are candidate strings,
  not saved event types. You must manually review them and create the actual event type
  knowledge objects in Settings > Event Types.
- **`notcovered` has no effect when no event types exist** — if your app context has no
  event types configured, `notcovered` returns the same results as omitting it. It is only
  useful when event types already exist.
- **`useraw` produces noisier results** — `_raw` contains timestamps, IPs, log levels, and
  other high-variability content that creates overly specific patterns. Use `useraw` only
  when extracted fields are sparse or missing.
- **Results vary between runs** — `findtypes` uses internal heuristics and the suggestions
  may change slightly between runs on the same data.

## Tips

- Use `findtypes` as the first step when onboarding a new data source. Run it against a
  representative 5000-event sample, review the top suggestions, and save the useful ones
  as event types.
- Combine with `typer` after creating event types to validate coverage: run `typer` and
  then `findtypes notcovered` to see what remains uncategorized.

## See also

- `typer.md` — apply existing event types to search results
- `typelearner.md` — deprecated predecessor to `findtypes`
