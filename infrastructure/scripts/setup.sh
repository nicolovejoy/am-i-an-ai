#!/bin/bash
set -e

# Check prerequisites
command -v terraform >/dev/null 2>&1 || { echo "Terraform is required but not installed. Aborting." >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "AWS CLI is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting." >&2; exit 1; }

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
cd ../frontend
npm install
npm run build
aws s3 sync out/ s3://amianai.com --delete --cache-control "max-age=86400"

# Invalidate CloudFront if needed
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[?contains(@, 'amianai.com')]].Id" --output text)
if [ -n "$DISTRIBUTION_ID" ]; then
  echo "Invalidating CloudFront cache..."
  aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
fi

echo "Setup complete!" 