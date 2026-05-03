# strcat — concatenate string values

Source: Splunk Search Reference 10.2.0

## Syntax

    | strcat [allrequired=<bool>] <source-fields> <dest-field>

    <source-fields>  ::=  (<field> | "<literal-string>")...

Concatenates field values and quoted string literals in order, writing the result
to `dest-field`. The destination field name must always be the last argument.
`strcat` is a distributable streaming command — it runs on indexers.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `source-fields` | Yes | — | Sequence of field names and/or quoted string literals to concatenate |
| `dest-field` | Yes | — | Name of the output field; must be the last argument |
| `allrequired` | No | false | When `true`, dest-field is only written if all source fields exist; when `false`, missing fields contribute empty string |

## Examples

### Basic — combine source and destination IP

```spl
... | strcat sourceIP "/" destIP comboIP
```

### Include literal separators and multiple fields

```spl
... | strcat host "::" port address
```

### Build a human-readable summary field

```spl
index=auth
| strcat "User " user " from " src " at " _time summary
```

### Use allrequired to skip incomplete events

```spl
index=app
| strcat allrequired=true user "@" domain full_user
```
Events where `user` or `domain` is null will have no `full_user` field.

### Equivalent eval expression

```spl
| eval endpoint = src . ":" . dest_port
```
Prefer `eval` when you need conditional logic, formatting functions, or chained expressions.

## Gotchas

- **Null fields become empty string (default):** When `allrequired=false`, a missing
  source field silently contributes nothing — the other parts are still concatenated.
  This can produce misleading output like `"/192.168.1.1"` when the source IP is
  missing. Use `allrequired=true` to detect incomplete events, or use `eval` with
  `if(isnull(...), ...)` for explicit handling.

- **No separator is added automatically:** Fields are joined with zero padding between
  them. You must include literal separator strings (e.g. `":"`, `" - "`) explicitly as
  quoted arguments.

- **`dest-field` must be the last argument:** The parser treats the last token as the
  destination. Putting it in the middle silently treats it as a source field, producing
  incorrect output with no error message.

- **Simpler but less flexible than `eval`:** `| strcat src ":" dest_port endpoint` is
  exactly equivalent to `| eval endpoint = src . ":" . dest_port`. Use `eval` for
  anything beyond plain concatenation — conditionals, functions, arithmetic.

- **Numeric fields are concatenated as strings:** `strcat` converts all field values to
  strings before joining. If you need to format numbers (e.g., zero-pad, round), use
  `eval tostring(num, "commas")` first.

## Tips

- `strcat` has a small performance advantage over `eval` for pure concatenation on
  indexers in distributed searches, since it is a distributable streaming command.
  In practice the difference is negligible — prefer whichever is more readable.

## See also

- `eval.md` — `.` operator and string functions for more complex concatenation
