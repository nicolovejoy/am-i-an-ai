#!/bin/bash
set -e

# Quick Lambda Deployment for Protocol Fixes
# Use this for rapid iteration on WebSocket protocol changes

echo "🚀 Quick Lambda Deployment..."

# Build the latest changes
echo "🔨 Building Lambda function..."
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
cd dist
zip -r function.zip *.js node_modules/ package*.json

# Deploy using the zip
echo "⬆️  Deploying to Lambda..."

# Deploy to AWS (using function name from previous infrastructure)
aws lambda update-function-code \
    --function-name robot-orchestra-websocket \
    --zip-file fileb://function.zip \
    --region us-east-1

# Get function info to confirm deployment
echo "✅ Deployment complete!"
echo "📊 Function status:"
aws lambda get-function \
    --function-name robot-orchestra-websocket \
    --query 'Configuration.{LastModified: LastModified, CodeSize: CodeSize, Version: Version}' \
    --output table \
    --region us-east-1

echo ""
echo "🎯 Your WebSocket protocol fixes are now live!"
echo "💡 Test the fixed join_match and submit_response actions"