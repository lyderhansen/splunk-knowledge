# strcat — concatenate string values

Source: Splunk Search Reference 8.2.12, page 547.

## Syntax

    | strcat [allrequired=<bool>] <source-fields-and-strings> <dest-field>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| source-fields-and-strings | yes | — | Mix of field names and quoted string literals to concatenate |
| dest-field | yes | — | Field name for the concatenated result |
| allrequired | no | false | If true, result is null when any source field is null |

## Examples

### Basic — build combined field

```spl
| strcat src ":" dest_port endpoint
```

### With string literals

```spl
| strcat "User " user " from " src " at " _time summary
```

## Gotchas

- **Simpler but less flexible than eval:** `| strcat src ":" dest combined` is equivalent to `| eval combined = src . ":" . dest`. Use `eval` when you need formatting functions, conditionals, or complex expressions.
- **Null fields become empty string:** If a source field is null, it contributes nothing (not the word "null"). Use `allrequired=true` to get null output when any field is missing.

## See also

- `eval.md` — `.` operator for concatenation with more control
