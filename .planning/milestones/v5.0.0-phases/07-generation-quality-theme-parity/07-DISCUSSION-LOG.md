# Phase 7: Discussion Log

**Date:** 2026-05-16
**Areas discussed:** 4/4 selected

## Area 1: Formatter Option Derivation

### Q1: How should Claude decide which formatter options to generate?
- Options: Follow viz-blueprints literally | Blueprint as baseline + brand reasoning | Claude reasons from scratch
- **Selected:** Blueprint as baseline + brand reasoning

### Q2: Universal options on every viz?
- Options: themeMode + accentColor + accentIntensity | Larger 5+ set | No universal set
- **Selected:** Other — evaluate which ones, but avoid duplicating Dashboard Studio controls (e.g., bgColor already in DS)

### Q3: Blueprint Settings as minimum or suggestion?
- Options: Minimum (always include all) | Suggestion (Claude can drop)
- **Selected:** Suggestion — Claude can drop irrelevant ones

## Area 2: accentIntensity Scaling

### Q1: Mapping curve (0-100 to visual)
- Options: Linear | Exponential | Stepped
- **Selected:** Linear scaling

### Q2: What does intensity=0 look like?
- Options: Clean and flat | Minimal baseline with shadow | You decide
- **Selected:** Clean and flat — no glow, no shadow, no ambient

### Q3: Which properties does accentIntensity scale?
- Options: Glow only | Ambient light | Vignette | All mood effects uniformly
- **Selected:** Glow only (shadowBlur + shadowColor alpha). Other mood effects should have their own individual formatter settings.

## Area 3: Light Theme Design Rules

### Q1: Core light theme philosophy
- Options: Warmth + readability | Neutral + clinical | Brand-tinted
- **Selected:** You decide (Claude's discretion per brand)

### Q2: Hero text opacity rule
- Options: Hard rule (always 100%) | Claude reasons per brand
- **Selected:** Hard rule — hero always t.text (100%) on light. Memory: test24 ghost-text bug.

### Q3: Glow/shadow on light theme
- Options: Scale to 40% | Replace with drop shadow | You decide
- **Selected:** You decide (Claude's discretion)

## Area 4: Formatter Section Organization

### Q1: Section grouping approach
- Options: Data → Appearance → Advanced | Per-concern | You decide per type
- **Selected:** Other — hybrid of 1 and 2. Text color with text settings, glow with effects, data fields first.

### Q2: Help text policy
- Options: Only non-obvious | Every control | You decide
- **Selected:** Only non-obvious controls

### Q3: Minimum section count
- Options: 3 minimum | 4 minimum | You decide
- **Selected:** 4 minimum sections (update DQG-05)

## Deferred Ideas

None.
