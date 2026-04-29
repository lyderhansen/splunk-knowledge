---
name: ds-ref-visual-encoding
description: Visual encoding theory for data dashboards — what color, size, position, and shape COMMUNICATE versus DECORATE. Edward Tufte data-ink ratio applied to Studio. Chart-selection rationale (when line vs bar vs pie, when log vs linear, when stacked vs grouped). The encoding rules that pre-date Splunk: ordered data needs ordered hues, categorical needs categorical hues, length-encoding for comparison, position-encoding for trend. Use when picking a viz type, when ds-pick-viz needs rationale beneath its decision table, or when ds-critique questions encoding choices.
---

# ds-ref-visual-encoding — Visual encoding theory for dashboards

> **Status:** skeleton only. Body extracted from `ds-ref-design-principles` in a follow-up task.

## Scope (what's IN)

- The four visual encoding channels (color, size, position, shape) — what each communicates.
- Tufte data-ink ratio applied to Splunk Dashboard Studio.
- Ordered vs categorical encoding rules.
- Line (continuous time) vs bar (discrete category) decisions.
- Log vs linear scale decisions.
- Stacked vs grouped vs side-by-side rules.
- Decoration vs information — when chrome adds vs subtracts.

## Out of scope (what's NOT here)

- Per-viz options — see the relevant `ds-viz-*` skill.
- Palette specifics — see `ds-ref-color`.
- Anti-pattern detection — see `ds-ref-anti-patterns`.

## Consults

- `ds-ref-color` (when encoding requires a specific palette type).

## Consulted by

- `ds-couture` (encoding rationale per design decision).
- `ds-pick-viz` (decision-table rationale).
- `ds-critique` (encoding violations).

## Source / migration

- Extracted from: `ds-ref-design-principles` "Chart selection — decision table" rationale.
- New content: Tufte data-ink ratio, channel-by-channel encoding theory, log/linear, stacked/grouped rules.

## Estimated size

M
