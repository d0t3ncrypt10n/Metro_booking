variable "aws_region" {
  type    = string
  default = "eu-north-1"
}

variable "project_name" {
  type    = string
  default = "metrogo"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "availability_zones" {
  type    = list(string)
  default = ["eu-north-1a", "eu-north-1b"]
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "eks_cluster_version" {
  type    = string
  default = "1.31"
}

variable "eks_node_instance_type" {
  type    = string
  default = "t3.small"
}

variable "eks_node_desired_count" {
  type    = number
  default = 2
}

variable "eks_node_min_count" {
  type    = number
  default = 2
}

variable "eks_node_max_count" {
  type    = number
  default = 4
}

variable "common_tags" {
  type    = map(string)
  default = {
    Project     = "MetroGo"
    ManagedBy   = "Terraform"
    Application = "Metro Booking Service"
  }
}