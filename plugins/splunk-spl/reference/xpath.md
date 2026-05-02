# xpath — extract a value from XML using an XPath expression

Source: Splunk Search Reference 8.2.12, page 651.

## Syntax

    | xpath [outfield=<field>] <xpath-string> [field=<field>] [default=<string>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<xpath-string>` | Yes | — | XPath 1.0 expression specifying the node or attribute to extract |
| `field` | No | `_raw` | Source field containing the XML |
| `outfield` | No | `xpath` | Destination field name for the extracted value |
| `default` | No | (none) | Value to write to `outfield` when the XPath expression matches nothing |

`xpath` is a distributable streaming command. It supports the XPath syntax described in the
Python Standard Library (ElementTree XPath subset).

## Examples

### Extract an XML attribute

Given `_raw` events:

    <foo>
        <bar nickname="spock"></bar>
    </foo>

Extract the `nickname` attribute and write it to field `name`:

    sourcetype="xml"
    | xpath outfield=name "//bar/@nickname"

### Extract an element value by path

Given events with a `<DataSet>` structure, extract the `identity_id` element text:

    index=trades sourcetype=xml_trades
    | xpath outfield=identity_id "//DataSet/identity_id"

The search returns one result row per matching event with `identity_id` set.

### Filter by attribute value and extract a sibling

Extract `instrument_id` only from `<DataSet>` records where `<sname>` equals `BARC`:

    index=trades sourcetype=xml_trades
    | xpath outfield=instrument_id "//DataSet[sname='BARC']/instrument_id"

### Test extractions with makeresults

    | makeresults
    | eval xml="<DataSet xmlns=\"\"><identity_id>1037669</identity_id><sname>TARC</sname></DataSet>"
    | xpath outfield=identity_id "//DataSet/identity_id" field=xml

## Gotchas

- **`outfield` default is literally `xpath`** — if you omit `outfield=`, all extractions
  write to the same field named `xpath`. Use explicit `outfield=<meaningful_name>` for
  every extraction to avoid collisions.

- **Attributes require `@` prefix** — to extract `<bar nickname="spock">`, the path is
  `//bar/@nickname`. Omitting `@` selects the element text, not the attribute.

- **`xpath` uses Python's ElementTree subset, not full XPath 1.0** — advanced axes
  (`following-sibling`, `preceding`, `ancestor`) and functions (`translate()`,
  `normalize-space()`) are not supported. For full XPath, pre-process with a custom
  command or `spath`.

- **Only the first match is returned** — if the XPath expression matches multiple nodes,
  only the first is written to `outfield`. Use `xmlkv` or multiple `xpath` calls for
  multi-value scenarios.

## See also

- `xmlkv.md` — bulk-extract all XML element values as fields
- `xmlunescape.md` — decode XML entity references before running xpath
- `spath.md` — unified JSON and XML extraction (auto-mode and explicit path)
- `extract.md` — regex and key-value based extraction
