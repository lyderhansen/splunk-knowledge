# makemv — split single-value field into multivalue

Source: Splunk Search Reference 10.2.0

## Syntax

    | makemv [delim=<string> | tokenizer=<string>] [allowempty=<bool>] [setsv=<bool>] <field>

`delim` and `tokenizer` are mutually exclusive.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field` | Yes | — | Field to convert to multivalue. Does not apply to internal fields (e.g., `_raw`, `_time`) |
| `delim` | No | `" "` (space) | Literal string delimiter. Split occurs at every occurrence |
| `tokenizer` | No | — | Regex with one capturing group. Each match of the group becomes one value |
| `allowempty` | No | `false` | If `true`, empty strings between consecutive delimiters (or zero-length regex matches) become values |
| `setsv` | No | `false` | If `true`, also set the field to a single-value (space-joined) version alongside the multivalue |

## Examples

### Comma-separated tags

```spl
index=events
| makemv delim="," tags
| mvexpand tags
| stats count by tags
```

### Multicharacter delimiter

```spl
| makemv delim=" | " raw_list
```

### Regex tokenizer — extract all emails

```spl
| makemv tokenizer="([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})" _raw
```

### Colon-split with empty values preserved

```spl
| makemv delim=":" allowempty=true product_info
```

### Regex tokenizer used with makeresults

```spl
| makeresults
| eval my_multival="one,two,three"
| makemv tokenizer="([^,]+),?" my_multival
```

## Gotchas

- **Destructive — overwrites the original field** — the original single-value string is replaced by the multivalue. If you need the original, copy it first with `| eval original = field` or use `setsv=true` to retain a space-joined single-value version.
- **`delim` is a literal string, not a regex** — `delim=","` splits on a literal comma. To split on a pattern (e.g., one-or-more spaces), use `tokenizer=` instead. Writing `delim="\s+"` will literally look for the five-character string `\s+`.
- **Default delimiter is a single space** — omitting both `delim` and `tokenizer` splits on spaces. A field containing `"hello world"` becomes `["hello", "world"]`.
- **Does not apply to internal fields** — `makemv` cannot be used on `_raw`, `_time`, `_indextime`, or other underscore-prefixed internal fields.
- **`setsv=true` creates a problematic dual state** — the field simultaneously has a multivalue and single-value representation. This can confuse downstream commands. Avoid unless you specifically need the single-value form for display.
- **`allowempty` with `tokenizer`** — when using `tokenizer`, `allowempty=true` allows zero-length matches to become values. This can produce unexpected empty strings in the multivalue field.

## Tips

Use `tokenizer=` when the values to extract are not cleanly separated by a fixed delimiter — for example, extracting all quoted strings or all numbers from a raw text field.

## See also

- `mvexpand.md` — expand multivalue field into separate rows
- `mvcombine.md` — inverse: collapse rows into a multivalue field
- `nomv.md` — convert multivalue back to a single delimited string
