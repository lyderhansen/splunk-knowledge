# Interactivity skills — progress

Tracker for the 6 interactivity skills. Same recipe as `viz/PROGRESS.md`:
PDF read → test dashboard built (dark + light) → deployed to
`splunk-knowledge-testing` → SKILL.md written → final visual QA.

| Skill | PDF | Dark JSON | Light JSON | Validated | Deployed | SKILL.md | QA dark | QA light |
|---|---|---|---|---|---|---|---|---|
| `ds-tokens` | ✅ | ✅ (core §1) | ✅ (core §1) | ✅ | ✅ | ✅ | ⬜ | ⬜ |
| `ds-inputs` | ✅ | ✅ (core §2) | ✅ (core §2) | ✅ | ✅ | ✅ | ⬜ | ⬜ |
| `ds-defaults` | ✅ | ✅ (core root) | ✅ (core root) | ✅ | ✅ | ✅ | ⬜ | ⬜ |
| `ds-drilldowns` | ✅ | ✅ (core §4) | ✅ (core §4) | ✅ | ✅ | ✅ | ⬜ | ⬜ |
| `ds-visibility` | ✅ | ✅ (core §5) | ✅ (core §5) | ✅ | ✅ | ✅ | ⬜ | ⬜ |
| `ds-tabs` | ✅ | ✅ (tabs) | ✅ (tabs) | ✅ | ✅ | ✅ | ⬜ | ⬜ |

## Test dashboards

Two dashboards cover all six skills:

- **`ds_interactivity_core_dark` / `_light`** — covers
  `ds-tokens`, `ds-inputs`, `ds-defaults`, `ds-drilldowns`,
  `ds-visibility`. Five sections (§1–§5), one section per skill, all on
  an `absolute` layout.
- **`ds_interactivity_tabs_dark` / `_light`** — covers `ds-tabs`. Three
  tabs (Overview / Details / Threats), each with its own `grid` layout
  in `layoutDefinitions`.

Tabs need a separate dashboard because `layout.type: "absolute"` and
`layout.tabs` are mutually exclusive at the top level.

## Deferred

- **Visual QA** — all four dashboards are deployed but not yet eyeballed
  in the Splunk UI. Same convention as `viz/PROGRESS.md`: QA columns
  remain `⬜` until a single review pass at the end.
- **Custom-URL host whitelist** — `drilldown.customUrl` accepts
  arbitrary URLs. If a future workspace policy requires a destination
  allow-list, that's an open governance question, not a skill bug.

## See also

- `viz/PROGRESS.md` — the visualization-skills tracker.
- `viz/REVIEW.md` — the final-review summary for visualization skills.
