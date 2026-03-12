terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {
    bucket         = "lotus-pil-terraform-state"
    key            = "audit/terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "PIL-Creation-Platform"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  }
}

# Provider for DR region
provider "aws" {
  alias  = "dr_region"
  region = var.dr_region

  default_tags {
    tags = {
      Project     = "PIL-Creation-Platform"
      ManagedBy   = "Terraform"
      Environment = var.environment
      Purpose     = "Disaster-Recovery"
    }
  }
}