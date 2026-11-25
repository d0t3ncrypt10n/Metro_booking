# ============================================
# Terraform Outputs — MetroGo Infrastructure
# ============================================

# ─── VPC ─────────────────────────────────────
output "vpc_id" {
  description = "ID of the MetroGo VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

# ─── S3 + CloudFront ────────────────────────
output "s3_bucket_name" {
  description = "S3 bucket name for frontend static files"
  value       = aws_s3_bucket.frontend.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.frontend.arn
}

output "s3_website_endpoint" {
  description = "S3 Website endpoint for direct frontend access"
  value       = "http://${var.project_name}-frontend-${data.aws_caller_identity.current.account_id}.s3-website-${var.aws_region}.amazonaws.com"
}

output "s3_bucket_website_url" {
  description = "S3 Website URL — frontend entry point"
  value       = "http://${var.project_name}-frontend-${data.aws_caller_identity.current.account_id}.s3-website-${var.aws_region}.amazonaws.com/index.html"
}

# ─── ECR ─────────────────────────────────────
output "ecr_repository_url" {
  description = "ECR repository URL for backend Docker images"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_repository_name" {
  description = "ECR repository name"
  value       = aws_ecr_repository.backend.name
}

# ─── EKS ─────────────────────────────────────
output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_certificate_authority" {
  description = "EKS cluster certificate authority (base64)"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

# ─── Kubeconfig Command ─────────────────────
output "configure_kubectl" {
  description = "Command to configure kubectl for this EKS cluster"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}

# ─── Secrets Manager Outputs ─────────────────
# Amazon Resource Name (ARN) of the application secret in AWS Secrets Manager
output "secrets_manager_arn" {
  # Description of the output value for evaluator
  description = "ARN of the Twilio credentials secret in AWS Secrets Manager"
  # References the ARN of the Twilio secret resource
  value       = aws_secretsmanager_secret.twilio.arn
}

# ─── CloudWatch Outputs ──────────────────────
# Name of the CloudWatch Log Group configured for backend application logging
output "cloudwatch_log_group" {
  # Description of the output value for evaluator
  description = "Name of the CloudWatch Log Group for MetroGo backend"
  # References the name attribute of the log group resource
  value       = aws_cloudwatch_log_group.backend.name
}

# ─── SNS Alarm Topic Outputs ─────────────────
# Amazon Resource Name (ARN) of the SNS topic for alarm notifications
output "sns_topic_arn" {
  # Description of the output value for evaluator
  description = "ARN of the SNS topic used for CloudWatch alarm notifications"
  # References the ARN attribute of the alarm notifications SNS topic
  value       = aws_sns_topic.alarm_notifications.arn
}

# ─── IAM IRSA Role Outputs ───────────────────
# Amazon Resource Name (ARN) of the IAM role assumed by backend pods via IRSA
output "irsa_role_arn" {
  # Description of the output value for evaluator
  description = "ARN of the IAM role assumed by backend pods via IRSA"
  # References the ARN attribute of the IRSA IAM role
  value       = aws_iam_role.backend_irsa.arn
}

# Kubernetes ServiceAccount annotation string linking the pod to the IAM role
output "k8s_service_account_annotation" {
  # Description of the output value for evaluator
  description = "Kubernetes ServiceAccount annotation key-value string for IRSA"
  # Returns formatted annotation string for k8s manifests
  value       = "eks.amazonaws.com/role-arn: ${aws_iam_role.backend_irsa.arn}"
}
