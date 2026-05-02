# spath — extract fields from XML or JSON structured data

Source: Splunk Search Reference 8.2.12, page 529.

## Syntax

    | spath [input=<field>] [output=<field>] [path=<datapath> | <datapath>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `input` | No | `_raw` | Source field to read from |
| `output` | No | path value | Destination field name for the extracted value |
| `path` | No | (none) | Dot-notation path to the value to extract |

## Variants

### Auto-extract mode (no `path`)

When `path` is omitted, `spath` reads the first 5,000 characters of `input` and extracts
all JSON/XML fields it can find, creating one field per key. This is convenient for
exploration but can be slow on large events with many keys.

    sourcetype=my_json | spath

### Explicit path mode

When `path` is specified, only that value is extracted. Use `output=` to control the
destination field name.

    | spath input=_raw output=order_id path=order.id

### spath() as eval function

`spath()` can be used inside `eval` to extract a value inline without creating a
pipeline stage:

    | eval region = spath(_raw, "location.region")
    | eval first_tag = spath(_raw, "tags{0}")

## Examples

### Basic: extract a single nested value

    index=orders sourcetype=order_json
    | spath output=customer_id path=customer.id
    | spath output=order_total path=order.total_amount
    | table _time, customer_id, order_total

### Array: extract all items from a JSON array

Use `{}` notation (no index) to extract all array elements into a multivalue field:

    index=orders sourcetype=order_json
    | spath output=item_skus path=order.items{}.sku
    | mvexpand item_skus
    | stats count by item_skus

To extract a specific element by index (zero-based):

    | spath output=first_item_sku path=order.items{0}.sku

### XML attribute extraction

Use `@` to reference an XML attribute:

    | spath output=published_year path=purchases.book.title{@yearPublished}

### Dashboard-specific pattern: extracting KPI fields from a JSON data source

When a dashboard data source returns events with JSON payloads, extract the fields
before aggregating:

    index=telemetry sourcetype=app_events
    | spath output=tenant_id    path=context.tenantId
    | spath output=event_type   path=event.type
    | spath output=duration_ms  path=event.durationMs
    | stats avg(duration_ms) AS avg_duration count by tenant_id, event_type
    | sort 0 -count

## Gotchas

- **`output=` NOT `as`** — this is the #1 spath mistake. `spath` does not use the `AS`
  keyword to name the output field. Write `output=my_field`, not `AS my_field`. Using
  `as` will silently produce no output field.

- **Auto-extract only reads 5,000 characters** — if the JSON event is larger, fields
  beyond the 5,000-character boundary are not extracted. Use explicit `path=` for
  reliable extraction on large events.

- **JSON must be well-formed** — string values other than `true`, `false`, and `null`
  must be double-quoted. Malformed JSON causes `spath` to silently produce no output.

- **Array `{}` creates multivalue fields** — `path=items{}.sku` returns a multivalue
  field with one value per array element. Use `mvexpand` to turn it into separate rows,
  or `mvindex` to get a single element.

- **Zero-based array indexing in JSON** — `{0}` is the first element, `{3}` is the
  fourth. XML uses one-based indexing (the same path `{3}` refers to the third element
  in XML).

- **`spath` is distributable streaming** — it runs on indexers, so it is efficient even
  on large result sets. Place it early in the pipeline.

- **Dotted field names after extraction** — after `spath` auto-extracts a JSON field
  like `order.id`, the resulting field name contains a literal dot. In `eval` and
  `where`, wrap it in single quotes: `'order.id'`. In `stats`, `table`, and `rename`
  it does not need quoting.

## See also

- `eval.md` — `spath()` eval function, `json_extract()` for JSON-only extraction
- `rex.md` — regex-based field extraction for unstructured data
