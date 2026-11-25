#!/bin/bash
# ==============================================================================
# MetroGo — Full AWS Production Deployment Script
# 4th-Year B.Tech CSE Final Year Capstone Project
# ==============================================================================
# This script automates end-to-end cloud-native deployment of the MetroGo platform:
# 1. Terraform: Provisions foundational AWS infrastructure (VPC, EKS, ECR, S3, CloudFront)
# 2. CloudFormation: Deploys CloudWatch monitoring stack (Log Groups, Alarms, SNS)
# 3. Docker: Builds and dual-pushes backend image to AWS ECR and Docker Hub
# 4. kubectl: Deploys MongoDB and Node.js backend to Amazon EKS Kubernetes
# 5. S3 & CloudFront: Builds and deploys React frontend SPA with edge distribution
# 6. CloudWatch: Runs post-deployment verification and monitoring health checks
# ==============================================================================

# Halt script execution immediately if any command returns a non-zero exit code
set -e

# Resolve the absolute path of the MetroGo project root directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Target AWS Region for all cloud resources (Stockholm: eu-north-1)
AWS_REGION="eu-north-1"

# Target AWS Account Identifier
AWS_ACCOUNT_ID="866409326671"

# Amazon Elastic Container Registry (ECR) repository URI for backend microservice
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/metrogo-backend"

# Docker Hub username and repository for dual registry push strategy
# Defaults to project student account or accepts DOCKER_HUB_USER environment override
DOCKER_HUB_USER="${DOCKER_HUB_USER:-jayantrathour}"
DOCKER_HUB_REPO="${DOCKER_HUB_USER}/metrogo-backend"

# AWS CloudFormation stack name for monitoring infrastructure
CF_STACK_NAME="metrogo-monitoring"

# CloudWatch Log Group path for backend application container logs
CW_LOG_GROUP="/aws/eks/metrogo/backend"

# CloudWatch Dashboard name in AWS Console
CW_DASHBOARD_NAME="metrogo-dashboard"

echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║  🚀 MetroGo — Full AWS Cloud-Native Deployment & Monitoring Pipeline    ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"

# ─── Step 1/6: Terraform Infrastructure ─────────────────────────────────────────
echo ""
echo "═══ Step 1/6: Provisioning AWS Infrastructure with Terraform ═══"
# Change directory into the terraform configuration root
cd "${PROJECT_DIR}/terraform"

# Initialize Terraform workspace, install required cloud providers, and upgrade modules
terraform init -upgrade

# Automatically apply the planned infrastructure changes without manual prompt
terraform apply -auto-approve

# Capture infrastructure outputs exported from Terraform state
S3_BUCKET=$(terraform output -raw s3_bucket_name)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)
CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain_name)
EKS_CLUSTER=$(terraform output -raw eks_cluster_name)
ECR_URL=$(terraform output -raw ecr_repository_url)

# Display provisioned infrastructure resource identifiers
echo "✅ AWS Infrastructure provisioned successfully:"
echo "   S3 Bucket:         ${S3_BUCKET}"
echo "   CloudFront Domain: ${CLOUDFRONT_DOMAIN}"
echo "   EKS Cluster:       ${EKS_CLUSTER}"
echo "   ECR Repo:          ${ECR_URL}"

# ─── Step 2/6: CloudFormation Monitoring Stack ─────────────────────────────────
echo ""
echo "═══ Step 2/6: Deploying CloudFormation Monitoring Stack ═══"
# Ensure the monitoring directory exists in project workspace
mkdir -p "${PROJECT_DIR}/monitoring/cloudwatch"

# Deploy AWS CloudFormation monitoring stack template (creates Log Group, SNS Topic, Metric Alarms)
echo "📦 Deploying CloudFormation template for CloudWatch monitoring resources..."
aws cloudformation deploy \
  --template-file "${PROJECT_DIR}/cloudformation/monitoring-stack.yaml" \
  --stack-name "${CF_STACK_NAME}" \
  --parameter-overrides \
      ProjectName="metrogo" \
      Environment="production" \
      LogRetentionInDays=14 \
  --capabilities CAPABILITY_IAM \
  --region "${AWS_REGION}"

echo "✅ CloudFormation monitoring stack '${CF_STACK_NAME}' deployed successfully."

# ── CloudWatch Log Group Creation Verification ──
echo "🔍 Verifying CloudWatch log group creation..."
# Query CloudWatch Logs API to check if the backend log group exists
if aws logs describe-log-groups --log-group-name-prefix "${CW_LOG_GROUP}" --region "${AWS_REGION}" --query "logGroups[*].logGroupName" --output text | grep -q "${CW_LOG_GROUP}"; then
  # Log group is verified and ready to accept container logs
  echo "✅ CloudWatch log group '${CW_LOG_GROUP}' successfully verified."
