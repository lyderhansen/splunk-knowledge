#!/bin/bash
# test_validate_viz_integration.sh
# Integration tests for validate_viz.sh AST delegation and vp-create shim
# Usage: bash test_validate_viz_integration.sh
# Exit code: 0 = all pass, 1 = failures found

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VVS="$SCRIPT_DIR/validate_viz.sh"
VPC_VVS="$SCRIPT_DIR/../../vp-create/scripts/validate_viz.sh"
TEST28="$SCRIPT_DIR/../../../../../tests/test28_drilldown_tabs/cloudflare_noc"
TEST21="$SCRIPT_DIR/../../../../../tests/test21_patagonia/patagonia_outdoor_ops"
TEST25="$SCRIPT_DIR/../../../../../tests/test25_v4/hospital_nps_gauge"

PASS=0
FAIL=0

pass() { echo "  PASS: $1"; PASS=$((PASS+1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }

echo "============================================"
echo "  validate_viz.sh Integration Tests"
echo "============================================"
echo ""

# --- T1: capability detection variables present in validate_viz.sh ---
echo "--- T1: Capability detection variables present ---"
if grep -q 'VALIDATE_AST=' "$VVS" && grep -q 'USE_AST=' "$VVS"; then
  pass "validate_viz.sh contains VALIDATE_AST= and USE_AST= variables"
else
  fail "validate_viz.sh missing VALIDATE_AST= or USE_AST= capability detection variables"
fi

# --- T2: AST delegation for HTML present ---
echo "--- T2: AST delegation for HTML present ---"
if grep -q 'node "$VALIDATE_AST" --html' "$VVS" || grep -q "node \"\$VALIDATE_AST\" --html" "$VVS"; then
  pass "validate_viz.sh delegates HTML checks to validate_ast.js"
else
  fail "validate_viz.sh missing 'node \"\$VALIDATE_AST\" --html' delegation"
fi

# --- T3: AST delegation for JS present ---
echo "--- T3: AST delegation for JS present ---"
if grep -q 'node "$VALIDATE_AST" --js' "$VVS" || grep -q "node \"\$VALIDATE_AST\" --js" "$VVS"; then
  pass "validate_viz.sh delegates JS checks to validate_ast.js"
else
  fail "validate_viz.sh missing 'node \"\$VALIDATE_AST\" --js' delegation"
fi

# --- T4: test28 exits 1 with B10 violations (Phase 2 dashboard check) ---
# NOTE: Phase 2 update -- test28 has bare option keys, so validate_viz.sh correctly exits 1
echo "--- T4: test28 exits 1 with B10 violations (Phase 2 dashboard check) ---"
if [ -d "$TEST28" ]; then
  OUTPUT=$(bash "$VVS" "$TEST28" 2>&1)
  EXIT_CODE=$?
  if [ "$EXIT_CODE" -eq 1 ] && echo "$OUTPUT" | grep -q 'FAIL B10'; then
    pass "validate_viz.sh on test28 exits 1 with FAIL B10 (correct Phase 2 behavior)"
  elif [ "$EXIT_CODE" -eq 0 ]; then
    fail "validate_viz.sh on test28 exited 0 — expected B10 failures for bare option keys"
  else
    fail "validate_viz.sh on test28 exits $EXIT_CODE but output missing FAIL B10"
    echo "    output: $(echo "$OUTPUT" | grep FAIL | head -3)"
  fi
else
  fail "test28 fixture not found at $TEST28"
fi

# --- T5: test28 output has FAIL B10 lines (Phase 2 bare-key detection) ---
# NOTE: Phase 2 update -- test28 correctly produces FAIL B10 lines for bare option keys
echo "--- T5: test28 output has FAIL B10 lines (Phase 2 bare-key detection) ---"
if [ -d "$TEST28" ]; then
  FAIL_LINES=$(bash "$VVS" "$TEST28" 2>&1 | grep -c '  FAIL B10' || true)
  if [ "$FAIL_LINES" -gt 0 ]; then
    pass "test28 output contains $FAIL_LINES FAIL B10 line(s) (correct Phase 2 behavior)"
  else
    fail "test28 output contains no FAIL B10 lines (expected bare-key violations)"
  fi
fi

# --- T6: test28 contains OK lines for formatters and JS ---
echo "--- T6: test28 output contains OK lines ---"
if [ -d "$TEST28" ]; then
  OK_LINES=$(bash "$VVS" "$TEST28" 2>&1 | grep -c '  OK' || true)
  if [ "$OK_LINES" -ge 2 ]; then
    pass "test28 output contains $OK_LINES OK lines"
  else
    fail "test28 output has only $OK_LINES OK lines (expected 2+)"
  fi
fi

# --- T7: structure checks unchanged (structure section present) ---
echo "--- T7: Structure checks still present in output ---"
if [ -d "$TEST28" ]; then
  OUTPUT=$(bash "$VVS" "$TEST28" 2>&1)
  if echo "$OUTPUT" | grep -q 'Structure'; then
    pass "Structure section still present in output"
  else
    fail "Structure section missing from output (structure checks removed?)"
  fi
fi

# --- T8: AST mode produces line numbers for F3 violations (direct validate_ast.js check) ---
# Note: test21 has only B7 HTML violations (no ES6/F3 violations), so line numbers are
# tested directly via validate_ast.js with a synthetic JS fixture containing a const declaration.
echo "--- T8: AST mode produces line numbers for F3 ES6 violations ---"
TMPJS=$(mktemp /tmp/test_es6_XXXXXX.js)
cat > "$TMPJS" << 'JSEOF'
// test fixture: ES6 violations for line number test
define(['api/SplunkVisualizationBase'], function(SplunkVisualizationBase) {
  var viz = SplunkVisualizationBase.extend({
    initialize: function() {
      const x = 1;
    }
  });
  return viz;
});
JSEOF
AST_OUTPUT=$(node "$SCRIPT_DIR/validate_ast.js" --js "$TMPJS" 2>&1)
AST_CODE=$?
rm -f "$TMPJS"
if [ "$AST_CODE" -ne 0 ]; then
  pass "validate_ast.js exits 1 on ES6 violation (F3 detection works)"
else
  fail "validate_ast.js exits 0 on ES6 violation (F3 detection broken)"
fi
if echo "$AST_OUTPUT" | grep -qE 'FAIL F3.*line [0-9]+'; then
  pass "F3 FAIL line includes line number ($(echo "$AST_OUTPUT" | grep -oE 'line [0-9]+' | head -1))"
else
  fail "F3 FAIL line missing line number"
  echo "    output: $AST_OUTPUT"
fi

# Also verify test21 exits 1 (html violations detected)
if [ -d "$TEST21" ]; then
  bash "$VVS" "$TEST21" > /tmp/test21_out.txt 2>&1; EXIT_CODE=$?
  if [ "$EXIT_CODE" -eq 1 ]; then
    pass "validate_viz.sh on test21 exits 1 (violations detected)"
  else
    fail "validate_viz.sh on test21 exits $EXIT_CODE (expected 1)"
  fi
else
  echo "  SKIP T8b: test21 not available at $TEST21"
fi

# --- T9: vp-create shim exists and is a small file ---
echo "--- T9: vp-create shim is a delegation shim (<=12 lines) ---"
if [ -f "$VPC_VVS" ]; then
  LINE_COUNT=$(wc -l < "$VPC_VVS")
  if [ "$LINE_COUNT" -le 12 ]; then
    pass "vp-create/validate_viz.sh is $LINE_COUNT lines (shim, not full copy)"
  else
    fail "vp-create/validate_viz.sh is $LINE_COUNT lines (expected <=12 for shim)"
  fi
else
  fail "vp-create/validate_viz.sh not found at $VPC_VVS"
fi

# --- T10: vp-create shim contains exec delegation ---
echo "--- T10: vp-create shim contains exec delegation ---"
if [ -f "$VPC_VVS" ]; then
  if grep -q 'exec bash' "$VPC_VVS"; then
    pass "vp-create/validate_viz.sh contains exec bash delegation"
  else
    fail "vp-create/validate_viz.sh missing 'exec bash' delegation"
  fi
fi

# --- T11: vp-create shim exit code matches canonical ---
echo "--- T11: vp-create shim exit code matches canonical for test28 ---"
if [ -f "$VPC_VVS" ] && [ -d "$TEST28" ]; then
  CANON_EXIT=$(bash "$VVS" "$TEST28" 2>&1; echo $?)
  SHIM_EXIT=$(bash "$VPC_VVS" "$TEST28" 2>&1; echo $?)
  CANON_CODE="${CANON_EXIT##*$'\n'}"
  SHIM_CODE="${SHIM_EXIT##*$'\n'}"
  # Re-run cleanly
  bash "$VVS" "$TEST28" > /tmp/canon_out.txt 2>&1; CANON_CODE=$?
  bash "$VPC_VVS" "$TEST28" > /tmp/shim_out.txt 2>&1; SHIM_CODE=$?
  if [ "$CANON_CODE" -eq "$SHIM_CODE" ]; then
    pass "vp-create shim exit code ($SHIM_CODE) matches canonical ($CANON_CODE)"
  else
    fail "vp-create shim exit code $SHIM_CODE != canonical $CANON_CODE"
  fi
  DIFF=$(diff /tmp/canon_out.txt /tmp/shim_out.txt)
  if [ -z "$DIFF" ]; then
    pass "vp-create shim output matches canonical exactly"
  else
    fail "vp-create shim output differs from canonical"
    echo "    diff: $DIFF"
  fi
fi

# --- T12: WARN fallback message when vendor unavailable ---
echo "--- T12: grep fallback when vendor unavailable ---"
VENDOR_BAK="$SCRIPT_DIR/vendor/node_modules.bak"
if [ -d "$SCRIPT_DIR/vendor/node_modules" ]; then
  trap 'mv "$VENDOR_BAK" "$SCRIPT_DIR/vendor/node_modules" 2>/dev/null; trap - EXIT INT TERM' EXIT INT TERM
  mv "$SCRIPT_DIR/vendor/node_modules" "$VENDOR_BAK"
  OUTPUT=$(bash "$VVS" "$TEST28" 2>&1)
  mv "$VENDOR_BAK" "$SCRIPT_DIR/vendor/node_modules"
  trap - EXIT INT TERM
  if echo "$OUTPUT" | grep -q 'WARN.*fallback'; then
    pass "grep fallback exercised when vendor unavailable"
  else
    fail "grep fallback not triggered"
    echo "    output: $(echo "$OUTPUT" | head -5)"
  fi
else
  # Vendor dir not present -- fallback always active, check the WARN string exists in script
  if grep -q 'WARN.*fallback\|fallback.*grep' "$VVS"; then
    pass "validate_viz.sh contains WARN fallback message text (vendor dir absent)"
  else
    fail "validate_viz.sh missing WARN fallback message for when AST is unavailable"
  fi
fi

# --- T13: Phase 2 capability detection variables in validate_viz.sh ---
echo "--- T13: Phase 2 capability detection variables in validate_viz.sh ---"
if grep -q 'VALIDATE_DASH=' "$VVS" && grep -q 'HAS_DASH=' "$VVS"; then
  pass "validate_viz.sh contains VALIDATE_DASH= and HAS_DASH= variables"
else
  fail "validate_viz.sh missing VALIDATE_DASH= or HAS_DASH= capability detection"
fi

# --- T14: test25 (clean namespaced dashboard) has no structural B10 failures ---
# NOTE: Phase 3 update -- test25 theme.js has a real FAIL CONTRAST (light.textDim/panelHi
# 4.32:1 < 4.5:1). validate_viz.sh now correctly exits 1 due to contrast violations.
# T14 verifies test25 has NO structural FAIL B10 lines (namespace issues) -- that baseline
# is preserved. Contrast failures are expected and tracked in T21/T22.
echo "--- T14: test25 (clean namespaced dashboard) has no B10/B9 structural failures ---"
if [ -d "$TEST25" ]; then
  OUTPUT=$(bash "$VVS" "$TEST25" 2>&1)
  B10_LINES=$(echo "$OUTPUT" | grep -c 'FAIL B10\|FAIL B9' || true)
  if [ "$B10_LINES" -eq 0 ]; then
    pass "validate_viz.sh on test25 has no structural B10/B9 failures (correct)"
  else
    fail "validate_viz.sh on test25 has $B10_LINES structural FAIL B10/B9 line(s) (unexpected)"
    echo "    output: $(echo "$OUTPUT" | grep 'FAIL B10\|FAIL B9' | head -3)"
  fi
else
  echo "  SKIP T14: test25 not found at $TEST25"
fi

# --- T15: test28 (bare-key dashboard) exits 1 with FAIL B10 ---
echo "--- T15: test28 (bare-key dashboard) exits 1 with FAIL B10 ---"
if [ -d "$TEST28" ]; then
  OUTPUT=$(bash "$VVS" "$TEST28" 2>&1)
  EXIT_CODE=$?
  if [ "$EXIT_CODE" -ne 0 ] && echo "$OUTPUT" | grep -q 'FAIL B10'; then
    pass "validate_viz.sh on test28 exits 1 with FAIL B10"
  elif [ "$EXIT_CODE" -eq 0 ]; then
    fail "validate_viz.sh on test28 exited 0 — expected failure for B10 violation"
  else
    fail "validate_viz.sh on test28 exited $EXIT_CODE but output missing FAIL B10: $(echo "$OUTPUT" | grep FAIL | head -3)"
  fi
else
  echo "  SKIP T15: test28 not found at $TEST28"
fi

# --- T16: validate_findings.ndjson produced alongside app dir ---
echo "--- T16: validate_findings.ndjson produced alongside app dir ---"
if [ -d "$TEST28" ]; then
  bash "$VVS" "$TEST28" > /dev/null 2>&1 || true
  FINDINGS="$(dirname "$TEST28")/validate_findings.ndjson"
  if [ -f "$FINDINGS" ]; then
    # Check it has at least one FINDING: JSON line (NDJSON format with FINDING: prefix)
    if grep -q '^FINDING:{' "$FINDINGS" 2>/dev/null; then
      pass "validate_findings.ndjson exists and contains FINDING:{json} entries"
    else
      fail "validate_findings.ndjson exists but no FINDING:{json} lines found"
    fi
  else
    fail "validate_findings.ndjson not found at $FINDINGS"
  fi
else
  echo "  SKIP T16: test28 not found at $TEST28"
fi

# --- T17: --repair flag wired into validate_viz.sh ---
echo "--- T17: --repair flag wired into validate_viz.sh ---"
if grep -q '\-\-repair' "$VVS"; then
  pass "--repair flag present in validate_viz.sh"
else
  fail "--repair flag not found in validate_viz.sh"
fi

# --- T18: validate_repair_log.ndjson created after --repair run ---
# Run --repair on a COPY of test28 to avoid modifying the fixture
echo "--- T18: validate_repair_log.ndjson created after --repair run ---"
if [ -d "$TEST28" ]; then
  TMP_PARENT=$(mktemp -d /tmp/test28_t18_parent_XXXXXX)
  TMP_APP="$TMP_PARENT/app"
  cp -r "$TEST28/." "$TMP_APP/"
  bash "$VVS" --repair "$TMP_APP" > /dev/null 2>&1 || true
  REPAIR_LOG="$TMP_PARENT/validate_repair_log.ndjson"
  if [ -f "$REPAIR_LOG" ]; then
    pass "validate_repair_log.ndjson created alongside app dir after --repair"
  else
    fail "validate_repair_log.ndjson not found at $REPAIR_LOG after --repair"
  fi
  rm -rf "$TMP_PARENT"
else
  echo "  SKIP T18: test28 not found at $TEST28"
fi

# --- T19: B10 violations eliminated after --repair on test28 ---
# NOTE: test28 has contrast violations that repair cannot fix (contrast is report-only).
# T19 asserts that FAIL B10 lines are eliminated (the primary repair target), not that
# validate_viz.sh exits 0. Exit will be 1 due to contrast violations after repair.
# Strategy: run --repair, then run validate_viz.sh WITHOUT --repair on the modified copy
# to get a clean final-state report; count B10 lines there.
echo "--- T19: B10 violations eliminated after --repair on test28 ---"
if [ -d "$TEST28" ]; then
  TMP_PARENT=$(mktemp -d /tmp/test28_t19_parent_XXXXXX)
  TMP_APP="$TMP_PARENT/app"
  cp -r "$TEST28/." "$TMP_APP/"
  bash "$VVS" --repair "$TMP_APP" > /dev/null 2>&1 || true
  # Re-run WITHOUT --repair to get a clean final-state report
  FINAL_OUTPUT=$(bash "$VVS" "$TMP_APP" 2>&1)
  FINAL_B10=$(echo "$FINAL_OUTPUT" | grep -c 'FAIL B10' || true)
  if [ "$FINAL_B10" -eq 0 ]; then
    pass "No FAIL B10 lines in post-repair validation (B10 fully repaired in <=3 attempts)"
  else
    fail "$FINAL_B10 FAIL B10 lines remain after --repair (repair_findings.js did not fix all B10)"
    echo "    first few remaining: $(echo "$FINAL_OUTPUT" | grep 'FAIL B10' | head -3)"
  fi
  # Also verify the repair log captured some entries
  REPAIR_LOG="$TMP_PARENT/validate_repair_log.ndjson"
  if [ -f "$REPAIR_LOG" ] && [ -s "$REPAIR_LOG" ]; then
    pass "validate_repair_log.ndjson has content"
  else
    fail "validate_repair_log.ndjson missing or empty"
  fi
  rm -rf "$TMP_PARENT"
else
  echo "  SKIP T19: test28 not found at $TEST28"
fi

# --- T20: check_contrast.js is called from validate_viz.sh ---
echo "--- T20: check_contrast.js called from validate_viz.sh ---"
if grep -q 'check_contrast' "$VVS"; then
  pass "check_contrast referenced in validate_viz.sh"
else
  fail "check_contrast not referenced in validate_viz.sh"
fi

# --- T21: Contrast Check section appears in test28 output ---
# test28 has shared/theme.js so the contrast check must run and produce the section header.
# Exit code may be 1 (test28 has contrast violations) -- we assert section presence only.
echo "--- T21: Contrast Check section appears in test28 output ---"
if [ -d "$TEST28" ]; then
  OUTPUT=$(bash "$VVS" "$TEST28" 2>&1)
  if echo "$OUTPUT" | grep -q 'Contrast Check'; then
    pass "Contrast Check section present in test28 output"
  else
    fail "Contrast Check section missing from test28 output"
    echo "    last 5 lines: $(echo "$OUTPUT" | tail -5)"
  fi
else
  echo "  SKIP T21: test28 not found at $TEST28"
fi

# --- T22: Contrast Check section appears in test25 output ---
# NOTE: test25 theme.js has a real FAIL CONTRAST (light.textDim/panelHi 4.32:1 < 4.5:1).
# validate_viz.sh exits 1 due to this contrast failure -- that is CORRECT behavior.
# T22 asserts the section header appears (proving check_contrast.js was called).
echo "--- T22: Contrast Check section appears in test25 output ---"
if [ -d "$TEST25" ]; then
  OUTPUT=$(bash "$VVS" "$TEST25" 2>&1)
  if echo "$OUTPUT" | grep -q 'Contrast Check'; then
    pass "Contrast Check section present in test25 output (contrast issues correctly surfaced)"
  else
    fail "Contrast Check section missing from test25 output"
    echo "    last 5 lines: $(echo "$OUTPUT" | tail -5)"
  fi
else
  echo "  SKIP T22: test25 not found at $TEST25"
fi

echo ""
echo "============================================"
echo "  Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -eq 0 ]; then
  echo "  ALL INTEGRATION TESTS PASSED"
  exit 0
else
  echo "  INTEGRATION TEST FAILURES"
  exit 1
fi
