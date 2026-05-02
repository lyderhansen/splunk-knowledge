# iconify — replace field values with icons for Splunk Web display

Source: Splunk Search Reference 8.2.12, page 350.

## Syntax

    | iconify [<field-list>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<field-list>` | no | all fields | Space-delimited list of fields to iconify. If omitted, all fields are processed. |

## Usage

`iconify` is a **distributable streaming command**. It replaces field values with the
corresponding Splunk Web icon HTML when a matching icon name is recognized. The icons are
rendered visually in the Splunk Web Events tab.

`iconify` matches field values against a built-in list of icon names (same set used by Splunk
Web's icon selector). If a value matches an icon name, it is replaced with an HTML icon
reference. Values that do not match any icon name are left unchanged.

This command is display-only and affects the Splunk Web Events tab view. The icons do not
appear in exported data (`outputcsv`, `outputlookup`) — the original string values are retained
in exports.

`iconify` is typically used with fields that already contain icon name strings (e.g., a
severity field with values like `"alert"`, `"warning"`, `"info"`) to produce a more visual
events list.

## Examples

### Iconify a severity field

    index=alerts | table _time, severity, message
    | iconify severity

### Iconify all fields

    index=network | table action, protocol, status
    | iconify

### Combine eval with iconify for conditional icon selection

    index=access_* | stats count by status
    | eval icon = case(
        status >= 500, "alert",
        status >= 400, "warning",
        status >= 300, "info",
        true(),        "check"
    )
    | table status, count, icon
    | iconify icon

## Gotchas

- **Events tab only** — icons only render on the Events tab in Splunk Web. On the Statistics
  tab, raw icon name strings appear. The command has no effect in Dashboard Studio table
  visualizations.

- **No icon renders in exports** — `outputcsv` and `outputlookup` see the original string value,
  not the icon HTML.

- **Value must exactly match an icon name** — if your field value does not match a recognized
  Splunk icon name, it is left as-is (no icon, no error). Icon names are lowercase strings like
  `"alert"`, `"warning"`, `"check"`, `"info"`, `"error"`.

- **Not useful in Dashboard Studio** — for visual status indicators in Dashboard Studio, use
  `singlevalueicon` or `eval` to produce a classification field for conditional formatting
  rather than `iconify`.

## See also

- `highlight.md` — highlight matching string terms in the Events list
- `fieldformat.md` — format field values for display without changing underlying values
- `eval.md` — `case()` pattern for producing classification fields for conditional viz coloring
