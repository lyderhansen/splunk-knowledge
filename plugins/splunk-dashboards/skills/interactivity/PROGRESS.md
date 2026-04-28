# Interactivity skills — progress

Tracker for the 6 interactivity skills. Same recipe as `viz/PROGRESS.md`:
PDF/doc read → test dashboard built (dark + light) → deployed to
`splunk-knowledge-testing` → SKILL.md written → final visual QA.

## Status snapshot (2026-04-28)

| Skill | Doc | Dark JSON | Light JSON | Validated | Deployed | SKILL.md | QA dark | QA light |
|---|---|---|---|---|---|---|---|---|
| `ds-tokens` | ✅ | ✅ (core §1) | ✅ (core §1) | ✅ | ✅ | ✅ v1.1 | 🟡 | ⬜ |
| `ds-inputs` | ✅ | ✅ (core §2) | ✅ (core §2) | ✅ | ✅ | ✅ v1.1 | 🟡 | ⬜ |
| `ds-defaults` | ✅ | ✅ (core root) | ✅ (core root) | ✅ | ✅ | ✅ v1.1 | ✅ | ⬜ |
| `ds-drilldowns` | ✅ | ✅ (core §4) | ✅ (core §4) | ✅ | ✅ | ✅ v1.1 | 🟡 | ⬜ |
| `ds-visibility` | ✅ | ✅ (core §5) | ✅ (core §5) | ✅ | ✅ | ✅ v1.2 | 🟡 | ⬜ |
| `ds-tabs` | ✅ | ✅ (tabs) | ✅ (tabs) | ✅ | ✅ | ✅ v1.0 | ✅ | ⬜ |

Legend: ✅ done / verified clean · 🟡 in progress (deployed, awaiting re-QA after fix) · ⬜ not started · ❌ blocked

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

## QA findings (2026-04-28)

Three rounds of live QA against `ds_interactivity_core` exposed schema
gaps and expression-language portability issues. All findings now
reflected in the live bench + the relevant SKILL.md.

| # | Finding | Skill(s) | Status |
|---|---------|----------|--------|
| Q1 | `visibility` rejected at panel root with `must NOT have additional properties` — must nest under `containerOptions.visibility`. | ds-visibility | ✅ fixed |
| Q2 | Conditions with `"$tok$" = "lit"` (quoted token) break SPL parser at hyphens with `S0201 Syntax error: "web" at position 5`. Token must be bare: `$tok$ = "lit"`. | ds-visibility | ✅ fixed |
| Q3 | `isSet($tok$)` rejected by Splunk Enterprise 10.2.x (`S0201 Syntax error: "isSet"`) — Cloud-only function. Use `$tok$ != ""` for portability. | ds-visibility | ✅ fixed (with portability note) |
| Q4 | Visibility panels evaluate against undefined tokens unpredictably on first render. Solved by initialising tokens via `defaults.tokens.default.<name>: { value: "" }`. | ds-defaults, ds-visibility | ✅ fixed |
| Q5 | Multiselect token in SPL `IN(...)` produces unquoted comma-joined output (`200,404`); breaks on hyphens/spaces. Use `IN ($tok\|s$)` filter. | ds-inputs, ds-tokens | ✅ fixed |
| Q6 | `drilldown.linkToDashboard.tokens` as `{form.host: $val$}` map silently drops tokens. Use array `[{token, value}]`. | ds-drilldowns | ✅ fixed |
| Q7 | `viz_token_echo` and `viz_inputs_proof` were `splunk.singlevalue` / `splunk.table` driven by `ds.search` `eval msg=...` — empty-string tokens produced malformed eval. Converted both to `splunk.markdown` with direct `$tok$` interpolation; ds_token_demo dropped as dead. | ds-tokens, ds-inputs (bench only) | ✅ fixed |
| Q8 | `dataSource.name` regex hygiene — bench `name` fields are short and clean, no violations. | (governance) | ✅ verified |

## Deferred

- **Final QA pass** — re-walk all 4 dashboards in light mode after the
  Q7 conversion. Dark currently 🟡 awaiting user verification of the
  markdown swap; light entirely ⬜.
- **Custom-URL host whitelist** — `drilldown.customUrl` accepts
  arbitrary URLs. If a future workspace policy requires a destination
  allow-list, that's a governance question, not a skill bug.

## See also

- `../PROGRESS.md` — top-level plugin progress (consolidated).
- `viz/PROGRESS.md` — the visualization-skills tracker.
- `viz/REVIEW.md` — the final-review summary for visualization skills.
