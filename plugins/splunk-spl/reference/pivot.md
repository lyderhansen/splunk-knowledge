# pivot — pivot-style queries against data models

Source: Splunk Search Reference 10.2.0

## Syntax

    | pivot <datamodel-name> <object-name> <pivot-element>...

Where `<pivot-element>` is one or more of:

    <function>(<field>) [AS <label>]
    SPLITROW <field> [AS <label>] [RANGE start=<v> end=<v> max=<v> size=<v>] [PERIOD auto|year|month|day|hour|minute|second] [TRUELABEL <l>] [FALSELABEL <l>]
    SPLITCOL <field> [RANGE ...] [PERIOD ...] [TRUELABEL <l>] [FALSELABEL <l>]
    FILTER <field> <comparison-op> <value>
    LIMIT <field> BY top|bottom <N> <stats-function>(<field>)
    ROWSUMMARY true|false
    COLSUMMARY true|false
    SHOWOTHER true|false
    NUMCOLS <int>
    SORT <N> <field>

## Parameters

| Parameter | Required | Description |
|---|---|---|
| `datamodel-name` | Yes | Name of the data model to search |
| `object-name` | Yes | Name of a data model object (dataset) within the model |
| cell value `function(field)` | Yes | Aggregation for cell values; see supported functions below |
| `SPLITROW` | No | Create row groups; supports RANGE for numbers, PERIOD for timestamps |
| `SPLITCOL` | No | Create column groups; same type-specific options as SPLITROW |
| `FILTER` | No | Filter expression: strings use `is`/`contains`/`in`/`startsWith`; numbers use `=`/`!=`/`<`/`>`; booleans use `is` |
| `LIMIT` | No | Limit results to top/bottom N by a stats function |
| `ROWSUMMARY` / `COLSUMMARY` | No | Add summary row/column totals |

### Cell value functions by field type

| Field type | Allowed functions |
|---|---|
| String | `list`, `values`, `first`, `last`, `count`, `dc` |
| Number | `sum`, `count`, `avg`, `max`, `min`, `stdev`, `list`, `values` |
| Timestamp | `duration`, `earliest`, `latest`, `list`, `values` |
| Object/child count | `count` |

## Examples

### Count events in a data model object

    | pivot Tutorial HTTP_requests count(HTTP_requests) AS "Count of HTTP requests"

### Pivot table: count by host, sorted

    | pivot Tutorial HTTP_requests count(HTTP_requests) AS "Count"
        SPLITROW host AS "Server"
        SORT 100 host

### Filter and split by action

    | pivot Authentication Authentication count(Authentication) AS total
        SPLITROW src AS "Source IP"
        SPLITCOL action
        FILTER action is "failure"
        LIMIT src BY top 25 count(Authentication)

## Gotchas

- **Generating command** — `pivot` must be the first command in the search (leading `|`). You cannot pipe other results into it.
- **Pivot wraps stats + xyseries** — `pivot` is syntactic sugar; it does not offer capabilities beyond what `stats`, `chart`, and `xyseries` can do. For complex transformations, SPL directly may be clearer.
- **SPLITCOL creates dynamic column names** — the output columns are derived from field values, which can make downstream SPL field references fragile if values change.
- **Data model acceleration required for performance** — without an accelerated data model, `pivot` must scan raw events and will be slow on large datasets. Use `tstats` for fast aggregations on accelerated models.
- **Cell values must come first** in the pivot element list, before any SPLITROW/SPLITCOL/FILTER clauses.

## Tips

- `tstats` is faster than `pivot` for simple count/sum aggregations on accelerated data models — use `pivot` when you need SPLITCOL dynamic column pivoting.
- Use `ROWSUMMARY=true` to add a totals row at the bottom of tabular pivot output.

## See also

- `tstats.md` — faster alternative for aggregations on accelerated data models
- `datamodel.md` — lower-level data model inspection and search
- `chart.md` — manual equivalent of pivot's SPLITCOL behavior
