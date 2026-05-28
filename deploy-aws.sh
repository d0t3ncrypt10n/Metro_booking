#!/bin/bash
# ============================================
# MetroGo — Full AWS Deployment Script
# ============================================
# This script deploys the entire MetroGo stack:
# 1. Terraform: VPC, EKS, ECR, S3, CloudFront
# 2. Docker: Build & push backend to ECR
# 3. K8s: Deploy backend + MongoDB to EKS
# 4. S3/CloudFront: Deploy frontend
# ============================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
AWS_REGION="eu-north-1"
AWS_ACCOUNT_ID="482531072638"
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/metrogo-backend"

echo "╔══════════════════════════════════════════════╗"
echo "║  🚀 MetroGo — Full AWS Deployment            ║"
echo "╚══════════════════════════════════════════════╝"

# ─── Step 1: Terraform Infrastructure ─────────
echo ""
echo "═══ Step 1/6: Provisioning AWS Infrastructure with Terraform ═══"
cd "${PROJECT_DIR}/terraform"
terraform init -upgrade
terraform apply -auto-approve

# Capture outputs
S3_BUCKET=$(terraform output -raw s3_bucket_name)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)
CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain_name)
EKS_CLUSTER=$(terraform output -raw eks_cluster_name)
ECR_URL=$(terraform output -raw ecr_repository_url)

echo "✅ Infrastructure provisioned"
echo "   S3 Bucket: ${S3_BUCKET}"
echo "   CloudFront: ${CLOUDFRONT_DOMAIN}"
echo "   EKS Cluster: ${EKS_CLUSTER}"
echo "   ECR Repo: ${ECR_URL}"

# ─── Step 2: Configure kubectl ────────────────
echo ""
echo "═══ Step 2/6: Configuring kubectl for EKS ═══"
aws eks update-kubeconfig --region ${AWS_REGION} --name ${EKS_CLUSTER}
echo "✅ kubectl configured for ${EKS_CLUSTER}"

# ─── Step 3: Build & Push Docker Image ────────
echo ""
echo "═══ Step 3/6: Building & Pushing Docker Image to ECR ═══"
cd "${PROJECT_DIR}/server"

# Login to ECR
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build and push
docker build --platform linux/amd64 -t ${ECR_REPO}:latest -t ${ECR_REPO}:v1 .
docker push ${ECR_REPO}:latest
docker push ${ECR_REPO}:v1
echo "✅ Docker image pushed to ECR"

# ─── Step 4: Deploy Backend to EKS ───────────
echo ""
echo "═══ Step 4/6: Deploying Backend to EKS Kubernetes ═══"
cd "${PROJECT_DIR}"

# Apply K8s manifests
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/backend-configmap.yml
kubectl apply -f k8s/backend-secret.yml
kubectl apply -f k8s/mongodb-deployment.yml
kubectl apply -f k8s/mongodb-service.yml
kubectl apply -f k8s/backend-deployment.yml
kubectl apply -f k8s/backend-service.yml
kubectl apply -f k8s/backend-hpa.yml

echo "⏳ Waiting for backend deployment to be ready..."
kubectl rollout status deployment/metrogo-backend -n metrogo --timeout=300s || true

echo "⏳ Waiting for LoadBalancer to get an external IP..."
for i in $(seq 1 30); do
  BACKEND_URL=$(kubectl get svc metrogo-backend-service -n metrogo -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
  if [ -n "$BACKEND_URL" ]; then
    echo "✅ Backend LoadBalancer: http://${BACKEND_URL}"
    break
  fi
  echo "   Waiting for LB... (attempt $i/30)"
  sleep 10
done

if [ -z "$BACKEND_URL" ]; then
  echo "⚠️ LoadBalancer not ready yet. Checking service status..."
  kubectl get svc -n metrogo
  BACKEND_URL="pending"
fi

# ─── Step 5: Build & Deploy Frontend ─────────
echo ""
echo "═══ Step 5/6: Building & Deploying Frontend to S3 + CloudFront ═══"
cd "${PROJECT_DIR}"

# Update .env with the backend LB URL
if [ "$BACKEND_URL" != "pending" ]; then
  echo "VITE_API_URL=http://${BACKEND_URL}" > .env
else
  echo "VITE_API_URL=http://placeholder.elb.eu-north-1.amazonaws.com" > .env
fi
echo "VITE_ENABLE_DARK_MODE=true" >> .env
echo "VITE_ENABLE_ANALYTICS=false" >> .env
echo "VITE_MAP_CENTER_X=500" >> .env
echo "VITE_MAP_CENTER_Y=400" >> .env

# Build frontend
npm run build

# Sync to S3
aws s3 sync dist/ s3://${S3_BUCKET}/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

aws s3 cp dist/index.html s3://${S3_BUCKET}/index.html \
  --cache-control "public, max-age=0, must-revalidate"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id ${CLOUDFRONT_ID} \
  --paths "/*"

echo "✅ Frontend deployed to CloudFront"

# ─── Step 6: Health Check ─────────────────────
echo ""
echo "═══ Step 6/6: Post-Deployment Verification ═══"
kubectl get pods -n metrogo
kubectl get svc -n metrogo
kubectl get hpa -n metrogo 2>/dev/null || true

if [ "$BACKEND_URL" != "pending" ]; then
  echo ""
  echo "🏥 Running health check..."
  for i in 1 2 3 4 5; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${BACKEND_URL}/health" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
      echo "✅ Backend health check passed!"
      break
    fi
    echo "   Attempt $i: HTTP $HTTP_CODE — waiting..."
    sleep 10
  done
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ MetroGo Deployment Complete!              ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Frontend: https://${CLOUDFRONT_DOMAIN}       "
echo "║  Backend:  http://${BACKEND_URL}               "
echo "║  S3:       ${S3_BUCKET}                        "
echo "╚══════════════════════════════════════════════╝"
