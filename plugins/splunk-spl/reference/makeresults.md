# makeresults — generate empty events

Source: Splunk Search Reference 10.2.0

## Syntax

    | makeresults [count=<int>] [annotate=<bool>] [splunk_server=<string>]
                  [splunk_server_group=<string>...] [format=csv|json] [data=<string>]

`format` and `data` must be used together. When present, they override `count` and `annotate`.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `count` | No | `1` | Number of events to generate |
| `annotate` | No | `false` | If `true`, add `_raw`, `host`, `source`, `sourcetype`, `splunk_server`, `splunk_server_group` fields |
| `splunk_server` | No | `local` | Generate results on a specific server. Use `local` for search head |
| `splunk_server_group` | No | — | Generate results across a server group |
| `format` | No | — | `csv` or `json` — inline data format |
| `data` | No | — | Inline data string (CSV or JSON). Overrides `count` |

## Examples

### Mock data for dashboard development

```spl
| makeresults count=10
| eval _time = _time - (random() % 86400)
| eval status = case(random() % 10 < 7, "ok", random() % 10 < 9, "warn", 1==1, "critical")
| eval value = random() % 100
```

### Single-row KPI placeholder

```spl
| makeresults
| eval total_orders = 1234, revenue = 45678.90
```

### Inline CSV data

```spl
| makeresults format=csv data="name,age
Alice,30
Bob,25
Carol,35"
```

### Inline JSON data

```spl
| makeresults format=json data="[{\"name\":\"Alice\",\"age\":30},{\"name\":\"Bob\",\"age\":25}]"
```

### Inspect annotate fields

```spl
| makeresults count=3 annotate=true
| table _time, splunk_server, host, sourcetype
```

### Distributed: generate results on all search peers

```spl
| makeresults count=1 splunk_server_group=dmc_group_indexer
| eval server = splunk_server
| stats count by server
```

## Gotchas

- **Only `_time` is set by default** — events have only `_time` populated (current time). All other fields must be added with `eval`. Do not expect `_raw`, `host`, `source`, or `sourcetype` unless you add `annotate=true`.
- **`format` + `data` overrides everything else** — when `format=csv data="..."` is present, `count` and `annotate` are silently ignored.
- **Inline data limit is 29,999 characters** — `data=` payloads larger than this are rejected with an error.
- **JSON values must use escaped double-quotes** — inline JSON in SPL must be double-quoted at the outer level. Internal quotes must be escaped: `data="[{\"key\":\"value\"}]"`. Forgetting the backslash is the most common inline JSON error.
- **`splunk_server` multiplies results** — if you specify `count=5` and target 3 servers with `splunk_server_group`, you get 15 total results (5 per server), not 5 total.
- **Generating command** — `makeresults` must be the first command in the pipeline (preceded by `|`). It cannot be used in the middle of a pipeline.
- **Results not persisted** — events are created in temporary memory only. They are not indexed, not written to disk, and disappear when the search ends.

## Tips

Use `makeresults format=csv data="..."` to embed small reference datasets directly in a dashboard search without needing a lookup file. Useful for mapping status codes to labels or defining threshold tiers inline.

## See also

- `gentimes.md` — generate time-range events (primarily for use with `map`)
- `inputlookup.md` — load existing data from a lookup file
