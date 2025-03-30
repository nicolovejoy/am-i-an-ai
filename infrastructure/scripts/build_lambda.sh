#!/bin/bash
set -e

# Ensure we're in the project root directory
cd "$(dirname "$0")/../.." || exit 1

# Check prerequisites
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting." >&2; exit 1; }

# Build Lambda function
echo "Building Lambda function..."
cd backend/lambda
npm install
npm run build

# Create zip file
echo "Creating Lambda deployment package..."
cd dist
zip -r ../../../infrastructure/backend_lambda.zip ./*

echo "Lambda build complete!" 