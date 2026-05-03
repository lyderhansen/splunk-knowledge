# nomv — convert multivalue field to single-value

Source: Splunk Search Reference 10.2.0

## Syntax

    | nomv <field>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field` | yes | — | Name of the multivalue field to convert to a single-value string |

## Usage

`nomv` is a distributable streaming command — it runs on indexers and is efficient even on large result
sets. It overrides any `fields.conf` configuration for the named field.

The conversion joins all values with a newline (`\n`) delimiter. The resulting single-value field contains
all former values as one string, separated by newlines. This is useful for export (e.g., CSV output where
multivalue fields would otherwise produce multiple columns) and for commands that do not handle multivalue
fields gracefully.

For a custom delimiter, use `eval field = mvjoin(field, ", ")` instead.

## Examples

### Flatten a multivalue field for top command

```spl
eventtype="sendmail" | nomv senders | top senders
```

### Combine host values after mvcombine, then flatten

```spl
index=* host=www*
| stats max(bytes) AS max, min(bytes) AS min BY host
| mvcombine delim="," host
| nomv host
```

### Flatten for CSV export

```spl
index=main | stats values(src) AS sources by user
| nomv sources
| outputcsv user_sources.csv
```

## Gotchas

- **Newline delimiter, not space** — the 10.2 documentation states that `nomv` joins values with a newline
  (`\n`) character, not a space. Earlier documentation said space; the actual behavior in 10.x is `\n`.
  If you need a specific delimiter, use `eval field = mvjoin(field, ", ")` instead.
- **Search-time only** — the conversion does not modify indexed data. Re-running the search will produce
  the multivalue field again unless `nomv` is in the pipeline.
- **Only one field per command invocation** — to flatten multiple fields, chain multiple `| nomv` commands.
- **Top/stats may not behave as expected post-`nomv`** — after conversion, the field is a single string
  containing `\n`-separated values. Aggregation functions will treat the entire joined string as one value.

## Tips

- Use `| eval joined = mvjoin(sources, " | ")` when you need a human-readable, single-line joined string
  with a visible separator, rather than `nomv`.
- `nomv` before `outputlookup` or `outputcsv` ensures multivalue fields are written as single columns.

## See also

- `makemv.md` — inverse: split a single-value field into a multivalue field
- `mvcombine.md` — collapse rows with a single differing field into a multivalue row
- `mvexpand.md` — expand multivalue field rows into separate events
- `eval.md` — `mvjoin()` for custom-delimited single-value conversion
