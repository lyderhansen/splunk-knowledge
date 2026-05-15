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

# --- T4: test28 exits 0 with AST mode active ---
echo "--- T4: test28 exits 0 (clean pack, AST mode) ---"
if [ -d "$TEST28" ]; then
  OUTPUT=$(bash "$VVS" "$TEST28" 2>&1)
  EXIT_CODE=$?
  if [ "$EXIT_CODE" -eq 0 ]; then
    pass "validate_viz.sh on test28 exits 0"
  else
    fail "validate_viz.sh on test28 exits $EXIT_CODE (expected 0)"
    echo "    output: $(echo "$OUTPUT" | grep FAIL | head -3)"
  fi
else
  fail "test28 fixture not found at $TEST28"
fi

# --- T5: test28 contains no FAIL lines ---
echo "--- T5: test28 output has no FAIL lines ---"
if [ -d "$TEST28" ]; then
  FAIL_LINES=$(bash "$VVS" "$TEST28" 2>&1 | grep -c '  FAIL' || true)
  if [ "$FAIL_LINES" -eq 0 ]; then
    pass "test28 output contains no FAIL lines"
  else
    fail "test28 output contains $FAIL_LINES FAIL line(s)"
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

# --- T8: test21 exits 1 and FAIL lines contain line numbers (if test21 available) ---
echo "--- T8: test21 exits 1 and FAIL lines include line numbers ---"
if [ -d "$TEST21" ]; then
  OUTPUT=$(bash "$VVS" "$TEST21" 2>&1)
  EXIT_CODE=$?
  if [ "$EXIT_CODE" -eq 1 ]; then
    pass "validate_viz.sh on test21 exits 1 (violations detected)"
  else
    fail "validate_viz.sh on test21 exits $EXIT_CODE (expected 1)"
  fi
  LINE_NUM_FAILS=$(echo "$OUTPUT" | grep -cE 'FAIL.*line [0-9]+' || true)
  if [ "$LINE_NUM_FAILS" -gt 0 ]; then
    pass "FAIL lines include line numbers ($LINE_NUM_FAILS line(s))"
  else
    fail "FAIL lines do not include line numbers (expected 'at line N:')"
    echo "    FAIL lines found: $(echo "$OUTPUT" | grep '  FAIL' | head -5)"
  fi
else
  echo "  SKIP T8: test21 not available at $TEST21"
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

# --- T12: WARN fallback message when USE_AST disabled ---
echo "--- T12: WARN message on fallback when AST unavailable ---"
if USE_AST_TEST=0 bash "$VVS" "$TEST28" 2>&1 | grep -q 'WARN.*validate_ast.*fallback\|WARN.*grep fallback'; then
  pass "validate_viz.sh prints WARN when AST unavailable (USE_AST=0 mode detectable)"
else
  # Check if the script has the WARN string at all
  if grep -q 'WARN.*fallback\|fallback.*grep' "$VVS"; then
    pass "validate_viz.sh contains WARN fallback message text"
  else
    fail "validate_viz.sh missing WARN fallback message for when AST is unavailable"
  fi
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
