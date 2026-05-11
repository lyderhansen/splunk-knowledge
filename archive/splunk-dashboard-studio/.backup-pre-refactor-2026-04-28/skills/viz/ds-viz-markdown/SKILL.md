---
name: ds-viz-markdown
description: |
  splunk.markdown - the typographic backbone of every dashboard. Use markdown
  panels for section headers, panel descriptions, KPI explanations, editorial
  framing, runbook links, and inline documentation. Verified against the 10.4
  Dashboard Studio docs.
version: 1.1.0
verified_against: SplunkCloud-10.4.2604-DashStudio + Splunk Enterprise 10.2.1 (live)
test_dashboards:
  - ds_viz_markdown_dark
  - ds_viz_markdown_light
  - ds_interactivity_core_dark (§1 + §2 use markdown for live token echo)
  - ds_interactivity_core_light
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

- For dynamic content driven by SPL search results — markdown takes no
  data source. (But token interpolation `$tok$` from inputs and
  drilldowns DOES work; see "Supported markdown syntax" below.)
- For images — use `splunk.image` instead.
- For shapes/dividers — use `splunk.rectangle` or `splunk.ellipse`.
- For tabular data that needs sorting / paging / column resizing — use
  `splunk.table`. The markdown renderer also doesn't render GFM
  pipe-tables at all (they show as raw `|`-separated text), so even
  static tables don't work — use bullet lists with bold field labels.

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

`splunk.markdown` supports a CommonMark-ish subset, with a couple of
notable gaps and a couple of Studio-specific superpowers. Verified live
in `ds_interactivity_core` and the test bench:

**Supported:**

- **Headings** `# H1` ... `###### H6`
- **Bold** `**text**`, **italic** `*text*`, ~~strikethrough~~ `~~text~~`
- **Inline code** `` `code` `` and **fenced code blocks** with language
  tags (` ```spl `, ` ```json `, ` ```bash `)
- **Blockquotes** `> text`
- **Unordered lists** with `-` or `*`, **ordered lists** with `1.`,
  **nested** lists
- **Links** `[text](url)` and reference-style `[text][ref]`, `[ref]: url`
- **Images** `![alt](url)` (use `splunk.image` for proper image panels)
- **Horizontal rules** `---`
- **Token interpolation** — `$token_name$` references in the markdown
  body resolve to the live token value at render time. This is a
  Studio-only extension on top of CommonMark and is the canonical way
  to build "live token echo" or status panels driven by inputs and
  drilldowns. Wrap token references in inline-code spans
  (`` `$tok$` ``) so values containing `*` or `_` don't get
  reinterpreted as markdown formatting.

**NOT supported (verified rejected or rendered raw):**

- **GFM pipe-tables** (`| col | col |\n|---|---|` etc.). These render as
  literal pipe-separated text — the renderer does not interpret the
  table syntax. Use bullet lists with bold field labels instead, or
  drop in a `splunk.table` panel with a `ds.test` source for tabular
  layout.
- **Raw HTML** (`<div>`, `<style>`, `<script>`, etc. — stripped or
  escaped).
- **Markdown attributes / extensions**: footnotes, definition lists,
  attribute syntax (`{.class}`).

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
| 9     | Tables (negative example — renders as raw `\|`-text in 10.2.x; kept to demonstrate the limitation) | If interactivity is wanted use `splunk.table`. For static tabular display use bullet lists with bold labels. |
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

1. **GFM pipe-tables don't render.** Writing
   `| col1 | col2 |\n| --- | --- |\n| a | b |` shows up as literal
   pipe-separated text in 10.2.x. The markdown renderer does not
   interpret the table syntax. Use one of:
   - **Bullet lists with bold field labels** —
     `- **Field**: value` reads cleanly as a key/value pair and is
     what production-grade markdown panels in this codebase use.
     See `ds_interactivity_core` §1 + §2 for the canonical form.
   - A separate `splunk.table` panel sourced from `ds.test` if you
     genuinely need a sortable / paginated table.
2. **Token interpolation works — and it's actually useful.** `$token$`
   references inside the `markdown` body resolve at render time, so
   you can build live "token echo" / status panels without an SPL
   round-trip. Wrap each token in an inline-code span
   (`` `$tok$` ``) so values containing `*`, `_`, or backticks don't
   get reinterpreted as markdown formatting. (This is a Studio
   superpower over CommonMark — see the §1 panel in
   `ds_interactivity_core` for verified usage.)
3. **Raw HTML is stripped.** If you paste `<div style="...">`, it
   disappears or shows as escaped text. Use `fontColor`,
   `backgroundColor`, `fontSize`, and `fontFamily` options instead.
4. **`fontColor` applies to everything.** It overrides headings,
   links, and code-inline color. If you want a colored heading on
   default-colored body, split it into two markdown panels.
5. **`backgroundColor` is the entire panel**, not just the text.
   Padding is minimal — colored backgrounds touch the panel border.
   Use a `splunk.rectangle` behind the markdown if you want padded
   color blocks.
6. **Code-block backgrounds are theme-controlled.** Inline `` `code` ``
   and fenced ``` blocks ``` get a subtle grey tint that you can't
   override with `backgroundColor` (which sets the panel, not the
   inline code).
7. **Long content scrolls.** If the markdown is taller than the panel
   height, the panel becomes scrollable. Size your panels generously
   — hero callouts especially.
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
