# Authoritative viz option schemas — extracted from `@splunk/visualization-schemas`

**Source:** `@splunk/visualization-schemas@28.6.0` (npm). The same JSON
schemas Splunk's editor and renderer use to validate dashboard JSON.
Extracted from the compiled `dist/cjs/index.js` bundle of the package.

## Why this directory exists

Up until v2.7.3 our `ds-viz-*/OPTIONS.md` files were authored from the
Splunk PDF docs (`docs/SplunkCloud-10.4.2604-DashStudio.pdf`). The PDF
has gaps, outdated key names (e.g. `xAxisTitleVisibility` instead of
`axisTitleX`), and missing options. Field-testing kept exposing
errors. These schemas are the source of truth — any drift between
this directory and `ds-viz-*/OPTIONS.md` is a skill bug to fix.

## Files

One markdown file per viz option schema. Each file is a flat table of
options with type, default, allowed values (enum/pattern), and the
description from the schema. **Do not hand-edit these files** — they
are generated and overwritten on each schemas refresh. Skill content
goes in `ds-viz-<type>/OPTIONS.md` (which interprets and adds context
on top of these raw schemas).

## Refreshing

Procedure to regenerate (when bumping `@splunk/visualization-schemas`):

```bash
# 1. Download the new package version
curl -s "https://registry.npmjs.org/@splunk/visualization-schemas" \
  | jq -r '.["dist-tags"].latest'                                 # latest version
TARBALL=$(curl -s "https://registry.npmjs.org/@splunk/visualization-schemas/<VERSION>" \
  | jq -r '.dist.tarball')

cd /tmp && rm -rf vs && mkdir vs && cd vs
curl -s "$TARBALL" -o pkg.tgz && tar -xzf pkg.tgz

# 2. Re-run the extractor + parser (Python script lives in
#    .planning/scripts/extract-viz-schemas.py — TODO: factor out from
#    the inline Python used during v2.7.4 work)

# 3. Diff against current `_schemas/` to find new/changed options
diff -r _schemas/ /tmp/vs/...
```

## How skills should reference these

Each `ds-viz-<type>/OPTIONS.md` should open with:

```markdown
> **Authoritative option list:** [_schemas/<viz>.md](../_schemas/<viz>.md)
> — extracted from `@splunk/visualization-schemas@28.6.0`. This file
> adds context, examples, and platform-level findings on top.
```

## Caveats

- **Schemas don't capture top-level viz keys** like `cornerRadius`,
  `containerOptions`, `eventHandlers` — those live OUTSIDE `options`
  on the viz object. See `ds-ref-syntax` for the full top-level key
  reference.
- **Nested objects** (e.g. `tableFormat`, `columnFormat` on
  `splunk.table`) are listed as one option in the flat table. Their
  sub-properties are documented in the corresponding skill's
  PATTERNS.md / OPTIONS.md.
- **Dynamic-options DSL patterns** are noted as `_DOS expression_` —
  see `ds-ref-syntax/DOS-REFERENCE.md` for the full grammar.
