# Phase 39: Extension API Template Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 39-extension-api-template-fixes
**Areas discussed:** Template structure, Verbatim vs skeleton, Misleading scaffold note, Plan structure (2 plans)

---

## Template structure

| Option | Description | Selected |
|--------|-------------|----------|
| Inline sections in visualization-js-template.md | Add build.mjs / package.mjs sections to the existing file. One stop for Claude, but file grows from ~300 to ~600+ lines and conflates source pattern with build pipeline guidance. | |
| Separate template files | Create build-mjs-template.md and package-mjs-template.md as new files. Focused but requires updating vp-viz SKILL.md + vp-create SKILL.md to point Claude at the new files — more change surface, and no anchor from visualization-js-template.md. | |
| Hybrid: separate files, referenced from visualization-js-template.md | Create new files AND visualization-js-template.md gains a Build & Package section referencing both. Best of both at the cost of one extra hop. | ✓ |

**User's choice:** Hybrid: separate files, but referenced from visualization-js-template.md
**Notes:** Aligns with the Phase 38 pattern (new reference skill + existing skill condenses inline content to summary + MUST LOAD link).

---

## Verbatim vs skeleton

| Option | Description | Selected |
|--------|-------------|----------|
| Full verbatim copy from test42 | Copy the working ~80-line build.mjs and ~250-line package.mjs verbatim with `{{APP_ID}}` / `{{ACCENT_HEX}}` placeholders. Zero-fix first build guarantee — proven file ships. | ✓ |
| Skeleton + WRONG/RIGHT + pointer | Slim templates with the 3 critical settings + WRONG/RIGHT examples + pointer to test42 as canonical reference. Shorter but Claude has to stitch two files. | |
| Verbatim + annotations | Full copy with inline `/* CRITICAL: must be 'iife' */` comments at the 3 key lines. Maximum guidance, slight redundancy with WRONG/RIGHT block. | |

**User's choice:** Full verbatim copy from test42
**Notes:** Brand-specific code (CRC32 PNG generation, preview.png logic) is bundled in — acceptable because that code is brand-agnostic at runtime and already proven-working.

---

## Misleading scaffold note

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with explicit "Claude scaffolds these during vp-create" | New text tells Claude exactly which template to copy and what to fill. No ambiguity about who generates the files. | ✓ |
| Delete the note entirely | Just inline the templates with no meta-commentary. The template files themselves convey "this is the source-of-truth file to write." | |
| Keep "scaffold" framing but redefine it | Define "scaffold" as "Claude generates these from templates at vp-create time" — keep the word but anchor it to the templates. Lowest edit surface. | |

**User's choice:** Replace with explicit "Claude scaffolds these during vp-create"
**Notes:** The misleading note has been in the template since Phase 28 and contributed to Claude not finding the build.mjs guidance during Phase 36 (live test). Explicit replacement closes that gap.

---

## Plan structure (2 plans)

| Option | Description | Selected |
|--------|-------------|----------|
| By file: Plan 1 = build-mjs + visualization-js-template.md edits; Plan 2 = package-mjs + SKILL.md wiring | Plan 1 covers EF-01 + EF-02, Plan 2 covers EF-03 + wiring. Files disjoint — plans can run in parallel. But Plan 1's visualization-js-template.md note would reference Plan 2's package-mjs file before it exists. | |
| By layer: Plan 1 = new template files; Plan 2 = SKILL.md wiring + note rewrite | Plan 1 creates both new files (verbatim from test42). Plan 2 wires references after files exist. Sequential, clean dependency. | ✓ |
| By requirement: Plan 1 = EF-01 + EF-02 (build.mjs); Plan 2 = EF-03 (package.mjs) | Strict requirement-to-plan mapping. Plan 1 = build-mjs-template.md + note update. Plan 2 = package-mjs-template.md. Lightest cross-coupling per plan but doesn't separate creation from wiring. | |

**User's choice:** "you decide" — Claude selected Option 2 (by layer)
**Notes:** Mirrors Phase 38 success pattern (Wave 1 creates new reference, Wave 2 condenses/wires). Plan 2 sequential on Plan 1 is acceptable given short plan count and clear dependency.

---

## Claude's Discretion

- Exact line ordering and section headers inside the two new template files
- Whether to keep the full ~250-line package.mjs CRC32 PNG generator inline or extract it
- Exact wording of MUST LOAD directives in vp-viz/vp-create SKILL.md
- Whether the rewrite of the visualization-js-template.md note keeps Node.js 22.0.0+ on the same line

## Deferred Ideas

- Validator extension to catch user hand-edits that revert to ESM or `external` clause — deferred to v6.0
- Pinning `@splunk/dashboard-studio-extension` to a tested version instead of `"latest"` — deferred to hygiene phase
- Real CLI scaffold (`vp-init --extension` writes files itself) — deferred to v6.0 tooling
