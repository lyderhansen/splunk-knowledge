# Viz Novelty Scores

## Contents
- Scoring table (1-5 scale by viz type)
- Pack threshold rule
- When to warn
- Anti-donut alternatives
- Scoring examples

## Scoring table

Higher scores = more unexpected, more brand-differentiating. Score 1 types are reflexive AI defaults; score 5 types are experimental and memorable.

| Viz Type | Novelty Score (1-5) | Notes |
|---|---|---|
| Donut / Pie | 1 | Reflexive AI default. Never bold. Almost always replaceable. |
| Half-donut (semi-circle gauge) | 2 | Pie variant. Common. Acceptable only if brand calls for circular motifs. |
| Simple bar chart (vertical) | 2 | Solid but uninspiring. Often misused for time-series. |
| Simple line chart | 2 | Common. Acceptable for time-series; uninspiring for anything else. |
| Grouped bar chart | 3 | Solid choice. Useful for multi-series comparison. |
| Stacked bar chart | 3 | Neutral. Communicates part-to-whole, but visually busy. |
| Area chart | 3 | More visual than line; still common. |
| KPI tile / single value | 3 | Essential for ops dashboards; use sparingly, not as the primary statement. |
| Heatmap / thermal grid | 4 | Interesting. Reveals patterns invisible in bars or lines. |
| Radial / polar bar chart | 4 | Non-default. Brand-differentiating when used intentionally. |
| Bullet gauge | 4 | Replaces donut without sacrificing meaning. Strong for KPI-heavy packs. |
| Sparkline matrix | 4 | Compact multi-series view. Signals sophistication. |
| Lollipop chart | 4 | Cleaner than bar. Signals intentional design choice. |
| Diverging bar chart | 4 | Excellent for positive/negative breakdowns (NPS, sentiment, variance). |
| Timeline / event feed | 5 | Unexpected. Memorable in ops and security contexts. |
| Radar / spider chart | 5 | Polarizing but distinctive. Strong for multi-attribute profiles. |
| Sankey / flow diagram | 5 | Experimental. Visually complex; powerful for flow and attribution. |
| Waffle chart | 5 | Non-standard. Excellent for proportional data with a fun or editorial tone. |
| Candlestick chart | 5 | Highly specific. Signals domain expertise in fintech or trading. |
| Geospatial grid | 5 | Unexpected in Splunk. Very high impact for geo-distributed data. |
| Custom composite (multi-part canvas) | 5 | Hand-crafted. Highest brand differentiation possible. |
| New or unknown viz type | 5 | Benefit of the doubt — if it is not on this list, treat it as experimental (score 5). |

## Pack threshold

Pack novelty = sum of novelty scores across all vizs in the pack.

Minimum acceptable pack novelty = **3 x vizCount**.

Examples:
- 4-viz pack: minimum total = 12 (average score 3.0 per viz)
- 6-viz pack: minimum total = 18
- 8-viz pack: minimum total = 24

A pack of all score-2 vizs (e.g., four simple bar charts and two simple lines) scores 12 for a 6-viz pack — below the minimum of 18. That pack will receive a novelty warning.

A pack at the threshold is acceptable, not aspirational. Push above the minimum when the brand or domain allows.

## When to warn

If the pack total is below 3 x vizCount:

1. List the viz types that scored 1 or 2.
2. For each low-scoring viz, suggest one score-4 or score-5 replacement that fits the same data contract.
3. Show the new projected total if the replacements are adopted.

**Do NOT hard-block.** Soft warning only. The user may have legitimate reasons for a conservative pack (executive audience, compliance dashboard, brand with deliberately minimal aesthetic). If the user acknowledges the warning and confirms the inventory, proceed.

Example warning format:

```
Novelty check: pack total = 10 / minimum 15 (5-viz pack).
Low-scoring vizs:
  - Donut (score 1) → consider: bullet gauge, radial progress bar, or waffle chart
  - Simple bar (score 2) → consider: lollipop chart or diverging bar
Projected total with replacements: 17 — above threshold.
Proceed with current inventory? (y to confirm, or update the list)
```

## Anti-donut alternatives

| Instead of | Try instead |
|---|---|
| Donut | Bullet gauge, radial progress bar, waffle chart, horizontal stacked bar |
| Pie | Treemap, ranked horizontal bar, heatmap cell grid |
| Simple bar chart | Lollipop chart, diverging bar, grouped slope chart |
| Plain KPI tile | Sparkline-in-KPI, threshold band behind the number, animated counter with gauge ring |
| Simple line chart | Area chart with gradient fill, sparkline matrix, candlestick (for time-series with open/close) |
| Half-donut gauge | Bullet gauge with target marker, radial burst, fill-thermometer |

## Scoring examples

### Low-score pack (below threshold)

Domain: retail ops (4-viz pack, minimum = 12)

| Viz | Type | Score |
|---|---|---|
| Sales volume | Simple bar chart | 2 |
| Revenue by region | Donut | 1 |
| YTD vs target | Simple bar chart | 2 |
| Top products | Pie | 1 |
| **Total** | | **6 / 12 minimum** |

Novelty warning triggered. Suggestions: replace donut with bullet gauge (+3), pie with ranked horizontal bar (+2), one simple bar with lollipop chart (+2). Projected total: 13.

### High-score pack (above threshold)

Domain: CDN / network ops (5-viz pack, minimum = 15)

| Viz | Type | Score |
|---|---|---|
| Request rate heatmap | Heatmap / thermal grid | 4 |
| Cache hit KPI | Bullet gauge | 4 |
| Error timeline | Timeline / event feed | 5 |
| Latency distribution | Radial / polar bar | 4 |
| Edge node status | Sparkline matrix | 4 |
| **Total** | | **21 / 15 minimum** |

No warning. Pack is above threshold. Strong brand differentiation expected.
