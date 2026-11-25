output "vpc_id" {
  value = aws_vpc.main.id
}

output "s3_bucket_name" {
  value = aws_s3_bucket.frontend.id
}

output "s3_website_endpoint" {
  value = "http://${var.project_name}-frontend-${data.aws_caller_identity.current.account_id}.s3-website-${var.aws_region}.amazonaws.com"
}

output "ecr_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "eks_cluster_name" {
  value = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}

output "configure_kubectl" {
  value = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}