# V2 Shared Infrastructure - Minimal Required Components
# Only deploys what v2 actually needs (no expensive v1 backend)

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "us-east-1"
}

# Local variables
locals {
  project_name = "amianai"
  domain_name  = var.domain_name
  tags = {
    Project     = "AmIAnAI"
    Environment = "production"
    Version     = "v2"
  }
}

############################
# S3 + CloudFront (Frontend Hosting)
############################

# S3 bucket for website hosting
resource "aws_s3_bucket" "website" {
  bucket        = local.domain_name
  force_destroy = true
  tags          = local.tags
}

# S3 bucket ownership controls
resource "aws_s3_bucket_ownership_controls" "website" {
  bucket = aws_s3_bucket.website.id
  
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# S3 bucket public access block configuration
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 bucket website configuration
resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document { suffix = "index.html" }
  error_document { key    = "index.html" }
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "website" {
  comment = "OAI for ${local.domain_name}"
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "website" {
  enabled             = true
  is_ipv6_enabled    = true
  default_root_object = "index.html"
  aliases            = [local.domain_name]
  
  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.website.bucket}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.website.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.website.bucket}"
    viewer_protocol_policy = "redirect-to-https"
    compress              = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Custom error responses for SPA routing
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.website.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = local.tags
}

# S3 bucket policy for CloudFront
resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.website.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.website.arn}/*"
      }
    ]
  })
}

############################
# SSL Certificate + DNS
############################

# DNS zone data source (existing)
data "aws_route53_zone" "website" {
  name = local.domain_name
}

# SSL certificate
resource "aws_acm_certificate" "website" {
  domain_name       = local.domain_name
  validation_method = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }

  tags = local.tags
}

# Certificate validation records
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.website.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.website.zone_id
}

# Certificate validation
resource "aws_acm_certificate_validation" "website" {
  certificate_arn         = aws_acm_certificate.website.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# Website DNS record
resource "aws_route53_record" "website" {
  zone_id = data.aws_route53_zone.website.zone_id
  name    = local.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

############################
# GitHub Actions OIDC
############################

# GitHub OIDC Provider
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
  
  client_id_list = ["sts.amazonaws.com"]
  
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1"
  ]
  
  tags = local.tags
}

# GitHub Actions Role
resource "aws_iam_role" "github_actions" {
  name = "github-actions"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${aws_iam_openid_connect_provider.github.url}:aud": "sts.amazonaws.com"
          }
          StringLike = {
            "${aws_iam_openid_connect_provider.github.url}:sub": "repo:nicolovejoy/am-i-an-ai:*"
          }
        }
      }
    ]
  })
  
  tags = local.tags
}

# GitHub Actions Policy
resource "aws_iam_role_policy" "github_actions" {
  name = "github-actions-deploy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.website.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.website.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation",
          "cloudfront:ListInvalidations"
        ]
        Resource = aws_cloudfront_distribution.website.arn
      }
    ]
  })
}

############################
# Cognito Authentication  
############################

resource "aws_cognito_user_pool" "main" {
  name = "${local.project_name}-user-pool"
  
  username_attributes = ["email"]
  
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }
  
  auto_verified_attributes = ["email"]
  
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "AmIAnAI Verification Code"
    email_message        = "Your AmIAnAI verification code is {####}"
  }
  
  tags = local.tags
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "auth-amianai"
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${local.project_name}-client"
  user_pool_id = aws_cognito_user_pool.main.id
  
  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}

# Cognito User Pool Groups
resource "aws_cognito_user_group" "admin" {
  name         = "admin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Admin users with full platform access"
  precedence   = 1
}

resource "aws_cognito_user_group" "user" {
  name         = "user"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Regular users"
  precedence   = 10
}

############################
# Outputs
############################

output "website_url" {
  description = "Website URL"
  value       = "https://${local.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.website.id
}

output "s3_bucket" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.website.bucket
}

output "github_actions_role_arn" {
  value       = aws_iam_role.github_actions.arn
  description = "ARN of the GitHub Actions role"
}

output "cognito_user_pool_id" {
  description = "The ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "The ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.main.id
}

output "cognito_domain" {
  description = "The domain of the Cognito User Pool"
  value       = aws_cognito_user_pool_domain.main.domain
}