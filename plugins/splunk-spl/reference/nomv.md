# nomv — convert multivalue field to single-value

Source: Splunk Search Reference 8.2.12, page 438.

## Syntax

    | nomv <field>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field | yes | — | Multivalue field to convert to single-value |

## Examples

### Basic — flatten for export

```spl
| stats values(src) AS sources by user
| nomv sources
```

## Gotchas

- **Values joined with space:** The resulting single-value is all values concatenated with a space delimiter. For custom delimiters, use `eval joined = mvjoin(field, ", ")` instead.
- **Search-time only:** The conversion happens at search time and does not modify indexed data.

## See also

- `makemv.md` — inverse operation
- `mvcombine.md` — combine rows into multivalue
- `eval.md` — `mvjoin()` for custom-delimited joining
