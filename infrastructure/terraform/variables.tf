variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
}

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "dr_region" {
  description = "Disaster recovery AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "vpc_id" {
  description = "VPC ID for resource deployment"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for database deployment"
  type        = list(string)
}

variable "app_security_group_id" {
  description = "Security group ID for application servers"
  type        = string
}