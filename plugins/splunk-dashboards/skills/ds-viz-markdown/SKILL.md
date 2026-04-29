---
name: ds-viz-markdown
description: Splunk Dashboard Studio splunk.markdown visualization — typographic backbone of every dashboard for section headers, panel descriptions, KPI explanations, editorial framing, runbook links, inline documentation, status callouts, and live token-echo panels. Provides patterns for section banners, incident callouts, footer attribution, editorial serif story-frames, and the seven-font allowlist. Use when the user asks about markdown panels, section headers, panel descriptions, runbook links, status banners, token echo, or editorial framing in Splunk Dashboard Studio.
---

# splunk.markdown — typographic content

Verified against Splunk Cloud 10.4.2604 + Splunk Enterprise 10.2.1.
Live test bench: `ds_viz_markdown_dark` / `ds_viz_markdown_light`.

The unsung hero of every great dashboard. Markdown panels turn "a wall
of charts" into a **narrated, editorial dashboard** that someone can
actually scan and understand.

## When to use

- **Section headers** that group related panels.
- **Panel descriptions** explaining what a KPI means or how it was
  computed.
- **Editorial framing** at the top of a dashboard (story, owner,
  audience, refresh cadence).
- **Runbook & link sidebars** — quick links to wikis, on-call pages,
  status pages.
- **Inline documentation** — thresholds, colour legends, footnotes.
- **Status callouts** — coloured "INCIDENT" / "ALL CLEAR" banners.
- **Live token-echo panels** — `$token$` interpolation works in
  markdown body (Studio extension).

## When NOT to use

- **Dynamic content driven by SPL search results** — markdown takes
  no data source. (But token interpolation `$tok$` from inputs and
  drilldowns DOES work.)
- **Images** → `splunk.image`.
- **Shapes / dividers** → `splunk.rectangle` / `splunk.ellipse`.
- **Tabular data needing sort/page** → `splunk.table`.

## Quick start

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

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Token echo:** `$token_name$` resolves at render time. Wrap in inline code (`` `$tok$` ``) so `*` / `_` in values don't break formatting. | Expect `$token$` to fail because docs don't mention it — Studio extension over CommonMark, fully supported. |
| **GFM tables:** use **bullet lists with bold field labels** (`- **Field**: value`). | Pipe tables `\| col \| col \|` — render as literal pipe-separated text. Renderer doesn't interpret table syntax. |
| **`fontFamily`:** one of seven allowed values (see below). | Arbitrary CSS stacks (`Georgia, serif`, `Inter`, `system-ui`) — schema rejects with `must match a schema in anyOf`. |
| **Whitespace:** blank line between paragraphs / headings / lists. JSON `\n\n`. | Single `\n` between paragraphs — collapses to a soft break. |
| **Mixed sizes:** split into two panels, each with its own `fontSize`. | Try to mix `fontSize` inside one panel — uniform per panel. |
| **Padded coloured blocks:** stack `splunk.rectangle` BEHIND the markdown. | Set `backgroundColor` expecting padding — colour touches panel border. |
| **Reference-style links:** define `[ref]: url` in same markdown string. | Forget the `[ref]: url` definition — `[text][ref]` renders as literal text. |
| **Drilldown:** embed markdown links `[text](url)`. | Try to wire `onSelectionChanged` / token updates — markdown has no event handlers. |

## `fontFamily` — seven allowed values

| Value | Class | Use for |
|---|---|---|
| `Splunk Platform Sans` | sans (UI) | Default UI typeface. |
| `Splunk Data Sans` | sans (data) | Number-friendly, KPI annotations. |
| `Splunk Platform Mono` | mono | Log lines, inline code, runbooks. |
| `Arial` | sans | Generic fallback. |
| `Helvetica` | sans | macOS-leaning sans fallback. |
| `Times New Roman` | serif | **Only allowed serif.** Editorial story copy. |
| `Comic Sans MS` | display | Avoid in production. Parody only. |

Plus DOS token interpolation: `$myFont$`, `$primary:fontName|s$`.

## Four options total

| Option | Type | Notes |
|---|---|---|
| `backgroundColor` | string | hex / `transparent`. Default theme-dependent. |
| `fontColor` | string | hex. Applies to everything (headings, links, body). |
| `fontSize` | enum | `extraSmall` \| `small` \| `default` (~14px) \| `large` \| `extraLarge`. **Uniform per panel.** |
| `markdown` | string | The actual content. |

Plus schema-supported `fontFamily` (above).

## Supported markdown syntax

CommonMark-ish subset:

- **Headings** `# H1` ... `###### H6`
- **Bold / italic / ~~strikethrough~~**
- **Inline code** `` `code` `` and fenced blocks with language tags
  (` ```spl `, ` ```json `).
- **Blockquotes** `> text`
- **Lists** — unordered (`-`/`*`), ordered (`1.`), nested.
- **Links** `[text](url)` and reference `[text][ref]`/`[ref]: url`.
- **Images** `![alt](url)` (use `splunk.image` for proper image
  panels).
- **Horizontal rules** `---`
- **Token interpolation** — `$token_name$` resolves at render time
  (Studio extension over CommonMark).

**NOT supported:**

- **GFM pipe-tables** — render as literal `|`-separated text.
- **Raw HTML** (`<div>`, `<style>`, `<script>`) — stripped/escaped.
- **Footnotes, definition lists, attribute syntax** (`{.class}`).

## Verified patterns

13+ panels in `ds_viz_markdown_dark`:

1. Default — theme defaults baseline.
2a–2e. Each `fontSize` value (`extraSmall`/`small`/`default`/`large`/`extraLarge`).
5. `fontColor` only (transparent bg).
6. `backgroundColor` + custom text colour — section grouping.
7. Alert-style red-on-dark — incident banner.
8. Lists — unordered, ordered, nested.
9. **Negative example:** GFM tables render as raw pipes (kept to
   demonstrate limitation).
10. Inline code + fenced code block.
11. Blockquote + bold + italic — "why this matters" callout.
12. Links — inline + reference-style.
13a–c. `fontFamily` variants: Times New Roman (serif),
    Splunk Platform Mono, Splunk Data Sans.

## Quick recipes

### Section header with subtle background

```json
{
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
  "options": {
    "fontSize": "extraSmall",
    "markdown": "*Source: operational data warehouse — refreshed every 15 min.*  \nMetric definitions: [runbooks/metrics.md](https://example.com/runbooks/metrics.md)"
  }
}
```

### Active-incident banner

```json
{
  "options": {
    "backgroundColor": "#3D1E1E",
    "fontColor": "#FF6B6B",
    "fontSize": "large",
    "markdown": "## INCIDENT\n\n`prod-eu-west` is degraded. **On-call**: Alex. **Runbook**: `runbooks/eu-west.md`"
  }
}
```

### Editorial serif story-frame

```json
{
  "options": {
    "fontFamily": "Times New Roman",
    "fontSize": "large",
    "markdown": "## What happened\n\n*\"At 09:42 UTC, latency in the EU region began climbing past 800 ms...\"*"
  }
}
```

### Live token echo

```json
{
  "options": {
    "markdown": "**Selected host**: `$selected_host$`\n\n**Severity filter**: `$severity|s$`"
  }
}
```

Wrap tokens in inline-code spans so values with `*` / `_` don't get
reinterpreted.

## See also

- `ds-viz-image` — actual images (logos, screenshots).
- `ds-viz-rectangle` / `ds-viz-ellipse` — shapes, dividers,
  decorative backgrounds.
- `ds-ref-design-principles` — typography hierarchy, when markdown beats
  panel titles.
- `ds-int-tokens` — for token interpolation context.
