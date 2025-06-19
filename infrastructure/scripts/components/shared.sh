#!/bin/bash

# Shared functions and utilities for AmIAnAI infrastructure scripts
# Source this file in other scripts: source "$(dirname "$0")/components/shared.sh"

# Color output for better UX
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_debug() { echo -e "${BLUE}[DEBUG]${NC} $1"; }

# Ensure we're in the infrastructure directory
ensure_infrastructure_directory() {
    local script_dir="$(dirname "$0")"
    if [ "$(basename "$(pwd)")" != "infrastructure" ]; then
        cd "$script_dir/.." || exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    command -v terraform >/dev/null 2>&1 || { 
        log_error "Terraform is required but not installed. Aborting."
        exit 1
    }
    
    command -v aws >/dev/null 2>&1 || { 
        log_error "AWS CLI is required but not installed. Aborting."
        exit 1
    }
    
    command -v npm >/dev/null 2>&1 || { 
        log_error "npm is required but not installed. Aborting."
        exit 1
    }
    
    command -v jq >/dev/null 2>&1 || { 
        log_error "jq is required but not installed. Aborting."
        exit 1
    }
    
    log_info "✅ All prerequisites found"
}

# Check environment variables
check_environment_variables() {
    log_info "Checking environment variables..."
    
    if [ -z "$AWS_PROFILE" ]; then
        log_warn "AWS_PROFILE not set. Using default profile."
    fi

    if [ -z "$DOMAIN_NAME" ]; then
        log_error "DOMAIN_NAME environment variable is required. Aborting."
        exit 1
    fi

    if [ -z "$GITHUB_USERNAME" ]; then
        log_error "GITHUB_USERNAME environment variable is required. Aborting."
        exit 1
    fi
    
    log_info "✅ Environment variables validated"
}

# Verify AWS credentials
verify_aws_credentials() {
    log_info "Verifying AWS credentials..."
    aws sts get-caller-identity > /dev/null || { 
        log_error "AWS credentials not configured properly"
        exit 1
    }
    log_info "✅ AWS credentials verified"
}

