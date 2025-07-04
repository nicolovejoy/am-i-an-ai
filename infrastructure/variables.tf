variable "aws_region" {
  description = "AWS region for most resources"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "The domain name for the website"
  type        = string
  default     = "robotorchestra.org"
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

variable "github_username" {
  type        = string
  description = "GitHub username for the repository"
  default     = "nicolovejoy"  

}

variable "project_name" {
  description = "The name of the project, used for resource naming"
  type        = string
  default     = "eeyore"
}

variable "openai_api_key" {
  description = "OpenAI API key for AI persona responses"
  type        = string
  sensitive   = true
}