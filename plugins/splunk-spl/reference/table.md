# table — return results as a table with specified columns

Source: Splunk Search Reference 8.2.12, page 559.

## Syntax

    | table <wc-field-list>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<wc-field-list>` | yes | — | Space- or comma-delimited list of field names. Accepts `*` wildcard. Columns appear in the order specified. |

## Usage

`table` is a **transforming command**. It returns only the fields listed, in the order listed.
Each row represents one event. Column headers are field names; cell values are field values.

`table` is similar to `fields +` but runs on the search head (not indexers) and controls column
order. For mid-pipeline field filtering, prefer `fields` for performance.

Avoid placing `table` in the middle of a pipeline — it runs on the search head and prevents
subsequent distributable commands from running on indexers. Put it at the end.

Do not use `table` before `chart`, `timechart`, or `stats` — those commands ignore the column
selection and regenerate their own field set. Exception: scatter plots can use `table` to control
the input field set.

Results may be truncated by the `max_count` parameter in `limits.conf [search]` when
`truncate_report=1`. Set `truncate_report=0` to disable truncation.

## Examples

### Basic column selection

    index=access_* | stats count, sum(bytes) AS total_bytes by src
    | table src, count, total_bytes

### With rename for display-friendly headers

    | metadata type=sourcetypes
    | rename totalCount AS Count firstTime AS "First Event"
    | table sourcetype Count "First Event"

### Wildcard column selection

    | stats count, sum(bytes_*) by host
    | table host, bytes_*       -- includes bytes_in, bytes_out, bytes_total, etc.

### Dashboard-specific pattern: streamstats then table

    sourcetype=access_combined* | head 5 | sort _time
    | streamstats sum(bytes) AS cumulative_bytes by clientip
    | table _time, clientip, bytes, cumulative_bytes

## Gotchas

- **`table` is not streaming** — it runs on the search head. If you want to filter fields
  efficiently mid-pipeline, use `| fields` instead (distributable streaming, runs on indexers).

- **Cannot rename in `table`** — `table` only selects fields by their existing names. Rename
  before piping to `table`: `| rename src AS source_ip | table source_ip, ...`

- **Column order matters for charts** — when using `table` before a scatter chart, the column
  order determines axis assignment. For all other chart types, avoid `table` before the viz command.

- **Wildcards in `table` match current fields only** — unlike `fields`, `table` with `value*`
  only keeps fields that exist at that point in the pipeline.

## See also

- `fields.md` — streaming field filtering (use mid-pipeline for performance)
- `rename.md` — rename fields before displaying
- `fieldformat.md` — change display format of values
