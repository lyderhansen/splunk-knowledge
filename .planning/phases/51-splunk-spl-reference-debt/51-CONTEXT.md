# Phase 51: splunk-spl Reference Debt — Context

**Gathered:** 2026-06-15
**Status:** Ready for planning
**Source:** Locked from v6.1 milestone scope + test51_cucm / test52_asus_rog HANDOFFs (pure markdown-reference work — no discuss-phase needed)

<domain>
## Phase Boundary

Harvest four SPL traps and one reshape recipe surfaced by two real-brand builds into the `splunk-spl` plugin so the next pack does not re-discover them. All work is documentation in `splunk-spl/skills/spl-gotchas/SKILL.md` and two `splunk-spl/reference/*.md` files.

**In scope:**
- `splunk-spl/skills/spl-gotchas/SKILL.md` — new traps + recipe + token-safety section (SPL-01, SPL-04, SPL-05)
- `splunk-spl/reference/multisearch.md` — inputlookup incompatibility warning (SPL-02)
- `splunk-spl/reference/stats.md` — round(avg(...)) invalid-syntax trap (SPL-03)
- splunk-spl plugin version bump

**Out of scope:**
- Any cv-* or ds-* changes — this is splunk-spl only
- New reference files for commands not already documented
- The dashboard-side `relative_time` wrapper (that's DS-04 in Phase 52 — this phase covers the SPL-side trap only; cross-reference, don't duplicate)

</domain>

<decisions>
## Implementation Decisions

### File-to-requirement mapping (LOCKED)

| Req | Lands in | What |
|---|---|---|
| SPL-01 | `spl-gotchas/SKILL.md` | New numbered trap: `relative_time(now(), "0")` fails on All-time picker; `case()` wrapper |
| SPL-02 | `reference/multisearch.md` | "DOES NOT WORK with inputlookup" warning + `append + discriminator` alternative |
| SPL-03 | `reference/stats.md` | `stats round(avg(field), N)` invalid; post-stats `eval` correction |
| SPL-04 | `spl-gotchas/SKILL.md` | "Wide → tall reshape without `untable`" recipe (`makemv + mvexpand + case`) |
| SPL-05 | `spl-gotchas/SKILL.md` | "Token substitution safety" section (tokens are dumb string substitution) |

### spl-gotchas trap numbering (LOCKED)

`spl-gotchas/SKILL.md` "## Silent-fail traps (ranked by frequency)" currently ends at trap #26 (PREFIX/TERM/append-last-resort cluster at #24-26). The new traps continue the sequence:

- **#27 (SPL-01):** `relative_time(now(), "0")` All-time picker breakage
- **#28 (SPL-04):** wide→tall reshape — though this is more a recipe than a silent-fail trap; the planner should decide whether it lives as trap #28 in the ranked list OR as a standalone "## Reshape recipes" section after the traps. RECOMMENDATION: standalone section, because it's a positive how-to, not a trap. SPL-04 success criterion only requires it be findable in spl-gotchas.md, not that it be a numbered trap.
- **SPL-05** is a SECTION ("## Token substitution safety"), not a numbered trap — it's a category warning, place it after the traps list near the search-performance hierarchy section.

The planner has discretion on exact placement as long as each item is findable by the symptom described in the success criteria.

### Trap content (the verbatim HANDOFF evidence)

