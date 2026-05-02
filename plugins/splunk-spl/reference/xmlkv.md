# xmlkv — extract key-value pairs from XML element content

Source: Splunk Search Reference 8.2.12, page 649.

## Syntax

    | xmlkv [<field>] [maxinputs=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<field>` | No | `_raw` | Field containing the XML to parse |
| `maxinputs` | No | `50000` | Maximum events processed per command invocation; command repeats in increments until all results are displayed. Do not change unless you understand the batching behavior. |

## Examples

### Auto-extract all XML key-value pairs from `_raw`

Given events whose `_raw` contains XML like:

    <game>
        <name>Settlers of Catan</name>
        <category>competitive</category>
    </game>

Running:

    index=games sourcetype=xml_events
    | xmlkv

produces fields `name=Settlers of Catan` and `category=competitive` for each event.

### Extract key-value pairs in controlled increments

Process in batches of 10,000 rather than the default 50,000:

    index=games sourcetype=xml_events
    | xmlkv maxinputs=10000
    | stats count by name, category

### Extract from a non-`_raw` field

    index=api_logs
    | xmlkv xml_payload
    | table _time, name, category

## Gotchas

- **Element text content becomes field values; element names become field names** — for
  `<name>Settlers of Catan</name>`, the field is `name` with value `Settlers of Catan`.
  XML attributes are not extracted; use `xpath` to access attributes.

- **`xmlkv` is distributable streaming** — it runs on indexers when `maxinputs` batching
  is not a concern. Place it early in the pipeline before transforming commands.

- **Malformed XML produces no output** — `xmlkv` silently skips events it cannot parse.
  Validate your XML source data if fields are unexpectedly missing.

## See also

- `xpath.md` — extract a specific value using an XPath expression (supports attributes)
- `xmlunescape.md` — decode XML entity references before parsing
- `spath.md` — structured extraction for both JSON and XML
- `extract.md` — general key-value extraction from `_raw`
- `kvform.md` — form-file based extraction
