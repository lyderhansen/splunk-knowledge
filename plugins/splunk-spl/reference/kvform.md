# kvform — extract fields using a form template file

Source: Splunk Search Reference 8.2.12, page 371.

## Syntax

    | kvform [form=<form_name>] [field=<field>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `form` | No | — | Name of a `.form` file (without extension) in the Splunk `forms` directory; if omitted, uses the field value |
| `field` | No | `sourcetype` | Field whose value determines which `.form` file to use; ignored when `form=` is specified |

At least one of `form` or `field` should be meaningful; if neither is specified, `kvform`
defaults to `field=sourcetype` and looks for `<sourcetype_value>.form` files.

`kvform` looks for form files in `$SPLUNK_HOME/etc/apps/<app_name>/forms/`.

## Examples

### Extract using a specific form file

Use the `sales_order.form` template to extract fields:

    index=sales sourcetype=order_data
    | kvform form=sales_order
    | table _time, order_id, customer_name, total

### Extract using a field value to select the form

Use `field=sourcetype` so that each sourcetype's own `.form` file is applied
(e.g., `splunkd.form`, `mongod.form`):

    index=os_logs
    | kvform field=sourcetype
    | stats count by pid, command

### Extract using the eventtype field

    index=security
    | kvform field=eventtype
    | table _time, src_ip, action

## Gotchas

- **Form files must exist in the app's `forms` directory** — if the referenced `.form`
  file is missing, `kvform` silently produces no extracted fields. Verify that
  `$SPLUNK_HOME/etc/apps/<app_name>/forms/<form_name>.form` exists.

- **`kvform` only operates on `_raw`** — like `extract`, it cannot be directed to a
  different source field. To extract from a non-`_raw` field, rename it to `_raw`
  first, extract, then rename back.

- **`field=sourcetype` is the default but only works if form files match sourcetype names**
  — if you have sourcetype `access_combined` but no `access_combined.form`, the command
  silently skips those events. Verify form file names match the field values exactly.

## See also

- `extract.md` — applies `transforms.conf` extraction stanzas
- `multikv.md` — tabular / multi-row event extraction
- `rex.md` — regex-based extraction
- `xmlkv.md` — XML element-based extraction
