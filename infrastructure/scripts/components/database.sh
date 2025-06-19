#!/bin/bash
set -e

# Source shared functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/shared.sh"

# Database component deployment (RDS PostgreSQL + Secrets)
deploy_database() {
    log_info "🗄️  Deploying database component..."
    
    ensure_infrastructure_directory
    check_prerequisites
    check_environment_variables
    verify_aws_credentials
    
    # Initialize Terraform if not already done
    if [ ! -d ".terraform" ]; then
        init_terraform
    fi
    
    # Plan and apply database resources
    log_info "Planning database infrastructure..."
    terraform plan \
        -target="random_password.db_password" \
        -target="aws_secretsmanager_secret.db_password" \
        -target="aws_secretsmanager_secret_version.db_password" \
        -target="aws_db_parameter_group.main" \
        -target="aws_db_subnet_group.main" \
        -target="aws_db_instance.main" \
        -target="aws_iam_role.rds_monitoring" \
        -target="aws_iam_role_policy_attachment.rds_monitoring" \
        -var="github_username=${GITHUB_USERNAME}" \
        -out=database-plan
    
    log_info "Applying database infrastructure..."
    terraform apply database-plan
    
    # Verify database deployment
    local db_endpoint=$(get_terraform_output "database_endpoint")
    local db_secret_arn=$(get_terraform_output "database_secret_arn")
    
    if [ -z "$db_endpoint" ] || [ -z "$db_secret_arn" ]; then
        log_error "Database deployment verification failed!"
        mark_component_failed "database"
        exit 1
    fi
    
    log_info "Database endpoint: ${db_endpoint}"
    log_info "Database secret ARN: ${db_secret_arn}"
    
    # Cleanup plan file
    rm -f database-plan
    
    mark_component_complete "database"
}

# Initialize database schema and seed data
init_database_schema() {
    log_info "🌱 Initializing database schema..."
    
    local api_gateway_url=$(get_terraform_output "api_gateway_url")
    
    if [ -z "$api_gateway_url" ]; then
        log_error "API Gateway URL not available. Deploy Lambda component first."
        exit 1
    fi
    
    log_info "Setting up database schema..."
    curl -X POST "${api_gateway_url}/api/admin/setup-database" || {
        log_warn "Database schema setup failed or already exists"
    }
    
    log_info "Seeding database with sample data..."
    curl -X POST "${api_gateway_url}/api/admin/seed-database" || {
        log_warn "Database seeding failed or data already exists"
    }
    
    log_info "✅ Database initialization complete"
}

# Main execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    case "${1:-deploy}" in
        "deploy")
            deploy_database
            ;;
        "init")
            init_database_schema
            ;;
        "full")
            deploy_database
            init_database_schema
            ;;
        *)
            echo "Usage: $0 [deploy|init|full]"
            echo "  deploy - Deploy database infrastructure"
            echo "  init   - Initialize schema and seed data"
            echo "  full   - Deploy and initialize"
            exit 1
            ;;
    esac
fi