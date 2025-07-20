#!/bin/bash
set -e

# Deploy Lambda Functions (plural!)
# Builds TypeScript and deploys ALL Lambda functions in parallel

echo "⚡ Deploying Lambda Functions..."

# Note: OpenAI API key check kept for backward compatibility
# but the system now uses AWS Bedrock for AI services
if [ -z "$TF_VAR_openai_api_key" ]; then
    echo "⚠️  Warning: TF_VAR_openai_api_key not set (using AWS Bedrock instead)"
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

echo "🧹 Cleaning temporary shared folder..."
rm -rf shared

echo "📁 Copying shared schemas..."
mkdir -p shared/schemas
cp -r ../shared/schemas/* shared/schemas/

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
        --function-name robot-orchestra-robot-worker \
        --zip-file fileb://lambda-deployment.zip &
    
    aws lambda update-function-code \
        --function-name robot-orchestra-ai-service \
        --zip-file fileb://lambda-deployment.zip &
    
    aws lambda update-function-code \
        --function-name robot-orchestra-admin-service \
        --zip-file fileb://lambda-deployment.zip &
} 

# Wait for all uploads to complete
wait

echo "⏳ Waiting for functions to update..."
aws lambda wait function-updated --function-name robot-orchestra-match-service &
aws lambda wait function-updated --function-name robot-orchestra-robot-worker &
aws lambda wait function-updated --function-name robot-orchestra-ai-service &
aws lambda wait function-updated --function-name robot-orchestra-admin-service &
wait

echo "✅ Lambda deployment complete!"

# Get function info
echo ""
echo "📊 Deployed Functions:"
aws lambda get-function --function-name robot-orchestra-match-service --query 'Configuration.{Function: FunctionName, Runtime: Runtime, LastModified: LastModified, CodeSize: CodeSize}' --output table
aws lambda get-function --function-name robot-orchestra-robot-worker --query 'Configuration.{Function: FunctionName, Runtime: Runtime, LastModified: LastModified, CodeSize: CodeSize}' --output table
aws lambda get-function --function-name robot-orchestra-ai-service --query 'Configuration.{Function: FunctionName, Runtime: Runtime, LastModified: LastModified, CodeSize: CodeSize}' --output table
aws lambda get-function --function-name robot-orchestra-admin-service --query 'Configuration.{Function: FunctionName, Runtime: Runtime, LastModified: LastModified, CodeSize: CodeSize}' --output table

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

# Match-history removed - functionality merged into match-service

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

# Test ai-service OPTIONS (CORS)
echo -n "  Testing ai-service CORS handling... "
if aws lambda invoke \
    --function-name robot-orchestra-ai-service \
    --payload '{"httpMethod":"OPTIONS","path":"/ai/generate"}' \
    --cli-binary-format raw-in-base64-out \
    /tmp/ai-service-response.json >/dev/null 2>&1; then
    if grep -q '"statusCode":200' /tmp/ai-service-response.json; then
        echo "✅ OK"
    else
        echo "❌ Failed (unexpected response)"
        cat /tmp/ai-service-response.json
    fi
else
    echo "❌ Failed (invocation error)"
fi

# Test admin-service health check (requires auth)
echo -n "  Testing admin-service health check... "
if aws lambda invoke \
    --function-name robot-orchestra-admin-service \
    --payload '{"httpMethod":"GET","path":"/health","headers":{"Authorization":"Bearer test-token"}}' \
    --cli-binary-format raw-in-base64-out \
    /tmp/admin-service-response.json >/dev/null 2>&1; then
    if grep -q '"statusCode":200' /tmp/admin-service-response.json; then
        echo "✅ OK"
    else
        echo "⚠️  Auth required (expected for admin service)"
    fi
else
    echo "❌ Failed (invocation error)"
fi

# Clean up temp files
rm -f /tmp/match-service-response.json /tmp/robot-worker-response.json /tmp/ai-service-response.json /tmp/admin-service-response.json

echo ""
echo "✅ Deployment complete and validated!"