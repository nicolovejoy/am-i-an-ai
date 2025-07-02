#!/bin/bash
set -e

# Source shared functions
DATABASE_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DATABASE_SCRIPT_DIR/shared.sh"

# Deploy DynamoDB table
deploy_database() {
    log_info "📦 Deploying DynamoDB table..."
    
    # Change to infrastructure directory if not already there
    if [[ "$(basename "$PWD")" != "infrastructure" ]]; then
        cd infrastructure
    fi
    check_environment_variables
    verify_aws_credentials
    
    # Initialize Terraform if needed
    if [ ! -d ".terraform" ]; then
        init_terraform
    fi
    
    # Plan and apply DynamoDB resources
    log_info "Planning DynamoDB infrastructure..."
    terraform plan \
        -target="aws_dynamodb_table.sessions" \
        -var="domain_name=${DOMAIN_NAME}" \
        -out=database-plan
    
    log_info "Applying DynamoDB infrastructure..."
    terraform apply database-plan
    
    # Cleanup plan file
    rm -f database-plan
    
    mark_component_complete "database"
}

# Test DynamoDB table
test_database() {
    log_info "🧪 Testing DynamoDB table..."
    
    local table_name=$(get_terraform_output "dynamodb_table_name")
    
    if [ -z "$table_name" ]; then
        log_error "DynamoDB table name not found in Terraform outputs"
        return 1
    fi
    
    # Test table exists and is active
    local table_status=$(aws dynamodb describe-table \
        --table-name "$table_name" \
        --query 'Table.TableStatus' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$table_status" = "ACTIVE" ]; then
        log_info "✅ DynamoDB table '$table_name' is active"
    else
        log_error "❌ DynamoDB table '$table_name' status: $table_status"
        return 1
    fi
}

# Main execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    deploy_database
    test_database
fi