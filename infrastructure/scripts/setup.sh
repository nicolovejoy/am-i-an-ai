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

# Initialize Terraform
log_info "Initializing Terraform..."
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
NEXT_PUBLIC_API_URL=http://localhost:3000

# Cognito Configuration
NEXT_PUBLIC_COGNITO_REGION=$(terraform output -raw cognito_region)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
NEXT_PUBLIC_COGNITO_CLIENT_ID=$(terraform output -raw cognito_client_id)
EOF

log_info "Environment file updated successfully!"

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
echo "✅ Frontend built and deployed"
echo "✅ Environment variables configured"
echo ""
echo "Next steps:"
echo "1. Test database connection:"
echo "   curl http://localhost:3000/api/admin/database-status/"
echo ""
echo "2. Setup database schema and seed data:"
echo "   curl -X POST http://localhost:3000/api/admin/setup-database/"
echo "   curl -X POST http://localhost:3000/api/admin/seed-database/"
echo ""
echo "3. Your website is available at: https://${DOMAIN_NAME}"
echo ""
echo "Database connection details:"
echo "- Endpoint: ${DB_ENDPOINT}"
echo "- Secret ARN: ${DB_SECRET_ARN}"
echo "- Admin panel: Set ENABLE_DB_ADMIN=true (already done)"