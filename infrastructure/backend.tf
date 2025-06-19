terraform {
  backend "s3" {
    bucket         = "amianai-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    use_lockfile   = true
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
