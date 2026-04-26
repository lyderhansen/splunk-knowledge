---
name: ds-viz-markdown
description: |
  splunk.markdown - the typographic backbone of every dashboard. Use markdown
  panels for section headers, panel descriptions, KPI explanations, editorial
  framing, runbook links, and inline documentation. Verified against the 10.4
  Dashboard Studio docs.
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_markdown_dark
  - ds_viz_markdown_light
related:
  - ds-viz-image
  - ds-viz-rectangle
  - ds-viz-ellipse
---

# splunk.markdown

The unsung hero of every great dashboard. Markdown panels are how you go from
"a wall of charts" to a **narrated, editorial dashboard** that someone can
actually scan and understand.

## When to use

- **Section headers** that group related panels (instead of relying on the
  visualization grid alone).
- **Panel descriptions** that explain what a KPI means or how it was computed.
- **Editorial framing** at the top of a dashboard (story, owner, audience,
  refresh cadence).
- **Runbook & link sidebars** - quick links to wikis, on-call pages, and
  status pages.
- **Inline documentation** - thresholds, color legends, footnotes, source
  attributions.
- **Status callouts** - colored "INCIDENT" or "ALL CLEAR" banners.

## When NOT to use

- For dynamic content driven by SPL - markdown is **static text only**, no
  token interpolation in the body.
- For images - use `splunk.image` instead.
- For shapes/dividers - use `splunk.rectangle` or `splunk.ellipse`.
- For tabular data that needs sorting/paging - use `splunk.table`.

## Data shape

`splunk.markdown` does not take a data source. The `markdown` option is the
entire content.

## Options (10.4 PDF)

| Option            | Type   | Values / range                                              | Notes                                              |
| ----------------- | ------ | ----------------------------------------------------------- | -------------------------------------------------- |
| `backgroundColor` | string | hex / `transparent`                                         | Panel background. Default is theme-dependent.      |
| `fontColor`       | string | hex                                                         | Text color for the entire panel.                   |
| `fontSize`        | enum   | `extraSmall` \| `small` \| `default` \| `large` \| `extraLarge` | Scales all text. Default is `default` (~14px).     |
| `markdown`        | string | Markdown source                                             | The actual content. See supported syntax below.    |

Also commonly used and supported by the renderer (not in the PDF table but
present in the schema):

| Option        | Type   | Notes                                                  |
| ------------- | ------ | ------------------------------------------------------ |
| `fontFamily`  | enum   | One of seven named fonts (see below) **or** a token.   |

### `fontFamily` — allowed values

The schema rejects arbitrary CSS font stacks like `"Georgia, serif"`. Only
seven literal font names are accepted, plus DOS token interpolation:

| Allowed value          | Class      | Use for                                          |
| ---------------------- | ---------- | ------------------------------------------------ |
| `Splunk Platform Sans` | sans (UI)  | Default UI typeface — usually no need to set.    |
| `Splunk Data Sans`     | sans (data)| Number-friendly variant, KPI annotations.        |
| `Splunk Platform Mono` | mono       | Log lines, inline code, runbook excerpts.        |
| `Arial`                | sans       | Generic fallback for portable copy.              |
| `Helvetica`            | sans       | macOS-leaning sans fallback.                     |
| `Times New Roman`      | serif      | The **only** allowed serif. Editorial story copy.|
| `Comic Sans MS`        | display    | Avoid in production. Useful for parody / demos.  |

Plus token interpolation via DOS: `$myFont$`, `$primary:fontName|s$`, etc.

If you set anything else (`Georgia, serif`, `Inter`, `system-ui`, web fonts),
the editor rejects the panel with `must match a schema in anyOf`.

## Supported markdown syntax

`splunk.markdown` supports **all standard Markdown except raw HTML**.
Verified in the test bench:

