# findtypes — generate suggested event types

Source: Splunk Search Reference 10.2.0

Analyzes search results and produces a ranked list of potential event type definitions. It is the modern, supported replacement for the deprecated `typelearner` command.

## Syntax

    | findtypes [max=<int>] [notcovered] [useraw]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `max` | No | 10 | Maximum number of event type suggestions to return |
| `notcovered` | No | false | When set, shows events that did not match any existing event type |
| `useraw` | No | false | Use the raw `_raw` field for pattern analysis instead of extracted fields |

## What it does

Inspects the search results, groups similar events based on field patterns and punctuation, and outputs a list of candidate SPL search strings that could be saved as event types. Results include a `search` field (the suggested search string) and a `count` field (events matched).

## Examples

    index=main sourcetype=syslog | head 5000 | findtypes

    index=web_logs | findtypes max=20

    index=main | findtypes notcovered | table _raw

## Gotchas

- Analyzes at most 5000 events by default; pipe through `head 5000` for large result sets to control which events are sampled.
- Output rows are **suggestions only** — you must manually review and create the actual event type knowledge objects in Settings > Event types.
- `notcovered` requires that event types already exist in your app context; it has no effect if no event types are configured.
- `useraw` can produce noisier results when `_raw` contains timestamps, IPs, or other variable data.

## Tips

Use `findtypes` as the first step when onboarding a new data source. Run it against a fresh sample, review the top suggestions, and save the useful ones as event types. Combine with `typer` to validate coverage after creating new event types.

## See also

- `typer.md` — apply existing event types to search results
- `typelearner.md` — deprecated predecessor
