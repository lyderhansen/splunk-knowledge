# datamodel — examine or search a data model

Source: Splunk Search Reference 10.2.0

## Syntax

    | datamodel [<data-model-name>] [<dataset-name>]
                [search | flat | acceleration_search |
                 search_string | flat_string | acceleration_search_string]
                [strict_fields=<bool>]
                [summariesonly=<bool>]
                [allow_old_summaries=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `data-model-name` | no | — | Name of the data model; omit to list JSON for all models |
| `dataset-name` | no | — | Name of a dataset within the model; omit to operate on the whole model |
| search mode | no | — | `search` returns results; `flat` strips hierarchical prefixes from field names; `acceleration_search` runs the model's accelerated search |
| `strict_fields` | no | true | When true, returns only fields defined in the model's constraints; false includes all inherited and derived fields |
| `summariesonly` | no | false | When true, returns only data already summarized in TSIDX format (accelerated models only) |
| `allow_old_summaries` | no | false | When true, uses summary directories predating the last model definition change |

## Usage

`datamodel` is a generating command — use a leading pipe and place it first in the search.
CIM field names carry the dataset prefix by default (e.g., `Authentication.user`). Use `flat` mode or
`| rename` to strip the prefix. For high-performance queries on accelerated models, prefer `tstats`.

## Examples

### List JSON for all data models

```spl
| datamodel
```

### Inspect JSON for a single model

```spl
| datamodel Authentication
```

### Search a dataset for events

```spl
| datamodel Authentication search
| search Authentication.action=success
| stats count by Authentication.user
```

### Search with flat field names (no prefix)

```spl
| datamodel Authentication search | rename Authentication.* AS *
| stats count by user, action
```

### Reveal accelerated summary coverage over time

```spl
| datamodel Authentication summariesonly=true search
| timechart span=1h count
```

## Gotchas

- **Leading pipe required** — `datamodel` is a generating command; it cannot follow another command
  without a pipe: `| datamodel ...`.
- **CIM field prefixes** — in `search` mode, all fields are prefixed with the dataset name
  (e.g., `Authentication.user`). Use `flat` mode or `| rename Authentication.* AS *` to work with
  unprefixed names.
- **`strict_fields=true` by default** — fields not declared in the model schema are hidden. Set
  `strict_fields=false` to expose all raw fields from matching events.
- **`summariesonly=true` may return no data** — if the model has not been accelerated or the summary
  window does not cover the queried time range, results will be empty.
- **Prefer `tstats` for accelerated queries** — `| tstats` is significantly faster than `| datamodel ...
  acceleration_search` for large, frequently-queried models.

## Tips

- Use `| datamodel` (no arguments) to discover what models are available and their JSON structure.
- Use `| from datamodel:<model>.<dataset>` as a cleaner alternative syntax for most search use cases.

## See also

- `tstats.md` — accelerated, high-performance data model search
- `from.md` — cleaner `from datamodel:` access syntax
- `pivot.md` — pivot-style data model queries
