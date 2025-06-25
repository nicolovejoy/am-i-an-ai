#!/bin/bash

# Pre-commit hook to prevent committing secrets
# This script checks for common patterns of API keys and secrets

echo "🔍 Checking for secrets in staged files..."

# Define patterns to search for
PATTERNS=(
    # OpenAI API keys
    'sk-[a-zA-Z0-9_-]{20,}'
    'sk-proj-[a-zA-Z0-9_-]{20,}'
    
    # AWS Access Keys
    'AKIA[0-9A-Z]{16}'
    'aws_access_key_id[[:space:]]*=[[:space:]]*["\047]?[A-Z0-9]{20}'
    'aws_secret_access_key[[:space:]]*=[[:space:]]*["\047]?[A-Za-z0-9/+=]{40}'
    
    # Generic API key patterns
    'api_key[[:space:]]*=[[:space:]]*["\047]?[a-zA-Z0-9_-]{20,}'
    'apikey[[:space:]]*=[[:space:]]*["\047]?[a-zA-Z0-9_-]{20,}'
    'API_KEY[[:space:]]*=[[:space:]]*["\047]?[a-zA-Z0-9_-]{20,}'
    
    # Database passwords (not just placeholders)
    'password[[:space:]]*=[[:space:]]*["\047]?[^<>{}$][a-zA-Z0-9!@#$%^&*()_+-=]{8,}'
    
    # Private keys
    '-----BEGIN RSA PRIVATE KEY-----'
    '-----BEGIN OPENSSH PRIVATE KEY-----'
    '-----BEGIN DSA PRIVATE KEY-----'
    '-----BEGIN EC PRIVATE KEY-----'
    '-----BEGIN PGP PRIVATE KEY BLOCK-----'
)

# Files to exclude from checks
EXCLUDED_FILES=(
    "package-lock.json"
    "yarn.lock"
    "*.min.js"
    "*.map"
    "terraform.tfstate"
    "terraform.tfstate.backup"
)

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Flag to track if secrets were found
SECRETS_FOUND=0

# Check each staged file
for file in $STAGED_FILES; do
    # Skip excluded files
    skip=0
    for excluded in "${EXCLUDED_FILES[@]}"; do
        if [[ "$file" == $excluded ]] || [[ "$file" == *"$excluded" ]]; then
            skip=1
            break
        fi
    done
    
    if [ $skip -eq 1 ]; then
        continue
    fi
    
    # Skip binary files
    if file "$file" | grep -q "binary"; then
        continue
    fi
    
    # Check each pattern
    for pattern in "${PATTERNS[@]}"; do
        if git diff --cached --name-only -G"$pattern" | grep -q "^$file$"; then
            echo "❌ Potential secret found in $file"
            echo "   Pattern matched: $pattern"
            git diff --cached "$file" | grep -E "$pattern" | head -3
            SECRETS_FOUND=1
        fi
    done
done

if [ $SECRETS_FOUND -eq 1 ]; then
    echo ""
    echo "⚠️  Commit blocked: Potential secrets detected!"
    echo ""
    echo "If this is a false positive, you can:"
    echo "1. Use environment variables instead of hardcoded values"
    echo "2. Add the file to .gitignore if it contains secrets"
    echo "3. Override with: git commit --no-verify (NOT RECOMMENDED)"
    echo ""
    exit 1
else
    echo "✅ No secrets detected. Proceeding with commit..."
fi

exit 0