---
name: cv-sketch
description: "Produces a single-file HTML mockup and a structured DESIGN-LOCK.md for a Splunk custom viz pack. Make sure to use this skill after cv-scope, or whenever the user wants to design a Splunk custom viz pack with high visual quality. HTML-first design workflow: writes a designer-grade mockup the user can open in a browser, then extracts a structured visual contract for cv-create to port to Splunk code. Includes mandatory pre-flight commitment block, 8 absolute bans against AI-slop patterns, and a self-administered Slop Test."
---

# cv-sketch — HTML-first design stage

This is the design skill. Its output is a single-file HTML mockup that defines exactly what the Splunk vizs must look like, plus a structured YAML lock file that cv-create reads to write the Canvas code.

The HTML mockup is the design source-of-truth. cv-create cannot drift from it — it can only translate the CSS into Canvas.

## Prerequisite

A `SCOPE CONTEXT` block from cv-scope (or equivalent inline-provided context). You need at minimum: `app_id`, `brand`, `format`, `theme`. Inventory is optional — if `tbd_by_sketch`, you propose one in Stage A.

## Output artifacts

Write these to `.cv/<app_id>/`:

```
.cv/<app_id>/
├── mockup.html           ← single-file HTML, openable in any browser
├── DESIGN-LOCK.md        ← YAML contract for cv-create
├── sketch-rationale.md   ← why these design choices (for iteration context)
└── lookups/
    └── <app_id>_demo_<viz>.csv   ← realistic demo data per viz
```

## Workflow — 4 stages

```
Stage A: Pre-flight commitment block (anti-slop)
Stage B: Write mockup.html
Stage C: Extract DESIGN-LOCK.md
Stage D: Present to user (skippable with --no-review)
```

## Stage A — Pre-flight commitment block

**MANDATORY before writing any HTML.** This block forces concrete commitments that prevent regression to AI-default visual patterns. Read [references/stage-a-commitment.md](references/stage-a-commitment.md) for the full template and discipline rules.

Quick checklist of what you must commit to:

1. **Brand essence** — 3 concrete words, NOT "modern/clean/elegant"
2. **Three reference physical objects** (not websites, not brands)
3. **Hero archetype** + 1-line justification
4. **Type stack** — display + mono pair, NEITHER on the reflex-reject list
5. **Palette strategy** — 60-30-10 with hex values, neutrals tinted toward primary
6. **Domain-unique element** — one thing that could not exist outside this domain
7. **Anti-references** — 3 concrete things this must NOT look like

Write the filled-in commitment block to `.cv/<app_id>/sketch-rationale.md`. Show it to the user. Wait for confirmation or correction before proceeding.

## Stage B — Write `mockup.html`

A single self-contained HTML file. No external JS, no React, no GSAP, no Tailwind. Plain HTML + CSS that an IT-savvy user can open in any browser.

**Required structure:**

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">  <!-- toggleable: dark | light -->
<head>
  <meta charset="UTF-8">
  <title><app_id> — Mockup</title>
  <style>
    /* === DESIGN TOKENS — both themes === */
    :root[data-theme="dark"] { /* ... */ }
    :root[data-theme="light"] { /* ... */ }

    /* === Per-viz styles === */
    .viz-mock[data-viz-name="..."] { /* ... */ }
    /* ... etc */
  </style>
</head>
<body>
  <div class="dashboard">
    <section class="viz-mock" data-viz-name="...">
      <!-- Full visual treatment: gradients, shadows, animations, hover.
           Inline realistic demo data as plain HTML. -->
    </section>
    <!-- ... one section per viz ... -->
  </div>

  <!-- Optional: a tiny theme toggle so user can flip dark/light in browser -->
  <script>
    document.querySelector('#theme-toggle')?.addEventListener('click', () => {
      const root = document.documentElement;
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    });
  </script>
</body>
</html>
```

Apply these references continuously while writing:

- [references/absolute-bans.md](references/absolute-bans.md) — the 8 forbidden CSS patterns
- [references/quality-bar.md](references/quality-bar.md) — what "designer-grade" means concretely
- [references/typography.md](references/typography.md) — font selection procedure + reflex-reject list

**Demo data generation:** For each viz, generate a small CSV with realistic domain values (real names, plausible numbers, credible dates). Write to `.cv/<app_id>/lookups/<app_id>_demo_<viz>.csv`. The data inlined in mockup.html and the data in the CSV MUST agree.

**Both themes mandatory:** Write `[data-theme="dark"]` and `[data-theme="light"]` blocks. Light is NOT an inversion — design independently. Both must look good on their own.

## Stage C — Extract `DESIGN-LOCK.md`

Parse the mockup and write the structured YAML contract. Read [references/lock-schema.md](references/lock-schema.md) for the complete schema with field-by-field definitions.

Key extraction rules:

- Global tokens (palette, fonts, scales) → `global:` block, both `palette_dark` and `palette_light`
- Stage A commitments → `global.commitments:` block (preserved for cv-create's sub-decisions)
- Dashboard layout (panel positions, tabs) → `dashboard:` block
- Per-viz visual specs → `vizs:` array with `visual_spec:` per entry
- For EACH viz, paste the exact CSS+HTML block from mockup.html into `visual_reference_html:` as a multi-line YAML string

## Stage D — Present to user

Default behavior: open the mockup in the user's browser, then ask for review.

```bash
# macOS
open .cv/<app_id>/mockup.html
# Linux
xdg-open .cv/<app_id>/mockup.html
```

Then say:

> *"Mockup written to `.cv/<app_id>/mockup.html` — it should open in your browser. Look at both themes (toggle in the corner). Tell me 'looks good' to proceed, describe changes to iterate, or say 'skip review' to proceed without checking."*

Run the **Slop Test** as a self-check before showing the user. See [references/slop-test.md](references/slop-test.md) for the 8-question checklist. If any answer is yes, fix the HTML before showing.

**Opt-out:** if invoked with `--no-review`, skip Stage D entirely.

## What cv-sketch does NOT do

- ❌ Does not write any Splunk code (cv-create)
- ❌ Does not produce dashboard.xml (cv-build)
- ❌ Does not handle ES5 / AMD / formatter syntax (cv-create)
- ❌ Does not validate (cv-build)

The HTML mockup is web technology. Splunk-specific concerns live in cv-create.
