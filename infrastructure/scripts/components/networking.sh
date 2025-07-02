#!/bin/bash
set -e

# Source shared functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/shared.sh"

# Networking component deployment (VPC, Security Groups, etc.)
deploy_networking() {
    log_info "🌐 Deploying networking component..."
    
    ensure_infrastructure_directory
    check_prerequisites
    check_environment_variables
    verify_aws_credentials
    
    # Initialize Terraform if not already done
    if [ ! -d ".terraform" ]; then
        init_terraform
    fi
    
    # Plan and apply only networking resources
    log_info "Planning networking infrastructure..."
    terraform plan \
        -target="aws_vpc.main" \
        -target="aws_subnet.private" \
        -target="aws_subnet.public" \
        -target="aws_internet_gateway.main" \
        -target="aws_route_table.public" \
        -target="aws_route_table_association.public" \
        -target="aws_security_group.rds" \
        -var="github_username=${GITHUB_USERNAME}" \
        -out=networking-plan
    
    log_info "Applying networking infrastructure..."
    terraform apply networking-plan
    
    # Cleanup plan file
    rm -f networking-plan
    
    mark_component_complete "networking"
}

# Main execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    deploy_networking
fi