- **Headings** `# H1` ... `###### H6`
- **Bold** `**text**`, **italic** `*text*`, ~~strikethrough~~ `~~text~~`
- **Inline code** `` `code` `` and **fenced code blocks** ``` ``` ```
- **Blockquotes** `> text`
- **Unordered lists** with `-` or `*`, **ordered lists** with `1.`, **nested**
- **Tables** with pipe syntax (`| col | col |`)
- **Links** `[text](url)` and reference-style `[text][ref]`, `[ref]: url`
- **Images** `![alt](url)` (use `splunk.image` for proper image panels)
- **Horizontal rules** `---`

What does **not** work:

- Raw HTML (`<div>`, `<style>`, `<script>` etc. is stripped or escaped).
- Markdown attributes / extensions like footnotes, definition lists.
- Token interpolation in the markdown body (e.g., `$token$` is rendered as
  literal text).

## Verified patterns (test-dashboard reference)

The patterns below are **all rendered and verified** in
`ds_viz_markdown_dark` / `ds_viz_markdown_light`.

| Panel | What it demonstrates                                  | Where to use                              |
| ----- | ----------------------------------------------------- | ----------------------------------------- |
| 1     | Default markdown - inherits theme defaults            | Baseline editorial copy                   |
| 2a-2e | Each `fontSize` value in its own panel                | Picking the right size for context        |
| 5     | `fontColor` only (transparent bg)                     | Single-message status panels              |
| 6     | `backgroundColor` + custom text color                 | Section grouping, visual zones            |
| 7     | Alert-style red-on-dark                               | Active incident banners (sparingly)       |
| 8     | Lists - unordered, ordered, nested                    | Steps, regions, environments              |
| 9     | Tables                                                | KPI quick-reference, threshold tables     |
| 10    | Inline code + fenced code block                       | SPL snippets, runbooks                    |
| 11    | Blockquote + bold + italic                            | "Why this matters" callouts               |
| 12    | Links (inline + reference-style)                      | Sidebar of quick links                    |
| 13a   | `fontFamily=Times New Roman` (only allowed serif)     | Editorial / long-form story panels        |
| 13b   | `fontFamily=Splunk Platform Mono`                     | Log excerpts, code-leaning copy           |
| 13c   | `fontFamily=Splunk Data Sans`                         | KPI annotations, tabular numbers          |

## Drilldown

`splunk.markdown` does **not** have built-in drilldown handlers (no
`onSelectionChanged` events) - it's a static content panel.

To make markdown clickable, embed a markdown link:

```markdown
See the [SOC overview dashboard](https://splunk.example.com/dashboard/soc).
```

The link opens normally on click. There is no way to fire token updates from
inside markdown - use a separate input panel (`splunk.input.dropdown` etc.)
for interactivity.

## Common gotchas

1. **No token interpolation in the body**. Writing `Hello $user$` renders
   literally as `Hello $user$`. If you need token-driven copy, the only
   workaround is to maintain multiple markdown panels and toggle them via
   layout visibility tokens (advanced).
2. **Raw HTML is stripped.** If you paste `<div style="...">`, it
   disappears or shows as escaped text. Use `fontColor`, `backgroundColor`,
   `fontSize`, and `fontFamily` options instead.
3. **`fontColor` applies to everything.** It overrides headings, links, and
   code-inline color. If you want a colored heading on default-colored body,
   you have to split it into two markdown panels.
4. **`backgroundColor` is the entire panel**, not just the text. Padding is
   minimal - colored backgrounds touch the panel border. Use a `splunk.rectangle`
   behind the markdown if you want padded color blocks.
5. **Code-block backgrounds are theme-controlled.** Inline `` `code` `` and
   fenced ``` blocks ``` get a subtle grey tint that you can't override with
   `backgroundColor` (which sets the panel, not the inline code).
6. **Tables don't sort or paginate.** Markdown tables are visual only. If
   you need interactivity, use `splunk.table` with a static `ds.test` data
   source.
7. **Long content scrolls.** If the markdown is taller than the panel
   height, the panel becomes scrollable. Size your panels generously - hero
   callouts especially.
8. **Headings render bigger than `fontSize` suggests.** `fontSize=default`
   is ~14px for body text, but `# H1` inside is still `H1`-sized. The five
   `fontSize` values *scale* the entire hierarchy.
8b. **`fontSize` is uniform per panel.** There is **no way** to mix sizes
   inside one markdown panel — `fontSize` scales every line, every heading,
   every table cell uniformly. If you want hero copy next to footnotes,
   you must use **two markdown panels**, each with its own `fontSize`.
   Same constraint applies to `fontColor` and `fontFamily`: one value per
   panel, no inline overrides. (Markdown's own `**bold**` and `# heading`
   syntax still bumps weight and relative size *within* the panel's scale.)
9. **Whitespace matters.** Markdown needs a blank line between paragraphs,
   between headings and lists, and between paragraphs and code blocks. JSON
   string `\n\n` is your friend - single `\n` collapses to a soft break.
10. **Reference-style links need a definition.** `[text][ref]` requires
    `[ref]: url` somewhere in the same markdown string. Forgetting the
    definition silently renders `[text][ref]` as literal text.

## Quick recipes

### Section header with subtle background

```json
{
  "type": "splunk.markdown",
  "options": {
    "backgroundColor": "#1A2440",
    "fontColor": "#E8E8E8",
    "fontSize": "large",
    "markdown": "## Service health\n\nLatency, error-rate, and saturation across the prod fleet."
  }
}
```

### Footer / source attribution

```json
{
  "type": "splunk.markdown",
  "options": {
    "fontSize": "extraSmall",
    "markdown": "*Source: operational data warehouse - refreshed every 15 min.*  \nMetric definitions: [runbooks/metrics.md](https://example.com/runbooks/metrics.md)"
  }
}
```

### Active-incident banner

```json
{
  "type": "splunk.markdown",
  "options": {
    "backgroundColor": "#3D1E1E",
    "fontColor": "#FF6B6B",
    "fontSize": "large",
    "markdown": "## INCIDENT\n\n`prod-eu-west` is degraded. **On-call**: Alex. **Runbook**: `runbooks/eu-west.md`"
  }
}
```

### Editorial story-frame (serif)

```json
{
  "type": "splunk.markdown",
  "options": {
    "fontFamily": "Times New Roman",
    "fontSize": "large",
    "markdown": "## What happened\n\n*\"At 09:42 UTC, latency in the EU region began climbing past 800 ms...\"*"
  }
}
```

`Times New Roman` is the only allowed serif. Web fonts and CSS stacks
(`Georgia`, `Inter`, `system-ui`, `serif`) are rejected by the schema —
see the `fontFamily` allowed values table above.

## See also

- `ds-viz-image` - for actual images (logos, screenshots)
- `ds-viz-rectangle` / `ds-viz-ellipse` - for shapes, dividers, decorative
  backgrounds
- `ds-design-principles` - typography hierarchy, when to use markdown vs
  panel titles
