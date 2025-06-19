#!/bin/bash
set -e

# Main orchestrator script for granular AmIAnAI infrastructure deployment
# Usage: ./scripts/deploy.sh [options] [components...]

# Source shared functions
SCRIPT_DIR="$(dirname "$0")"
source "$SCRIPT_DIR/components/shared.sh"

# Script configuration
COMPONENTS_DIR="$SCRIPT_DIR/components"
FORCE_REFRESH=false
SKIP_VERIFICATION=false

# Available components
AVAILABLE_COMPONENTS=(
    "state-backend"
    "networking" 
    "cognito"
    "database"
    "lambda"
    "frontend"
)

# Component groups (bash 4+ safe)
get_component_group() {
    case $1 in
        "infrastructure") echo "state-backend networking" ;;
        "backend") echo "database lambda" ;;
        "application") echo "lambda frontend" ;;
        "all") echo "state-backend networking cognito database lambda frontend" ;;
        *) echo "" ;;
    esac
}

# Usage information
show_usage() {
    echo "Usage: $0 [options] [components...]"
    echo ""
    echo "Components:"
    echo "  state-backend  - S3 + DynamoDB for Terraform state"
    echo "  networking     - VPC, subnets, security groups"
    echo "  cognito        - Authentication (user pools)"
    echo "  database       - RDS PostgreSQL + secrets"
    echo "  lambda         - Lambda functions + API Gateway"
    echo "  frontend       - S3 + CloudFront + certificates"
    echo ""
    echo "Component Groups:"
    echo "  --infrastructure - state-backend + networking"
    echo "  --backend        - database + lambda"
    echo "  --application    - lambda + frontend"
    echo "  --all            - All components (equivalent to current setup.sh)"
    echo ""
    echo "Options:"
    echo "  --force-refresh  - Force Terraform refresh and rebuild"
    echo "  --skip-verify    - Skip infrastructure verification"
    echo "  --help           - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --all                    # Deploy everything (current behavior)"
    echo "  $0 --lambda                # Deploy only Lambda functions"
    echo "  $0 --database --lambda     # Deploy database and Lambda"
    echo "  $0 --backend               # Deploy database + Lambda"
    echo "  $0 --frontend --force-refresh  # Force rebuild frontend"
    echo ""
    echo "Environment Variables Required:"
    echo "  DOMAIN_NAME      - Your domain name (e.g., amianai.com)"
    echo "  GITHUB_USERNAME  - Your GitHub username"
    echo ""
}

# Parse command line arguments
parse_arguments() {
    local components=()
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_usage
                exit 0
                ;;
            --force-refresh)
                FORCE_REFRESH=true
                shift
                ;;
            --skip-verify)
                SKIP_VERIFICATION=true
                shift
                ;;
            --all)
                components+=($(get_component_group "all"))
                shift
                ;;
            --infrastructure)
                components+=($(get_component_group "infrastructure"))
                shift
                ;;
            --backend)
                components+=($(get_component_group "backend"))
                shift
                ;;
            --application)
                components+=($(get_component_group "application"))
                shift
                ;;
            --state-backend|--networking|--cognito|--database|--lambda|--frontend)
                # Remove leading dashes
                local component="${1#--}"
                components+=("$component")
                shift
                ;;
            *)
                # Check if it's a valid component without dashes
                local found=false
                for available in "${AVAILABLE_COMPONENTS[@]}"; do
                    if [ "$1" = "$available" ]; then
                        components+=("$1")
                        found=true
                        break
                    fi
                done
                
                if [ "$found" = false ]; then
                    log_error "Unknown argument: $1"
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # If no components specified, show usage
    if [ ${#components[@]} -eq 0 ]; then
        log_error "No components specified"
        show_usage
        exit 1
    fi
    
    # Remove duplicates and set global array
    SELECTED_COMPONENTS=($(printf "%s\n" "${components[@]}" | sort -u))
}

# Validate component dependencies
validate_dependencies() {
    log_info "Validating component dependencies..."
    
    for component in "${SELECTED_COMPONENTS[@]}"; do
        case $component in
            "database")
                if ! [[ " ${SELECTED_COMPONENTS[*]} " =~ " networking " ]] && ! terraform state list | grep -q "aws_vpc.main"; then
                    log_error "Database component requires networking to be deployed first"
                    exit 1
                fi
                ;;
            "lambda")
                if ! [[ " ${SELECTED_COMPONENTS[*]} " =~ " networking " ]] && ! terraform state list | grep -q "aws_vpc.main"; then
                    log_error "Lambda component requires networking to be deployed first"
                    exit 1
                fi
                ;;
            "frontend")
                # Frontend can be deployed independently, but warn if no backend
                if ! [[ " ${SELECTED_COMPONENTS[*]} " =~ " lambda " ]] && ! terraform state list | grep -q "aws_lambda_function.api"; then
                    log_warn "Frontend deployed without Lambda API - some features may not work"
                fi
                ;;
        esac
    done
    
    log_info "✅ Dependencies validated"
}

