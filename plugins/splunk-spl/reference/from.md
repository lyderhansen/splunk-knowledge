# from — retrieve data from a named dataset

Source: Splunk Search Reference 10.2.0

A generating command that retrieves data from a named dataset: data model datasets,
CSV lookups, KV Store lookups, or saved searches. It is the preferred replacement for
`datamodelsimple` (removed in 10.2) and a cleaner alternative to `datamodel` for
data model access.

`from` is a generating command — it uses a leading pipe and must be the first command
in a search (or inside `append`).

## Syntax

    | from <dataset_type>:<dataset_name>
    | from <dataset_type> <dataset_name>

Both colon-separated and space-separated forms are valid.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `dataset_type` | Yes | — | `datamodel`, `lookup`, or `savedsearch` |
| `dataset_name` | Yes | — | Name of the dataset; quote with `"` if it contains spaces |

### Dataset type details

| Type | Syntax | What it accesses |
|---|---|---|
| `datamodel` | `datamodel:<ModelName>.<DatasetName>` | A data model dataset or table dataset |
| `lookup` | `lookup:<lookup_definition_name>` or `lookup <filename.csv>` | CSV lookup or KV Store lookup |
| `savedsearch` | `savedsearch:<saved_search_name>` | Any saved search as a dataset |

## Examples

### CIM data model access (Authentication)

    | from datamodel:Authentication.Authentication
    | where action="failure"
    | stats count by user, src

### Internal data model access

    | from datamodel:internal_server.splunkdaccess
    | stats count by uri_path

### KV Store lookup with filter

    | from lookup:kvstorecoll_lookup
    | where CustID > 500 AND CustName="P*"
    | stats count

### CSV lookup as starting dataset

    | from lookup geo_attr_countries.csv
    | where continent="Europe"
    | table country, iso_code, subregion

### Saved search as dataset

    | from savedsearch:mysecurityquery
    | fields _time, clientip, status
    | head 100

## Gotchas

- **Field names are NOT prefixed** — unlike the `datamodel` command which prefixes fields
  with the object name (e.g., `Authentication.user`), `from` returns unprefixed field names
  (e.g., `user`). Mixing `datamodel` and `from` in the same pipeline causes field-name
  mismatches.
- **Field filtering is strict by default for data models** — `from datamodel:` returns only
  default fields and those defined in the data model constraint. Fields extracted at search
  time or from lookups are excluded unless `strict_fields=false` is set in `datamodel.conf`
  for that model.
- **Dataset must exist** — `from` fails if the referenced dataset does not exist. For data
  models, the model must be deployed to the search head and the dataset name must match
  exactly (case-sensitive).
- **Only `datamodel`, `lookup`, and `savedsearch` are valid types** — there is no
  `inputlookup` type. Use `lookup` for lookups.
- **`from` inside `append`** — generating commands normally must be first in a search, but
  `from` can be used inside `append [ | from ... ]`.
- **Knowledge object dependency** — creating a report or dashboard panel from a `from`
  search creates a dependency. If the upstream dataset changes (fields removed or renamed),
  the dependent object breaks automatically.

## Tips

- Prefer `from datamodel:` over `| datamodel ... search` for new development — the syntax
  is cleaner, field names are unprefixed, and it aligns with current documentation.
- Use `from savedsearch:` to compose modular searches — one saved search feeds another
  without duplicating the base search logic.

## See also

- `datamodel.md` — lower-level data model access (prefixed field names)
- `datamodelsimple.md` — removed in 10.2; migration guide
- `inputlookup.md` — alternative direct lookup loading
- `tstats.md` — fast aggregation over accelerated data model data
