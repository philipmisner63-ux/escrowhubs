#!/bin/sh
# Pre-commit hook: regenerate agent artifacts when agent record files change
# Install: ln -s ../../agents/copilot/pre-commit.sh .git/hooks/pre-commit
# Or: cp agents/copilot/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

STAGED_FILES=$(git diff --cached --name-only)

# 1. Check if Copilot agent record changed → regenerate instructions
if echo "$STAGED_FILES" | grep -q "agents/copilot/"; then
    echo "[pre-commit] Copilot agent record changed — regenerating instructions..."
    python3 agents/copilot/generate-instructions.py
    if [ $? -ne 0 ]; then
        echo "[pre-commit] ❌ Gateway script failed. Aborting commit."
        exit 1
    fi
    git add .github/copilot-instructions.md
    echo "[pre-commit] ✓ .github/copilot-instructions.md regenerated and staged"
fi

# 2. Check if broadcast.md changed → fan out to all agents
if echo "$STAGED_FILES" | grep -q "agents/broadcast.md"; then
    echo "[pre-commit] Broadcast changed — fanning out to all agents..."
    python3 agents/broadcast-fanout.py
    if [ $? -ne 0 ]; then
        echo "[pre-commit] ❌ Broadcast fan-out failed. Aborting commit."
        exit 1
    fi
    git add agents/*/inbox.md agents/broadcast-seen.json
    echo "[pre-commit] ✓ Broadcast fanned out to agent inboxes"
fi

# 3. Check if any outbox.md changed → compile consensus thread
if echo "$STAGED_FILES" | grep -q "outbox.md"; then
    echo "[pre-commit] Outbox entries changed — compiling consensus thread..."
    python3 agents/consensus/compile-thread.py
    if [ $? -ne 0 ]; then
        echo "[pre-commit] ❌ Consensus compilation failed. Aborting commit."
        exit 1
    fi
    git add agents/consensus/current.md
    echo "[pre-commit] ✓ Consensus thread compiled and staged"
fi

exit 0