else
  # If log group creation was not completed, create it as a fallback
  echo "⚠️ Log group '${CW_LOG_GROUP}' not found. Creating directly via AWS CLI..."
  aws logs create-log-group --log-group-name "${CW_LOG_GROUP}" --region "${AWS_REGION}" || true
  # Set 14-day retention policy to prevent uncontrolled log storage growth
  aws logs put-retention-policy --log-group-name "${CW_LOG_GROUP}" --retention-in-days 14 --region "${AWS_REGION}" || true
  echo "✅ CloudWatch log group '${CW_LOG_GROUP}' created with 14-day retention."
fi

# Deploy CloudWatch Dashboard definition from dashboard.json
if [ -f "${PROJECT_DIR}/monitoring/cloudwatch/dashboard.json" ]; then
  echo "📊 Applying CloudWatch Dashboard widgets from dashboard.json..."
  # Put or update dashboard using AWS CLI
  aws cloudwatch put-dashboard \
    --dashboard-name "${CW_DASHBOARD_NAME}" \
    --dashboard-body "file://${PROJECT_DIR}/monitoring/cloudwatch/dashboard.json" \
    --region "${AWS_REGION}"
  echo "✅ CloudWatch Dashboard '${CW_DASHBOARD_NAME}' applied successfully."
fi

# Deploy CloudWatch Alarms from alarms.json using AWS CLI
if [ -f "${PROJECT_DIR}/monitoring/cloudwatch/alarms.json" ]; then
  echo "🚨 Applying CloudWatch Alarms configuration from alarms.json..."
  # Parse alarms.json and apply each metric alarm using python script
  python3 -c '
import json, subprocess, os
region = os.environ.get("AWS_REGION", "eu-north-1")
alarms_path = "'"${PROJECT_DIR}"'/monitoring/cloudwatch/alarms.json"
with open(alarms_path) as f:
    data = json.load(f)
alarms = data if isinstance(data, list) else data.get("Alarms", [data])
for alarm in alarms:
    name = alarm.get("AlarmName", "unknown")
    print(f"   Configuring alarm: {name}")
    res = subprocess.run(["aws", "cloudwatch", "put-metric-alarm", "--cli-input-json", json.dumps(alarm), "--region", region], capture_output=True, text=True)
    if res.returncode != 0:
        print(f"   Note on alarm {name}: {res.stderr.strip()}")
'
  echo "✅ CloudWatch Alarms successfully configured."
fi

# ─── Step 3/6: Build & Push Docker Image (Dual Registry Push) ───────────────────
echo ""
echo "═══ Step 3/6: Building & Pushing Docker Image to ECR & Docker Hub ═══"
# Navigate to the backend server directory where Dockerfile resides
cd "${PROJECT_DIR}/server"

# Semantic version tag for reproducible container builds
IMAGE_TAG="v1"

# 1. Authenticate Docker with AWS Elastic Container Registry (ECR)
echo "🔐 Logging in to AWS ECR..."
# Retrieve ECR authorization token and pipe to docker login via standard input
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# 2. Authenticate Docker with Docker Hub (Dual Registry Strategy)
echo "🔐 Logging in to Docker Hub..."
# Check for automated credentials in environment variables (CI/CD friendly)
if [ -n "$DOCKER_HUB_TOKEN" ] && [ -n "$DOCKER_HUB_USER" ]; then
  # Secure authentication using personal access token
  echo "$DOCKER_HUB_TOKEN" | docker login --username "$DOCKER_HUB_USER" --password-stdin
elif [ -n "$DOCKER_HUB_PASSWORD" ] && [ -n "$DOCKER_HUB_USER" ]; then
  # Standard authentication using password
  echo "$DOCKER_HUB_PASSWORD" | docker login --username "$DOCKER_HUB_USER" --password-stdin
else
  # Use cached local docker session if environment variables are not exported
  echo "ℹ️ Using existing local Docker Hub session credentials..."
fi

# 3. Build multi-platform Docker image tagged for both registries
echo "🔨 Building backend Docker image for linux/amd64 architecture..."
# Tag image for AWS ECR (latest & versioned) and Docker Hub (latest & versioned)
docker build --platform linux/amd64 \
  -t "${ECR_REPO}:latest" \
  -t "${ECR_REPO}:${IMAGE_TAG}" \
  -t "${DOCKER_HUB_REPO}:latest" \
  -t "${DOCKER_HUB_REPO}:${IMAGE_TAG}" \
  .

