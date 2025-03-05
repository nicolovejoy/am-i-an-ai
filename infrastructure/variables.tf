variable "aws_region" {
  description = "AWS region for most resources"
  type        = string
  default     = "us-west-2"
}

variable "domain_name" {
  description = "The domain name for the website"
  type        = string
  default     = "amianai.com"
}

variable "environment" {
  description = "Environment (dev/staging/prod)"
  type        = string
  default     = "prod"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "amianai"
    Environment = "prod"
    Terraform   = "true"
  }
} 