#!/bin/bash
# AWS Resource Audit Script - Complete inventory

echo "🔍 AWS Resource Audit - $(date)"
echo "================================================"

# Basic account info
echo ""
echo "📋 Account Information:"
aws sts get-caller-identity --query '{Account: Account, UserId: UserId, Arn: Arn}' --output table

# S3 buckets
echo ""
echo "🗂️  S3 Buckets:"
aws s3api list-buckets --query 'Buckets[*].{Name: Name, Created: CreationDate}' --output table

# DynamoDB tables
echo ""
echo "🗄️  DynamoDB Tables:"
aws dynamodb list-tables --query 'TableNames' --output table

# Lambda functions
echo ""
echo "⚡ Lambda Functions:"
aws lambda list-functions --query 'Functions[*].{Name: FunctionName, Runtime: Runtime, LastModified: LastModified}' --output table

# API Gateway
echo ""
echo "🌐 API Gateway (v1 REST APIs):"
aws apigateway get-rest-apis --query 'items[*].{Name: name, Id: id, CreatedDate: createdDate}' --output table

echo ""
echo "🌐 API Gateway (v2 WebSocket/HTTP):"
aws apigatewayv2 get-apis --query 'Items[*].{Name: Name, ApiId: ApiId, ProtocolType: ProtocolType, CreatedDate: CreatedDate}' --output table

# CloudFront distributions
echo ""
echo "🌍 CloudFront Distributions:"
aws cloudfront list-distributions --query 'DistributionList.Items[*].{Id: Id, DomainName: DomainName, Status: Status, Aliases: Aliases.Items[0]}' --output table

# Route53 hosted zones
echo ""
echo "🌐 Route53 Hosted Zones:"
aws route53 list-hosted-zones --query 'HostedZones[*].{Name: Name, Id: Id, ResourceRecordSetCount: ResourceRecordSetCount}' --output table

# Cognito User Pools
echo ""
echo "👥 Cognito User Pools:"
aws cognito-idp list-user-pools --max-items 60 --query 'UserPools[*].{Name: Name, Id: Id, CreationDate: CreationDate}' --output table

# ACM Certificates
echo ""
echo "🔐 SSL Certificates (ACM):"
aws acm list-certificates --query 'CertificateSummaryList[*].{DomainName: DomainName, CertificateArn: CertificateArn, Status: Status}' --output table

# VPCs
echo ""
echo "🏗️  VPCs:"
aws ec2 describe-vpcs --query 'Vpcs[*].{VpcId: VpcId, CidrBlock: CidrBlock, State: State, IsDefault: IsDefault, Tags: Tags[?Key==`Name`].Value|[0]}' --output table

# NAT Gateways
echo ""
echo "🌉 NAT Gateways:"
aws ec2 describe-nat-gateways --query 'NatGateways[*].{NatGatewayId: NatGatewayId, State: State, VpcId: VpcId, SubnetId: SubnetId, Tags: Tags[?Key==`Name`].Value|[0]}' --output table

# Elastic IPs
echo ""
echo "📍 Elastic IP Addresses:"
aws ec2 describe-addresses --query 'Addresses[*].{AllocationId: AllocationId, PublicIp: PublicIp, Domain: Domain, AssociationId: AssociationId, Tags: Tags[?Key==`Name`].Value|[0]}' --output table

# RDS instances
echo ""
echo "🗃️  RDS Instances:"
aws rds describe-db-instances --query 'DBInstances[*].{DBInstanceIdentifier: DBInstanceIdentifier, DBInstanceStatus: DBInstanceStatus, Engine: Engine, DBInstanceClass: DBInstanceClass}' --output table

# CloudTrail
echo ""
echo "📋 CloudTrail:"
aws cloudtrail describe-trails --query 'trailList[*].{Name: Name, S3BucketName: S3BucketName, IsLogging: IsLogging}' --output table

# IAM roles (limited to avoid clutter)
echo ""
echo "🔑 IAM Roles (project-related):"
aws iam list-roles --query 'Roles[?contains(RoleName, `amianai`) || contains(RoleName, `robot`) || contains(RoleName, `eeyore`)].{RoleName: RoleName, CreateDate: CreateDate}' --output table

# EC2 instances
echo ""
echo "💻 EC2 Instances:"
aws ec2 describe-instances --query 'Reservations[*].Instances[*].{InstanceId: InstanceId, State: State.Name, InstanceType: InstanceType, Tags: Tags[?Key==`Name`].Value|[0]}' --output table

echo ""
echo "================================================"
echo "✅ Audit Complete - $(date)"
echo ""
echo "💰 Cost Impact Summary:"
echo "- NAT Gateways: \$45/month each"
echo "- RDS instances: \$15-50/month depending on size"
echo "- Elastic IPs (unattached): \$3.65/month each"
echo "- CloudFront/Route53/Lambda: Pay-per-use (minimal)"
echo ""