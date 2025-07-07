#!/bin/bash
set -e

# Deploy Lambda Functions - Fixed for Unified Match API
# Builds TypeScript and deploys both Lambda functions properly

echo "⚡ Deploying Lambda Functions (Fixed)..."

# Check environment variables
if [ -z "$TF_VAR_openai_api_key" ]; then
    echo "❌ Error: TF_VAR_openai_api_key environment variable is required"
    echo "Usage: export TF_VAR_openai_api_key='your-api-key' && ./deploy-lambda-fixed.sh"
    exit 1
fi

# Navigate to lambda directory
cd "$(dirname "$0")/../../lambda"

echo "📦 Installing Lambda dependencies..."
npm ci

echo "🔨 Compiling TypeScript..."
npx tsc

echo "📦 Building deployment packages..."

# Create deployment package directory (different from tsc output)
mkdir -p deploy
rm -rf deploy/*

# Copy compiled JS files from TypeScript dist directory and package.json
cp dist/*.js deploy/
cp package*.json deploy/
# Copy the kafka-schemas directory (needed by the compiled code)
cp -r dist/kafka-schemas deploy/ 2>/dev/null || true

# Copy node_modules for production dependencies only
cd deploy
npm ci --production --silent

# Create match-service package with proper structure
echo "📦 Creating match-service package..."
zip -r match-service.zip . -q

# Create match-history package with proper structure
echo "📦 Creating match-history package..."
zip -r match-history.zip . -q

echo "📤 Uploading Lambda functions..."

# Upload match service function
aws lambda update-function-code \
    --function-name robot-orchestra-match-service \
    --zip-file fileb://match-service.zip

# Upload match history function
aws lambda update-function-code \
    --function-name robot-orchestra-match-history \
    --zip-file fileb://match-history.zip

echo "⏳ Waiting for functions to update..."
aws lambda wait function-updated --function-name robot-orchestra-match-service
aws lambda wait function-updated --function-name robot-orchestra-match-history

echo "✅ Lambda deployment complete!"

# Get function info
echo "📊 Match Service Function:"
aws lambda get-function --function-name robot-orchestra-match-service --query 'Configuration.{Runtime: Runtime, LastModified: LastModified, CodeSize: CodeSize}' --output table

echo "📊 Match History Function:"
aws lambda get-function --function-name robot-orchestra-match-history --query 'Configuration.{Runtime: Runtime, LastModified: LastModified, CodeSize: CodeSize}' --output table

# Test functions
echo "🧪 Testing functions..."
echo "Testing match service..."
aws lambda invoke --function-name robot-orchestra-match-service --payload '{"httpMethod":"OPTIONS","path":"/matches"}' /tmp/test-response.json
cat /tmp/test-response.json

echo ""
echo "✅ Deployment complete! Functions should now handle CORS properly."