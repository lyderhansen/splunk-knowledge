# Mood-to-Design Lookup + Design Ambition + Conditional Logic

## Contents
- Mood lookup (9 moods → color/font/effects)
- Design ambition (graphic designer questions)
- Creative latitude
- Conditional design logic
- Cognitive load gate
- Dashboard richness rules
- Design scoring
- Anti-AI checklist

## Mood-to-design lookup

Instead of "what colors?", ask "what mood?" The mood drives everything.

### Step 1: Identify mood

| Mood | Feels like | Domain examples |
|---|---|---|
| **Precision** | Swiss watch, surgical | Motorsport, aerospace, fintech |
| **Power** | Authority, weight | Defense, heavy industry, enterprise security |
| **Speed** | Kinetic, urgent, live | Racing, CDN monitoring, trading floor |
| **Trust** | Calm, reliable | Banking, healthcare, government |
| **Luxury** | Exclusive, restrained | Fashion, hospitality, premium retail |
| **Playful** | Energetic, colorful | Marketing, gaming, social media |
| **Futuristic** | Neon, digital, sci-fi | SOC walls, space ops, AI/ML |
| **Organic** | Warm, earthy, natural | Sustainability, agriculture, ESG |
| **Minimal** | Quiet, spacious | Developer tools, status pages |

### Step 2: Mood → color

| Mood | Temperature | Saturation | Accent strategy |
|---|---|---|---|
| Precision | Cool blue-grey | Low-medium | Single sharp accent |
| Power | Neutral-warm | Low | Dark dominance, minimal accent |
| Speed | Warm red-orange | High | Multiple high-energy accents |
| Trust | Cool blue | Low-medium | Blue primary, green secondary |
| Luxury | Warm gold | Very low base, high accent | Gold on deep black |
| Playful | Mixed | High | 3-4 vibrant accents |
| Futuristic | Cool cyan-purple | High accent, low base | Neon on near-black |
| Organic | Warm green-brown | Low-medium | Earth tones, muted greens |
| Minimal | Neutral | Very low | One accent or none |

### Step 3: Mood → typography

| Mood | Heading weight | Body style | Letter-spacing |
|---|---|---|---|
| Precision | 600-700 condensed | Clean sans | Tight |
| Power | 800-900 wide | Sturdy sans | Normal |
| Speed | 700 italic | Compressed sans | Tight |
| Trust | 500-600 regular | Readable sans | Normal |
| Luxury | 300-400 serif/thin | Light serif | Wide |
| Playful | 700-800 rounded | Rounded sans | Normal |
| Futuristic | 200-300 geometric | Geometric sans | Wide |
| Organic | 400-500 humanist | Humanist sans | Normal |
| Minimal | 400 system | System sans | Normal |

### Step 4: Mood → effects

| Mood | Glow | Shadow | Gradient | Animation |
|---|---|---|---|---|
| Precision | Subtle | Sharp, small | Linear, subtle | None |
| Power | None | Heavy | None | None |
| Speed | Medium | Motion blur | Diagonal | Subtle motion |
| Trust | None | Soft | Vertical, gentle | None |
| Luxury | Warm gold | Subtle | Rich jewel | None |
| Playful | Colorful | Bouncy | Multi-color | Bounce/pop |
| Futuristic | Neon strong | None | Cyan-purple | Pulse/breathe |
| Organic | Warm amber | Soft | Earth tones | None |
| Minimal | None | None | None | None |

## Design ambition

Before finalizing any design, ask:
1. "What would a graphic designer do that an AI wouldn't?"
2. "What's the ONE unexpected detail?"
3. "Would someone screenshot this?"

**Creative latitude** (permissions, not rules):
- Color: alpha variants, tinted greys, glow colors different from fill, 3-4 shades of near-black
- Typography: extreme size contrast (48-72px hero, 8-10px labels), letter-spacing on uppercase
- Composition: asymmetric 60/40, rule of thirds, negative space as design element
- Effects: subtle noise/grain (2-5%), inner shadow, accent glow on hero values, thin accent lines
- Viz form: gauge as thermometer/fill bar/radial burst, table as card grid, vertical timeline

## Conditional design logic

### Layout
- Hero image provided → full-bleed hero archetype, panels 85-92% opacity
- No hero → strip banner or no-hero, panels 95-100% opacity
- 6+ panels → no-hero, reduce padding, consider tabs
- 3 or fewer → generous whitespace, dramatic typography

### Color
- Brand collides with status semantic → demote brand to accent only
- Dark theme: bg #0B-#12, text #E8-#F0, glow ×1.2
- Light theme: bg #F5-#FA, text #1A-#2D, glow ×0.6
- NOC wall: min 14px font, 90%+ contrast, no hover

### Typography
- Custom font → embed base64, brand font for display only, system mono for data
- No custom font → pick by mood from lookup table
- Panel < 300px → no letter-spacing, condensed font, truncate with ellipsis
- Panel > 600px → letter-spacing, expanded variants, full labels

### Effects
- accentIntensity: multiply all glow/shadow by (intensity / 50)
- 5+ vizs per dashboard → effects on hero only
- 3 or fewer → each viz can have effects

## Cognitive load gate

Run before finalizing the brief:
1. **Five-second story** — can you describe the dashboard's message in 5 seconds?
2. **Grouping** — are related panels visually grouped? Unrelated separated?
3. **Working memory** — 4±1 groups maximum visible at once
4. **Decision density** — each zone supports ONE decision, not three

## Dashboard richness rules

- Every tab: 3+ visual elements
- Icons: standard, not optional (singlevalueicon for KPIs)
- Drilldowns: SHOULD on every entity-displaying panel
- Full canvas width: no narrow strips with empty margins
- Suggest additional vizs beyond what user asked for

## Design scoring (quantitative gate)

| Dimension | What to check | Target |
|---|---|---|
| Visual hierarchy | Size ratio hero-to-supporting 3:1+, eye path matches job | 7+ |
| Whitespace quality | Intentional negative space, consistent padding | 7+ |
| Brand distinctiveness | Would someone recognize the brand? | 7+ |
| Emotional resonance | Does it feel like the brand, not generic Splunk? | 7+ |

## Anti-AI checklist (step 8 gate)

- [ ] No rainbow color palette (Splunk default colors)
- [ ] No 5 identical KPI tiles in a row
- [ ] No centered-everything layout
- [ ] Hero element exists (not equal-weight grid)
- [ ] At least one unexpected design detail
- [ ] No placeholder text ("Title", "Label")
- [ ] Colors from brand, not from AI defaults
