# typeahead — return autocomplete suggestions for a search prefix

Source: Splunk Search Reference 10.2.0

## Syntax

    | typeahead
      prefix=<string>
      count=<int>
      [collapse=<bool>]
      [index=<string>]
      [max_servers=<int>]
      [max_time=<int>]
      [use_cache=<bool>]
      [starttimeu=<int>]
      [endtimeu=<int>]
      [banned_segments=<semicolon-separated-list>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `prefix` | Yes | — | Full search string fragment to return typeahead candidates for |
| `count` | Yes | — | Maximum number of suggestions to return |
| `collapse` | No | `true` | If `true`, collapses terms that are a prefix of another term with the same event count |
| `index` | No | default | Index to search instead of the default index |
| `max_servers` | No | `2` | Maximum number of indexers/search peers to query in addition to the search head |
| `max_time` | No | `1` | Maximum run time in seconds; `0` = no limit |
| `use_cache` | No | `true` | Whether to use the typeahead cache |
| `starttimeu` | No | `0` | Start time bound in Unix epoch seconds |
| `endtimeu` | No | now | End time bound in Unix epoch seconds |
| `banned_segments` | No | none | Semicolon-separated list of term patterns to suppress, e.g. `*password*;*SSN*` |

## Usage

`typeahead` is a generating command (leading `|`). It powers the search bar autocomplete UI internally. Running it directly is useful for programmatic suggestion tools or dashboards that present search helpers.

Results include a `count` field (event count for the suggestion) and a `term` field (the suggestion string).

## Examples

### Basic prefix suggestions

    | typeahead prefix="error" count=20 index=main

### Suggest field values starting with a known host prefix

    | typeahead prefix="host=web" count=10
    | table term, count
    | sort - count

### Limit to a specific time window

    | typeahead prefix="sourcetype=access" count=15
      starttimeu=1700000000 endtimeu=1700086400

## Gotchas

- **Both `prefix` and `count` are required** — omitting either causes the command to fail with a missing argument error.
- **`max_time` defaults to 1 second** — results may be incomplete for large or slow indexes. Increase `max_time` for more thorough results at the cost of latency.
- **Only queries warm/cold buckets** — very recent events in hot buckets may not appear in typeahead results.
- **`banned_segments` is security-relevant** — use it to prevent suggesting terms containing sensitive strings like passwords or PII identifiers.
- **Caching can return stale suggestions** — set `use_cache=false` to force a fresh scan when accurate counts matter.

## See also

- `metadata.md` — broader index/sourcetype/host discovery
- `walklex.md` — enumerate all indexed terms in a bucket
