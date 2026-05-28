// ============================================
// Jenkinsfile — MetroGo CI/CD Pipeline
// ============================================
// Declarative pipeline with 8 stages as per synopsis:
// 1. Source Code Fetch
// 2. Dependency Install & Lint
// 3. Frontend Tests
// 4. Production Build
// 5. Dockerize Backend
// 6. Frontend Deploy (S3 + CloudFront)
// 7. Backend Deploy (EKS Kubernetes)
// 8. Monitoring Check

pipeline {
    agent any

    environment {
        // AWS Configuration
        AWS_REGION         = 'eu-north-1'
        AWS_ACCOUNT_ID     = credentials('aws-account-id')
        ECR_REPO           = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/metrogo-backend"
        EKS_CLUSTER_NAME   = 'metrogo-eks'
        S3_BUCKET          = credentials('metrogo-s3-bucket')
        CLOUDFRONT_ID      = credentials('metrogo-cloudfront-id')

        // Node.js
        NODE_ENV           = 'production'
    }

    tools {
        nodejs 'NodeJS'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {
        // ─── Stage 1: Source Code Fetch ─────────
        stage('1. Source Code Fetch') {
            steps {
                echo '📥 Fetching source code from GitHub...'
                checkout scm
                echo "✅ Source code checked out — Branch: ${env.BRANCH_NAME ?: 'main'}"
            }
        }

        // ─── Stage 2: Dependency Install & Lint ──
        stage('2. Dependency Install & Lint') {
            parallel {
                stage('Frontend Dependencies') {
                    steps {
                        echo '📦 Installing frontend dependencies...'
                        sh 'npm ci'
                        echo '🔍 Running TypeScript type-check...'
                        sh 'npx tsc --noEmit'
                    }
                }
                stage('Backend Dependencies') {
                    steps {
                        echo '📦 Installing backend dependencies...'
                        dir('server') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        // ─── Stage 3: Frontend Tests ─────────────
        stage('3. Frontend Tests') {
            steps {
                echo '🧪 Running Vitest + React Testing Library...'
                sh 'npm run test'
                echo '✅ All frontend tests passed'
            }
            post {
                failure {
                    echo '❌ Frontend tests failed — aborting pipeline'
                }
            }
        }

        // ─── Stage 4: Production Build ───────────
        stage('4. Production Build') {
            steps {
                echo '🏗️ Building production frontend with Vite...'
                sh 'npm run build'
                echo '✅ Vite build complete — dist/ directory ready'
                sh 'ls -la dist/'
            }
        }

        // ─── Stage 5: Dockerize Backend ──────────
        stage('5. Dockerize Backend') {
            steps {
                echo '🐳 Building Docker image for backend...'
                dir('server') {
                    script {
                        def imageTag = "${env.BUILD_NUMBER}"
                        sh """
                            docker build -t ${ECR_REPO}:${imageTag} -t ${ECR_REPO}:latest .
                        """

                        echo '📤 Pushing Docker image to AWS ECR...'
                        sh """
                            aws ecr get-login-password --region ${AWS_REGION} | \
                            docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

                            docker push ${ECR_REPO}:${imageTag}
                            docker push ${ECR_REPO}:latest
                        """
                        echo "✅ Docker image pushed: ${ECR_REPO}:${imageTag}"
                    }
                }
            }
        }

        // ─── Stage 6: Frontend Deploy ────────────
        stage('6. Frontend Deploy') {
            steps {
                echo '🌐 Deploying frontend to AWS S3 + CloudFront...'
                sh """
                    aws s3 sync dist/ s3://${S3_BUCKET}/ \
                        --delete \
                        --cache-control "public, max-age=31536000, immutable" \
                        --exclude "index.html"

                    aws s3 cp dist/index.html s3://${S3_BUCKET}/index.html \
                        --cache-control "public, max-age=0, must-revalidate"
                """

                echo '🔄 Invalidating CloudFront cache...'
                sh """
                    aws cloudfront create-invalidation \
                        --distribution-id ${CLOUDFRONT_ID} \
                        --paths "/*"
                """
                echo '✅ Frontend deployed to CloudFront CDN'
            }
        }

        // ─── Stage 7: Backend Deploy ─────────────
        stage('7. Backend Deploy') {
            steps {
                echo '☸️ Deploying backend to AWS EKS Kubernetes...'
                sh """
                    aws eks update-kubeconfig \
                        --region ${AWS_REGION} \
                        --name ${EKS_CLUSTER_NAME}
                """

                echo '📋 Applying Kubernetes manifests...'
                sh """
                    kubectl apply -f k8s/namespace.yml
                    kubectl apply -f k8s/backend-configmap.yml
                    kubectl apply -f k8s/backend-secret.yml
                    kubectl apply -f k8s/mongodb-deployment.yml
                    kubectl apply -f k8s/mongodb-service.yml
                    kubectl apply -f k8s/backend-deployment.yml
                    kubectl apply -f k8s/backend-service.yml
                    kubectl apply -f k8s/backend-hpa.yml
                    kubectl apply -f k8s/prometheus-deployment.yml
                    kubectl apply -f k8s/grafana-deployment.yml
                """

                echo '🔄 Triggering rolling update...'
                sh """
                    kubectl set image deployment/metrogo-backend \
                        metrogo-backend=${ECR_REPO}:${env.BUILD_NUMBER} \
                        -n metrogo

                    kubectl rollout status deployment/metrogo-backend \
                        -n metrogo --timeout=300s
                """
                echo '✅ Backend deployed to EKS with rolling update'
            }
        }

        // ─── Stage 8: Monitoring Check ───────────
        stage('8. Monitoring Check') {
            steps {
                echo '🔍 Running post-deployment health checks...'

                script {
                    // Get the backend service URL
                    def backendUrl = sh(
                        script: "kubectl get svc metrogo-backend-service -n metrogo -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'",
                        returnStdout: true
                    ).trim()

                    // Health check
                    echo "🏥 Checking backend health at: ${backendUrl}"
                    sh """
                        for i in 1 2 3 4 5; do
                            HTTP_CODE=\$(curl -s -o /dev/null -w "%{http_code}" http://${backendUrl}/health)
                            if [ "\$HTTP_CODE" = "200" ]; then
                                echo "✅ Health check passed (attempt \$i)"
                                break
                            fi
                            echo "⏳ Waiting for backend... (attempt \$i, status: \$HTTP_CODE)"
                            sleep 10
                        done
                    """

                    // Metrics check
                    echo '📊 Verifying Prometheus metrics endpoint...'
                    sh """
                        METRICS_CODE=\$(curl -s -o /dev/null -w "%{http_code}" http://${backendUrl}/metrics)
                        if [ "\$METRICS_CODE" = "200" ]; then
                            echo "✅ Prometheus metrics endpoint is active"
                        else
                            echo "⚠️ Metrics endpoint returned: \$METRICS_CODE"
                        fi
                    """
                }

                echo '📈 Checking Kubernetes pod status...'
                sh '''
                    kubectl get pods -n metrogo -o wide
                    kubectl get hpa -n metrogo
                    kubectl get svc -n metrogo
                '''

                echo '✅ All post-deployment checks complete'
            }
        }
    }

    post {
        success {
            echo '''
            ╔══════════════════════════════════════════════╗
            ║  ✅ MetroGo Deployment Successful!           ║
            ║                                              ║
            ║  Frontend: CloudFront CDN                    ║
            ║  Backend:  EKS Kubernetes                    ║
            ║  Monitor:  Prometheus + Grafana              ║
            ╚══════════════════════════════════════════════╝
            '''
        }
        failure {
            echo '❌ Pipeline failed — check logs for details'
        }
        cleanup {
            cleanWs()
        }
    }
}
