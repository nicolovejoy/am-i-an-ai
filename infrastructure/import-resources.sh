#!/bin/bash
set -e

# import-resources.sh - Import existing AWS infrastructure into Terraform state
#
# USE CASE:
# This script is used when you need to manage infrastructure that was created
# on a different machine or when your local Terraform state is missing/outdated.
# It imports existing AWS resources into your local Terraform state file.
#
# WHEN TO USE:
# - Setting up development on a new machine when infrastructure already exists
# - After losing or corrupting your local terraform.tfstate file
# - When you get "resource already exists" errors during terraform apply
# - Switching between machines that manage the same infrastructure
#
# USAGE:
#   GITHUB_USERNAME=your-username ./import-resources.sh
#   
# OPTIONAL:
#   GITHUB_USERNAME=your-username OPENAI_API_KEY=your-key ./import-resources.sh
#
# NOTE: This script only imports resources into state. After running this,
# you should run 'terraform plan' to verify the state matches reality.

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

cd /Users/nico/src/amianai/infrastructure

# Set required variables to avoid prompts
export TF_VAR_github_username="${GITHUB_USERNAME:-nicolovejoy}"
export TF_VAR_openai_api_key="${OPENAI_API_KEY:-}"

log_info "Importing existing AWS resources into Terraform state..."

# Import S3 bucket
log_info "Importing S3 bucket..."
terraform import aws_s3_bucket.website amianai.com || log_warn "Failed to import S3 bucket"

# Import OIDC provider
log_info "Importing GitHub OIDC provider..."
terraform import aws_iam_openid_connect_provider.github arn:aws:iam::218141621131:oidc-provider/token.actions.githubusercontent.com || log_warn "Failed to import OIDC provider"

# Import DB subnet group
log_info "Importing DB subnet group..."
terraform import aws_db_subnet_group.main eeyore-db-subnet-group || log_warn "Failed to import DB subnet group"

# Import DB parameter group
log_info "Importing DB parameter group..."
terraform import aws_db_parameter_group.main eeyore-db-params || log_warn "Failed to import DB parameter group"

# Import Secrets Manager secrets
log_info "Importing database password secret..."
terraform import aws_secretsmanager_secret.db_password eeyore-db-password || log_warn "Failed to import DB password secret"

log_info "Importing OpenAI API key secret..."
terraform import aws_secretsmanager_secret.openai_api_key eeyore-openai-api-key || log_warn "Failed to import OpenAI API key secret"

# Import IAM role
log_info "Importing RDS monitoring role..."
terraform import aws_iam_role.rds_monitoring eeyore-rds-monitoring-role || log_warn "Failed to import RDS monitoring role"

# Import Cognito domain
log_info "Importing Cognito domain..."
terraform import aws_cognito_user_pool_domain.main auth-amianai || log_warn "Failed to import Cognito domain"

# Import CloudWatch log group
log_info "Importing Lambda log group..."
terraform import aws_cloudwatch_log_group.lambda_logs /aws/lambda/eeyore-api || log_warn "Failed to import Lambda log group"

log_info "Import process completed. You may need to import additional resources if errors persist."
log_info "After importing, run: terraform plan to see what changes remain."