#!/bin/bash
set -e

# Source shared functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/shared.sh"

# Cognito component deployment (Authentication)
deploy_cognito() {
    log_info "🔐 Deploying Cognito component..."
    
    ensure_infrastructure_directory
    check_prerequisites
    check_environment_variables
    verify_aws_credentials
    
    # Initialize Terraform if not already done
    if [ ! -d ".terraform" ]; then
        init_terraform
    fi
    
    # Plan and apply Cognito resources
    log_info "Planning Cognito infrastructure..."
    terraform plan \
        -target="aws_cognito_user_pool.main" \
        -target="aws_cognito_user_pool_domain.main" \
        -target="aws_cognito_user_pool_client.main" \
        -target="aws_cognito_user_group.admin" \
        -target="aws_cognito_user_group.user" \
        -var="github_username=${GITHUB_USERNAME}" \
        -out=cognito-plan
    
    log_info "Applying Cognito infrastructure..."
    terraform apply cognito-plan
    
    # Verify Cognito deployment
    local cognito_user_pool_id=$(get_terraform_output "cognito_user_pool_id")
    local cognito_client_id=$(get_terraform_output "cognito_client_id")
    
    if [ -z "$cognito_user_pool_id" ] || [ -z "$cognito_client_id" ]; then
        log_error "Cognito deployment verification failed!"
        mark_component_failed "cognito"
        exit 1
    fi
    
    log_info "Cognito User Pool ID: ${cognito_user_pool_id}"
    log_info "Cognito Client ID: ${cognito_client_id}"
    
    # Cleanup plan file
    rm -f cognito-plan
    
    mark_component_complete "cognito"
}

# Import existing Cognito resources (for preservation scenarios)
import_existing_cognito() {
    local user_pool_name="${1:-amianai-user-pool}"
    
    log_info "🔍 Importing existing Cognito resources..."
    
    # Find existing user pool
    local user_pool_id=$(aws cognito-idp list-user-pools --max-items 50 --query "UserPools[?Name=='$user_pool_name'].Id" --output text 2>/dev/null || echo "")
    
    if [ -z "$user_pool_id" ]; then
        log_error "Existing user pool '$user_pool_name' not found"
        exit 1
    fi
    
    log_info "Found existing user pool: $user_pool_id"
    
    # Import user pool
    terraform import aws_cognito_user_pool.main "$user_pool_id" || {
        log_warn "Could not import user pool (may already be in state)"
    }
    
    # Find and import user pool domain
    local domain_name=$(aws cognito-idp describe-user-pool --user-pool-id "$user_pool_id" --query "UserPool.Domain" --output text 2>/dev/null || echo "")
    if [ -n "$domain_name" ] && [ "$domain_name" != "None" ]; then
        terraform import aws_cognito_user_pool_domain.main "$domain_name" || {
            log_warn "Could not import user pool domain (may already be in state)"
        }
    fi
    
    # Find and import user pool client
    local client_id=$(aws cognito-idp list-user-pool-clients --user-pool-id "$user_pool_id" --query "UserPoolClients[0].ClientId" --output text 2>/dev/null || echo "")
    if [ -n "$client_id" ] && [ "$client_id" != "None" ]; then
        terraform import aws_cognito_user_pool_client.main "$user_pool_id/$client_id" || {
            log_warn "Could not import user pool client (may already be in state)"
        }
    fi
    
    log_info "✅ Cognito import complete"
}

# List existing Cognito resources
list_cognito_resources() {
    log_info "📋 Listing Cognito resources..."
    
    echo ""
    echo "User Pools:"
    aws cognito-idp list-user-pools --max-items 50 --query "UserPools[].{Name:Name,Id:Id,CreationDate:CreationDate}" --output table
    
    echo ""
    echo "Current Terraform state:"
    terraform state list | grep cognito || echo "No Cognito resources in state"
}

# Main execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    case "${1:-deploy}" in
        "deploy")
            deploy_cognito
            ;;
        "import")
            import_existing_cognito "$2"
            ;;
        "list")
            list_cognito_resources
            ;;
        *)
            echo "Usage: $0 [deploy|import|list] [user_pool_name]"
            echo "  deploy - Deploy new Cognito infrastructure"
            echo "  import - Import existing Cognito resources into Terraform state"
            echo "  list   - List existing Cognito resources"
            exit 1
            ;;
    esac
fi