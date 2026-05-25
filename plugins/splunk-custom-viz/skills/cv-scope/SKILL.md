---
name: cv-scope
description: "Gathers the 5 context inputs needed to build a Splunk custom viz pack. Make sure to use this skill whenever the user asks to build, design, scaffold, or create a Splunk custom visualization, themed dashboard app, or branded viz suite — even if they only say 'I want a Splunk viz' without using the word 'pack' or 'plugin'. Asks for: app name, brand + domain, target format, viz inventory hint, theme. Routes to cv-sketch with a structured scope-context block."
---

# cv-scope — gather context for a custom viz build

## When to use

Use at the start of every custom viz build. The output is a `<scope-context>` block that flows into `cv-sketch`. Do not write any HTML, design tokens, or Splunk code in this skill — that all happens downstream.

If the user already answered some questions in their initial prompt, skip those and only ask the missing ones.

## The 5 questions

Ask in this order. One question per message.

**Use the interactive multi-choice question tool** when one is available in the runtime (`AskUserQuestion` in Claude Code, `AskQuestion` in Cursor, `ask_user` in Gemini-aligned environments). This makes the user's answer a click instead of a typed reply for the questions where the answer is a fixed enum. Plain-text prompts are fine for the two free-text questions (app name, brand+domain).

For each question below, the marker `[multi-choice]` means "use the interactive tool with the listed options as buttons", and `[text]` means "ask as a normal text question".

### 1. App name `[text]`

> What should the Splunk app ID be? Lowercase with underscores, used as the directory name and Splunk app identifier. Example: `redbull_racing_viz` or `hospital_ops_viz`.

If the user's initial prompt already hinted at a brand (e.g. "Red Bull F1"), suggest a derived app ID in the prompt: *"Suggestion: `redbull_racing_viz`. Press enter to accept or type a different one."*

### 2. Brand and domain `[text]`

> Describe the brand identity AND the industry/use case in one or two sentences. Example: `"Red Bull Racing F1 — motorsport telemetry, kinetic energy, carbon fiber aesthetic"` or `"Hospital patient flow — calm, clinical, trustworthy"`.

This is the most important answer. It seeds the entire downstream design. If the user's initial prompt already described the brand, skip this question entirely — don't ask again.

### 3. Target format `[multi-choice]`

Use the interactive question tool with these exact options:

- **Classic** — Splunk Enterprise 9.x+ and Splunk Cloud, produces `.tar.gz` (default, recommended if unsure)
- **Extension** — Splunk 10.4+ Dashboard Studio Extension API, produces `.spl`
- **Both** — both artifacts side-by-side

Question prompt: *"Which Splunk format should the pack target?"*

### 4. Viz inventory hint `[multi-choice]`

Use the interactive question tool with these exact options:

- **Let Claude pick** — cv-sketch will research the domain and propose 4-6 vizs (recommended for first-time users)
- **I'll specify** — agent will ask a follow-up text question for the list

Question prompt: *"How should the viz inventory be decided?"*

If user picks "I'll specify", follow up with a `[text]` question: *"Which vizs? Either specific names (e.g. 'KPI hero, lap delta board, ERS gauge') or general categories (e.g. '6 vizs, mix of KPIs and time series'). Recommended: 4-6 vizs total, max 8."*

cv-sketch will refine the chosen inventory based on domain analysis — it can add domain-unique vizs or push back on inventory that doesn't make sense for the data.

### 5. Theme `[multi-choice]`

Use the interactive question tool with these exact options:

- **Both** — light + dark themes (recommended default — works in any Splunk environment)
- **Dark only** — single-theme pack
- **Light only** — single-theme pack

Question prompt: *"Which themes should the pack support?"*

### Fallback if no interactive tool is available

If the runtime exposes no multi-choice question tool, fall back to plain-text prompts for Q3, Q4, Q5 and accept the answer as typed text. Parse the response generously (e.g. "classic", "1", "c" all mean Classic for Q3). Do NOT make the user re-type if their answer is close to one of the enum values.

## Output — the scope context block

When all 5 answers are gathered, produce this block exactly:

```
SCOPE CONTEXT
  app_id:    <answer 1>
  brand:     "<answer 2>"
  format:    <answer 3 — one of: classic | extension | both>
  inventory: [<answer 4 as a list, or "tbd_by_sketch" if delegated>]
  theme:     <answer 5 — one of: dark | light | both>
```

Then hand off: *"Scope captured. Loading cv-sketch to produce the HTML mockup and DESIGN-LOCK.md."*

## What cv-scope does NOT do

- ❌ Does not pick fonts, colors, palettes (cv-sketch Stage A)
- ❌ Does not commit to viz blueprints or layouts (cv-sketch)
- ❌ Does not write HTML, CSS, or any Splunk code (downstream skills)
- ❌ Does not ask design questions ("what mood?", "what fonts?") — those are cv-sketch's job

cv-scope's only job is to gather the inputs cv-sketch needs to start its work.
