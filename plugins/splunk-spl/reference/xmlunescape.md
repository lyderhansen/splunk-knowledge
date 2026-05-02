# xmlunescape — decode XML entity references in field values

Source: Splunk Search Reference 8.2.12, page 651.

## Syntax

    | xmlunescape [maxinputs=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `maxinputs` | No | `50000` | Maximum events processed per command invocation. The command repeats in increments until all results are displayed. Do not change unless you understand the batching behavior. |

`xmlunescape` is distributable streaming by default. It becomes centralized streaming if
the `local` setting in `commands.conf` is set to `true`.

## Examples

### Decode entity references in `_raw` before XML parsing

    index=api_responses sourcetype=xml_encoded
    | xmlunescape
    | xmlkv
    | table _time, name, category

### Decode then apply xpath

When event `_raw` contains encoded XML like `&lt;DataSet&gt;...&lt;/DataSet&gt;`,
decode first so that `xpath` can traverse the structure:

    index=api_responses
    | xmlunescape
    | xpath outfield=identity_id "//DataSet/identity_id"
    | table _time, identity_id

## Gotchas

- **`xmlunescape` operates on `_raw` only** — it decodes entity references in the raw
  event text. There is no `field=` parameter. If the encoded XML is in a different field,
  use `eval` with `replace()` to decode the specific entities you need, or rename the
  field to `_raw` before calling `xmlunescape`.

- **Only standard XML entities are decoded** — the command handles `&amp;` (`&`),
  `&lt;` (`<`), `&gt;` (`>`), `&quot;` (`"`), and `&apos;` (`'`). Custom entity
  references defined in a DTD are not decoded.

- **Decode before parsing** — always place `xmlunescape` before `xmlkv` or `xpath`
  when the source data uses entity-encoded XML. Calling `xmlkv` on encoded data produces
  no fields because the angle brackets are not recognized as tag delimiters.

## See also

- `xmlkv.md` — extract key-value pairs from XML element content
- `xpath.md` — extract a specific value using an XPath expression
- `spath.md` — structured extraction for JSON and XML
