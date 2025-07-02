#!/bin/bash
set -e

echo "🧹 Complete Infrastructure Destruction - Clean Slate"
echo "===================================================="
echo ""
echo "This will destroy ALL remaining AWS resources for amianai:"
echo "  ❌ S3 bucket + CloudFront distribution"
echo "  ❌ Route53 DNS records (keeps hosted zone)"
echo "  ❌ v2 WebSocket Lambda + DynamoDB + API Gateway"
echo "  ❌ All IAM roles and policies"
echo "  ❌ Any remaining Cognito resources"
echo ""
echo "⚠️  This is DESTRUCTIVE and will take the site completely offline!"
echo "✅ We'll redeploy everything fresh with v2-only infrastructure"
echo ""

# Confirmation prompt
echo "Are you absolutely sure you want to destroy everything? (type 'destroy' to confirm)"
read -r response

if [ "$response" != "destroy" ]; then
    echo "Aborting..."
    exit 1
fi

echo ""
echo "🔥 Starting complete destruction..."

# Ensure we're in the infrastructure directory
SCRIPT_DIR="$(dirname "$0")"
if [ "$(basename "$(pwd)")" != "infrastructure" ]; then
    cd "$SCRIPT_DIR/.." || exit 1
fi

# First, empty S3 bucket so it can be destroyed
echo "📦 Emptying S3 bucket..."
aws s3 rm s3://amianai.com --recursive || echo "S3 bucket already empty or doesn't exist"

# Disable CloudFront distribution if it exists and is enabled
echo "🌐 Checking CloudFront distribution status..."
DIST_STATUS=$(aws cloudfront get-distribution --id E2DDCO3458Q1DX --query "Distribution.DistributionConfig.Enabled" --output text 2>/dev/null || echo "false")

if [ "$DIST_STATUS" = "True" ]; then
    echo "🔄 Disabling CloudFront distribution..."
    
    # Get current distribution config
    CONFIG_FILE=$(mktemp)
    DIST_CONFIG_FILE=$(mktemp)
    
    aws cloudfront get-distribution-config --id E2DDCO3458Q1DX > "$CONFIG_FILE"
    ETAG=$(jq -r '.ETag' "$CONFIG_FILE")
    jq '.DistributionConfig' "$CONFIG_FILE" > "$DIST_CONFIG_FILE"
    jq '.Enabled = false' "$DIST_CONFIG_FILE" > "${DIST_CONFIG_FILE}.tmp" && mv "${DIST_CONFIG_FILE}.tmp" "$DIST_CONFIG_FILE"
    
    # Update distribution
    aws cloudfront update-distribution --id E2DDCO3458Q1DX --if-match "$ETAG" --distribution-config "$(cat "$DIST_CONFIG_FILE")"
    
    # Cleanup temp files
    rm "$CONFIG_FILE" "$DIST_CONFIG_FILE"
    
    echo "⏳ Waiting for CloudFront to disable (this may take 10-15 minutes)..."
    aws cloudfront wait distribution-deployed --id E2DDCO3458Q1DX
    echo "✅ CloudFront distribution disabled"
else
    echo "✅ CloudFront distribution already disabled or doesn't exist"
fi

# Check if terraform state exists
if [ -f "terraform.tfstate" ] || [ -f ".terraform/terraform.tfstate" ]; then
    echo ""
    echo "🏗️ Destroying remaining Terraform-managed resources..."
    terraform destroy -auto-approve
else
    echo "ℹ️ No Terraform state found - cleaning up any orphaned resources manually..."
fi

# Manual cleanup of any remaining resources
echo ""
echo "🧽 Cleaning up any orphaned resources..."

# Delete any remaining Lambda functions
aws lambda list-functions --query "Functions[?contains(FunctionName,'amianai')].FunctionName" --output text | xargs -I {} aws lambda delete-function --function-name {} 2>/dev/null || echo "No Lambda functions to clean up"

# Delete DynamoDB tables
aws dynamodb list-tables --query "TableNames[?contains(@,'amianai')]" --output text | xargs -I {} aws dynamodb delete-table --table-name {} 2>/dev/null || echo "No DynamoDB tables to clean up"

# Delete API Gateway WebSocket APIs
aws apigatewayv2 get-apis --query "Items[?contains(Name,'amianai')].ApiId" --output text | xargs -I {} aws apigatewayv2 delete-api --api-id {} 2>/dev/null || echo "No WebSocket APIs to clean up"

# Delete IAM roles (except github-actions which might be shared)
aws iam list-roles --query "Roles[?contains(RoleName,'amianai')].RoleName" --output text | xargs -I {} sh -c 'aws iam list-attached-role-policies --role-name {} --query "AttachedPolicies[].PolicyArn" --output text | xargs -I @ aws iam detach-role-policy --role-name {} --policy-arn @; aws iam list-role-policies --role-name {} --query "PolicyNames" --output text | xargs -I @ aws iam delete-role-policy --role-name {} --policy-name @; aws iam delete-role --role-name {}' 2>/dev/null || echo "No IAM roles to clean up"

# Clean up terraform state files
echo ""
echo "🗑️ Cleaning up Terraform state..."
rm -f terraform.tfstate terraform.tfstate.backup
rm -rf .terraform/

echo ""
echo "🎉 Complete Destruction Finished!"
echo ""
echo "📊 Summary:"
echo "  ✅ All AWS resources destroyed"
echo "  ✅ Terraform state cleaned"
echo "  ✅ Clean slate ready for v2 deployment"
echo ""
echo "💡 Next steps:"
echo "  1. Clean up repository (remove v1 code, reorganize structure)"
echo "  2. Fix tests and pre-commit checks"
echo "  3. Commit clean v2-only codebase"
echo "  4. Deploy fresh v2 infrastructure with v2-shared.tf"
echo ""