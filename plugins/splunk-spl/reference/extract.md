# extract — apply props/transforms field extractions to search results

Source: Splunk Search Reference 8.2.12, page 299.

## Syntax

    | extract [<extract-options>...] [<extractor-name>...]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `clean_keys` | No | From `transforms.conf` `CLEAN_KEYS` | Strip non-alphanumeric characters from extracted key names |
| `kvdelim` | No | — | Characters that separate a key from its value; if the delimiter appears in the value, that pair is skipped |
| `limit` | No | `50` | Maximum number of key-value pairs to extract automatically |
| `maxchars` | No | `10240` | How many characters of the event to scan |
| `mv_add` | No | `false` | Create multivalue fields when the same key appears more than once |
| `pairdelim` | No | — | Characters that separate key-value pairs from each other |
| `reload` | No | `false` | Force reload of `props.conf` and `transforms.conf` from disk before extracting |
| `segment` | No | `false` | Record the character offsets of each extracted pair in the results |
| `<extractor-name>` | No | — | Stanza name in `transforms.conf` to use explicitly |

All arguments are optional; `extract` with no arguments applies automatic key-value extraction
using the current sourcetype's settings from `props.conf`.

The alias for `extract` is `kv`.

## Examples

### Auto-extract with custom delimiters

Extract key-value pairs delimited by `|` or `;` between pairs, and `=` or `:` between
key and value:

    index=app_logs
    | extract pairdelim="|;", kvdelim="=:"

### Force reload of extraction configuration

Useful during development when `transforms.conf` has been updated without a full restart:

    index=app_logs
    | extract reload=true

### Extract from a non-`_raw` field

`extract` only operates on `_raw`. To extract from another field, swap it into `_raw`
temporarily:

    index=app_logs
    | rename _raw AS temp uri_query AS _raw
    | extract pairdelim="?&" kvdelim="="
    | rename _raw AS uri_query temp AS _raw

### Apply a named transforms.conf stanza

    index=access_logs
    | extract my-access-extractions

## Gotchas

- **`extract` only reads `_raw`** — unlike `rex` (which has a `field=` parameter),
  `extract` always operates on `_raw`. To extract from a different field, rename it
  to `_raw` before calling `extract`, then rename it back.

- **`limit=50` caps automatic extraction** — events with more than 50 distinct key-value
  pairs will have excess pairs silently dropped. Raise `limit` if you know the event
  has many fields.

- **`kvdelim` skips pairs where the delimiter appears in the value** — for example,
  with `kvdelim=":"`, a pair like `Referer: https://example.com` will not be extracted
  because the value contains `:`.

## See also

- `rex.md` — regex-based extraction with full PCRE control
- `erex.md` — auto-learn a regex from example values
- `multikv.md` — extract fields from tabular / multi-row formatted events
- `kvform.md` — extract fields using `.form` template files
- `xmlkv.md` — extract key-value pairs from XML tag content
- `spath.md` — structured extraction for JSON and XML
