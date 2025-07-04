#!/bin/bash
set -e

# Deploy Lambda Function
# Builds and deploys the WebSocket Lambda function

echo "⚡ Deploying Lambda Function..."

# Check environment variables
if [ -z "$TF_VAR_openai_api_key" ]; then
    echo "❌ Error: TF_VAR_openai_api_key environment variable is required"
    echo "Usage: export TF_VAR_openai_api_key='your-api-key' && ./deploy-lambda.sh"
    exit 1
fi

# Navigate to lambda directory
cd "$(dirname "$0")/../../lambda"

echo "📦 Installing Lambda dependencies..."
npm ci --production

echo "🔨 Building Lambda package..."
npm run build

echo "📤 Deploying Lambda function via Terraform..."
cd ../infrastructure

# Update lambda function using terraform
terraform apply -target=aws_lambda_function.websocket -auto-approve

echo "✅ Lambda deployment complete!"

# Get function info
FUNCTION_NAME=$(terraform output -raw lambda_function_name 2>/dev/null || echo "")
if [ -n "$FUNCTION_NAME" ]; then
    echo "🔗 Function: $FUNCTION_NAME"
    echo "📊 Function info:"
    aws lambda get-function --function-name "$FUNCTION_NAME" --query 'Configuration.{Runtime: Runtime, LastModified: LastModified, CodeSize: CodeSize}' --output table
fi