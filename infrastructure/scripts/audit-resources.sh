#!/bin/bash

echo "🔍 AWS Resource Audit - Current State"
echo "=================================="
echo ""

# S3 Buckets
echo "📦 S3 Buckets:"
aws s3 ls | grep amianai || echo "  No amianai buckets found"
echo ""

# CloudFront Distributions  
echo "🌐 CloudFront Distributions:"
aws cloudfront list-distributions --query "DistributionList.Items[].{Id:Id,Status:Status,Aliases:Aliases.Items[0]}" --output table || echo "  No distributions found"
echo ""

# Route53 Hosted Zones & Records
echo "🌍 Route53 Hosted Zones:"
aws route53 list-hosted-zones --query "HostedZones[?contains(Name,'amianai')].{Name:Name,Id:Id}" --output table || echo "  No amianai zones found"

if aws route53 list-hosted-zones --query "HostedZones[?contains(Name,'amianai')].Id" --output text | grep -q Z; then
    ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?contains(Name,'amianai')].Id" --output text | head -1)
    echo "📋 DNS Records in amianai.com zone:"
    aws route53 list-resource-record-sets --hosted-zone-id "$ZONE_ID" --query "ResourceRecordSets[].{Name:Name,Type:Type}" --output table
fi
echo ""

# Cognito User Pools
echo "🔐 Cognito User Pools:"
aws cognito-idp list-user-pools --max-results 10 --query "UserPools[?contains(Name,'amianai')].{Name:Name,Id:Id}" --output table || echo "  No amianai user pools found"
echo ""

# Lambda Functions
echo "⚡ Lambda Functions:"
aws lambda list-functions --query "Functions[?contains(FunctionName,'amianai')].{Name:FunctionName,Runtime:Runtime,LastModified:LastModified}" --output table || echo "  No amianai functions found"
echo ""

# DynamoDB Tables
echo "🗄️ DynamoDB Tables:"
aws dynamodb list-tables --query "TableNames[?contains(@,'amianai')]" --output table || echo "  No amianai tables found"
echo ""

# API Gateway APIs
echo "🚪 API Gateway APIs:"
aws apigateway get-rest-apis --query "items[?contains(name,'amianai')].{Name:name,Id:id}" --output table || echo "  No amianai REST APIs found"

echo "🔌 API Gateway WebSocket APIs:"
aws apigatewayv2 get-apis --query "Items[?contains(Name,'amianai')].{Name:Name,ApiId:ApiId,ProtocolType:ProtocolType}" --output table || echo "  No amianai WebSocket APIs found"
echo ""

# IAM Roles
echo "👤 IAM Roles:"
aws iam list-roles --query "Roles[?contains(RoleName,'amianai') || contains(RoleName,'github')].{Name:RoleName,Created:CreateDate}" --output table || echo "  No amianai/github roles found"
echo ""

# Secrets Manager
echo "🔒 Secrets Manager:"
aws secretsmanager list-secrets --query "SecretList[?contains(Name,'amianai')].{Name:Name,LastChanged:LastChangedDate}" --output table || echo "  No amianai secrets found"
echo ""

# VPC Resources
echo "🏗️ VPC Resources:"
aws ec2 describe-vpcs --query "Vpcs[?Tags[?Key=='Project' && Value=='AmIAnAI']].{VpcId:VpcId,State:State,Tags:Tags[?Key=='Name'].Value|[0]}" --output table || echo "  No amianai VPCs found"

aws ec2 describe-nat-gateways --query "NatGateways[?Tags[?Key=='Project' && Value=='AmIAnAI']].{NatGatewayId:NatGatewayId,State:State}" --output table || echo "  No amianai NAT Gateways found"
echo ""

# RDS Instances
echo "🗃️ RDS Instances:"
aws rds describe-db-instances --query "DBInstances[?contains(DBInstanceIdentifier,'amianai')].{Instance:DBInstanceIdentifier,Status:DBInstanceStatus,Engine:Engine}" --output table || echo "  No amianai RDS instances found"
echo ""

echo "✅ Resource audit complete!"
echo ""
echo "💡 Next steps:"
echo "  1. Review what survived the destroy script"
echo "  2. Deploy v2-shared.tf to restore missing components"
echo "  3. Test website functionality"