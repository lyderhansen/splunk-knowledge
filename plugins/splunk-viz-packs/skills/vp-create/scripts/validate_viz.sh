#!/bin/bash
# validate_viz.sh — delegates to canonical validator in vp-viz/scripts/
# Why: vp-create callers use ${CLAUDE_SKILL_DIR}/scripts/validate_viz.sh; this delegates to
# the canonical copy in vp-viz/scripts/ to avoid duplicating logic.
# Canonical source: plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CANONICAL="$SCRIPT_DIR/../../vp-viz/scripts/validate_viz.sh"
if [ ! -f "$CANONICAL" ]; then
    echo "ERROR: canonical validate_viz.sh not found at $CANONICAL"
    exit 1
fi
exec bash "$CANONICAL" "$@"
