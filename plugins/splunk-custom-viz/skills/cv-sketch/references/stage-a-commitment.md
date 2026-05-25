# Stage A — Pre-flight commitment block

Read this BEFORE writing any HTML in cv-sketch Stage B.

This block forces concrete, project-specific commitments. It is the single highest-leverage anti-slop mechanism in the plugin. Without it, the LLM regresses to its training-data defaults (Inter font, purple-to-blue gradients, centered KPI grids) regardless of what the user asked for.

The block is **dynamic in content, disciplined in process**. The LLM picks every value; the structure of what must be picked is fixed.

## The full commitment template

Copy this template, fill in every field. Save to `.cv/<app_id>/sketch-rationale.md`.

```
DESIGN COMMITMENT — <app_id>
================================

Brand essence (3 concrete words; NO "modern", "clean", "elegant"):
  → <word 1>, <word 2>, <word 3>

Three reference physical objects (NOT websites, NOT other brands):
  → <e.g., "1970s Tektronix oscilloscope manual">
  → <e.g., "F1 carbon-fiber wing surface, freshly waxed">
  → <e.g., "ski race pit board with sharpie annotations">

Hero archetype + justification for THIS brand:
  → <one of: cinematic-center | asymmetric | editorial-split | data-wall | invented>
  → <one sentence on why this brand uniquely calls for it>

Type stack (display + mono pair):
  → display: <font name + 1-line why>
  → mono:    <font name + 1-line why>
  → confirm: neither is on the reflex-reject list (see below)

Palette strategy (60-30-10 with hex values):
  → 60% surface family: <hex>  (tinted neutral, NOT pure grey)
  → 30% brand primary:  <hex>
  → 10% accent:         <hex>  (used SPARINGLY)
  → confirm: chroma is reduced toward extreme lightness;
             neutrals are tinted (Δchroma ≥ 0.005 toward primary)

Domain-unique element (mandatory commitment):
  → <one visual element that could NOT exist outside this domain>
  → soft check: is this just "a chart with domain-specific labels"?
                If yes, push harder.

Anti-references (3 concrete things this must NOT look like):
  → <thing 1, specific>
  → <thing 2, specific>
  → <thing 3, specific>
```

## Reflex-reject font list

These fonts are your training-data defaults. They create monoculture across AI-generated projects. Reject all of them and pick from outside this list:

```
Inter, DM Sans, DM Serif Display, DM Serif Text
Outfit, Plus Jakarta Sans, Instrument Sans, Instrument Serif
Space Mono, Space Grotesk
IBM Plex Sans, IBM Plex Mono, IBM Plex Serif
Fraunces, Newsreader, Lora
Crimson, Crimson Pro, Crimson Text
Playfair Display, Cormorant, Cormorant Garamond
Syne
```

If your first instinct is "Inter for body" or "Fraunces for headings", that's the reflex. Look further. Sources to browse:

- Google Fonts (browse by category, not by popularity)
- Pangram Pangram, Future Fonts, ABC Dinamo, Klim Type Foundry, Velvetyne
- Adobe Fonts (if licensed)

Pick fonts that fit the brand as a **physical object** — a museum exhibit caption, a hand-painted shop sign, a 1970s mainframe terminal manual, a fabric label on the inside of a coat.

## Anti-patterns in the commitment block itself

These fail the block and require redo:

- Brand essence words from the dead-category list: "modern", "clean", "elegant", "minimalist", "playful" — too generic, force more specificity
- Reference objects that are actually websites or brands ("looks like Stripe" — not a physical object)
- Hero archetype "centered KPI grid" with no justification — you just picked the AI default
- Type stack containing any reflex-reject font
- Palette: pure grey neutrals (no tint), or accent appearing in more than 10% visual weight
- Domain-unique element that's actually generic ("a status indicator" — every dashboard has one)
- Anti-references that are vague ("not boring") — must be specific

## Why the commitment block matters

By the time the LLM is writing the 5th HTML viz section, context pressure has accumulated and the LLM tends to grab the closest familiar pattern. The commitment block is read at the start, recorded in `sketch-rationale.md`, and persisted into `DESIGN-LOCK.md.global.commitments` — so when cv-create is mid-port and has to make a sub-decision, it can re-read the commitments and stay aligned with what was committed at Stage A.

This is the structural fix for the test44 finding: *"the agent prioritizes compliance over creativity every time, and the creative work gets the minimum viable implementation."* Locking commitments at Stage A means there's no minimum viable to fall back to — the spec is concrete.
