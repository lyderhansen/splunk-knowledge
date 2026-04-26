# Final viz-skill review pass (2026-04-25)

End-of-iteration sweep across all 26 `ds-viz-*` skills + the meta-skill
`ds-pick-viz`. Reviewed for cross-reference correctness, frontmatter
consistency, factual coherence with the PDF, and `PROGRESS.md` truth.

> Scope: viz skills only. Interactivity skills (`ds-defaults`,
> `ds-tokens`, `ds-inputs`, `ds-tabs`, `ds-drilldowns`, `ds-visibility`)
> were inspected but **not modified** — they remain stubs and are
> tracked as known debt.

## What "complete" means after this pass

26 visualization skills, one per `splunk.<type>`, each with:

1. A non-stub `SKILL.md` derived from the 10.4 PDF and verified
   against Splunk Enterprise 10.2.1.
2. A dark-theme `test-dashboard/dashboard.json` covering the option
   matrix.
3. A light-theme companion (`dashboard-light.json`).
4. Both deployed to the `splunk-knowledge-testing` app as
   `ds_viz_<type>_dark` and `ds_viz_<type>_light`.

Plus one disambiguation skill (`ds-viz-choropleth-map`) explaining why
that viz type does not exist in Dashboard Studio and routing to the
correct alternatives.

The 10.4 PDF has **27 viz-type entries** when you naively count
section headings, but only **26 are real Studio viz types**. The 27th
("Choropleth map" on PDF page 381) is a Simple-XML / Classic appendix
section and does not produce a `splunk.choropleth.map` viz type.

## Findings

### Fixed in this pass

| #  | Finding                                                             | Files affected                                                                                                                                  | Fix                                                                                                                                                  |
| -- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 | 5 broken cross-references to `../../design/ds-design-principles/`   | `ds-viz-bubble`, `ds-viz-scatter`, `ds-viz-events`, `ds-viz-timeline`, `ds-viz-table`                                                           | Rewrote each link to point at the canonical location, `../../reference/ds-design-principles/SKILL.md`.                                              |
| F2 | 3 stale `ds-viz-choropleth-map` references describing it as a viz   | `ds-pick-viz`, `ds-viz-map`, `ds-viz-choropleth-svg`                                                                                            | Replaced with an explicit "disambiguation skill, not a viz type" note. `ds-pick-viz`'s decision-table row was rewritten to point at `splunk.map` + a `choropleth` layer. |
| F3 | `PROGRESS.md` significantly out of date                             | `viz/PROGRESS.md`                                                                                                                               | Re-marked rows for `area`, `column`, `bar`, `pie`, `singlevalue`, `singlevalueicon`, `singlevalueradial`, `markergauge`, `fillergauge`, `table` — all of which had finished build pipelines but were still showing ⬜. |

### Confirmed correct (no action needed)

- All **26** viz skills have both `dashboard.json` and
  `dashboard-light.json` on disk under `test-dashboard/`.
- The smallest skill at 104 lines is `ds-viz-choropleth-map` (the
  disambiguation), which is appropriate for its purpose.
- The largest skills are the chart family (`ds-viz-line` 531,
  `ds-viz-area` 522, `ds-viz-column` 511, `ds-viz-bar` 502),
  reflecting the option-surface area.
- Sibling cross-references (`../ds-viz-foo/SKILL.md`) all resolve.
- `ds-pick-viz` decision table now covers all 26 viz types and the
  redirect, with no remaining wrong-target rows.

### Deferred (out of scope for the viz iteration)

| #  | Item                                                                                                                | Status                                                                                              |
| -- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| D1 | 6 interactivity skills are stubs: `ds-defaults`, `ds-tokens`, `ds-inputs`, `ds-tabs`, `ds-drilldowns`, `ds-visibility` | Each contains a one-line stub pointing at `reference/ds-syntax` / `reference/ds-viz`. Their migration is its own work session. |
| D2 | Visual-QA pass against the live `splunk-knowledge-testing` deployments                                              | All 52 dashboards (26 dark + 26 light) are deployed. The QA-dark / QA-light columns of `PROGRESS.md` are intentionally still ⬜. |
| D3 | Frontmatter-style consistency: 9 viz skills (the older ones) lack `version` / `verified_against` / `test_dashboards` keys | Not blocking — every skill that lacks the keys has the equivalent context written into the prose. Standardising the frontmatter is a separate cleanup. |

## How to use this skill set

For an LLM agent answering "build me a Splunk dashboard":

1. Read `ds-pick-viz` first when the viz type is undecided.
2. Read `ds-viz-<type>/SKILL.md` for the chosen viz.
3. The skill will reference its **deployed** test dashboards
   (`ds_viz_<type>_dark` / `_light`) — those are the source of truth
   for "does this option actually do what the docs claim".
4. Cross-reference `reference/ds-syntax` for envelope-level questions
   (data sources, layout, tokens, drilldowns).
5. Cross-reference `reference/ds-design-principles` for archetype +
   chart-selection rationale.

## Provenance

- Source PDF: `docs/SplunkCloud-10.4.2604-DashStudio.txt`
  (extracted from `SplunkCloud-10.4.2604-DashStudio.pdf`, 24,227 lines).
- Verification target: Splunk Enterprise 10.2.1 in
  `splunk-knowledge-testing` app.
- Iteration owner: end-of-iteration review per user request
  ("dashboards ser bra ut, men jeg tenker review ser bra ut. fokuser
  nå på å itterer gjennom alle vizene og skillsene så tar vi en review
  på slutten").
