# rename — rename one or more fields in search results

Source: Splunk Search Reference 8.2.12, page 470.

## Syntax

    | rename <field> AS <new-name> [, <field> AS <new-name>]...

Multiple renames are comma-separated or can be written as consecutive `AS` pairs in one call.
Wildcard renames use `*` on both sides.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<field>` | yes | — | The existing field name to rename. Supports `*` wildcard. Dotted field names do NOT need quotes in `rename`. |
| `<new-name>` | yes | — | The new name for the field. Quote with double quotes if it contains spaces. |

## Usage

`rename` is a **distributable streaming command**. It changes only the field name — values are
unchanged. After renaming, the old field name no longer exists; use the new name in all
subsequent commands.

Wildcard renames require `*` on both sides and replace the matched portion symmetrically:
`rename *_bytes AS *_size` renames `src_bytes` → `src_size`, `dst_bytes` → `dst_size`.

## Examples

### Rename for display-friendly column headers

    | stats count AS "Event Count", dc(src) AS "Unique Sources" by action

    ... | rename src AS source_ip, dst AS dest_ip

### Rename dotted JSON fields

    ... | rename requestParameters.bucketName AS bucket
    ... | rename userIdentity.userName AS user

Dotted fields work without quotes in `rename` (unlike `eval`/`where`).

### Wildcard rename

    ... | rename *_ip AS *_address
    -- renames src_ip -> src_address, dst_ip -> dst_address, etc.

### Rename before table for clean output

    | metadata type=sourcetypes
    | rename totalCount AS Count firstTime AS "First Event" lastTime AS "Last Event"
    | table sourcetype Count "First Event" "Last Event"

## Gotchas

- **Old name disappears immediately** — any command after `rename` must use the new name.
  Referencing the old name returns NULL or an error.

- **Rename before `table`** — `table` specifies which columns to include; if you rename after
  `table` the column is already gone. Always rename first.

- **Wildcard renames require `*` on both sides** — `rename *_ip AS address` (no `*` on right)
  is a literal rename that only matches a field literally named `*_ip`.

## See also

- `fields.md` — keep or remove fields by name
- `table.md` — select and order output columns
- `fieldformat.md` — change display format without renaming
