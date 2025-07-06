#!/bin/bash
set -e

# Deploy Lambda Functions
# Builds and deploys Lambda functions for Kafka-based architecture

echo "⚡ Deploying Lambda Functions..."

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

echo "📤 Deploying Lambda functions via Terraform..."
cd ../infrastructure

# Deploy match history Lambda function
terraform apply -target=aws_lambda_function.match_history -auto-approve

# Deploy match history API Gateway
terraform apply -target=aws_api_gateway_rest_api.match_history -auto-approve

echo "✅ Lambda deployment complete!"

# Get function info
FUNCTION_NAME=$(terraform output -raw match_history_lambda_name 2>/dev/null || echo "")
if [ -n "$FUNCTION_NAME" ]; then
    echo "🔗 Function: $FUNCTION_NAME"
    echo "📊 Function info:"
    aws lambda get-function --function-name "$FUNCTION_NAME" --query 'Configuration.{Runtime: Runtime, LastModified: LastModified, CodeSize: CodeSize}' --output table
fi

API_ENDPOINT=$(terraform output -raw match_history_endpoint 2>/dev/null || echo "")
if [ -n "$API_ENDPOINT" ]; then
    echo "🌐 API Endpoint: $API_ENDPOINT"
fi