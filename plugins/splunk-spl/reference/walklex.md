# walklex — enumerate indexed terms from tsidx/lexicon files

Source: Splunk Search Reference 10.2.0

## Syntax

    | walklex
      index=<string> [index=<string>...]
      [type=all|field|fieldvalue|term]
      [prefix=<string> | pattern=<wc-string>]
      [splunk_server=<wc-string>]
      [splunk_server_group=<wc-string>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `index` | Yes | — | Index name(s) to inspect. Repeat for multiple indexes, e.g., `index=main index=security` |
| `type` | No | `all` | Term type to return: `field` (field names only), `fieldvalue` (field::value pairs), `term` (raw tokens, no field pairs), or `all` (all three) |
| `prefix` | No | — | Filter to terms that begin with this string. Mutually exclusive with `pattern` |
| `pattern` | No | `*` | Wildcard filter for terms. Mutually exclusive with `prefix` |
| `splunk_server` | No | all peers | Distributed search peer to query. Use `local` for the search head. Omit on Splunk Cloud |
| `splunk_server_group` | No | none | Limit to a named server group. Omit on Splunk Cloud |

## Usage

`walklex` is a generating command (leading `|`) that reads the merged lexicon or `.tsidx` files directly from index buckets. It is useful for discovering indexed field names, auditing what terms exist in an index, and accelerating searches by confirming that a field is indexed before using `tstats`.

**Hot buckets are excluded** — `walklex` only reads warm and cold buckets (buckets that have a merged lexicon or single tsidx file). Very recent data will not appear.

## Examples

### List all indexed field names in an index

    | walklex index=main type=field
    | stats count by term

### Find all raw tokens starting with "error"

    | walklex index=main type=term prefix="error"
    | sort - count

### Audit indexed field-value pairs (useful for tstats optimization)

    | walklex index=web type=fieldvalue pattern="status::*"
    | rex field=term "(?<field>[^:]+)::(?<value>.+)"
    | stats count by field, value

### Count all raw tokens excluding indexed field pairs

    | walklex index=main type=term
    | stats sum(count) AS total_terms by term
    | sort - total_terms

## Gotchas

- **Hot buckets are not scanned** — recently indexed data will not appear until buckets roll from hot to warm. There is no workaround short of manually rolling buckets or waiting.
- **Results are not guaranteed to be consistent** — due to the variable nature of merged lexicon and tsidx files, `walklex` may return different results across runs on the same index.
- **`type=all` mixes three formats** — when using `type=all`, both bare terms and `field::value` pairs are returned mixed together. Split on `::` to separate them: `| rex field=term "(?<f>[^:]+)::(?<v>.+)"`.
- **Only works on event indexes** — `walklex` cannot be used on metric indexes.
- **Search filters block walklex** — users with role-based search filters applied cannot use `walklex` unless they have an additional unrestricted role.

## See also

- `tstats.md` — high-performance search over indexed fields discovered via walklex
- `metadata.md` — higher-level metadata (sourcetype, host, source) with event counts
- `typeahead.md` — autocomplete suggestions from the typeahead cache
