# tags — add tag fields based on Knowledge Manager tag definitions

Source: Splunk Search Reference 8.2.12, page 563.

## Syntax

    | tags [inclall=<bool>] [<field-list>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `inclall=<bool>` | no | `false` | If `true`, includes all tag fields even when they have no matching tags for an event. Results in many null/empty fields for untagged events. |
| `<field-list>` | no | all fields | Space-delimited list of fields to check for tag definitions. If omitted, all fields are checked. |

## Usage

`tags` is a **distributable streaming command**. It consults the Knowledge Manager tag
definitions and adds a `tag` field (multivalue) and individual `tag::<tagname>` fields to each
event based on field-value pairs that have been tagged in Splunk Web or `tags.conf`.

Tags are defined in the Knowledge Manager UI (Settings > Tags) or in `tags.conf`. A tag
associates a human-readable label with a specific `field=value` pair. For example, if
`action=blocked` is tagged as `"deny"` and `"firewall"`, events with `action=blocked` get
`tag::action = "deny"` and `tag::action = "firewall"`.

The `tag` field is a multivalue field containing all tags across all tagged fields on the event.

### How tag fields are named

For each tagged field, `tags` creates `tag::<fieldname>` as a multivalue field. The generic
`tag` field is also populated and contains all tags from all tagged fields combined.

### Common use in CIM (Common Information Model)

Tags are the primary mechanism for CIM data model membership. An event belongs to a data model
node when it has specific required tags set. For example, an Authentication event requires
`tag=authentication`.

## Examples

### Add all tags to events

    index=network | tags

### Check for a specific tag value

    index=network | tags
    | search tag=authentication

### Use tags with specific fields only

    index=firewall | tags action, src_ip

### Filter to CIM Authentication events

    index=* | tags
    | search tag=authentication tag=default
    | stats count by user, src

### Dashboard-specific pattern: tag-aware CIM lookup

    index=* sourcetype=* | tags
    | eval is_auth = if(mvfind(tag, "authentication") >= 0, 1, 0)
    | stats count by is_auth, sourcetype

## Gotchas

- **Tags must be defined in Knowledge Manager first** — `tags` does not create tags at search
  time; it only reads pre-defined tags from `tags.conf` or the UI. If no tags are defined,
  no tag fields are added.

- **`inclall=true` adds many empty fields** — when enabled, every possible `tag::field` column
  appears in results even when empty. This can make `table` output very wide. Only use it when
  debugging tag coverage.

- **Tags are case-sensitive** — `tag=Authentication` and `tag=authentication` are different. CIM
  tags are conventionally lowercase.

- **Tags apply at search time, not index time** — changing a tag definition affects future
  searches but not already-stored events. This is purely a search-time enrichment.

## See also

- `eval.md` — `mvfind()`, `mvindex()` for working with the multivalue `tag` field
- `lookup.md` — for static field enrichment without the tags framework
- `fields.md` — drop `tag::*` fields if you do not need them in output
