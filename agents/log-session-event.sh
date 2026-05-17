#!/usr/bin/env bash
# Log an event to agents/copilot/session-notes.md
# Usage: ./agents/log-session-event.sh "Event description" --agent <name>
#
# Example:
#   ./agents/log-session-event.sh "Deployed v2.3 to production" --agent hermes

set -e

AGENT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$AGENT_DIR")"
NOTES_FILE="$AGENT_DIR/copilot/session-notes.md"

AGENT_NAME="${USER:-agent}"
MSG=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --agent)
      AGENT_NAME="$2"
      shift 2
      ;;
    *)
      MSG="$MSG $1"
      shift
      ;;
  esac
done

MSG="$(echo "$MSG" | sed 's/^ *//')"

if [ -z "$MSG" ]; then
  echo "Usage: $0 \"Event description\" --agent <name>" >&2
  exit 1
fi

TIMESTAMP="$(date -u +"%Y-%m-%d %H:%M UTC")"

# Insert after "## Session Notes" heading, before first entry
TMP="$(mktemp)"
awk -v entry="### [$TIMESTAMP] $MSG\n$MSG\n— $AGENT_NAME\n" '
  /^## Session Notes$/ {
    print
    print ""
    printf "%s", entry
    next
  }
  { print }
' "$NOTES_FILE" > "$TMP"

mv "$TMP" "$NOTES_FILE"
echo "[log-session-event] Appended to session-notes.md — $AGENT_NAME"
