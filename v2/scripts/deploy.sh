#!/bin/bash
set -e

# Main deployment orchestrator for AmIAnAI v2
# Usage: ./scripts/deploy.sh [options]

# Source shared functions
SCRIPT_DIR="$(dirname "$0")"
source "$SCRIPT_DIR/components/shared.sh"

# Available components
AVAILABLE_COMPONENTS=("database" "websocket" "frontend")

# Show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Components:"
    echo "  --database     - DynamoDB table for sessions"
    echo "  --websocket    - WebSocket API + Lambda function"
    echo "  --frontend     - S3 + CloudFront for v2.amianai.com"
    echo "  --all          - Deploy all components"
    echo ""
    echo "Options:"
    echo "  --help         - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --all                    # Deploy everything"
    echo "  $0 --websocket --database   # Deploy backend only"
    echo "  $0 --frontend               # Deploy frontend only"
    echo ""
    echo "Environment Variables Required:"
    echo "  DOMAIN_NAME    - Your domain name (e.g., amianai.com)"
    echo ""
}

# Parse arguments
parse_arguments() {
    local components=()
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_usage
                exit 0
                ;;
            --all)
                components=("${AVAILABLE_COMPONENTS[@]}")
                shift
                ;;
            --database|--websocket|--frontend)
                local component="${1#--}"
                components+=("$component")
                shift
                ;;
            *)
                log_error "Unknown argument: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    if [ ${#components[@]} -eq 0 ]; then
        log_error "No components specified"
        show_usage
        exit 1
    fi
    
    SELECTED_COMPONENTS=($(printf "%s\n" "${components[@]}" | sort -u))
}

# Deploy components
deploy_components() {
    log_info "🚀 Starting v2 deployment: ${SELECTED_COMPONENTS[*]}"
    
    check_environment_variables
    verify_aws_credentials
    
    # Deploy in dependency order
    local deployment_order=("database" "websocket" "frontend")
    
    for component in "${deployment_order[@]}"; do
        if [[ " ${SELECTED_COMPONENTS[*]} " =~ " $component " ]]; then
            log_info "📦 Deploying component: $component"
            
            case $component in
                "database")
                    source "$SCRIPT_DIR/components/database.sh"
                    deploy_database
                    ;;
                "websocket")
                    source "$SCRIPT_DIR/components/websocket.sh"
                    deploy_websocket
                    ;;
                "frontend")
                    source "$SCRIPT_DIR/components/frontend.sh"
                    deploy_frontend
                    ;;
            esac
            
            log_info "✅ Component $component deployed successfully"
        fi
    done
}

# Post-deployment summary
print_summary() {
    echo ""
    log_info "🎉 v2 Deployment Complete!"
    echo ""
    
    cd infrastructure 2>/dev/null || return
    
    local websocket_url=$(get_terraform_output "websocket_url")
    local table_name=$(get_terraform_output "dynamodb_table_name")
    
    if [ -n "$websocket_url" ]; then
        echo "🔌 WebSocket API: $websocket_url"
        echo "   Test with: wscat -c $websocket_url"
    fi
    
    if [ -n "$table_name" ]; then
        echo "🗄️  DynamoDB Table: $table_name"
    fi
    
    echo ""
    echo "📊 Architecture Summary:"
    echo "   • No VPC (cost savings: ~$90/month)"
    echo "   • DynamoDB (serverless, pay-per-use)"
    echo "   • WebSocket Lambda (real-time 2H+2AI)"
    echo "   • Estimated monthly cost: ~$5"
    echo ""
    echo "🧪 Test the WebSocket:"
    echo "   1. Connect: wscat -c $websocket_url"
    echo "   2. Send: {\"action\":\"message\",\"content\":\"Hello!\"}"
    echo "   3. Expect: A/B/C/D identity assignment"
    echo ""
}

# Main execution
main() {
    log_info "🚀 AmIAnAI v2 - 2H+2AI Deployment"
    echo ""
    
    parse_arguments "$@"
    deploy_components
    print_summary
}

# Execute main with all arguments
main "$@"