# makemv — split single-value field into multivalue

Source: Splunk Search Reference 8.2.12, page 386.

## Syntax

    | makemv [delim=<string>] [allowempty=<bool>] [setsv=<bool>] [tokenizer=<regex>] <field>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field | yes | — | Field to split into multivalue |
| delim | no | space | Delimiter string to split on |
| allowempty | no | false | If true, include empty values between consecutive delimiters |
| setsv | no | false | If true, also set a single-value version of the field |
| tokenizer | no | — | Regex with capture group — each match becomes a value |

## Examples

### Basic — comma-separated tags

```spl
| makemv delim="," tags
| mvexpand tags
| stats count by tags
```

### Regex tokenizer — extract all emails

```spl
| makemv tokenizer="([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,})" _raw
```

## Gotchas

- **Sparkline trap:** `| eval x="1,2,3" | makemv delim="," x` only types row 1 as multivalue. Rows 2+ silently degrade to single-value. For sparklines in tables, use `| stats sparkline()` instead.
- **Destructive:** Overwrites the original field. The original single-value is lost unless you copy first or use `setsv=true`.
- **delim is a string, not regex:** `delim=","` splits on literal comma. For regex-based splitting, use `tokenizer=` instead.

## See also

- `mvexpand.md` — expand multivalue into rows
- `mvcombine.md` — inverse operation
- `nomv.md` — convert multivalue back to single-value
