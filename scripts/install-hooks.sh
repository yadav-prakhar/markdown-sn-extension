#!/bin/bash

# Install git hooks for the project
# Run this script after cloning to enable pre-push test verification

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_DIR="$(git rev-parse --git-common-dir 2>/dev/null)"

if [ -z "$GIT_DIR" ]; then
    echo "Error: Not in a git repository"
    exit 1
fi

HOOKS_DIR="$GIT_DIR/hooks"
SOURCE_HOOKS="$SCRIPT_DIR/hooks"

echo "Installing git hooks..."

# Install pre-push hook
if [ -f "$SOURCE_HOOKS/pre-push" ]; then
    cp "$SOURCE_HOOKS/pre-push" "$HOOKS_DIR/pre-push"
    chmod +x "$HOOKS_DIR/pre-push"
    echo "✓ Installed pre-push hook"
fi

echo ""
echo "Git hooks installed successfully!"
echo "The pre-push hook will run tests before each push."
