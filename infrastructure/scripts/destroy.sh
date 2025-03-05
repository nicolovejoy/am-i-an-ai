#!/bin/bash
set -e

DOMAIN_NAME="amianai.com"

# Ensure we're in the infrastructure directory for terraform commands
cd "$(dirname "$0")/.." || exit 1

echo "⚠️  This will destroy all resources for ${DOMAIN_NAME}"
echo "Are you sure? (y/n)"
read -r response

if [ "$response" != "y" ]; then
    echo "Aborting..."
    exit 1
fi

# Check if resources exist first
if ! aws s3 ls "s3://${DOMAIN_NAME}" 2>&1 > /dev/null; then
    echo "S3 bucket doesn't exist, skipping bucket cleanup..."
else
    echo "Emptying S3 bucket..."
    aws s3 rm "s3://${DOMAIN_NAME}" --recursive
fi

# Get CloudFront distribution ID
echo "Getting CloudFront distribution ID..."
DIST_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")
echo "Distribution ID: ${DIST_ID}"

if [ -n "$DIST_ID" ]; then
    echo "Disabling CloudFront distribution..."
    aws cloudfront update-distribution --id "$DIST_ID" --enabled false --region us-east-1

    echo "Waiting for CloudFront to disable..."
    aws cloudfront wait distribution-deployed --id "$DIST_ID" --region us-east-1
else
    echo "No CloudFront distribution found, skipping disable step..."
fi

# Destroy infrastructure
echo "Destroying infrastructure..."
terraform destroy -auto-approve

echo "Infrastructure destroyed successfully!" 