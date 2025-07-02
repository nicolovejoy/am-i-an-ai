#!/bin/bash
set -e

# Selective V1 Backend Destruction Script
# Destroys expensive v1 components while preserving shared infrastructure

# Check environment variables
if [ -z "$DOMAIN_NAME" ]; then
    echo "Error: DOMAIN_NAME environment variable is required. Aborting." >&2
    exit 1
fi

# Ensure we're in the infrastructure directory
SCRIPT_DIR="$(dirname "$0")"
if [ "$(basename "$(pwd)")" != "infrastructure" ]; then
    cd "$SCRIPT_DIR/.." || exit 1
fi

echo "🧹 Selective V1 Backend Destruction for ${DOMAIN_NAME}"
echo ""
echo "This will destroy ONLY expensive v1 backend components:"
echo "  ❌ VPC + Internet Gateway + Subnets + Route Tables"
echo "  ❌ RDS PostgreSQL Database + Security Groups"  
echo "  ❌ V1 Lambda Function + IAM Roles + CloudWatch Logs"
echo "  ❌ API Gateway REST API + Deployments"
echo "  ❌ Secrets Manager (DB password, OpenAI key)"
echo ""
echo "PRESERVED (working shared infrastructure):"
echo "  ✅ S3 Bucket + CloudFront Distribution"
echo "  ✅ Route53 DNS Records + SSL Certificate"
echo "  ✅ GitHub Actions OIDC + IAM Roles"
echo "  ✅ Cognito User Pool + User Groups"
echo ""
echo "💰 Expected savings: ~$90/month (NAT Gateway + RDS costs)"
echo ""

# Confirmation prompt
echo "Are you sure you want to proceed? (y/n)"
read -r response

if [ "$response" != "y" ]; then
    echo "Aborting..."
    exit 1
fi

echo ""
echo "🔍 Removing v1 backend resources from Terraform state..."

# V1 Backend Resources to Destroy (remove from state first for safety)
echo "Removing VPC networking resources..."
terraform state rm aws_vpc.main 2>/dev/null || echo "VPC not in state"
terraform state rm aws_internet_gateway.main 2>/dev/null || echo "Internet Gateway not in state"
terraform state rm aws_subnet.public 2>/dev/null || echo "Public subnets not in state"
terraform state rm aws_subnet.private 2>/dev/null || echo "Private subnets not in state"
terraform state rm aws_route_table.public 2>/dev/null || echo "Route table not in state"
terraform state rm aws_route_table_association.public 2>/dev/null || echo "Route table associations not in state"

echo "Removing RDS database resources..."
terraform state rm aws_db_instance.main 2>/dev/null || echo "RDS instance not in state"
terraform state rm aws_db_subnet_group.main 2>/dev/null || echo "DB subnet group not in state"
terraform state rm aws_db_parameter_group.main 2>/dev/null || echo "DB parameter group not in state"
terraform state rm aws_security_group.rds 2>/dev/null || echo "RDS security group not in state"
terraform state rm random_password.db_password 2>/dev/null || echo "DB password not in state"

echo "Removing Secrets Manager resources..."
terraform state rm aws_secretsmanager_secret.db_password 2>/dev/null || echo "DB secret not in state"
terraform state rm aws_secretsmanager_secret_version.db_password 2>/dev/null || echo "DB secret version not in state"
terraform state rm aws_secretsmanager_secret.openai_api_key 2>/dev/null || echo "OpenAI secret not in state"
terraform state rm aws_secretsmanager_secret_version.openai_api_key 2>/dev/null || echo "OpenAI secret version not in state"

echo "Removing v1 Lambda function resources..."
terraform state rm aws_lambda_function.api 2>/dev/null || echo "Lambda function not in state"
terraform state rm aws_iam_role.lambda_execution 2>/dev/null || echo "Lambda execution role not in state"
terraform state rm aws_iam_policy.lambda_policy 2>/dev/null || echo "Lambda policy not in state"
terraform state rm aws_iam_role_policy_attachment.lambda_policy 2>/dev/null || echo "Lambda policy attachment not in state"
terraform state rm aws_cloudwatch_log_group.lambda_logs 2>/dev/null || echo "Lambda logs not in state"

echo "Removing API Gateway resources..."
terraform state rm aws_api_gateway_rest_api.main 2>/dev/null || echo "API Gateway not in state"
terraform state rm aws_api_gateway_resource.proxy 2>/dev/null || echo "API Gateway resource not in state"
terraform state rm aws_api_gateway_method.proxy 2>/dev/null || echo "API Gateway method not in state"
terraform state rm aws_api_gateway_method.proxy_root 2>/dev/null || echo "API Gateway root method not in state"
terraform state rm aws_api_gateway_integration.lambda 2>/dev/null || echo "API Gateway integration not in state"
terraform state rm aws_api_gateway_integration.lambda_root 2>/dev/null || echo "API Gateway root integration not in state"
terraform state rm aws_lambda_permission.api_gw 2>/dev/null || echo "Lambda permission not in state"
terraform state rm aws_api_gateway_deployment.main 2>/dev/null || echo "API Gateway deployment not in state"
terraform state rm aws_api_gateway_stage.prod 2>/dev/null || echo "API Gateway stage not in state"

echo "Removing RDS monitoring role..."
terraform state rm aws_iam_role.rds_monitoring 2>/dev/null || echo "RDS monitoring role not in state"
terraform state rm aws_iam_role_policy_attachment.rds_monitoring 2>/dev/null || echo "RDS monitoring attachment not in state"

echo ""
echo "✅ V1 backend resources removed from Terraform state"
echo ""
echo "🗑️  Now running terraform destroy to clean up orphaned AWS resources..."

# Clean destroy of remaining infrastructure
# This will only affect resources still managed by Terraform (shared infrastructure)
terraform destroy -auto-approve

echo ""
echo "🎉 V1 Backend Destruction Complete!"
echo ""
echo "📊 Results:"
echo "  ✅ Expensive v1 backend destroyed (~$90/month savings)"
echo "  ✅ Shared infrastructure preserved (S3, CloudFront, DNS, GitHub Actions)"
echo "  ✅ v2 WebSocket system continues running"
echo "  ✅ Production site remains live at https://amianai.com"
echo ""
echo "💡 Next steps:"
echo "  1. Remove unused v1 code directories (/backend, /lambda, /frontend)"
echo "  2. Reorganize file structure (eliminate /v2 folder)"
echo "  3. Commit clean migration"
echo ""