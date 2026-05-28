# ============================================
# Terraform Main — MetroGo AWS Infrastructure
# ============================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }

  # Remote state storage (optional — uncomment for team use)
  # backend "s3" {
  #   bucket         = "metrogo-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "ap-south-1"
  #   encrypt        = true
  #   dynamodb_table = "metrogo-terraform-locks"
  # }
}

# ─── AWS Provider ────────────────────────────
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(var.common_tags, {
      Environment = var.environment
    })
  }
}

# ─── Data Sources ────────────────────────────
data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}
