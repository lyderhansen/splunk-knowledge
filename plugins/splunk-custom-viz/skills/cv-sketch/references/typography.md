# Typography — selection procedure for cv-sketch

The typography choice is one of the top 3 decisions that distinguish designer-grade output from AI-default. This file is the procedure for picking display + mono fonts that fit the brand.

## The 4-step procedure

Do this BEFORE typing any font name in the mockup.

### Step 1: Three brand words

Read the brand description. Write down 3 concrete words. NOT "modern", "clean", "elegant" — those are dead categories.

Examples of usable brand words:
- "kinetic, defiant, electric"
- "clinical, precise, reassuring"
- "warm, mechanical, opinionated"
- "calm, dense, unimpressed"

### Step 2: List your reflex choices

Write down the 3 fonts you would normally pick given those words. They are most likely in this list:

```
REFLEX-REJECT (do NOT use any of these):
  Inter
  DM Sans, DM Serif Display, DM Serif Text
  Outfit
  Plus Jakarta Sans
  Instrument Sans, Instrument Serif
  Space Mono, Space Grotesk
  IBM Plex Sans, IBM Plex Mono, IBM Plex Serif
  Fraunces
  Newsreader
  Lora
  Crimson, Crimson Pro, Crimson Text
  Playfair Display
  Cormorant, Cormorant Garamond
  Syne
```

If your reflex picks are on this list, they ARE the reflex. Reject them.

### Step 3: Browse with intent

Browse a font catalog with the 3 brand words in mind. Sources:

- Google Fonts (filter by category, ignore "popular")
- Pangram Pangram
- Future Fonts
- Adobe Fonts (if licensed)
- ABC Dinamo
- Klim Type Foundry
- Velvetyne

Look for fonts that fit the brand as a **physical object**:
- A museum exhibit caption
- A hand-painted shop sign
- A 1970s mainframe terminal manual
- A fabric label on the inside of a coat
- A children's book on cheap newsprint

Reject the first thing that "looks designy" — that's the trained reflex too.

### Step 4: Cross-check

The right font for an "elegant" brief is NOT necessarily a serif. The right font for a "technical" brief is NOT necessarily a sans-serif. The right font for a "warm" brief is NOT Fraunces.

If your final pick lines up with your reflex pattern, return to Step 3.

## Common brand → unexpected font pairings (for inspiration only, NOT a catalog to lookup from)

These are examples of how brand words might pull AWAY from reflex defaults. Do not pattern-match — use these to expand the search, not as a lookup table.

- "warm, mechanical, opinionated" → **JetBrains Mono** for body (not because mechanical = mono, but because JetBrains has a humanist warmth that Space Mono doesn't)
- "calm, clinical, careful" → consider **Söhne** or **Söhne Breit**, NOT Inter — Söhne has a tighter, more confident grid
- "kinetic, electric" → consider **Saans** or **Editorial New**, NOT Outfit
- "luxury, restrained" → consider **PP Editorial New Italic** or a custom commission, NOT Cormorant
- "industrial, dense" → consider **Söhne Mono** or **Berthold Akzidenz Grotesk**, NOT IBM Plex

## Mockup integration

Use Google Fonts CDN in the HTML mockup:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=<display>:wght@<weights>&family=<mono>:wght@<weights>&display=swap" rel="stylesheet">
```

Set both via CSS variables in the design tokens:

```css
:root {
  --font-display: '<display>', '<fallback>', sans-serif;
  --font-mono:    '<mono>', '<fallback>', monospace;
}
```

In DESIGN-LOCK.md, record both fonts with their fallback chain:

```yaml
typography:
  display:
    family: "Barlow Condensed"
    fallback: "Impact, sans-serif"
    embed: base64               # cv-create base64-embeds for Splunk
    weights_used: [600, 700, 800]
  mono:
    family: "JetBrains Mono"
    fallback: "SF Mono, Consolas, monospace"
    embed: base64
    weights_used: [400, 500, 700]
```

cv-create will handle the base64 embedding so the fonts ship in the Splunk app's CSS.

## Typography rules in the HTML

- Vary font weight and size to create hierarchy — at least 1.5× ratio between steps
- Cap line length at 65-75ch for body text
- Use uppercase + narrow tracking for labels (whisper tier)
- Tabular figures (`font-variant-numeric: tabular-nums`) for data columns, prices, timers
- Reserve italics for emphasis, not as decoration
```
