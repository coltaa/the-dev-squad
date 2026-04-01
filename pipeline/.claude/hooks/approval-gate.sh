#!/bin/bash
#
# Pipeline Approval Gate
#
# Per-agent permission enforcement. Auto mode handles general safety.
# This hook handles pipeline-specific rules:
#
# AGENT S (Supervisor): No restrictions.
# AGENT A (Planner):    Can only write plan.md. No Bash. No Agent tool. No writes during Phase 0.
# AGENT B (Reviewer):   Cannot write anything. No Bash. No Agent tool.
# AGENT C (Coder):      Can write anything inside ~/Builds/ except plan.md. No Agent tool.
# AGENT D (Tester):     Cannot write anything. No Agent tool.
#
# ALL: Write/Edit outside ~/Builds/ blocked.
#

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name')
TOOL_INPUT=$(echo "$INPUT" | jq -c '.tool_input')
CWD=$(echo "$INPUT" | jq -r '.cwd')

BUILDS_DIR="$HOME/Builds"
AGENT="${PIPELINE_AGENT:-unknown}"

# ── Auto-approve read-only tools ─────────────────────────────────────

case "$TOOL_NAME" in
  Read|Glob|Grep|ToolSearch|TaskCreate|TaskUpdate|TaskGet|TaskList|TaskOutput)
    echo '{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow"}}'
    exit 0
    ;;
esac

# ── Supervisor has no restrictions ───────────────────────────────────

if [ "$AGENT" = "S" ]; then
  echo '{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow"}}'
  exit 0
fi

# ── Block Agent tool for A/B/C/D ────────────────────────────────────

if [ "$TOOL_NAME" = "Agent" ]; then
  echo "BLOCKED: Agent $AGENT cannot spawn sub-agents" >&2
  exit 2
fi

# ── Per-agent Write/Edit rules ───────────────────────────────────────

case "$TOOL_NAME" in
  Write|Edit)
    FILEPATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // ""')
    if [[ "$FILEPATH" != /* ]]; then
      FILEPATH="$CWD/$FILEPATH"
    fi
    FILEPATH=$(cd "$(dirname "$FILEPATH")" 2>/dev/null && echo "$(pwd -P)/$(basename "$FILEPATH")" || echo "$FILEPATH")
    FILENAME=$(basename "$FILEPATH")

    # Block all writes outside ~/Builds/
    if [[ "$FILEPATH" != "$BUILDS_DIR"* ]]; then
      echo "BLOCKED: Cannot write to $FILEPATH — outside ~/Builds/" >&2
      exit 2
    fi

    # Phase 0 check for A
    if [ "$AGENT" = "A" ]; then
      EVENTS_FILE=""
      CHECK="$CWD"
      while [ "$CHECK" != "/" ]; do
        if [ -f "$CHECK/pipeline-events.json" ]; then
          EVENTS_FILE="$CHECK/pipeline-events.json"
          break
        fi
        CHECK=$(dirname "$CHECK")
      done
      if [ -n "$EVENTS_FILE" ]; then
        CURRENT_PHASE=$(jq -r '.currentPhase // "concept"' "$EVENTS_FILE" 2>/dev/null)
        if [ "$CURRENT_PHASE" = "concept" ]; then
          echo "BLOCKED: Agent A cannot write during Phase 0" >&2
          exit 2
        fi
      fi
    fi

    # Agent-specific write rules
    case "$AGENT" in
      A)
        if [[ "$FILENAME" != "plan.md" ]]; then
          echo "BLOCKED: Agent A can only write plan.md, not $FILENAME" >&2
          exit 2
        fi
        ;;
      B)
        echo "BLOCKED: Agent B cannot write files" >&2
        exit 2
        ;;
      C)
        if [[ "$FILENAME" == "plan.md" ]]; then
          echo "BLOCKED: Agent C cannot modify plan.md — it is locked" >&2
          exit 2
        fi
        ;;
      D)
        echo "BLOCKED: Agent D cannot write files" >&2
        exit 2
        ;;
    esac

    echo '{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow"}}'
    exit 0
    ;;
esac

# ── Per-agent Bash rules ─────────────────────────────────────────────

if [ "$TOOL_NAME" = "Bash" ]; then
  case "$AGENT" in
    A)
      echo "BLOCKED: Agent A cannot run commands" >&2
      exit 2
      ;;
    B)
      echo "BLOCKED: Agent B cannot run commands" >&2
      exit 2
      ;;
  esac
  # C and D: auto mode handles bash safety
  echo '{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow"}}'
  exit 0
fi

# ── Everything else — let auto mode decide ───────────────────────────

echo '{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow"}}'
exit 0