**SPL-01 — `relative_time(now(), "0")` (test51 Correction #16)**
Symptom: panels error "Argument is invalid" when user selects "All time". Splunk sets `$global_time.earliest$ = "0"` (literal zero, no suffix), which `relative_time` rejects. Required pattern:
```spl
| where _time >= case(
    "$global_time.earliest$" = "0" OR "$global_time.earliest$" = "", 0,
    1==1, relative_time(now(), "$global_time.earliest$"))
  AND _time <= case(
    "$global_time.latest$" = "now" OR "$global_time.latest$" = "", now(),
    1==1, relative_time(now(), "$global_time.latest$"))
```
Cross-reference: Phase 52 DS-04 documents the dashboard-side application of this same pattern in ds-data-explore. This phase owns the SPL-language trap; link to it.

**SPL-02 — multisearch + inputlookup (test51 Correction #17)**
Symptom: panel returns no rows; multisearch + inputlookup silently fails. Root cause: `multisearch` requires each subsearch to begin with the `search` command; `| inputlookup` does not qualify. Working alternative:
```spl
| inputlookup table_a.csv | eval src="a"
| append [| inputlookup table_b.csv | eval src="b"]
| stats avg(eval(if(src="a", metric_a, null()))) AS "Metric A"
        count(eval(src="b")) AS "Count B" by _time
```

**SPL-03 — stats round(avg(...)) (test51 Correction #18)**
Symptom: SPL error "The argument 'round(avg(field), N)' is invalid". Root cause: `stats` does not allow aggregation functions wrapped in math/eval functions inline. Pattern:
```spl
# WRONG
| stats round(avg(field), 1) AS x
# RIGHT
| stats avg(field) AS x | eval x=round(x, 1)
```

**SPL-04 — wide→tall reshape (test52 Correction #25)**
Converts "wide one-row" (gpu_temp, cpu_temp, vrm_temp as columns) to "tall N-row" (component, current_temp) without `untable` (which loses type metadata Canvas vizs need). Canonical example:
```spl
| inputlookup telemetry_5min.csv | search rig_id="$focus_rig$" | sort -_time | head 1
| eval components = "GPU,CPU,VRM,SSD,RAM,PSU"
| makemv delim="," components
| mvexpand components
| eval current_temp_c = case(
    components=="GPU", gpu_temp_c, components=="CPU", cpu_temp_c,
    components=="VRM", vrm_temp_c, components=="SSD", ssd_temp_c,
    components=="RAM", round(cpu_temp_c - 5, 1), components=="PSU", round(vrm_temp_c + 4, 1))
| rename components as component
| table component current_temp_c throttle_temp_c max_safe_c
```
Note WHY not `untable`: `untable` doesn't preserve enough type metadata for Canvas vizs, and the `case()` arm lets you derive missing components inline. Used in 3/7 panels in the Asus ROG build.

**SPL-05 — token substitution safety (test51 Gap G4)**
General lesson: tokens are dumb string substitution. Never let a token value be passed directly into a function that requires a specific format. Always wrap in `case()` or `if()` with explicit edge-case branches. SPL-01 is the canonical instance; SPL-05 is the general rule. Reference SPL-01 as the worked example.

### Existing-trap dedup check (LOCKED)

spl-gotchas already has trap #19 ("makemv only types row 1 for sparklines") and command-index entries for makemv/mvexpand. SPL-04's reshape recipe must NOT contradict #19 — read it first and cross-reference rather than duplicate. The reshape recipe is a different use (wide→tall for radar data) than the sparkline-typing trap.

### Version bump (LOCKED)

splunk-spl: minor or patch — current is v1.2.0. Per memory `feedback_plugin_version_bump`, patch is the default (→ v1.2.1). These are additive reference entries, not new commands, so patch is correct.

</decisions>

<canonical_refs>
## Canonical References

Downstream agents MUST read these before planning or implementing.

### Files being modified
- `plugins/splunk-spl/skills/spl-gotchas/SKILL.md` — traps end at #26; add SPL-01 (#27), SPL-04 (reshape recipe), SPL-05 (token-safety section). Check it stays under 500 lines.
- `plugins/splunk-spl/reference/multisearch.md` — SPL-02 inputlookup warning
- `plugins/splunk-spl/reference/stats.md` — SPL-03 round(avg) trap
- `plugins/splunk-spl/.claude-plugin/plugin.json` — version bump

### Source HANDOFFs (verbatim trap evidence)
- `tests/test51_cucm/HANDOFF.md` — Corrections #16 (SPL-01), #17 (SPL-02), #18 (SPL-03), Gap G4 (SPL-05)
- `tests/test52_asus_rog/HANDOFF.md` — Correction #25 (SPL-04 wide→tall reshape)

### Project rules
- `CLAUDE.md` — plugin language English-only; SKILL.md < 500 lines (applies to spl-gotchas/SKILL.md — check line count after edits)
- `splunk-spl` sourced from Splunk 10.2 (memory `project_splunk_spl_10_2_review`) — keep new content consistent with that version's syntax

</canonical_refs>

<specifics>
## Specific Ideas

- spl-gotchas/SKILL.md line count matters (< 500 rule). Three additions (trap #27, reshape recipe, token-safety section) could push it over. Check current line count first; if tight, the reshape recipe (SPL-04, the longest addition) could go in a `reference/` file with a pointer from spl-gotchas. SPL-04 success criterion says "User reading spl-gotchas.md finds..." so a pointer with a one-line summary in spl-gotchas + full recipe in reference/ satisfies it.
- multisearch.md and stats.md are per-command reference files — confirm their existing structure (likely "## Syntax / ## Examples / ## Gotchas") and append the new trap in the gotchas-style section, matching the file's existing heading convention.
- SPL-01 and SPL-05 are tightly linked (SPL-01 is the canonical instance of the SPL-05 general rule). Plan them in the same task so the cross-reference is coherent and not split across commits.

</specifics>

<deferred>
## Deferred Ideas

- DS-04 (dashboard-side `relative_time` wrapper in ds-data-explore) — that's Phase 52, not here. This phase documents the SPL-language trap; Phase 52 documents the dashboard application. Cross-reference only.
- A linter/validator that greps generated SPL for raw `relative_time(now(), $token$)` without a case() wrapper. Out of scope — splunk-spl is reference-only, no validator tooling.

</deferred>

---

*Phase: 51-splunk-spl-reference-debt*
*Context gathered: 2026-06-15 via locked v6.1 milestone scope*
