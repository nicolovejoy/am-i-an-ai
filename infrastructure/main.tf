# RobotOrchestra - Clean Infrastructure
# DynamoDB + Lambda 

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Get current AWS region
data "aws_region" "current" {}

locals {
  project_name = var.project_name
  
  tags = merge(var.tags, {
    Version = "2.0"
    Purpose = "kafka-event-driven-conversations"
  })
}

############################
# AUTHENTICATION (Cognito)
############################

# Cognito User Pool for authentication
resource "aws_cognito_user_pool" "main" {
  name = "${local.project_name}-users"

  # Password policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }

  # Allow email as username
  username_attributes = ["email"]
  
  # Auto-verify email
  auto_verified_attributes = ["email"]

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = local.tags
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "main" {
  name         = "${local.project_name}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Client settings
  generate_secret = false
  
  # Auth flows
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  # Token validity
  access_token_validity  = 24   # hours
  id_token_validity     = 24   # hours
  refresh_token_validity = 30  # days

  token_validity_units {
    access_token  = "hours"
    id_token     = "hours"
    refresh_token = "days"
  }

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"
}

############################
# DynamoDB Table (Legacy - will be phased out)
############################

resource "aws_dynamodb_table" "matches" {
  name           = "${local.project_name}-matches"
  billing_mode   = "PAY_PER_REQUEST"  # Serverless pricing
  hash_key       = "matchId"
  range_key      = "timestamp"

  attribute {
    name = "matchId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  # TTL for automatic match cleanup (30 days)
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = local.tags
}

############################
# SECRETS MANAGER FOR API KEYS
############################

# OpenAI API Key Secret
resource "aws_secretsmanager_secret" "openai_api_key" {
  name        = "${local.project_name}-openai-api-key"
  description = "OpenAI API key for AI robot participants"
  
  tags = local.tags
}

# Store the OpenAI API key value
resource "aws_secretsmanager_secret_version" "openai_api_key" {
  secret_id     = aws_secretsmanager_secret.openai_api_key.id
  secret_string = var.openai_api_key
}

############################
# Outputs
############################

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.matches.name
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

# Frontend outputs
output "website_url" {
  description = "The website URL"
  value       = "https://${var.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "The CloudFront distribution ID"
  value       = aws_cloudfront_distribution.website.id
}

output "s3_bucket_name" {
  description = "The S3 bucket name for the website"
  value       = aws_s3_bucket.website.id
}

output "route53_zone_id" {
  description = "The Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_nameservers" {
  description = "Name servers for the Route 53 hosted zone"
  value       = aws_route53_zone.main.name_servers
}

output "cloudtrail_name" {
  description = "CloudTrail trail name"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_s3_bucket" {
  description = "S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail.bucket
}