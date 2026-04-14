#!/bin/bash

# Auto-commit and push script for Claude Code hooks
# This script runs after every code change

cd "$(dirname "$0")/.." || exit 1

# Check if there are any changes
if [[ -z $(git status --porcelain) ]]; then
    exit 0
fi

# Stage all changes
git add .

# Create commit with timestamp
COMMIT_MSG="Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git commit -m "$COMMIT_MSG" --no-verify

# Push to remote
git push --no-verify

exit 0
