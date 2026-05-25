# The Slop Test — self-administered before showing the user

Run this checklist after Stage B (HTML written) but BEFORE Stage D (opening mockup.html in the user's browser). It is an agent self-check, not a script.

The core question:

> **"If you showed this interface to someone and said 'AI made this,' would they believe you immediately?"**

If yes — that's the problem. The mockup should make someone ask "how was this made?" not "which AI made this?"

## The 8 questions

For each, answer honestly. For any "yes", fix the HTML before proceeding.

1. **Did I use a font from the reflex-reject list anywhere?**
   (Inter, DM Sans, Fraunces, etc. — see [typography.md](typography.md))

2. **Is the palette purple-to-blue / cyan-to-pink / the generic SaaS gradient?**
   (Unless the brand explicitly called for it.)

3. **Are cards rounded with drop shadows used as the default pattern?**
   (Card-soup is the #1 AI dashboard tell.)

4. **Did I use any of the 8 absolute bans?**
   See [absolute-bans.md](absolute-bans.md). Quick greps:
   ```
   grep -E 'border-(left|right):\s*[0-9]+px' mockup.html
   grep -E 'background-clip:\s*text' mockup.html
   ```
   Both should return empty.

5. **Is the layout the same centered-3-band pattern that every AI dashboard uses?**
   (KPI row → big chart → details table — that's the AI default.)

6. **Did I default to glassmorphism, neon-on-dark, or sparklines-as-decoration?**
   (Each is a "looks technical" cliché.)

7. **Are there any "QUESTION 01" / "SECTION 05" meta-labels?**
   (Numbered prefixes look cheap and templated.)

8. **Does anything in here surprise me, or could AI make all of this?**
   (This is the hardest question. Be honest.)

## What to do with each "yes"

Don't just tweak — rewrite. If the palette is generic, pick a different palette. If the layout is the AI default, redesign it. If a card uses border-left, replace the indicator with a different structure entirely.

The Slop Test is not gradient-correction. It's a structural redo trigger.

## What "good enough" looks like

A passing mockup has:
- Typography that surprises (you didn't pick Inter)
- A palette that feels brand-derived (not stock SaaS)
- At least one moment of design risk (asymmetric layout, oversized type, unexpected interaction)
- Variation in visual rhythm (not the same padding everywhere)
- One or more domain-unique vizs that could not exist elsewhere

If the mockup feels safe, it's slop. The whole point of cv-sketch is that boring is failure.

## Calibration

The Slop Test is hard to pass on the first attempt. Expect to redo Stage B 1-2 times before the test passes. The redo is cheap (HTML iteration takes minutes); the cost of NOT redoing is shipping a generic Splunk app to the user.

If you can't pass the Slop Test after 2 redos, the problem is upstream: the Stage A commitment block was too generic. Go back to [stage-a-commitment.md](stage-a-commitment.md) and push harder on brand essence + reference physical objects.
