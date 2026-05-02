# appendcols — add subsearch results as new columns

Source: Splunk Search Reference 8.2.12, page 202.

## Syntax

    | appendcols [override=<bool>] [<subsearch>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| subsearch | yes | — | Search enclosed in square brackets |
| override | no | false | If true, subsearch fields overwrite main search fields with same name |

## Examples

### Add a computed column

```spl
index=main | stats count by host
| appendcols [search index=main | stats dc(sourcetype) AS type_count by host | fields type_count]
```

## Gotchas

- **Row-by-row alignment:** First subsearch result maps to first main result, second to second, etc. If counts differ, extra rows get null values.
- **Field name collisions:** If subsearch returns fields with the same name, they are dropped unless `override=true`.

## See also

- `append.md` — add rows instead of columns
- `join.md` — key-based column merging
