# MetroGo DevOps Deployment Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [DevOps Tools Used](#devops-tools-used)
3. [File Structure](#file-structure)
4. [Local Development](#local-development-docker-compose)
5. [AWS Infrastructure (Terraform)](#phase-2-production-deployment-terraform)
6. [Docker & ECR](#step-2-build--push-docker-image-to-ecr)
7. [Kubernetes Deployment](#step-3-deploy-to-kubernetes-eks)
8. [Frontend Deployment](#step-4-build--deploy-frontend)
9. [Jenkins CI/CD](#phase-3-cicd-with-jenkins)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           METROGO FULL STACK                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐    │
│  │   FRONTEND       │     │   BACKEND        │     │   DATABASE       │    │
│  │   React+Vite     │────▶│   Node.js/Expr   │────▶│   MongoDB        │    │
│  │   (Static Files) │     │   (Port 3000)    │     │   (Port 27017)   │    │
│  └────────┬─────────┘     └────────┬─────────┘     └──────────────────┘    │
│           │                          │                                        │
│           ▼                          │                                        │
│  ┌──────────────────┐     ┌────────┴─────────┐                              │
│  │   CLOUDFRONT CDN │     │   PROMETHEUS     │                              │
│  │   (AWS S3)       │     │   (Metrics)      │                              │
│  └──────────────────┘     └────────┬─────────┘                              │
│                                      │                                        │
│                                      ▼                                        │
│                           ┌──────────────────┐                               │
│                           │   GRAFANA        │                               │
│                           │   (Dashboards)   │                               │
│                           └──────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────────┘

DEVENVMENT WORKFLOW:
Code ──▶ Docker Build ──▶ Push to ECR ──▶ Deploy to EKS ──▶ Monitor
                │                                              │
                └──────── docker-compose (Local) ─────────────┘
```

---

## DevOps Tools Used

| Tool | Purpose | Configuration File |
|------|---------|---------------------|
| **Docker** | Containerize backend | `server/Dockerfile` |
| **Docker Compose** | Local development stack | `docker-compose.yml` |
| **Prometheus** | Metrics collection | `monitoring/prometheus/prometheus.yml` |
| **Grafana** | Dashboards & visualization | `monitoring/grafana/provisioning/` |
| **Kubernetes (EKS)** | Container orchestration | `k8s/*.yml` |
| **Terraform** | Infrastructure as Code | `terraform/*.tf` |
| **Jenkins** | CI/CD automation | `Jenkinsfile` |

---

## File Structure

```
Metro_booking/
├── server/
│   ├── Dockerfile                 # Multi-stage Docker build
│   ├── .dockerignore              # Exclude files from Docker
│   ├── package.json               # Includes prom-client
│   └── src/
│       └── app.js                 # Prometheus metrics instrumentation
│
├── docker-compose.yml             # Local development stack
│
├── k8s/                           # Kubernetes manifests
│   ├── namespace.yml              # metrogo namespace
│   ├── backend-deployment.yml    # Backend pods (2 replicas)
│   ├── backend-service.yml       # LoadBalancer service
│   ├── backend-hpa.yml            # Auto-scaling (2-10 pods)
│   ├── backend-configmap.yml      # Environment variables
│   ├── backend-secret.yml         # Sensitive credentials
│   ├── mongodb-deployment.yml    # MongoDB StatefulSet
│   ├── mongodb-service.yml       # MongoDB internal service
│   ├── prometheus-deployment.yml # In-cluster Prometheus
│   └── grafana-deployment.yml    # In-cluster Grafana
│
├── terraform/                     # AWS infrastructure
│   ├── main.tf                    # Provider configuration
│   ├── variables.tf               # Input variables
│   ├── terraform.tfvars           # Variable values
│   ├── outputs.tf                 # Output values
│   ├── vpc.tf                     # VPC, subnets, NAT, routes
│   ├── eks.tf                     # EKS cluster & node group
│   ├── ecr.tf                     # ECR repository
│   ├── s3-cloudfront.tf          # S3 + CloudFront CDN
│   └── security-groups.tf         # Security groups
│
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml         # Prometheus scrape config
│   └── grafana/
│       ├── provisioning/
│       │   ├── datasources/prometheus.yml
│       │   └── dashboards/dashboard.yml
│       └── dashboards/
│           └── metrogo-dashboard.json
│
└── Jenkinsfile                    # CI/CD pipeline (8 stages)
```

---

## Local Development (Docker Compose)

### Start All Services

Run from project root (`/home/nexus/Documents/Metro_booking`):

```bash
docker compose up -d
```

### Check Status

```bash
docker compose ps
```

### View Logs

```bash
docker compose logs -f
```

### Stop All Services

```bash
docker compose down
```

### Access URLs (Local)

| Service | URL | Credentials |
|---------|-----|--------------|
| Backend API | http://localhost:3000 | - |
| Health Check | http://localhost:3000/health | - |
| Metrics | http://localhost:3000/metrics | - |
| Prometheus | http://localhost:9090 | - |
| Grafana | http://localhost:3001 | admin / metrogo2026 |

---

## Phase 2: Production Deployment (Terraform)

### Step 1: Create AWS Infrastructure

Run from `/terraform` directory:

```bash
cd terraform

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Preview what will be created
terraform plan

# Create all AWS resources
terraform apply -auto-approve

# Save output values
terraform output
```

### What Terraform Creates

| Resource | Description |
|----------|-------------|
| VPC | 10.0.0.0/16 with public/private subnets |
| NAT Gateway | For private subnet internet access |
| EKS Cluster | Kubernetes 1.29, t3.medium nodes |
| Node Group | 2-4 EC2 instances |
| ECR Repository | Docker image storage |
| S3 Bucket | Frontend static files |
| CloudFront CDN | Global content delivery |
| Security Groups | Network access rules |

### Important Outputs

After `terraform apply`, note these values:

```
frontend_url = https://<cloudfront-id>.cloudfront.net
ecr_repository_url = <account-id>.dkr.ecr.ap-south-1.amazonaws.com/metrogo-backend
eks_cluster_endpoint = https://<endpoint>.eks.amazonaws.com
configure_kubectl = aws eks update-kubeconfig --region ap-south-1 --name metrogo-eks
```

---

## Step 2: Build & Push Docker Image to ECR

Run from project root:

```bash
# 1. Login to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com

# 2. Build Docker image
docker build -t metrogo-backend ./server

# 3. Tag image for ECR (replace <ACCOUNT_ID>)
docker tag metrogo-backend:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/metrogo-backend:latest

# 4. Push to ECR
docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/metrogo-backend:latest
```

---

## Step 3: Deploy to Kubernetes (EKS)

### Configure kubectl

```bash
aws eks update-kubeconfig --region ap-south-1 --name metrogo-eks
```

### Deploy All K8s Manifests

```bash
kubectl apply -f k8s/
```

### Check Deployment Status

```bash
# All pods
kubectl get pods -n metrogo

# Services
kubectl get svc -n metrogo

# Auto-scaler
kubectl get hpa -n metrogo

# Backend logs
kubectl logs -n metrogo -l app=metrogo -c metrogo-backend

# Rolling status
kubectl rollout status deployment/metrogo-backend -n metrogo
```

### Update Running Deployment (Rolling Update)

```bash
# Update image tag
kubectl set image deployment/metrogo-backend metrogo-backend=<ECR_URL>:<VERSION> -n metrogo

# Check rollout status
kubectl rollout status deployment/metrogo-backend -n metrogo
```

---

## Step 4: Build & Deploy Frontend

### Install & Build

```bash
# Install dependencies
npm ci

# Build for production
npm run build
```

### Deploy to S3

```bash
# Upload to S3 (replace <BUCKET_NAME>)
aws s3 sync dist/ s3://<BUCKET_NAME>/ --delete
```

### Invalidate CloudFront Cache

```bash
# Invalidate cache (replace <DISTRIBUTION_ID>)
aws cloudfront create-invalidation --distribution-id <DISTRIBUTION_ID> --paths "/*"
```

---

## Phase 3: CI/CD with Jenkins

### Prerequisites

1. Jenkins installed (Docker or EC2)
2. Required plugins: Pipeline, AWS Steps, Kubernetes CLI
3. Credentials configured in Jenkins

### Required Credentials

| Credential ID | Description |
|---------------|-------------|
| `aws-account-id` | AWS Access Key ID |
| `aws-secret-access-key` | AWS Secret Access Key |
| `metrogo-s3-bucket` | S3 Bucket Name |
| `metrogo-cloudfront-id` | CloudFront Distribution ID |

### Jenkins Pipeline Stages

The `Jenkinsfile` contains 8 stages:

1. **Source Code Fetch** — Checkout from GitHub
2. **Dependency Install & Lint** — npm install + tsc --noEmit
3. **Frontend Tests** — npm run test (Vitest)
4. **Production Build** — npm run build (Vite → dist/)
5. **Dockerize Backend** — Build & push to ECR
6. **Frontend Deploy** — S3 sync + CloudFront invalidation
7. **Backend Deploy** — kubectl apply + rolling update
8. **Monitoring Check** — Health check + Prometheus verify

### Create Jenkins Job

1. New Item → Pipeline
2. GitHub repository URL
3. Script from SCM (Jenkinsfile)
4. Add credentials
5. Build

---

## How Each File Works

### Docker Files

| File | Purpose |
|------|---------|
| `server/Dockerfile` | Multi-stage build: builder stage installs deps, production stage copies only needed files, runs as non-root user |
| `server/.dockerignore` | Excludes node_modules, .env, .git from Docker context |
| `docker-compose.yml` | Orchestrates: mongo → backend → prometheus → grafana with health checks and volumes |

### Kubernetes Files

| File | Purpose |
|------|---------|
| `k8s/namespace.yml` | Creates `metrogo` namespace |
| `k8s/backend-deployment.yml` | 2 replicas, rolling update, liveness/readiness probes, resource limits |
| `k8s/backend-service.yml` | LoadBalancer exposing port 80 → 3000 |
| `k8s/backend-hpa.yml` | Auto-scale 2-10 pods at 70% CPU |
| `k8s/backend-configmap.yml` | Non-sensitive env vars (NODE_ENV, PORT, OTP_EXPIRY_SECONDS) |
| `k8s/backend-secret.yml` | Sensitive data (JWT_SECRET, TWILIO_*, MONGODB_URI) |
| `k8s/mongodb-deployment.yml` | StatefulSet with 5Gi PVC |
| `k8s/mongodb-service.yml` | ClusterIP service (internal only) |
| `k8s/prometheus-deployment.yml` | 6 resources: ConfigMap, Deployment, Service, ServiceAccount, ClusterRole, ClusterRoleBinding |
| `k8s/grafana-deployment.yml` | 5 resources: Deployment, Service, 3 ConfigMaps |

### Terraform Files

| File | Purpose |
|------|---------|
| `terraform/main.tf` | Provider config, Terraform settings |
| `terraform/variables.tf` | Input variables with defaults |
| `terraform/terraform.tfvars` | Actual values (region, instance types) |
| `terraform/outputs.tf` | Shows: frontend URL, ECR URL, EKS endpoint |
| `terraform/vpc.tf` | VPC, subnets, NAT gateway, route tables |
| `terraform/eks.tf` | EKS cluster + managed node group |
| `terraform/ecr.tf` | ECR repository + lifecycle policy |
| `terraform/s3-cloudfront.tf` | S3 bucket + CloudFront distribution |
| `terraform/security-groups.tf` | EKS cluster & node security groups |

### Monitoring Files

| File | Purpose |
|------|---------|
| `monitoring/prometheus/prometheus.yml` | Scrape backend /metrics every 15s |
| `monitoring/grafana/provisioning/datasources/prometheus.yml` | Auto-provision Prometheus datasource |
| `monitoring/grafana/provisioning/dashboards/dashboard.yml` | Auto-provision dashboard provider |
| `monitoring/grafana/dashboards/metrogo-dashboard.json` | Pre-built dashboard: request rate, latency, OTP, sessions |

---

## Quick Reference Commands

| Step | Command | Where |
|------|---------|-------|
| Local Dev | `docker compose up -d` | Project root |
| Terraform Init | `terraform init` | `/terraform` |
| Terraform Plan | `terraform plan` | `/terraform` |
| Terraform Apply | `terraform apply -auto-approve` | `/terraform` |
| Terraform Output | `terraform output` | `/terraform` |
| Docker Build | `docker build -t metrogo-backend ./server` | Project root |
| ECR Push | `docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/metrogo-backend:latest` | Project root |
| Configure kubectl | `aws eks update-kubeconfig --region ap-south-1 --name metrogo-eks` | Project root |
| K8s Deploy | `kubectl apply -f k8s/` | Project root |
| Frontend Build | `npm run build` | Project root |
| S3 Sync | `aws s3 sync dist/ s3://<BUCKET_NAME>/ --delete` | Project root |
| CloudFront Invalidate | `aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"` | Project root |

---

## Troubleshooting

### Docker

```bash
# Remove all containers
docker compose down -v

# Rebuild from scratch
docker compose build --no-cache
docker compose up -d
```

### Kubernetes

```bash
# Check pod logs
kubectl logs <pod-name> -n metrogo

# Describe pod for issues
kubectl describe pod <pod-name> -n metrogo

# Delete and recreate
kubectl delete deployment metrogo-backend -n metrogo
kubectl apply -f k8s/backend-deployment.yml

# Check events
kubectl get events -n metrogo --sort-by='.lastTimestamp'
```

### Terraform

```bash
# Refresh state
terraform refresh

# Destroy all resources
terraform destroy -auto-approve
```

---

## Environment Variables Reference

### Backend (via docker-compose or K8s)

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment | development/production |
| PORT | API port | 3000 |
| MONGODB_URI | MongoDB connection string | mongodb://mongo:27017/metrogo |
| JWT_SECRET | JWT signing key | Required |
| TWILIO_ACCOUNT_SID | Twilio Account SID | Required |
| TWILIO_AUTH_TOKEN | Twilio Auth Token | Required |
| TWILIO_PHONE_NUMBER | Twilio Phone Number | Required |
| OTP_EXPIRY_SECONDS | OTP validity | 300 |

### AWS (via Terraform)

| Variable | Default |
|----------|---------|
| aws_region | ap-south-1 |
| project_name | metrogo |
| eks_cluster_version | 1.29 |
| eks_node_instance_type | t3.medium |
| eks_node_desired_count | 2 |
| eks_node_min_count | 2 |
| eks_node_max_count | 4 |

---

