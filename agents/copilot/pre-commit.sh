#!/bin/sh
# Pre-commit hook: regenerate Copilot instructions when inbox.md or outbox.md changes
# Install: ln -s ../../agents/copilot/pre-commit.sh .git/hooks/pre-commit
# Or: cp agents/copilot/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

STAGED_FILES=$(git diff --cached --name-only)

# Check if any agent record files changed
if echo "$STAGED_FILES" | grep -q "agents/copilot/"; then
    echo "[pre-commit] Copilot agent record changed — regenerating instructions..."
    python3 agents/copilot/generate-instructions.py
    if [ $? -ne 0 ]; then
        echo "[pre-commit] ❌ Gateway script failed. Aborting commit."
        exit 1
    fi
    # Stage the regenerated file
    git add .github/copilot-instructions.md
    echo "[pre-commit] ✓ .github/copilot-instructions.md regenerated and staged"
fi

exit 0
