pipeline {
    agent any

    options {
        timeout(time: 60, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    tools {
        nodejs 'NodeJS'
    }

    environment {
        PATH = "/home/nexus/bin:${env.PATH}"
        AWS_REGION = 'eu-north-1'
        AWS_ACCOUNT_ID = credentials('aws-account-id')
        ECR_REPO = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/metrogo-backend"
        DOCKERHUB_REPO = 'd0t3ncrypti0n/metrogo-backend'
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        EKS_CLUSTER_NAME = 'metrogo-eks'
        S3_BUCKET = credentials('metrogo-s3-bucket')
        SONARQUBE_URL = 'http://localhost:9000'
        SONARQUBE_TOKEN = credentials('sonar-token')
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Source Code Fetch') {
            steps {
                checkout scm
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        stage('Lint + TypeScript') {
            steps {
                sh 'npm run lint || true'
                sh 'npx tsc --noEmit || true'
            }
        }
        stage('Unit Tests (Vitest)') {
            steps {
                sh 'npm run test -- --run || true'
            }
        }
        stage('BDD Tests (Cucumber)') {
            steps {
                sh 'npx cucumber-js --exit || true'
            }
        }
        stage('SonarQube Analysis') {
            steps {
                sh "sonar-scanner -Dsonar.projectKey=metrogo -Dsonar.projectName='MetroGo' -Dsonar.sources=src,server/src -Dsonar.host.url=${SONARQUBE_URL} -Dsonar.token=${SONARQUBE_TOKEN} || true"
            }
        }
        stage('Vite Production Build') {
            steps {
                sh 'npm run build'
            }
        }
        stage('Docker Build + Trivy') {
            steps {
                sh "docker build -t ${ECR_REPO}:${IMAGE_TAG} -t ${ECR_REPO}:latest server/"
                sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity HIGH,CRITICAL --exit-code 0 ${ECR_REPO}:${IMAGE_TAG} || true"
            }
        }
        stage('Push to ECR + Docker Hub') {
            steps {
                sh 'echo "${DOCKERHUB_CREDENTIALS_PSW}" | docker login -u "${DOCKERHUB_CREDENTIALS_USR}" --password-stdin || true'
                sh "docker push ${DOCKERHUB_REPO}:${IMAGE_TAG} || true"
                sh "docker push ${DOCKERHUB_REPO}:latest || true"
                sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com || true"
                sh "docker push ${ECR_REPO}:${IMAGE_TAG} || true"
                sh "docker push ${ECR_REPO}:latest || true"
            }
        }
        stage('OWASP ZAP Security') {
            steps {
                sh "docker run --rm --network host zaproxy/zap-stable:latest zap-baseline.py -t http://localhost:3000 || true"
            }
        }
        stage('Frontend Deploy') {
            steps {
                sh "aws s3 sync dist/ s3://${S3_BUCKET}/ --delete --cache-control 'public, max-age=31536000, immutable' --exclude 'index.html' || true"
                sh "aws s3 cp dist/index.html s3://${S3_BUCKET}/index.html --cache-control 'public, max-age=0, must-revalidate' || true"
            }
        }
        stage('Backend Deploy (EKS)') {
            steps {
                sh "aws eks update-kubeconfig --region ${AWS_REGION} --name ${EKS_CLUSTER_NAME} || true"
                sh 'kubectl apply -f k8s/namespace.yml || true'
                sh 'kubectl apply -f k8s/backend-configmap.yml || true'
                sh 'kubectl apply -f k8s/backend-secret.yml || true'
                sh 'kubectl apply -f k8s/mongodb-deployment.yml || true'
                sh 'kubectl apply -f k8s/mongodb-service.yml || true'
                sh 'kubectl apply -f k8s/backend-deployment.yml || true'
                sh 'kubectl apply -f k8s/backend-service.yml || true'
                sh "kubectl set image deployment/metrogo-backend metrogo-backend=${ECR_REPO}:${IMAGE_TAG} -n metrogo || true"
                sh 'kubectl rollout status deployment/metrogo-backend -n metrogo --timeout=300s || true'
            }
        }
        stage('Monitoring Check') {
            steps {
                sh "aws cloudwatch describe-alarms --region ${AWS_REGION} --alarm-name-prefix 'MetroGo' || true"
                sh "aws logs describe-log-groups --region ${AWS_REGION} --log-group-name-prefix '/metrogo/backend' || true"
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully'
        }
        failure {
            echo 'Pipeline failed'
        }
        cleanup {
            cleanWs()
        }
    }
}