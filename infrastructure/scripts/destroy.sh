#!/bin/bash
set -e

# Check environment variables
if [ -z "$DOMAIN_NAME" ]; then
    echo "Error: DOMAIN_NAME environment variable is required. Aborting." >&2
    exit 1
fi

# Ensure we're in the infrastructure directory
SCRIPT_DIR="$(dirname "$0")"
if [ "$(basename "$(pwd)")" != "infrastructure" ]; then
    cd "$SCRIPT_DIR/.." || exit 1
fi

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
DIST_ID=$(terraform output -json | jq -r .cloudfront_distribution_id.value 2>/dev/null || echo "")
echo "Distribution ID: ${DIST_ID}"

if [ -n "$DIST_ID" ]; then
    echo "Disabling CloudFront distribution..."
    # Get the current config
    CONFIG_FILE=$(mktemp)
    ETAG_FILE=$(mktemp)
    DIST_CONFIG_FILE=$(mktemp)
    
    # Get distribution config and extract ETag
    aws cloudfront get-distribution-config --id "$DIST_ID" > "$CONFIG_FILE"
    ETAG=$(jq -r '.ETag' "$CONFIG_FILE")
    
    # Extract just the DistributionConfig portion
    jq '.DistributionConfig' "$CONFIG_FILE" > "$DIST_CONFIG_FILE"
    
    # Set Enabled to false
    jq '.Enabled = false' "$DIST_CONFIG_FILE" > "${DIST_CONFIG_FILE}.tmp" && mv "${DIST_CONFIG_FILE}.tmp" "$DIST_CONFIG_FILE"
    
    # Update the distribution with the new config
    aws cloudfront update-distribution --id "$DIST_ID" --if-match "$ETAG" --distribution-config "$(cat "$DIST_CONFIG_FILE")"
    
    # Cleanup temp files
    rm "$CONFIG_FILE" "$ETAG_FILE" "$DIST_CONFIG_FILE"

    echo "Waiting for CloudFront to disable..."
    aws cloudfront wait distribution-deployed --id "$DIST_ID" --region us-east-1
else
    echo "No CloudFront distribution found, skipping disable step..."
fi

# No Lambda functions to build in new architecture

# Destroy infrastructure
echo "Destroying infrastructure..."
terraform destroy -auto-approve

# No Lambda deployment packages to clean up

echo "Infrastructure destroyed successfully!" 