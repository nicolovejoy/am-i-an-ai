#!/bin/bash
set -e

# Ensure we're in the infrastructure directory
SCRIPT_DIR="$(dirname "$0")"
if [ "$(basename "$(pwd)")" != "infrastructure" ]; then
    cd "$SCRIPT_DIR/.." || exit 1
fi

# Check prerequisites
command -v terraform >/dev/null 2>&1 || { echo "Terraform is required but not installed. Aborting." >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "AWS CLI is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting." >&2; exit 1; }
command -v zip >/dev/null 2>&1 || { echo "zip is required but not installed. Aborting." >&2; exit 1; }

# Check environment variables
if [ -z "$AWS_PROFILE" ]; then
    echo "Warning: AWS_PROFILE not set. Using default profile."
fi

if [ -z "$DOMAIN_NAME" ]; then
    echo "Error: DOMAIN_NAME environment variable is required. Aborting." >&2
    exit 1
fi

# Build Lambda function
echo "Building Lambda function..."
./scripts/build_lambda.sh

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

# Apply infrastructure
echo "Applying infrastructure..."
terraform apply

# Wait for certificate validation
echo "Waiting for certificate validation..."
sleep 30

# Deploy initial content
echo "Deploying initial content..."
cd ../frontend || exit 1
npm install
npm run build
aws s3 sync out/ s3://${DOMAIN_NAME}/ --delete

# Get CloudFront distribution ID and create invalidation
DISTRIBUTION_ID=$(cd ../infrastructure && terraform output -json | jq -r .cloudfront_distribution_id.value)
if [ -n "$DISTRIBUTION_ID" ]; then
    echo "Creating CloudFront invalidation..."
    aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
else
    echo "Warning: Could not get CloudFront distribution ID"
fi

echo "Setup complete!" 