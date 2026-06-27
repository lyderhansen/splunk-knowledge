# 53-02 SUMMARY — cv-build symptom-first DS rule + namespace/preview gotchas

**Status:** complete · **Commit:** `748b69be` · **Requirements:** FMT-03, FMT-04, FMT-06

## What changed
- **diagnostic-rules.md** — added a SYMPTOM-FIRST entry `### Symptom: Formatter controls missing in the Dashboard Studio config panel` (keyed on the user-visible symptom, not a FAIL code) with cause (non-standard section-label), fix (the 3 exact labels), and "applies to any Classic viz incl. hand-authored". Existing B5 FAIL-code rule kept.
- **diagnostic-rules.md B3** — namespace probe now documented as **3-way**: getPropertyNamespaceInfo ns+key → short `<app>.<viz>.<key>` → bare key, with both host key-forms (DS short / SXML long).
- **dashboard-transcription.md** — cross-ref added: SXML `<option name>` uses LONG `display.visualizations.custom.<app>.<viz>.<key>`, DS JSON uses SHORT bare key; viz reads both via the 3-way probe.
- **splunk-viz-canon.md** — note distinguishing the SXML long-key form (shown there) from the DS short form, pointing to B3.
- **generate-assets.md** — preview.png auto-discovery semantics: Splunk auto-discovers `appserver/static/visualizations/<viz>/preview.png` with NO `visualizations.conf` reference; tile is blank if missing.

## Untouched (by design)
`cv-create/references/formatter-emission.md` — the authoritative emission rule. `git diff --quiet` confirmed clean.

## Version
splunk-custom-viz 6.0.10 → **6.0.11**.

## Verify
Both task `<automated>` blocks printed ALL_PASS.
