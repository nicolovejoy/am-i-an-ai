terraform {
  backend "s3" {
    bucket = "amianai-terraform-state"
    key    = "terraform.tfstate"
    region = "us-east-1"
    
    # Enable state locking
    dynamodb_table = "amianai-terraform-state-lock"
  }
} 