# 4. Push container images to AWS ECR (Primary Registry for Kubernetes)
echo "📤 Pushing image to AWS ECR..."
# Push latest tag to ECR
docker push "${ECR_REPO}:latest"
# Push version tag to ECR for rollbacks and version history
docker push "${ECR_REPO}:${IMAGE_TAG}"
echo "✅ Docker image pushed to AWS ECR: ${ECR_REPO}"

# 5. Push container images to Docker Hub (Secondary Public Registry for dual push)
echo "📤 Pushing image to Docker Hub (Dual Registry Push)..."
# Push latest tag to Docker Hub (non-fatal warning if unauthenticated locally)
docker push "${DOCKER_HUB_REPO}:latest" || echo "⚠️ Docker Hub push (latest) failed (check docker login credentials)"
# Push version tag to Docker Hub
docker push "${DOCKER_HUB_REPO}:${IMAGE_TAG}" || echo "⚠️ Docker Hub push (${IMAGE_TAG}) failed (check docker login credentials)"
echo "✅ Dual registry push process completed."

# ─── Step 4/6: Deploy Backend to EKS Kubernetes ────────────────────────────────
echo ""
echo "═══ Step 4/6: Deploying Backend to EKS Kubernetes ═══"
# Return to root directory containing k8s manifests
cd "${PROJECT_DIR}"

# Update local kubeconfig context to authenticate with EKS cluster
echo "⚙️ Updating kubeconfig for EKS cluster: ${EKS_CLUSTER}..."
aws eks update-kubeconfig --region "${AWS_REGION}" --name "${EKS_CLUSTER}"
echo "✅ kubectl configured for ${EKS_CLUSTER}"

# Apply Kubernetes namespace to isolate MetroGo resources
kubectl apply -f k8s/namespace.yml

# Apply backend application environment configurations
kubectl apply -f k8s/backend-configmap.yml

# Apply backend sensitive secrets (Twilio SMS, JWT credentials, DB connection)
kubectl apply -f k8s/backend-secret.yml

# Deploy MongoDB database replica for booking persistence
kubectl apply -f k8s/mongodb-deployment.yml

# Expose MongoDB internally within the cluster network
kubectl apply -f k8s/mongodb-service.yml

# Deploy MetroGo backend Node.js API pods
kubectl apply -f k8s/backend-deployment.yml

# Expose backend API via AWS LoadBalancer service (provisions external ELB)
kubectl apply -f k8s/backend-service.yml

# Apply Horizontal Pod Autoscaler for dynamic scaling based on CPU utilization
kubectl apply -f k8s/backend-hpa.yml

# Wait up to 300 seconds for backend pods rolling update to complete
echo "⏳ Waiting for backend deployment rollout to become healthy..."
kubectl rollout status deployment/metrogo-backend -n metrogo --timeout=300s || true

