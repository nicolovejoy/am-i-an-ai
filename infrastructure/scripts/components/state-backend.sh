#!/bin/bash
set -e

# Source shared functions  
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/shared.sh"

# State backend component deployment
deploy_state_backend() {
    log_info "🗃️  Deploying state backend component..."
    
    ensure_infrastructure_directory
    check_prerequisites
    verify_aws_credentials
    
    setup_state_backend
    
    mark_component_complete "state-backend"
}

# Main execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    deploy_state_backend
fi