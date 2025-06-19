#!/bin/bash
set -e

# Source shared functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/shared.sh"

# Lambda component deployment (Lambda functions + API Gateway)
deploy_lambda() {
    log_info "⚡ Deploying Lambda component..."
    
    ensure_infrastructure_directory
    check_prerequisites
    check_environment_variables
    verify_aws_credentials
    
    # Initialize Terraform if not already done
    if [ ! -d ".terraform" ]; then
        init_terraform
    fi
    
    # Plan and apply Lambda and API Gateway resources
    log_info "Planning Lambda infrastructure..."
    terraform plan \
        -target="aws_iam_role.lambda_execution" \
        -target="aws_iam_policy.lambda_policy" \
        -target="aws_iam_role_policy_attachment.lambda_policy" \
        -target="aws_iam_role_policy_attachment.lambda_vpc_execution" \
        -target="aws_cloudwatch_log_group.lambda_logs" \
        -target="aws_lambda_function.api" \
        -target="aws_api_gateway_rest_api.main" \
        -target="aws_api_gateway_resource.proxy" \
        -target="aws_api_gateway_method.proxy" \
        -target="aws_api_gateway_integration.lambda" \
        -target="aws_api_gateway_method.proxy_root" \
        -target="aws_api_gateway_integration.lambda_root" \
        -target="aws_api_gateway_deployment.main" \
        -target="aws_api_gateway_stage.prod" \
        -target="aws_lambda_permission.api_gw" \
        -var="github_username=${GITHUB_USERNAME}" \
        -out=lambda-plan
    
    log_info "Applying Lambda infrastructure..."
    terraform apply lambda-plan
    
    # Build and package Lambda function
    build_and_package_lambda
    
    # Deploy Lambda function code
    deploy_lambda_code
    
    # Cleanup plan file
    rm -f lambda-plan
    
    mark_component_complete "lambda"
}

# Build and package Lambda function
build_and_package_lambda() {
    log_info "Building Lambda function..."
    
    cd ../backend/lambda || exit 1
    
    # Install dependencies
    install_npm_dependencies "." "Lambda"
    
    # Build Lambda function
    log_info "Building Lambda TypeScript..."
    npm run build || { 
        log_error "Lambda build failed!"
        mark_component_failed "lambda"
        exit 1
    }
    
    # Package Lambda function
    log_info "Packaging Lambda function..."
    npm run package || { 
        log_error "Lambda packaging failed!"
        mark_component_failed "lambda"
        exit 1
    }
    
    cd ../../infrastructure || exit 1
    
    log_info "✅ Lambda function built and packaged"
}

# Deploy Lambda function code
deploy_lambda_code() {
    log_info "Deploying Lambda function code..."
    
    local lambda_function_name=$(get_terraform_output "lambda_function_name")
    
    if [ -z "$lambda_function_name" ]; then
        log_error "Lambda function name not found in Terraform output"
        mark_component_failed "lambda"
        exit 1
    fi
    
    log_info "Lambda function name: $lambda_function_name"
    
    # Check if Lambda exists
    if ! aws lambda get-function --function-name "$lambda_function_name" --region us-east-1 >/dev/null 2>&1; then
        log_warn "Lambda function $lambda_function_name does not exist yet. It may still be creating..."
    fi
    
    # Wait for Lambda to be ready
    wait_for_lambda_ready "$lambda_function_name" || {
        mark_component_failed "lambda"
        exit 1
    }
    
    # Deploy with retries
    cd ../backend/lambda || exit 1
    deploy_lambda_with_retries "$lambda_function_name" "lambda-function.zip" || {
        mark_component_failed "lambda"
        exit 1
    }
    
    cd ../../infrastructure || exit 1
    
    log_info "✅ Lambda function deployed successfully"
}

# Test Lambda deployment
test_lambda() {
    log_info "🧪 Testing Lambda deployment..."
    
    local api_gateway_url=$(get_terraform_output "api_gateway_url")
    
    if [ -z "$api_gateway_url" ]; then
        log_error "API Gateway URL not available"
        exit 1
    fi
    
    log_info "Testing API health endpoint..."
    if curl -f "${api_gateway_url}/api/health" >/dev/null 2>&1; then
        log_info "✅ API health check passed"
    else
        log_error "❌ API health check failed"
        exit 1
    fi
    
    log_info "Testing database status endpoint..."
    if curl -f "${api_gateway_url}/api/admin/database-status" >/dev/null 2>&1; then
        log_info "✅ Database status check passed"
    else
        log_warn "⚠️  Database status check failed (may be expected if database not deployed)"
    fi
}

# Main execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    case "${1:-deploy}" in
        "deploy")
            deploy_lambda
            ;;
        "build")
            build_and_package_lambda
            ;;
        "code")
            deploy_lambda_code
            ;;
        "test")
            test_lambda
            ;;
        "full")
            deploy_lambda
            test_lambda
            ;;
        *)
            echo "Usage: $0 [deploy|build|code|test|full]"
            echo "  deploy - Deploy Lambda infrastructure and code"
            echo "  build  - Build and package Lambda function only"
            echo "  code   - Deploy Lambda function code only"
            echo "  test   - Test Lambda deployment"
            echo "  full   - Deploy and test"
            exit 1
            ;;
    esac
fi