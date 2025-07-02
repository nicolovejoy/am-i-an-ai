#!/bin/bash
set -e

echo "🧹 Cleaning up existing v2 AWS resources for fresh deployment..."

ROLE_NAME="amianai-v2-websocket-lambda"
DYNAMODB_POLICY_ARN="arn:aws:iam::218141621131:policy/amianai-v2-dynamodb-access"
APIGATEWAY_POLICY_ARN="arn:aws:iam::218141621131:policy/amianai-v2-apigateway-management"
BASIC_EXECUTION_POLICY_ARN="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
LOG_GROUP_NAME="/aws/lambda/amianai-v2-websocket"

echo "Step 1: Detaching policies from role..."
aws iam detach-role-policy --role-name "$ROLE_NAME" --policy-arn "$DYNAMODB_POLICY_ARN" 2>/dev/null || echo "DynamoDB policy already detached"
aws iam detach-role-policy --role-name "$ROLE_NAME" --policy-arn "$APIGATEWAY_POLICY_ARN" 2>/dev/null || echo "API Gateway policy already detached"
aws iam detach-role-policy --role-name "$ROLE_NAME" --policy-arn "$BASIC_EXECUTION_POLICY_ARN" 2>/dev/null || echo "Basic execution policy already detached"

echo "Step 2: Deleting IAM role..."
aws iam delete-role --role-name "$ROLE_NAME" 2>/dev/null || echo "Role already deleted or doesn't exist"

echo "Step 3: Deleting custom IAM policies..."
aws iam delete-policy --policy-arn "$DYNAMODB_POLICY_ARN" 2>/dev/null || echo "DynamoDB policy already deleted"
aws iam delete-policy --policy-arn "$APIGATEWAY_POLICY_ARN" 2>/dev/null || echo "API Gateway policy already deleted"

echo "Step 4: Deleting CloudWatch log group..."
aws logs delete-log-group --log-group-name "$LOG_GROUP_NAME" 2>/dev/null || echo "Log group already deleted"

echo "Step 5: Checking for Lambda function..."
aws lambda delete-function --function-name "amianai-v2-websocket" 2>/dev/null || echo "Lambda function already deleted or doesn't exist"

echo "Step 6: Checking for DynamoDB table..."
aws dynamodb delete-table --table-name "amianai-v2-sessions" 2>/dev/null || echo "DynamoDB table already deleted or doesn't exist"

echo "Step 7: Checking for API Gateway..."
# Get WebSocket API ID if it exists
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='amianai-v2-websocket'].ApiId" --output text 2>/dev/null || echo "")
if [ ! -z "$API_ID" ] && [ "$API_ID" != "None" ]; then
    echo "Deleting WebSocket API: $API_ID"
    aws apigatewayv2 delete-api --api-id "$API_ID" 2>/dev/null || echo "API Gateway already deleted"
else
    echo "WebSocket API already deleted or doesn't exist"
fi

echo "✅ Cleanup complete! Ready for fresh deployment."
echo ""
echo "Now run:"
echo "DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/deploy.sh --all"