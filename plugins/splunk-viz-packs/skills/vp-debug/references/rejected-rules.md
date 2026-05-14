## REJECTED — fails AppInspect / Splunk Cloud vetting

### R1. app.conf must have 5 stanzas

```ini
[install]
is_configured = 0
build = 1

[id]
name = app_name

[package]
id = app_name
check_for_updates = false

[ui]
is_visible = true
label = Display Name

[launcher]
author = Author
description = Description
version = 1.0.0
```

**Missing `[id]`** → AppInspect failure.
**`is_configured = true`** → non-standard, use `0`.
**Missing `check_for_updates = false`** → warning for private apps.

### R2. default.meta must include sc_admin

```ini
[]
access = read : [ * ], write : [ admin, sc_admin ]
export = system

[visualizations/viz_name]
export = system
```

**Missing global `[]` stanza** → blocked by
`check_meta_default_write_access`.
**Missing `sc_admin`** → blocked by `check_kos_are_accessible` (Cloud
has no `admin` role).

### R3. No macOS artifacts in tarball

macOS tar silently adds `._` resource fork entries to the archive.
Splunk sees these as extra top-level directories and rejects the
upload: **"archive contains more than one immediate subdirectory:
and {app_name}"**.

`COPYFILE_DISABLE=1` is MANDATORY on macOS:

```bash
find app_dir -name '._*' -delete
find app_dir -name '.DS_Store' -delete
COPYFILE_DISABLE=1 tar czf app.tar.gz --exclude='.*' app_dir
```

`.DS_Store`, `._*` files → AppInspect failure. Missing
`COPYFILE_DISABLE=1` → Splunk install rejection.

### R4. No nested archives

Remove old `.tar.gz` files from `dist/` before packaging. Nested
archives → AppInspect failure.

### R5. No real-time saved searches

```ini
# WRONG
dispatch.earliest_time = rt-1m
dispatch.latest_time = rt

# CORRECT
dispatch.earliest_time = -1m
dispatch.latest_time = now
```

Splunk Cloud vetting rejects real-time (`check_for_real_time_saved_searches`).

### R6. README/savedsearches.conf.spec required

Must document every custom setting:

```
display.visualizations.custom.{app}.{viz}.setting = <type>
```

Missing → btool compliance warning.

### R7. No [triggers] stanza

`visualizations.conf` is a Splunk-defined conf file. Adding
`[triggers] reload.visualizations = simple` causes
`check_for_trigger_stanza` failure on Cloud.

### R8. Every viz MUST include a preview.png

Each visualization directory must contain a `preview.png` at
250×150px (or 500×300px @2x). This thumbnail is shown in the
Splunk viz picker when users select a visualization type in
ad-hoc search.

```
appserver/static/visualizations/{viz_name}/preview.png
```

Without `preview.png`, users see a generic bar-chart placeholder
and cannot distinguish between custom vizs. Generate during build:
- Render the viz to a canvas with sample data and export as PNG
- Or create a static mockup/screenshot at the correct dimensions

**MUST be a real PNG file.** An SVG renamed to `.png` renders as
a black box in the picker. Use `cairosvg`, ImageMagick (`convert`),
or Pillow to convert SVG → PNG if needed.

