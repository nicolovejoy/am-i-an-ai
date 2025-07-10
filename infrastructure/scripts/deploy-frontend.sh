#!/bin/bash
set -e

# Deploy Frontend to S3 and Invalidate CloudFront
# Builds and uploads frontend files to S3, then clears CloudFront cache

echo "🚀 Deploying Frontend Application..."

# Check environment variables
if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Error: DOMAIN_NAME environment variable is required"
    echo "Usage: DOMAIN_NAME=robotorchestra.org ./deploy-frontend.sh"
    exit 1
fi

# Navigate to frontend directory
cd "$(dirname "$0")/../../frontend"

# Check if dependencies need to be installed
if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Run linting
echo "🔍 Running linter..."
npm run lint || {
    echo "❌ Linting failed! Fix errors before deploying."
    exit 1
}

# Build the frontend
echo "🔨 Building frontend..."
npm run build || {
    echo "❌ Build failed!"
    exit 1
}

# Verify build output exists
if [ ! -d "dist" ]; then
    echo "❌ Build output not found in dist/"
    exit 1
fi

echo "📤 Uploading to S3 bucket: $DOMAIN_NAME"
aws s3 sync dist/ "s3://${DOMAIN_NAME}/" \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html" \
    --exclude "*.json"

# Upload index.html and JSON files with no-cache headers
aws s3 cp dist/index.html "s3://${DOMAIN_NAME}/index.html" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html"

# Upload any JSON files with appropriate cache headers
find dist -name "*.json" -type f | while read -r file; do
    rel_path="${file#dist/}"
    aws s3 cp "$file" "s3://${DOMAIN_NAME}/$rel_path" \
        --cache-control "no-cache, no-store, must-revalidate" \
        --content-type "application/json"
done

# Get CloudFront distribution ID from terraform
cd ../infrastructure
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")

if [ -n "$CLOUDFRONT_ID" ]; then
    echo "🔄 Creating CloudFront invalidation..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo "⏳ Waiting for invalidation to complete (ID: $INVALIDATION_ID)..."
    aws cloudfront wait invalidation-completed \
        --distribution-id "$CLOUDFRONT_ID" \
        --id "$INVALIDATION_ID" || {
        echo "⚠️  Invalidation is in progress but taking longer than expected"
        echo "    You can check status with:"
        echo "    aws cloudfront get-invalidation --distribution-id $CLOUDFRONT_ID --id $INVALIDATION_ID"
    }
    
    echo "✅ CloudFront cache cleared"
else
    echo "⚠️  CloudFront distribution ID not found - cache not invalidated"
    echo "    Run 'terraform output' to check your infrastructure"
fi

echo ""
echo "✅ Frontend deployment complete!"
echo "🌍 Site: https://$DOMAIN_NAME"
echo ""
echo "📊 Deployment summary:"
echo "   - Built with timestamp: $(TZ='America/Los_Angeles' date +'%Y-%m-%d %H:%M PST')"
echo "   - Files uploaded to S3: $(find dist -type f | wc -l)"
echo "   - CloudFront invalidation: ${CLOUDFRONT_ID:-Not configured}"