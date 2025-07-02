#!/bin/bash
set -e

# Source shared functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/shared.sh"

# Frontend component deployment (S3 + CloudFront)
deploy_frontend() {
    log_info "🌐 Deploying frontend component..."
    
    # Change to infrastructure directory if not already there
    if [[ "$(basename "$PWD")" != "infrastructure" ]]; then
        cd infrastructure
    fi
    check_environment_variables
    verify_aws_credentials
    
    # Initialize Terraform if not already done
    if [ ! -d ".terraform" ]; then
        init_terraform
    fi
    
    # Plan and apply frontend resources
    log_info "Planning frontend infrastructure..."
    terraform plan \
        -target="aws_s3_bucket.website" \
        -target="aws_s3_bucket_ownership_controls.website" \
        -target="aws_s3_bucket_public_access_block.website" \
        -target="aws_s3_bucket_website_configuration.website" \
        -target="aws_s3_bucket_policy.website" \
        -target="aws_acm_certificate.ssl_certificate" \
        -target="aws_acm_certificate_validation.ssl_certificate" \
        -target="aws_route53_zone.main" \
        -target="aws_route53_record.ssl_validation" \
        -target="aws_cloudfront_distribution.website" \
        -target="aws_route53_record.website" \
        -var="github_username=${GITHUB_USERNAME}" \
        -out=frontend-plan
    
    log_info "Applying frontend infrastructure..."
    terraform apply frontend-plan
    
    # Wait for certificate validation
    wait_for_certificate
    
    # Verify frontend infrastructure
    local cloudfront_id=$(get_terraform_output "cloudfront_distribution_id")
    
    if [ -z "$cloudfront_id" ]; then
        log_error "CloudFront distribution not created properly!"
        mark_component_failed "frontend"
        exit 1
    fi
    
    log_info "CloudFront Distribution ID: ${cloudfront_id}"
    
    # Cleanup plan file
    rm -f frontend-plan
    
    mark_component_complete "frontend"
}

# Build and deploy frontend application
build_and_deploy_frontend() {
    log_info "🏗️  Building and deploying frontend application..."
    
    # Update environment file first
    update_frontend_env
    
    # Build frontend
    build_frontend_app
    
    # Deploy to S3
    deploy_to_s3
    
    # Invalidate CloudFront
    invalidate_cloudfront
    
    log_info "✅ Frontend application deployed successfully"
}

# Build frontend application
build_frontend_app() {
    log_info "Building Next.js application..."
    
    cd ../frontend || exit 1
    
    # Install dependencies
    install_npm_dependencies "." "Frontend"
    
    # Set environment variables for build (from .env.local)
    if [ -f ".env.local" ]; then
        source .env.local
    else
        log_warn ".env.local not found, build may fail"
    fi
    
    # Build the application
    log_info "Building Next.js application..."
    npm run build || { 
        log_error "Frontend build failed!"
        mark_component_failed "frontend"
        exit 1
    }
    
    # Verify build output
    if [ ! -d "out" ]; then
        log_error "Build output directory 'out' not found!"
        mark_component_failed "frontend"
        exit 1
    fi
    
    cd ../infrastructure || exit 1
    
    log_info "✅ Frontend application built successfully"
}

# Deploy to S3
deploy_to_s3() {
    log_info "Deploying to S3..."
    
    cd ../frontend || exit 1
    
    # Deploy to S3
    aws s3 sync out/ "s3://${DOMAIN_NAME}/" --delete --cache-control "max-age=86400" || {
        log_error "S3 deployment failed!"
        mark_component_failed "frontend"
        exit 1
    }
    
    cd ../infrastructure || exit 1
    
    log_info "✅ S3 deployment complete"
}

# Invalidate CloudFront cache
invalidate_cloudfront() {
    log_info "Invalidating CloudFront cache..."
    
    local cloudfront_id=$(get_terraform_output "cloudfront_distribution_id")
    
    if [ -z "$cloudfront_id" ]; then
        log_error "CloudFront distribution ID not available"
        exit 1
    fi
    
    create_cloudfront_invalidation "$cloudfront_id"
    
    log_info "✅ CloudFront invalidation complete"
}

# Test frontend deployment
test_frontend() {
    log_info "🧪 Testing frontend deployment..."
    
    local website_url="https://${DOMAIN_NAME}"
    
    log_info "Testing website availability at: $website_url"
    
    # Test with curl (allow for some CloudFront propagation time)
    local retries=0
    local max_retries=5
    
    while [ $retries -lt $max_retries ]; do
        if curl -f -s "$website_url" >/dev/null 2>&1; then
            log_info "✅ Website is accessible"
            return 0
        else
            retries=$((retries + 1))
            if [ $retries -lt $max_retries ]; then
                log_info "Website not yet accessible, waiting 30 seconds... (attempt $retries/$max_retries)"
                sleep 30
            fi
        fi
    done
    
    log_warn "⚠️  Website may not be fully accessible yet (CloudFront propagation can take time)"
    log_info "Manual check: $website_url"
}

# Main execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    case "${1:-deploy}" in
        "deploy")
            deploy_frontend
            ;;
        "build")
            build_frontend_app
            ;;
        "upload")
            deploy_to_s3
            ;;
        "invalidate")
            invalidate_cloudfront
            ;;
        "app")
            build_and_deploy_frontend
            ;;
        "test")
            test_frontend
            ;;
        "full")
            deploy_frontend
            build_and_deploy_frontend
            test_frontend
            ;;
        *)
            echo "Usage: $0 [deploy|build|upload|invalidate|app|test|full]"
            echo "  deploy     - Deploy frontend infrastructure (S3, CloudFront, certificates)"
            echo "  build      - Build Next.js application only"
            echo "  upload     - Upload built application to S3"
            echo "  invalidate - Invalidate CloudFront cache"
            echo "  app        - Build and deploy application (no infrastructure)"
            echo "  test       - Test frontend deployment"
            echo "  full       - Deploy infrastructure, build, and deploy application"
            exit 1
            ;;
    esac
fi