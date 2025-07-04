#!/bin/bash
set -e

# Deploy Frontend to S3 and Invalidate CloudFront
# Uploads built frontend files to S3 and clears CloudFront cache

echo "🚀 Deploying Frontend Application..."

# Check environment variables
if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Error: DOMAIN_NAME environment variable is required"
    echo "Usage: DOMAIN_NAME=robotorchestra.org ./deploy-frontend.sh"
    exit 1
fi

# Navigate to frontend directory
cd "$(dirname "$0")/../../frontend"

# Verify build exists
if [ ! -d "dist" ]; then
    echo "❌ Build not found! Run ./build-frontend.sh first"
    exit 1
fi

echo "📤 Uploading to S3 bucket: $DOMAIN_NAME"
aws s3 sync dist/ "s3://${DOMAIN_NAME}/" --delete --cache-control "max-age=86400"

# Get CloudFront distribution ID from terraform
cd ../infrastructure
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")

if [ -n "$CLOUDFRONT_ID" ]; then
    echo "🔄 Invalidating CloudFront cache: $CLOUDFRONT_ID"
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text
    echo "✅ CloudFront invalidation created"
else
    echo "⚠️  CloudFront distribution ID not found - cache not invalidated"
fi

echo "✅ Frontend deployment complete!"
echo "🌍 Site: https://$DOMAIN_NAME"