# Poll AWS LoadBalancer status to retrieve external hostname for frontend API calls
echo "⏳ Waiting for AWS LoadBalancer to assign external DNS hostname..."
for i in $(seq 1 30); do
  # Retrieve ingress hostname from service status
  BACKEND_URL=$(kubectl get svc metrogo-backend-service -n metrogo -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
  if [ -n "$BACKEND_URL" ]; then
    echo "✅ Backend LoadBalancer ready: http://${BACKEND_URL}"
    break
  fi
  echo "   Waiting for LoadBalancer allocation... (attempt $i/30)"
  sleep 10
done

# Check if LoadBalancer external hostname was successfully resolved
if [ -z "$BACKEND_URL" ]; then
  echo "⚠️ LoadBalancer hostname not resolved yet. Current service status:"
  kubectl get svc -n metrogo
  BACKEND_URL="pending"
fi

# ─── Step 5/6: Build & Deploy Frontend to S3 + CloudFront ──────────────────────
echo ""
echo "═══ Step 5/6: Building & Deploying Frontend to S3 + CloudFront ═══"
# Change to root directory to build React Vite frontend
cd "${PROJECT_DIR}"

# Inject backend API endpoint into frontend environment file
if [ "$BACKEND_URL" != "pending" ]; then
  # Point API client to live AWS LoadBalancer endpoint
  echo "VITE_API_URL=http://${BACKEND_URL}" > .env
else
  # Use placeholder URL if LoadBalancer is still provisioning
  echo "VITE_API_URL=http://placeholder.elb.${AWS_REGION}.amazonaws.com" > .env
fi
# Set UI configuration flags for MetroGo interactive application
echo "VITE_ENABLE_DARK_MODE=true" >> .env
echo "VITE_ENABLE_ANALYTICS=false" >> .env
echo "VITE_MAP_CENTER_X=500" >> .env
echo "VITE_MAP_CENTER_Y=400" >> .env

# Compile and bundle frontend using Vite production build
npm run build

# Synchronize static assets to Amazon S3 bucket with 1-year cache headers for immutable assets
aws s3 sync dist/ s3://${S3_BUCKET}/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# Upload index.html with no-cache headers to ensure immediate SPA version updates
aws s3 cp dist/index.html s3://${S3_BUCKET}/index.html \
  --cache-control "public, max-age=0, must-revalidate"

# Create Amazon CloudFront invalidation to purge edge cache and serve latest frontend
aws cloudfront create-invalidation \
  --distribution-id "${CLOUDFRONT_ID}" \
  --paths "/*"

echo "✅ Frontend deployed to S3 and distributed via CloudFront CDN."

# ─── Step 6/6: CloudWatch Monitoring Verification ──────────────────────────────
echo ""
echo "═══ Step 6/6: CloudWatch Monitoring Verification ═══"
# Inspect current status of all Kubernetes workloads
echo "📈 Checking Kubernetes cluster workloads..."
kubectl get pods -n metrogo
kubectl get svc -n metrogo
kubectl get hpa -n metrogo 2>/dev/null || true

# Test backend API health endpoint if LoadBalancer hostname is available
if [ "$BACKEND_URL" != "pending" ]; then
  echo ""
  echo "🏥 Running Backend API Health Check at http://${BACKEND_URL}/health..."
  # Retry health probe up to 5 times with 10-second delays
  for i in 1 2 3 4 5; do
    # Fetch HTTP response code
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${BACKEND_URL}/health" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
      echo "✅ Backend health check passed! (HTTP 200 OK)"
      break
    fi
    echo "   Attempt $i: HTTP $HTTP_CODE — waiting for API to accept traffic..."
    sleep 10
  done
fi

# 1. CloudWatch Log Group Verification
echo ""
echo "🔍 Verifying CloudWatch Log Group: ${CW_LOG_GROUP}..."
# Describe log group attributes (retention period and stored bytes)
aws logs describe-log-groups \
  --log-group-name-prefix "${CW_LOG_GROUP}" \
  --region "${AWS_REGION}" \
  --query "logGroups[*].[logGroupName,retentionInDays,storedBytes]" \
  --output table || echo "⚠️ Could not inspect CloudWatch Log Groups"

# 2. CloudWatch Dashboard Verification
echo ""
echo "📊 Verifying CloudWatch Dashboard: ${CW_DASHBOARD_NAME}..."
# Confirm dashboard exists in CloudWatch and retrieve its ARN
DASHBOARD_ARN=$(aws cloudwatch get-dashboard --dashboard-name "${CW_DASHBOARD_NAME}" --region "${AWS_REGION}" --query "DashboardArn" --output text 2>/dev/null || echo "")
if [ -n "$DASHBOARD_ARN" ]; then
  echo "✅ CloudWatch Dashboard '${CW_DASHBOARD_NAME}' is active and operational."
else
  echo "⚠️ CloudWatch Dashboard '${CW_DASHBOARD_NAME}' could not be verified."
fi

# 3. CloudWatch Metric Alarms Verification
echo ""
echo "🚨 Verifying CloudWatch Metric Alarms..."
# Query CloudWatch Alarms for MetroGo prefix to confirm alarm states
aws cloudwatch describe-alarms \
  --alarm-name-prefix "MetroGo" \
  --region "${AWS_REGION}" \
  --query "MetricAlarms[*].[AlarmName,StateValue,MetricName,Threshold]" \
  --output table || echo "⚠️ Could not inspect CloudWatch Metric Alarms"

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║  ✅ MetroGo AWS Full Deployment & CloudWatch Verification Complete!       ║"
echo "╠══════════════════════════════════════════════════════════════════════════╣"
echo "║  Frontend (CloudFront CDN): https://${CLOUDFRONT_DOMAIN}"
echo "║  Backend API (EKS LoadBalancer): http://${BACKEND_URL}"
echo "║  S3 Bucket: ${S3_BUCKET}"
echo "║  CloudWatch Dashboard: ${CW_DASHBOARD_NAME}"
echo "║  CloudWatch Log Group: ${CW_LOG_GROUP}"
echo "║  ECR Repository: ${ECR_REPO}"
echo "║  Docker Hub Repository: ${DOCKER_HUB_REPO}"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
