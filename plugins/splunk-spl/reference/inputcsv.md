# inputcsv — load CSV from the csv or dispatch directory

Source: Splunk Search Reference 10.2.0

## Syntax

    | inputcsv
        [dispatch=<bool>]
        [append=<bool>]
        [strict=<bool>]
        [start=<int>]
        [max=<int>]
        [events=<bool>]
        <filename>
        [WHERE <search-query>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `filename` | yes | — | Name of the `.csv` file in `$SPLUNK_HOME/var/run/splunk/csv/` (extension optional) |
| `dispatch` | no | false | When true, reads from the current job's dispatch directory instead of the csv directory |
| `append` | no | false | When true, appends CSV data to existing results; when false, must be the first command |
| `strict` | no | false | When true, causes the search to fail on any error instead of issuing a warning |
| `start` | no | 0 | Zero-based offset of the first row to read |
| `max` | no | 1000000000 | Maximum number of rows to read |
| `events` | no | false | When true, treats each CSV row as an event (requires `_time` and `_raw`); results appear on Events tab |
| `WHERE` | no | — | Pre-filter rows using `=`, `!=`, `<`, `>`, `<=`, `>=`, `AND`, `OR`, `NOT`, and wildcards |

## Usage

`inputcsv` is an event-generating command. With `append=false` (default), it must be the first command
in the search (use a leading pipe). With `append=true`, it can appear later in the pipeline.

Files are read from `$SPLUNK_HOME/var/run/splunk/csv/` by default. If `dispatch=true`, the file is
read from the current job's dispatch directory. CSV files are not replicated across search head cluster
members — use `inputlookup` for shared lookup tables.

Note: ensure the CSV file ends with a blank line, or `inputcsv` may raise a parsing error.

## Examples

### Load a CSV and filter for errors, then save

```spl
| inputcsv all.csv | search error | outputcsv errors.csv
```

### Load a large file with row offset and limit

```spl
| inputcsv start=1000 max=5000 mydata.csv
```

### Pre-filter rows before loading into memory

```spl
| inputcsv mydata.csv WHERE status = "fail"
| stats count by host
```

### Append CSV data to current search results

```spl
index=main earliest=-1h | stats count by host
| inputcsv append=true baseline_hosts.csv
| stats sum(count) AS total_count by host
```

## Gotchas

- **Not for lookup tables** — use `inputlookup` for lookup files managed through the UI or `transforms.conf`.
  `inputcsv` reads from the local dispatch/csv directory, which is not replicated.
- **File path is relative, not absolute** — the filename is relative to `$SPLUNK_HOME/var/run/splunk/csv/`.
  You cannot specify an arbitrary filesystem path.
- **CSV must end with a blank line** — missing trailing newline causes a parsing error that can be hard to
  diagnose.
- **Not compatible with search head clustering** — CSV files written by `outputcsv` exist only on the local
  search head. Running the same `inputcsv` from another member will fail.

## Tips

- Use the `WHERE` clause to pre-filter large CSV files before they are loaded into memory — this is much
  faster than loading everything and then filtering with `| search`.
- Combine `start=` and `max=` to paginate through a very large CSV in multiple passes.

## See also

- `inputlookup.md` — load from a managed lookup table (replicated, shared)
- `outputcsv.md` — write current results to a CSV file in the dispatch directory
