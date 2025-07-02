#!/bin/bash
# Shared utilities for v2 deployment

set -e

# Logging functions
log_info() {
    echo "[INFO] $1"
}

log_warn() {
    echo "[WARN] $1"
}

log_error() {
    echo "[ERROR] $1"
}

# Environment validation
check_environment_variables() {
    if [ -z "$DOMAIN_NAME" ]; then
        log_error "DOMAIN_NAME environment variable is required"
        exit 1
    fi
    log_info "✅ Environment variables validated"
}

# AWS validation
verify_aws_credentials() {
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    log_info "✅ AWS credentials verified"
}

# Project configuration
PROJECT_NAME="amianai-v2"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Terraform utilities
init_terraform() {
    log_info "Initializing Terraform..."
    terraform init
}

apply_terraform() {
    local component=$1
    log_info "Applying $component infrastructure..."
    terraform apply -auto-approve
}

# Component status tracking
mark_component_complete() {
    local component=$1
    log_info "✅ Component $component completed successfully"
}

mark_component_failed() {
    local component=$1
    log_error "❌ Component $component failed"
}

# Get terraform outputs
get_terraform_output() {
    local output_name=$1
    terraform output -raw "$output_name" 2>/dev/null || echo ""
}