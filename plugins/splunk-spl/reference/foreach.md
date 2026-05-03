# foreach — apply a transform across multiple fields or values

Source: Splunk Search Reference 10.2.0

Runs a subsearch template iteratively — either over a list of fields matching a wildcard,
over each value in a multivalue field, or over each element in a JSON array. The template
uses placeholder tokens that are replaced on each iteration.

## Syntax

    | foreach [mode=<mode-name>] <wildcard-field-list> | <field>
              [<mode-options>]
              [<subsearch>]

## Modes

| Mode | Iterates over | Token | Notes |
|---|---|---|---|
| `multifield` (default) | Each field matching a wildcard pattern | `<<FIELD>>` | Works with any streaming command |
| `multivalue` | Each value in a multivalue field | `<<ITEM>>`, `<<ITER>>` | Only works with `eval` |
| `json_array` | Each element in a JSON array field | `<<ITEM>>`, `<<ITER>>` | Only works with `eval` |
| `auto_collections` | JSON array or multivalue, auto-detected | `<<ITEM>>`, `<<ITER>>` | Only works with `eval` |

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `wildcard-field-list` | Yes (multifield) | — | Space-delimited field name(s) with optional `*` wildcards |
| `field` | Yes (multivalue/json_array) | — | Name of the multivalue or JSON array field to iterate over |
| `mode` | No | `multifield` | Iteration mode (see table above) |
| `fieldstr` | No | `FIELD` | Custom name for the `<<FIELD>>` token (multifield mode) |
| `matchstr` | No | `MATCHSTR` | Custom name for the `<<MATCHSTR>>` token (the wildcard match portion) |
| `subsearch` | Yes | — | Transform template enclosed in `[ ]` |

## Examples

### Round all cpu_* fields to 2 decimal places

    | foreach cpu_* [eval <<FIELD>> = round('<<FIELD>>', 2)]

### Zero-fill null numeric fields before stats

    | foreach count_* bytes_* [eval <<FIELD>> = coalesce('<<FIELD>>', 0)]

### Rename matching fields with a prefix

    | foreach host_* [eval new_<<MATCHSTR>> = '<<FIELD>>']

### Iterate over a multivalue field (eval only)

    | foreach mode=multivalue tags
        [eval tag_upper = mvappend(tag_upper, upper(<<ITEM>>))]

### Iterate over a JSON array field (eval only)

    | foreach mode=json_array events_json
        [eval event_ids = mvappend(event_ids, json_extract(<<ITEM>>, "id"))]

## Gotchas

- **`<<FIELD>>` token must use double angle brackets** — single angle brackets are not
  recognized. A typo here produces no error; the template just runs without substitution.
- **Single-quote the value reference inside the subsearch** — use `'<<FIELD>>'` (with
  single quotes) to reference the field's value. Without quotes, field names containing
  spaces or special characters cause parse errors.
- **`multivalue` and `json_array` modes work only with `eval`** — attempting to use them
  with other streaming commands (e.g., `stats`, `rex`) will fail or produce unexpected
  behavior.
- **`auto_collections` is dynamic but can mask errors** — if a field is neither a JSON
  array nor a multivalue field, `auto_collections` may iterate zero times silently.
- **Wildcard matches are determined at the time of execution** — if fields matching the
  wildcard do not exist in the current result set, `foreach` iterates zero times without error.
- **Processing order is not guaranteed** — do not depend on a specific field iteration
  order in `multifield` mode.

## Tips

- Use `<<MATCHSTR>>` to capture only the wildcard portion of a field name — e.g., for
  fields `count_web` and `count_api`, `foreach count_* [eval label_<<MATCHSTR>> = ...]`
  creates `label_web` and `label_api`.
- Combine `foreach` with `fillnull` for a cleaner null-handling pattern:
  `| fillnull value=0 | foreach metric_* [eval <<FIELD>> = round('<<FIELD>>', 1)]`

## See also

- `eval.md` — single-field computation
- `map.md` — iterate over result rows (not fields)
- `mvexpand.md` — expand multivalue fields into separate events
