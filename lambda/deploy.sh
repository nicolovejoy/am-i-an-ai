#!/bin/bash
set -e

# Deploy v2 WebSocket Lambda
echo "🚀 Deploying v2 WebSocket Lambda..."

# Get Lambda function name from Terraform
cd ../../infrastructure
LAMBDA_NAME=$(terraform output -raw lambda_function_name 2>/dev/null || echo "")

if [ -z "$LAMBDA_NAME" ]; then
    echo "❌ Error: Could not get Lambda function name from Terraform"
    exit 1
fi

cd ../v2/lambda

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create deployment package
echo "📦 Creating deployment package..."
zip -r lambda.zip handler.js node_modules

# Deploy to AWS
echo "⬆️  Uploading to Lambda: $LAMBDA_NAME..."
aws lambda update-function-code \
    --function-name "$LAMBDA_NAME" \
    --zip-file fileb://lambda.zip \
    --region us-east-1

# Update environment variables
echo "🔧 Updating Lambda environment variables..."
WEBSOCKET_URL=$(cd ../../infrastructure && terraform output -raw websocket_url 2>/dev/null)
WEBSOCKET_ENDPOINT=$(echo "$WEBSOCKET_URL" | sed 's|wss://|https://|' | sed 's|$prod||')

aws lambda update-function-configuration \
    --function-name "$LAMBDA_NAME" \
    --environment "Variables={DYNAMODB_TABLE=amianai-v2-sessions,WEBSOCKET_ENDPOINT=$WEBSOCKET_ENDPOINT}" \
    --region us-east-1

# Clean up
rm lambda.zip

echo "✅ Lambda deployed successfully!"
echo "🔗 WebSocket URL: $WEBSOCKET_URL"