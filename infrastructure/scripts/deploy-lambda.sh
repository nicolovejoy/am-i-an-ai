#!/bin/bash
set -e

# Deploy Lambda Functions
# Builds TypeScript and deploys all Lambda functions

echo "⚡ Deploying Lambda Functions..."

# Check environment variables
if [ -z "$TF_VAR_openai_api_key" ]; then
    echo "❌ Error: TF_VAR_openai_api_key environment variable is required"
    echo "Usage: export TF_VAR_openai_api_key='your-api-key' && ./deploy-lambda.sh"
    exit 1
fi

# Navigate to lambda directory
cd "$(dirname "$0")/../../lambda"

# Check if package-lock.json has changed since last install
if [ -f node_modules/.package-lock.json ]; then
    if ! diff -q package-lock.json node_modules/.package-lock.json > /dev/null 2>&1; then
        echo "📦 Installing Lambda dependencies..."
        npm ci
        cp package-lock.json node_modules/.package-lock.json
    else
        echo "✅ Dependencies up to date, skipping npm ci"
    fi
else
    echo "📦 Installing Lambda dependencies..."
    npm ci
    mkdir -p node_modules
    cp package-lock.json node_modules/.package-lock.json
fi

echo "🧹 Cleaning old dist folder..."
rm -rf dist

echo "🔍 Type checking TypeScript..."
npx tsc --noEmit

echo "🔨 Compiling TypeScript..."
npx tsc

# Verify compilation succeeded
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    echo "❌ Error: TypeScript compilation failed - dist directory is empty"
    exit 1
fi

echo "📦 Building deployment package..."

# Create deployment package directory
mkdir -p deploy
rm -rf deploy/*

# Copy all compiled output (including subdirectories)
cp -r dist/* deploy/
cp package*.json deploy/

# Install production dependencies only
cd deploy
npm ci --production --silent

# Create single deployment package
echo "📦 Creating deployment package..."
zip -r lambda-deployment.zip . -q

echo "📤 Uploading Lambda functions in parallel..."

# Upload all functions in parallel
{
    aws lambda update-function-code \
        --function-name robot-orchestra-match-service \
        --zip-file fileb://lambda-deployment.zip &
    
    aws lambda update-function-code \
        --function-name robot-orchestra-match-history \
        --zip-file fileb://lambda-deployment.zip &
    
    aws lambda update-function-code \
        --function-name robot-orchestra-robot-worker \
        --zip-file fileb://lambda-deployment.zip &
} 

# Wait for all uploads to complete
wait

echo "⏳ Waiting for functions to update..."
aws lambda wait function-updated --function-name robot-orchestra-match-service &
aws lambda wait function-updated --function-name robot-orchestra-match-history &
aws lambda wait function-updated --function-name robot-orchestra-robot-worker &
wait

echo "✅ Lambda deployment complete!"

# Get function info
echo ""
echo "📊 Deployed Functions:"
aws lambda get-function --function-name robot-orchestra-match-service --query 'Configuration.{Function: FunctionName, Runtime: Runtime, LastModified: LastModified, CodeSize: CodeSize}' --output table
aws lambda get-function --function-name robot-orchestra-match-history --query 'Configuration.{Function: FunctionName, Runtime: Runtime, LastModified: LastModified, CodeSize: CodeSize}' --output table
aws lambda get-function --function-name robot-orchestra-robot-worker --query 'Configuration.{Function: FunctionName, Runtime: Runtime, LastModified: LastModified, CodeSize: CodeSize}' --output table

# Validate deployments with test invocations
echo ""
echo "🧪 Validating deployments..."

# Test match-service health check
echo -n "  Testing match-service health check... "
if aws lambda invoke \
    --function-name robot-orchestra-match-service \
    --payload '{"httpMethod":"GET","path":"/health"}' \
    --cli-binary-format raw-in-base64-out \
    /tmp/match-service-response.json >/dev/null 2>&1; then
    if grep -q '"statusCode":200' /tmp/match-service-response.json; then
        echo "✅ OK"
    else
        echo "❌ Failed (unexpected response)"
        cat /tmp/match-service-response.json
    fi
else
    echo "❌ Failed (invocation error)"
fi

# Test match-history health check
echo -n "  Testing match-history health check... "
if aws lambda invoke \
    --function-name robot-orchestra-match-history \
    --payload '{"httpMethod":"GET","path":"/health"}' \
    --cli-binary-format raw-in-base64-out \
    /tmp/match-history-response.json >/dev/null 2>&1; then
    if grep -q '"statusCode":200' /tmp/match-history-response.json; then
        echo "✅ OK"
    else
        echo "❌ Failed (unexpected response)"
        cat /tmp/match-history-response.json
    fi
else
    echo "❌ Failed (invocation error)"
fi

# Test robot-worker (SQS handler - just verify it doesn't crash)
echo -n "  Testing robot-worker handler... "
if aws lambda invoke \
    --function-name robot-orchestra-robot-worker \
    --payload '{"Records":[]}' \
    --cli-binary-format raw-in-base64-out \
    /tmp/robot-worker-response.json >/dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ Failed (invocation error)"
fi

# Clean up temp files
rm -f /tmp/match-service-response.json /tmp/match-history-response.json /tmp/robot-worker-response.json

echo ""
echo "✅ Deployment complete and validated!"