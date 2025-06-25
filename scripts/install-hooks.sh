#!/bin/bash

# Install Git hooks for the project
# This script copies pre-commit hooks to the .git/hooks directory

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "📦 Installing Git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Copy pre-commit hook
cp "$SCRIPT_DIR/pre-commit-hook.sh" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"

echo "✅ Pre-commit hook installed successfully!"
echo ""
echo "The pre-commit hook will check for:"
echo "  • OpenAI API keys (sk-*)"
echo "  • AWS credentials"
echo "  • Generic API keys"
echo "  • Hardcoded passwords"
echo "  • Private keys"
echo ""
echo "To skip the hook temporarily (not recommended):"
echo "  git commit --no-verify"