# Deploy selected components
deploy_components() {
    log_info "🚀 Starting deployment of components: ${SELECTED_COMPONENTS[*]}"
    
    ensure_infrastructure_directory
    
    # Always ensure state backend is ready
    if ! [[ " ${SELECTED_COMPONENTS[*]} " =~ " state-backend " ]]; then
        log_info "Ensuring state backend is ready..."
        source "$COMPONENTS_DIR/state-backend.sh"
        deploy_state_backend
    fi
    
    # Deploy components in dependency order
    local deployment_order=(
        "state-backend"
        "networking"
        "cognito" 
        "database"
        "lambda"
        "frontend"
    )
    
    for component in "${deployment_order[@]}"; do
        if [[ " ${SELECTED_COMPONENTS[*]} " =~ " $component " ]]; then
            log_info "📦 Deploying component: $component"
            
            case $component in
                "state-backend")
                    source "$COMPONENTS_DIR/state-backend.sh"
                    deploy_state_backend
                    ;;
                "networking")
                    source "$COMPONENTS_DIR/networking.sh"
                    deploy_networking
                    ;;
                "cognito")
                    source "$COMPONENTS_DIR/cognito.sh"
                    deploy_cognito
                    ;;
                "database")
                    source "$COMPONENTS_DIR/database.sh"
                    deploy_database
                    ;;
                "lambda")
                    source "$COMPONENTS_DIR/lambda.sh"
                    deploy_lambda
                    ;;
                "frontend")
                    source "$COMPONENTS_DIR/frontend.sh"
                    deploy_frontend
                    # Also build and deploy the application
                    build_and_deploy_frontend
                    ;;
            esac
            
            if is_component_complete "$component"; then
                log_info "✅ Component $component deployed successfully"
            else
                log_error "❌ Component $component deployment failed"
                exit 1
            fi
        fi
    done
}

# Post-deployment tasks
post_deployment() {
    log_info "🔧 Running post-deployment tasks..."
    
    # Update environment file if any backend components were deployed
    if [[ " ${SELECTED_COMPONENTS[*]} " =~ " lambda " ]] || [[ " ${SELECTED_COMPONENTS[*]} " =~ " database " ]] || [[ " ${SELECTED_COMPONENTS[*]} " =~ " cognito " ]]; then
        update_frontend_env
    fi
    
    # Initialize database if both database and lambda were deployed
    if [[ " ${SELECTED_COMPONENTS[*]} " =~ " database " ]] && [[ " ${SELECTED_COMPONENTS[*]} " =~ " lambda " ]]; then
        log_info "🌱 Initializing database schema and seed data..."
        source "$COMPONENTS_DIR/database.sh"
        init_database_schema
    fi
    
    # Verify infrastructure if not skipped
    if [ "$SKIP_VERIFICATION" = false ]; then
        verify_deployment
    fi
    
    log_info "✅ Post-deployment tasks complete"
}

# Verify deployment
verify_deployment() {
    log_info "🧪 Verifying deployment..."
    
    # Test Lambda if deployed
    if [[ " ${SELECTED_COMPONENTS[*]} " =~ " lambda " ]]; then
        source "$COMPONENTS_DIR/lambda.sh"
        test_lambda
    fi
    
    # Test frontend if deployed
    if [[ " ${SELECTED_COMPONENTS[*]} " =~ " frontend " ]]; then
        source "$COMPONENTS_DIR/frontend.sh"
        test_frontend
    fi
    
    log_info "✅ Deployment verification complete"
}

# Print deployment summary
print_final_summary() {
    echo ""
    log_info "🎉 Deployment Complete!"
    echo ""
    
    print_deployment_summary
    
    # Show useful endpoints and next steps
    local api_gateway_url=$(get_terraform_output "api_gateway_url")
    local website_url="https://${DOMAIN_NAME}"
    
    if [ -n "$api_gateway_url" ]; then
        echo "🔗 API Endpoints:"
        echo "   Health: ${api_gateway_url}/api/health"
        echo "   Database Status: ${api_gateway_url}/api/admin/database-status"
        echo ""
    fi
    
    if [[ " ${SELECTED_COMPONENTS[*]} " =~ " frontend " ]]; then
        echo "🌐 Website: $website_url"
        echo ""
    fi
    
    echo "📋 Next Steps:"
    if [[ " ${SELECTED_COMPONENTS[*]} " =~ " database " ]] && [[ " ${SELECTED_COMPONENTS[*]} " =~ " lambda " ]]; then
        echo "   1. Database is initialized and ready"
        echo "   2. Test API endpoints above"
    else
        echo "   1. Deploy remaining components as needed"
        echo "   2. Initialize database: ./scripts/components/database.sh init"
    fi
    
    if [[ " ${SELECTED_COMPONENTS[*]} " =~ " frontend " ]]; then
        echo "   3. Your application is live at: $website_url"
    fi
    
    echo ""
}

# Cleanup on exit
cleanup_on_exit() {
    cleanup_deployment_artifacts
}
trap cleanup_on_exit EXIT

# Main execution
main() {
    log_info "🚀 AmIAnAI Granular Infrastructure Deployment"
    echo ""
    
    # Parse arguments
    parse_arguments "$@"
    
    # Show deployment plan
    log_info "📋 Deployment Plan:"
    log_info "   Components: ${SELECTED_COMPONENTS[*]}"
    log_info "   Force Refresh: $FORCE_REFRESH"
    log_info "   Skip Verification: $SKIP_VERIFICATION"
    echo ""
    
    # Pre-deployment checks
    check_prerequisites
    check_environment_variables
    verify_aws_credentials
    validate_dependencies
    
    # Execute deployment
    deploy_components
    post_deployment
    
    # Show summary
    print_final_summary
}

# Execute main function with all arguments
main "$@"