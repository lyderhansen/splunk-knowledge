# The 8 absolute bans

These CSS / Canvas patterns are NEVER acceptable in cv-sketch (HTML) or cv-create (Canvas). They are the most recognizable AI design tells. If you find yourself about to write any of them, stop and rewrite the element with a different approach entirely.

These rules apply to BOTH the HTML mockup AND the Canvas port. cv-build's validator will grep for the grep-detectable ones (BAN-1, BAN-2).

## BAN-1 — Side-stripe borders on cards / panels / callouts

**HTML pattern (FORBIDDEN):** `border-left: Npx solid <any color>` where N > 1

**Canvas pattern (FORBIDDEN):** drawing a 2-5px colored vertical bar at the left or right edge of a panel as a status indicator.

**Includes:** hard-coded colors AND CSS variables. `border-left: 3px solid red` is forbidden. So is `border-left: 4px solid var(--color-warning)`. So is `border-left: 5px solid oklch(...)`. It doesn't matter what the variable name is.

**Why:** this is the single most overused "design touch" in admin, dashboard, and medical UIs. It never looks intentional regardless of color, radius, opacity, or naming.

**Rewrite:** use a different element structure entirely. Don't just swap to `box-shadow inset`. Reach for full borders, background tints, leading numbers/icons, or no visual indicator at all.

## BAN-2 — Gradient text

**HTML pattern (FORBIDDEN):** `background-clip: text` (or `-webkit-background-clip: text`) combined with a gradient background.

**Canvas pattern (FORBIDDEN):** filling text via `createLinearGradient` / `createRadialGradient` as `ctx.fillStyle`.

**Why:** gradient text is decorative rather than meaningful. Top-3 AI design tell.

**Rewrite:** use a single solid color for text. If you want emphasis, use weight or size, not gradient fill.

## BAN-3 — Status colors as series colors

**Pattern (FORBIDDEN):** using red / green / amber to differentiate two unrelated series (e.g., "Revenue red, Cost green").

**Why:** status colors carry universal severity meaning. Stealing them for series colors confuses both layers — the user can't tell if "red bar" means "this category" or "this is bad".

**Rewrite:** use the series palette from `DESIGN-LOCK.md.global.palette.series`. Reserve status colors for severity indicators only.

## BAN-4 — Red / green as sole differentiator

**Pattern (FORBIDDEN):** any data viz where the ONLY difference between two states is red vs green.

**Why:** 8% of users have red-green color blindness.

**Rewrite:** pair red/green with shape, position, label, or icon. A "good vs bad" pair must work in black and white.

## BAN-5 — Cards inside cards

**HTML pattern (FORBIDDEN):** a rounded card with shadow containing another rounded card with shadow.

**Canvas pattern (FORBIDDEN):** nested rectangles with separate shadows or strokes.

**Why:** visual noise. Looks templated.

**Rewrite:** flatten the hierarchy. Group related content with whitespace, dividers, or background tint, not nested containers.

## BAN-6 — Generic gradient backgrounds

**Pattern (FORBIDDEN):** purple-to-blue, cyan-to-pink, the "AI gradient palette" — UNLESS the brand has explicitly requested it.

**Why:** top-5 AI design tell. Looks like a stock SaaS landing page.

**Rewrite:** solid brand color with subtle radial accent, or generated gradient PNG using actual brand hues from DESIGN-LOCK.md.global.palette.

## BAN-7 — "QUESTION 05" / "SECTION 01" meta-labels

**Pattern (FORBIDDEN):** numbered section headers with prefix like `01 / FEATURES` or `QUESTION 03`.

**Why:** looks cheap and templated. From gpt-taste's meta-label ban.

**Rewrite:** remove them entirely. Use the section content itself to establish hierarchy.

## BAN-8 — Centered-everything

**Pattern (FORBIDDEN):** every section using center-aligned text with centered images as the default layout.

**Why:** left-aligned text with asymmetric layouts feels more designed.

**Rewrite:** mix alignments. Center is reserved for moments of emphasis (the hero KPI, an "empty state" illustration), not the default.

## Self-check before showing the user

Before opening mockup.html in the browser, do a quick scan:

```
grep -E 'border-(left|right): [0-9]+px' mockup.html  # → should be empty
grep -E 'background-clip:\s*text' mockup.html        # → should be empty
```

If either grep finds matches, fix them before proceeding to Stage D.
