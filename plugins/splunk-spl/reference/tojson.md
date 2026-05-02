# tojson — convert events to JSON objects

Source: Splunk Search Reference 10.2.0, page 857.

## Syntax

    | tojson [<datatype-func>(<field>)]... [default_type=<func>] [output_field=<field>] [fill_null=<bool>] [include_internal=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| datatype-func | no | none | Datatype function to apply per field: `auto`, `bool`, `json`, `none`, `num`, `str` |
| default_type | no | none | Default datatype function for all unspecified fields |
| output_field | no | _raw | Field to write the JSON output to |
| fill_null | no | false | If true, output `null` for skipped values instead of omitting them |
| include_internal | no | false | If true, include internal fields (`_time`, `_indextime`, `_raw`) |

## Datatype functions

| Function | Behavior |
|---|---|
| `auto` | Auto-detect: numeric → number, "true"/"false" → boolean, valid JSON → nested object, else → string |
| `bool` | Convert to boolean. "true"/"t"/"yes" → true, "false"/"f"/"no"/0 → false. Case-insensitive. |
| `json` | Validate and output as nested JSON object. Invalid JSON is skipped. |
| `none` | Output as-is: numeric values get numeric type, strings get string type. No validation. |
| `num` | Convert to numeric. Strings are parsed as numbers; unparseable values are skipped. |
| `str` | Force string type for all values, even numbers and booleans. |

## Examples

### Basic — convert all events

```spl
index=_internal | tojson
```

### Auto-detect datatypes for all fields

```spl
... | tojson auto(*)
```

Or equivalently:

```spl
... | tojson default_type=auto
```

### Specific datatypes per field

```spl
... | tojson num(date_hour) str(date_*) bool(isInternal)
```

### Write to custom field with internal fields

```spl
... | tojson age height weight str(name) default_type=num output_field=my_JSON_field
```

### Include internal fields and fill nulls

```spl
... | tojson include_internal=true fill_null=true
```

## Gotchas

- **Multivalue fields become JSON arrays:** Each element gets the datatype function applied.
- **Default `none` skips invalid JSON:** Fields that can't be typed are silently omitted unless `fill_null=true`.
- **Streaming command:** Operates on each event as it flows through the pipeline.

## See also

- `eval.md` — `json_object()`, `json_array()` for building JSON in eval
- `spath.md` — inverse: extract fields FROM JSON
