#!/bin/bash
set -e

# Ensure we're in the project root directory
cd "$(dirname "$0")/../.." || exit 1

# Store the infrastructure directory path
INFRA_DIR="$(pwd)/infrastructure"

# Check prerequisites
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting." >&2; exit 1; }

# Build main Lambda function
echo "Building main Lambda function..."
cd backend/lambda
npm install
npm run build

# Create zip file for main Lambda
echo "Creating main Lambda deployment package..."
cd dist
zip -r "$INFRA_DIR/backend_lambda.zip" ./*

# Build auth Lambda function
echo "Building auth Lambda function..."
cd ../auth
npm install
npm run build

# Create zip file for auth Lambda
echo "Creating auth Lambda deployment package..."
if [ ! -d "dist" ]; then
    echo "Error: dist directory not found after build"
    exit 1
fi

# Create zip file from the auth directory
cd dist
zip -r "$INFRA_DIR/auth_lambda.zip" ./*

echo "Lambda builds complete!" 