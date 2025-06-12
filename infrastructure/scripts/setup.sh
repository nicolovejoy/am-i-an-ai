#!/bin/bash
set -e

# Color output for better UX
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Ensure we're in the infrastructure directory
SCRIPT_DIR="$(dirname "$0")"
if [ "$(basename "$(pwd)")" != "infrastructure" ]; then
    cd "$SCRIPT_DIR/.." || exit 1
fi

log_info "Starting AmIAnAI infrastructure setup..."

# Check prerequisites
command -v terraform >/dev/null 2>&1 || { log_error "Terraform is required but not installed. Aborting."; exit 1; }
command -v aws >/dev/null 2>&1 || { log_error "AWS CLI is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { log_error "npm is required but not installed. Aborting."; exit 1; }
command -v jq >/dev/null 2>&1 || { log_error "jq is required but not installed. Aborting."; exit 1; }

# Check environment variables
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

# Verify AWS credentials
log_info "Verifying AWS credentials..."
aws sts get-caller-identity > /dev/null || { log_error "AWS credentials not configured properly"; exit 1; }

# Setup S3 remote state backend
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

# Initialize Terraform
log_info "Initializing Terraform with S3 backend..."
terraform init

# Plan first (safer)
log_info "Planning infrastructure changes..."
terraform plan -var="github_username=${GITHUB_USERNAME}" -out=tfplan

# Apply infrastructure
log_info "Applying infrastructure..."
terraform apply tfplan

# Wait for certificate validation (proper wait)
log_info "Waiting for SSL certificate validation..."
CERT_ARN=$(terraform output -raw certificate_arn 2>/dev/null || echo "")
if [ -n "$CERT_ARN" ]; then
    aws acm wait certificate-validated --certificate-arn "$CERT_ARN" --region us-east-1 || {
        log_warn "Certificate validation timeout. Continuing anyway..."
    }
else
    log_warn "Could not get certificate ARN. Skipping certificate wait."
fi

# Verify critical infrastructure
log_info "Verifying infrastructure..."
DB_ENDPOINT=$(terraform output -raw database_endpoint 2>/dev/null || echo "")
DB_SECRET_ARN=$(terraform output -raw database_secret_arn 2>/dev/null || echo "")
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")

[ -z "$DB_ENDPOINT" ] && { log_error "Database not created properly!"; exit 1; }
[ -z "$DB_SECRET_ARN" ] && { log_error "Database secret not created!"; exit 1; }
[ -z "$CLOUDFRONT_ID" ] && { log_error "CloudFront not created!"; exit 1; }

log_info "Database endpoint: ${DB_ENDPOINT}"
log_info "Database secret ARN: ${DB_SECRET_ARN}"

# Auto-update .env.local
log_info "Updating frontend/.env.local..."
ENV_FILE="../frontend/.env.local"
cat > "$ENV_FILE" << EOF
# Production database configuration (PRODUCTION-ONLY strategy)
DB_SECRET_ARN=${DB_SECRET_ARN}
DB_HOST=${DB_ENDPOINT%:*}
DB_PORT=5432
DB_NAME=amianai
ENABLE_DB_ADMIN=true
NODE_ENV=production

# API Configuration
API_GATEWAY_URL=$(terraform output -raw api_gateway_url)
NEXT_PUBLIC_API_URL=${API_GATEWAY_URL}

# Cognito Configuration
NEXT_PUBLIC_COGNITO_REGION=$(terraform output -raw cognito_region)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
NEXT_PUBLIC_COGNITO_CLIENT_ID=$(terraform output -raw cognito_client_id)
EOF

log_info "Environment file updated successfully!"

# Build and deploy Lambda function
log_info "Building Lambda function..."
cd ../backend/lambda || exit 1

# Check if node_modules exists for Lambda
if [ ! -d "node_modules" ]; then
    log_info "Installing Lambda dependencies..."
    npm ci
else
    log_info "Lambda dependencies already installed, skipping npm ci"
fi

# Build Lambda function
log_info "Building Lambda TypeScript..."
npm run build || { log_error "Lambda build failed!"; exit 1; }

# Package Lambda function
log_info "Packaging Lambda function..."
npm run package || { log_error "Lambda packaging failed!"; exit 1; }

# Deploy Lambda function
log_info "Deploying Lambda function..."
# Get Lambda function name from correct directory
cd ../../infrastructure || exit 1
LAMBDA_FUNCTION_NAME=$(terraform output -raw lambda_function_name 2>/dev/null || echo "")
cd ../backend/lambda || exit 1

if [ -n "$LAMBDA_FUNCTION_NAME" ]; then
    log_info "Lambda function name: $LAMBDA_FUNCTION_NAME"
    
    # Check if Lambda exists
    if ! aws lambda get-function --function-name "$LAMBDA_FUNCTION_NAME" --region us-east-1 >/dev/null 2>&1; then
        log_warn "Lambda function $LAMBDA_FUNCTION_NAME does not exist yet. It may still be creating..."
    fi
    
    # Wait for Lambda to be ready for update
    log_info "Waiting for Lambda function to be ready..."
    MAX_WAIT=60
    WAIT_COUNT=0
    while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
        # Get function state with better error handling
        FUNCTION_INFO=$(aws lambda get-function --function-name "$LAMBDA_FUNCTION_NAME" --region us-east-1 2>/dev/null || echo "")
        
        if [ -z "$FUNCTION_INFO" ]; then
            log_info "Lambda function not found yet, waiting..."
            sleep 2
            WAIT_COUNT=$((WAIT_COUNT + 2))
            continue
        fi
        
        STATE=$(echo "$FUNCTION_INFO" | jq -r '.Configuration.State // empty' 2>/dev/null || echo "")
        UPDATE_STATUS=$(echo "$FUNCTION_INFO" | jq -r '.Configuration.LastUpdateStatus // empty' 2>/dev/null || echo "")
        
        if [ "$STATE" = "Active" ] && ([ "$UPDATE_STATUS" = "Successful" ] || [ -z "$UPDATE_STATUS" ]); then
            log_info "Lambda function is ready for update (State: $STATE)"
            break
        fi
        
        log_info "Lambda state: ${STATE:-Unknown}, update status: ${UPDATE_STATUS:-None} - waiting..."
        sleep 2
        WAIT_COUNT=$((WAIT_COUNT + 2))
    done
    
    if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
        log_error "Timeout waiting for Lambda to be ready"
        exit 1
    fi
    
    # Try to update with retries
    RETRY_COUNT=0
    MAX_RETRIES=3
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if aws lambda update-function-code \
            --function-name "$LAMBDA_FUNCTION_NAME" \
            --region us-east-1 \
            --zip-file fileb://lambda-function.zip 2>/tmp/lambda-error.log; then
            log_info "Lambda function deployed successfully!"
            break
        else
            ERROR_MSG=$(cat /tmp/lambda-error.log)
            if echo "$ERROR_MSG" | grep -q "421"; then
                RETRY_COUNT=$((RETRY_COUNT + 1))
                if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                    log_warn "Lambda update failed with 421 error (attempt $RETRY_COUNT/$MAX_RETRIES), retrying in 5 seconds..."
                    sleep 5
                else
                    log_error "Lambda deployment failed after $MAX_RETRIES attempts!"
                    cat /tmp/lambda-error.log
                    exit 1
                fi
            else
                log_error "Lambda deployment failed!"
                cat /tmp/lambda-error.log
                exit 1
            fi
        fi
    done
else
    log_warn "Lambda function name not found in Terraform output. Skipping Lambda deployment."
fi

# Return to infrastructure directory
cd ../infrastructure || exit 1

# Build and deploy frontend
log_info "Building frontend..."
cd ../frontend || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm ci
else
    log_info "Dependencies already installed, skipping npm ci"
fi

# Set environment variables for build (from .env.local)
source .env.local

# Build the application
log_info "Building Next.js application..."
npm run build || { log_error "Frontend build failed!"; exit 1; }

# Verify build output
if [ ! -d "out" ]; then
    log_error "Build output directory 'out' not found!"
    exit 1
fi

# Deploy to S3
log_info "Deploying to S3..."
aws s3 sync out/ "s3://${DOMAIN_NAME}/" --delete --cache-control "max-age=86400" || {
    log_error "S3 deployment failed!"
    exit 1
}

# Create CloudFront invalidation
log_info "Creating CloudFront invalidation..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

log_info "CloudFront invalidation created: ${INVALIDATION_ID}"

# Cleanup
rm -f ../infrastructure/tfplan

echo ""
log_info "🎉 Setup complete!"
echo ""
echo "✅ Infrastructure deployed successfully"
echo "✅ Lambda API function deployed"
echo "✅ Frontend built and deployed"
echo "✅ Environment variables configured"
echo ""
echo "API endpoints are now available:"
echo "- API Gateway URL: $(terraform output -raw api_gateway_url 2>/dev/null || echo 'Not available')"
echo ""
echo "Next steps:"
echo "1. Test API health:"
echo "   curl $(terraform output -raw api_gateway_url 2>/dev/null || echo 'API_URL')/api/health"
echo ""
echo "2. Test database connection:"
echo "   curl $(terraform output -raw api_gateway_url 2>/dev/null || echo 'API_URL')/api/admin/database-status"
echo ""
echo "3. Setup database schema and seed data:"
echo "   curl -X POST $(terraform output -raw api_gateway_url 2>/dev/null || echo 'API_URL')/api/admin/setup-database"
echo "   curl -X POST $(terraform output -raw api_gateway_url 2>/dev/null || echo 'API_URL')/api/admin/seed-database"
echo ""
echo "4. Your website is available at: https://${DOMAIN_NAME}"
echo ""
echo "Database connection details:"
echo "- Endpoint: ${DB_ENDPOINT}"
echo "- Secret ARN: ${DB_SECRET_ARN}"
echo "- Admin panel: Set ENABLE_DB_ADMIN=true (already done)"