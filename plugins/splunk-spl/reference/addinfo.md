# addinfo — add search metadata fields to events

Source: Splunk Search Reference 8.2.12, page 179.

## Syntax

    | addinfo

No parameters. Adds `info_min_time`, `info_max_time`, `info_search_time`, `info_sid`, `info_max_results`.

## Examples

### Make search aware of its own time range

```spl
index=main | addinfo | eval search_window_hours = round((info_max_time - info_min_time) / 3600, 1)
```

## See also

- `search.md` — the search that provides the context
