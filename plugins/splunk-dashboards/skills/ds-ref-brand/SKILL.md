---
name: ds-ref-brand
description: Brand discovery rules for Splunk dashboards — how to translate a brand book or reference URL ("match our brand", "look like Stripe") into specific Studio decisions. Color extraction from logo, tone-word translation (e.g., "warm" → which palette family), font fallbacks when brand fonts aren't available in Studio (which has fontFamily only on splunk.markdown), and brand-tinted neutrals via OKLCH. Use when ds-couture is gathering brand context, or when a user wants the dashboard to align with corporate identity.
---

# ds-ref-brand — Brand discovery for Splunk dashboards

> **Status:** skeleton only. Body authored as new content in a follow-up task.

## Scope (what's IN)

- Color extraction from logo (manual workflow + tools).
- Tone-word translation (3 brand words → palette + typography + density bias).
- Font fallback rules (Studio has fontFamily only on `splunk.markdown`).
- Brand-tinted neutrals via OKLCH.
- "Like X" translation playbook (cross-references `ds-ref-references`).

## Out of scope (what's NOT here)

- The brand-discovery workflow itself — lives in `ds-couture` as Design Context Protocol orchestration.
- Generic palettes — see `ds-ref-color`.
- Generic fonts — see `ds-ref-typography`.

## Consults

- `ds-ref-color` (OKLCH math + categorical paletting).
- `ds-ref-typography` (font fallbacks).
- `ds-ref-references` ("like X" translations).

## Consulted by

- `ds-couture` (brand-context phase of Design Context Protocol).

## Source / migration

- All new content — no existing source. New capability for the plugin.

## Estimated size

M