# Setup S3 remote state backend
setup_state_backend() {
    log_info "Setting up S3 remote state backend..."

    # Create S3 bucket for Terraform state if it doesn't exist
    if ! aws s3 ls "s3://amianai-terraform-state" > /dev/null 2>&1; then
        log_info "Creating S3 bucket for Terraform state..."
        aws s3 mb s3://amianai-terraform-state --region us-east-1
        
        # Enable versioning
        log_info "Enabling versioning on state bucket..."
        aws s3api put-bucket-versioning --bucket amianai-terraform-state --versioning-configuration Status=Enabled
        
        # Enable encryption
        log_info "Enabling encryption on state bucket..."
        aws s3api put-bucket-encryption --bucket amianai-terraform-state --server-side-encryption-configuration '{
          "Rules": [
            {
              "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        }'
    else
        log_info "S3 bucket for Terraform state already exists"
    fi

    # Create DynamoDB table for state locking if it doesn't exist
    if ! aws dynamodb describe-table --table-name terraform-state-lock --region us-east-1 > /dev/null 2>&1; then
        log_info "Creating DynamoDB table for state locking..."
        aws dynamodb create-table \
          --table-name terraform-state-lock \
          --attribute-definitions AttributeName=LockID,AttributeType=S \
          --key-schema AttributeName=LockID,KeyType=HASH \
          --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
          --region us-east-1
        
        # Wait for table to be active
        log_info "Waiting for DynamoDB table to be active..."
        aws dynamodb wait table-exists --table-name terraform-state-lock --region us-east-1
    else
        log_info "DynamoDB table for state locking already exists"
    fi
    
    log_info "✅ State backend ready"
}

# Initialize Terraform
init_terraform() {
    log_info "Initializing Terraform with S3 backend..."
    terraform init
    log_info "✅ Terraform initialized"
}

# Get terraform output safely
get_terraform_output() {
    local output_name="$1"
    terraform output -raw "$output_name" 2>/dev/null || echo ""
}

# Wait for certificate validation
wait_for_certificate() {
    log_info "Waiting for SSL certificate validation..."
    local cert_arn=$(get_terraform_output "certificate_arn")
    
    if [ -n "$cert_arn" ]; then
        aws acm wait certificate-validated --certificate-arn "$cert_arn" --region us-east-1 || {
            log_warn "Certificate validation timeout. Continuing anyway..."
        }
    else
        log_warn "Could not get certificate ARN. Skipping certificate wait."
    fi
}

# Verify critical infrastructure components
verify_infrastructure() {
    log_info "Verifying infrastructure..."
    
    local db_endpoint=$(get_terraform_output "database_endpoint")
    local db_secret_arn=$(get_terraform_output "database_secret_arn")
    local cloudfront_id=$(get_terraform_output "cloudfront_distribution_id")

    [ -z "$db_endpoint" ] && { log_error "Database not created properly!"; exit 1; }
    [ -z "$db_secret_arn" ] && { log_error "Database secret not created!"; exit 1; }
    [ -z "$cloudfront_id" ] && { log_error "CloudFront not created!"; exit 1; }

    log_info "Database endpoint: ${db_endpoint}"
    log_info "Database secret ARN: ${db_secret_arn}"
    
    log_info "✅ Infrastructure verification complete"
}

# Update frontend environment file
update_frontend_env() {
    log_info "Updating frontend/.env.local..."
    
    local env_file="../frontend/.env.local"
    local db_secret_arn=$(get_terraform_output "database_secret_arn")
    local db_endpoint=$(get_terraform_output "database_endpoint")
    local api_gateway_url=$(get_terraform_output "api_gateway_url")
    local cognito_region=$(get_terraform_output "cognito_region")
    local cognito_user_pool_id=$(get_terraform_output "cognito_user_pool_id")
    local cognito_client_id=$(get_terraform_output "cognito_client_id")
    
    cat > "$env_file" << EOF
# Production database configuration (PRODUCTION-ONLY strategy)
DB_SECRET_ARN=${db_secret_arn}
DB_HOST=${db_endpoint%:*}
DB_PORT=5432
DB_NAME=amianai
ENABLE_DB_ADMIN=true
NODE_ENV=production

# API Configuration
API_GATEWAY_URL=${api_gateway_url}
NEXT_PUBLIC_API_URL=${api_gateway_url}

# Cognito Configuration
NEXT_PUBLIC_COGNITO_REGION=${cognito_region}
NEXT_PUBLIC_COGNITO_USER_POOL_ID=${cognito_user_pool_id}
NEXT_PUBLIC_COGNITO_CLIENT_ID=${cognito_client_id}
EOF

    log_info "✅ Environment file updated successfully!"
}

# Wait for Lambda function to be ready
wait_for_lambda_ready() {
    local function_name="$1"
    local max_wait=60
    local wait_count=0
    
    log_info "Waiting for Lambda function to be ready..."
    
    while [ $wait_count -lt $max_wait ]; do
        # Get function state with better error handling
        local function_info=$(aws lambda get-function --function-name "$function_name" --region us-east-1 2>/dev/null || echo "")
        
        if [ -z "$function_info" ]; then
            log_info "Lambda function not found yet, waiting..."
            sleep 2
            wait_count=$((wait_count + 2))
            continue
        fi
        
        local state=$(echo "$function_info" | jq -r '.Configuration.State // empty' 2>/dev/null || echo "")
        local update_status=$(echo "$function_info" | jq -r '.Configuration.LastUpdateStatus // empty' 2>/dev/null || echo "")
        
        if [ "$state" = "Active" ] && ([ "$update_status" = "Successful" ] || [ -z "$update_status" ]); then
            log_info "Lambda function is ready for update (State: $state)"
            return 0
        fi
        
        log_info "Lambda state: ${state:-Unknown}, update status: ${update_status:-None} - waiting..."
        sleep 2
        wait_count=$((wait_count + 2))
    done
    
    log_error "Timeout waiting for Lambda to be ready"
    return 1
}

# Deploy Lambda with retries
deploy_lambda_with_retries() {
    local function_name="$1"
    local zip_file="$2"
    local retry_count=0
    local max_retries=3
    
    while [ $retry_count -lt $max_retries ]; do
        if aws lambda update-function-code \
            --function-name "$function_name" \
            --region us-east-1 \
            --zip-file "fileb://$zip_file" 2>/tmp/lambda-error.log; then
            log_info "Lambda function deployed successfully!"
            return 0
        else
            local error_msg=$(cat /tmp/lambda-error.log)
            if echo "$error_msg" | grep -q "421"; then
                retry_count=$((retry_count + 1))
                if [ $retry_count -lt $max_retries ]; then
                    log_warn "Lambda update failed with 421 error (attempt $retry_count/$max_retries), retrying in 5 seconds..."
                    sleep 5
                else
                    log_error "Lambda deployment failed after $max_retries attempts!"
                    cat /tmp/lambda-error.log
                    return 1
                fi
            else
                log_error "Lambda deployment failed!"
                cat /tmp/lambda-error.log
                return 1
            fi
        fi
    done
}

# Install npm dependencies with cache check
install_npm_dependencies() {
    local directory="$1"
    local service_name="$2"
    
    cd "$directory" || exit 1
    
    if [ ! -d "node_modules" ]; then
        log_info "Installing $service_name dependencies..."
        npm ci
    else
        log_info "$service_name dependencies already installed, skipping npm ci"
    fi
}

# Create CloudFront invalidation
create_cloudfront_invalidation() {
    local distribution_id="$1"
    
    log_info "Creating CloudFront invalidation..."
    local invalidation_id=$(aws cloudfront create-invalidation \
        --distribution-id "$distribution_id" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)

    log_info "CloudFront invalidation created: ${invalidation_id}"
}

# Component status tracking (requires bash 4+)
if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
    declare -A COMPONENT_STATUS
else
    # Fallback for older bash versions
    COMPONENT_STATUS=""
fi

mark_component_complete() {
    local component="$1"
    if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
        COMPONENT_STATUS[$component]="complete"
    fi
    log_info "✅ Component $component completed"
}

mark_component_failed() {
    local component="$1"
    if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
        COMPONENT_STATUS[$component]="failed"
    fi
    log_error "❌ Component $component failed"
}

is_component_complete() {
    local component="$1"
    if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
        [ "${COMPONENT_STATUS[$component]}" = "complete" ]
    else
        return 0  # Assume complete for older bash
    fi
}

# Print deployment summary
print_deployment_summary() {
    echo ""
    log_info "🎉 Deployment Summary"
    echo ""
    
    if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
        for component in "${!COMPONENT_STATUS[@]}"; do
            local status="${COMPONENT_STATUS[$component]}"
            if [ "$status" = "complete" ]; then
                echo "✅ $component"
            else
                echo "❌ $component ($status)"
            fi
        done
    else
        echo "✅ Deployment completed (status tracking requires bash 4+)"
    fi
    
    echo ""
}

# Cleanup function
cleanup_deployment_artifacts() {
    log_info "Cleaning up deployment artifacts..."
    
    # Remove terraform plan files
    rm -f tfplan
    
    # Remove temporary Lambda error logs
    rm -f /tmp/lambda-error.log
    
    log_info "✅ Cleanup complete"
}