# pivot — pivot-style queries against data models

Source: Splunk Search Reference 8.2.12, page 451.

## Syntax

    | pivot <datamodel> <object> <agg-func>(<field>) [AS <alias>] [SPLITBY <field>] [SPLITROW <field>] [FILTER <expr>] [SORT <field>] [ROWSUMMARY <bool>] [COLSUMMARY <bool>] [LIMIT <int>]

## Examples

```spl
| pivot Authentication Authentication count(Authentication) AS total SPLITBY action
```

## See also

- `tstats.md` — faster alternative for simple aggregations
- `datamodel.md` — lower-level data model access
