#!/bin/bash
set -e

# Source shared functions  
WEBSOCKET_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$WEBSOCKET_SCRIPT_DIR/shared.sh"

# Deploy WebSocket Lambda and API Gateway
deploy_websocket() {
    log_info "⚡ Deploying WebSocket Lambda and API Gateway..."
    
    cd infrastructure
    check_environment_variables
    verify_aws_credentials
    
    # Initialize Terraform if needed
    if [ ! -d ".terraform" ]; then
        init_terraform
    fi
    
    # Build and package Lambda function first
    build_and_package_lambda
    
    # Plan and apply WebSocket resources
    log_info "Planning WebSocket infrastructure..."
    terraform plan \
        -target="aws_iam_role.websocket_lambda" \
        -target="aws_iam_role_policy_attachment.lambda_basic" \
        -target="aws_iam_policy.dynamodb_access" \
        -target="aws_iam_role_policy_attachment.lambda_dynamodb" \
        -target="aws_iam_policy.apigateway_management" \
        -target="aws_iam_role_policy_attachment.lambda_apigateway" \
        -target="aws_cloudwatch_log_group.websocket_logs" \
        -target="aws_lambda_function.websocket" \
        -target="aws_apigatewayv2_api.websocket" \
        -target="aws_apigatewayv2_integration.websocket_lambda" \
        -target="aws_apigatewayv2_route.connect" \
        -target="aws_apigatewayv2_route.disconnect" \
        -target="aws_apigatewayv2_route.message" \
        -target="aws_apigatewayv2_route.default" \
        -target="aws_apigatewayv2_deployment.websocket" \
        -target="aws_apigatewayv2_stage.prod" \
        -target="aws_lambda_permission.websocket_apigateway" \
        -var="domain_name=${DOMAIN_NAME}" \
        -out=websocket-plan
    
    log_info "Applying WebSocket infrastructure..."
    terraform apply websocket-plan
    
    # Deploy Lambda function code
    deploy_lambda_code
    
    # Cleanup plan file
    rm -f websocket-plan
    
    mark_component_complete "websocket"
}

# Build and package Lambda function
build_and_package_lambda() {
    log_info "Building Lambda function..."
    
    # Go to project root (v2 directory)
    cd ..
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm install
    fi
    
    # Compile TypeScript
    log_info "Compiling TypeScript..."
    npm run build
    
    # Create deployment package
    log_info "Packaging Lambda function..."
    rm -f infrastructure/websocket-function.zip
    
    # Package the compiled JavaScript and dependencies
    cd dist/lambda
    cp ../../lambda/package*.json .
    npm install --production
    
    zip -r ../../infrastructure/websocket-function.zip . \
        -x "*.test.*" "*.ts" "tsconfig.json"
    
    cd ../../infrastructure
}

# Deploy Lambda function code
deploy_lambda_code() {
    log_info "Deploying Lambda function code..."
    
    local function_name=$(get_terraform_output "lambda_function_name")
    
    if [ -z "$function_name" ]; then
        log_error "Lambda function name not found"
        return 1
    fi
    
    # Update Lambda function code
    aws lambda update-function-code \
        --function-name "$function_name" \
        --zip-file fileb://websocket-function.zip \
        --region "$AWS_REGION"
    
    log_info "✅ Lambda function code updated"
}

# Test WebSocket API
test_websocket() {
    log_info "🧪 Testing WebSocket API..."
    
    local websocket_url=$(get_terraform_output "websocket_url")
    
    if [ -z "$websocket_url" ]; then
        log_error "WebSocket URL not found in Terraform outputs"
        return 1
    fi
    
    log_info "WebSocket URL: $websocket_url"
    log_info "✅ WebSocket API Gateway deployed successfully"
    log_info "Test with: wscat -c $websocket_url"
}

# Main execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    deploy_websocket
    test_websocket
fi