#!/bin/bash
# ============================================
# MetroGo — Jenkins Pipeline Prerequisites Setup
# ============================================
# Run this script with sudo:
#   sudo bash jenkins-setup.sh
#
# What this script does:
# 1. Adds 'jenkins' user to 'docker' group (so Jenkins can run Docker)
# 2. Starts SonarQube as a Docker container on port 9000
# 3. Pulls OWASP ZAP Docker image for security scanning
# 4. Installs Trivy container scanner
# 5. Restarts Jenkins to pick up group changes
# ============================================

set -e  # Stop the script if any command fails

echo "╔══════════════════════════════════════════════╗"
echo "║  🔧 MetroGo — Jenkins Pipeline Setup         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ─── Step 1: Add Jenkins user to Docker group ────────
# Jenkins needs to run Docker commands (docker build, docker push)
# By adding jenkins to the 'docker' group, it can access the Docker socket
echo "═══ Step 1/5: Adding Jenkins user to Docker group ═══"
usermod -aG docker jenkins
echo "✅ Jenkins user added to docker group"

# ─── Step 2: Install Trivy (Container Vulnerability Scanner) ────
# Trivy scans Docker images for known CVE vulnerabilities
# We install it system-wide so Jenkins can call 'trivy' command
echo ""
echo "═══ Step 2/5: Installing Trivy container scanner ═══"
if command -v trivy &> /dev/null; then
    echo "✅ Trivy is already installed: $(trivy --version | head -1)"
else
    # Add Trivy's official APT repository
    apt-get update -qq
    apt-get install -y -qq wget apt-transport-https gnupg lsb-release
    wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor -o /usr/share/keyrings/trivy.gpg
    echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/trivy.list
    apt-get update -qq
    apt-get install -y -qq trivy
    echo "✅ Trivy installed: $(trivy --version | head -1)"
fi

# ─── Step 3: Start SonarQube (Code Quality Scanner) ────
# SonarQube runs as a Docker container on port 9000
# It analyzes our code for bugs, vulnerabilities, and code smells
echo ""
echo "═══ Step 3/5: Starting SonarQube container ═══"
if docker ps | grep -q sonarqube; then
    echo "✅ SonarQube is already running"
else
    # Run SonarQube Community Edition as a Docker container
    # -d = run in background (detached mode)
    # -p 9000:9000 = map container port 9000 to host port 9000
    # --name = give the container a friendly name
    # --restart unless-stopped = auto-restart on reboot
    docker run -d \
        --name sonarqube \
        --restart unless-stopped \
        -p 9000:9000 \
        -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
        sonarqube:lts-community
    echo "⏳ Waiting for SonarQube to start (this takes ~60 seconds)..."
    # Wait until SonarQube API responds with status UP
    for i in $(seq 1 30); do
        STATUS=$(curl -s http://localhost:9000/api/system/status 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$STATUS" = "UP" ]; then
            echo "✅ SonarQube is running at http://localhost:9000"
            echo "   Default login: admin / admin"
            break
        fi
        echo "   Waiting... attempt $i/30"
        sleep 5
    done
fi

# ─── Step 4: Pull OWASP ZAP Docker Image ────
# OWASP ZAP is a security testing tool that scans web applications
# We use it as a Docker container so we don't need to install Java/Python deps
echo ""
echo "═══ Step 4/5: Pulling OWASP ZAP Docker image ═══"
docker pull zaproxy/zap-stable:latest 2>&1 | tail -3
echo "✅ OWASP ZAP Docker image ready"

# ─── Step 5: Restart Jenkins ────
# Jenkins needs to be restarted to pick up the new docker group membership
echo ""
echo "═══ Step 5/5: Restarting Jenkins ═══"
systemctl restart jenkins
echo "⏳ Waiting for Jenkins to come back up..."
for i in $(seq 1 20); do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/login 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "403" ]; then
        echo "✅ Jenkins is running at http://localhost:8080"
        break
    fi
    echo "   Waiting... attempt $i/20"
    sleep 3
done

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                           ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Jenkins:    http://localhost:8080             ║"
echo "║  SonarQube:  http://localhost:9000             ║"
echo "║  Trivy:      $(trivy --version 2>/dev/null | head -1)"
echo "║  OWASP ZAP:  Docker image ready              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "👉 Next: Open Jenkins at http://localhost:8080"
echo "   and follow the JENKINS_PIPELINE_SETUP.md guide"
