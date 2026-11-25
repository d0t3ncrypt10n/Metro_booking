# ==============================================================================
# MetroGo Backend — Multi-Stage Dockerfile
# ==============================================================================
# Project: MetroGo - Metro Booking & Network Management System
# Component: Backend REST API (Node.js / Express.js / MongoDB)
# Context: 4th-Year B.Tech CSE Final Year Project (DevOps Pipeline)
#
# What is a Multi-Stage Build?
# A multi-stage build divides the image creation process into separate stages:
#   - Stage 1 ("builder"): Installs npm dependencies in a temporary environment.
#   - Stage 2 ("production"): Starts from a brand-new, clean base image and copies
#     only the required production files from Stage 1.
#
# Benefits for Student to Explain to Evaluator:
#   1. Minimal Image Size: Discards temporary build files, reducing size drastically (~80MB).
#   2. Security & Reduced Attack Surface: No development tools or package managers left in prod.
#   3. Least Privilege: Runs as a non-root user ('metrogo') rather than 'root'.
#   4. Self-Healing: Includes HEALTHCHECK so Docker/Kubernetes detects hung containers.
# ==============================================================================


# ==============================================================================
# STAGE 1: Dependency Builder ("builder")
# ==============================================================================
# Simple explanation: This temporary stage downloads and installs the npm packages.
# Once done, we copy the resulting node_modules to Stage 2 and discard the rest.
# ------------------------------------------------------------------------------

# FROM specifies the base operating system image with Node.js pre-installed.
# Simple explanation: This downloads the official Node.js version 20 image built on lightweight Alpine Linux.
# - 'node:20-alpine': Alpine Linux is an ultra-light Linux distro (~5MB base) that keeps image sizes small.
# - 'AS builder': Gives this stage the nickname "builder" so we can reference it in Stage 2.
FROM node:20-alpine AS builder

# WORKDIR sets the working folder inside the container where all commands will run.
# Simple explanation: This creates the folder '/app' inside the container and navigates into it.
WORKDIR /app

# COPY transfers files from our local computer into the container filesystem.
# Simple explanation: This copies package.json and package-lock.json to the container's '/app' folder.
# - './' represents the current working directory (/app) inside the container.
# - EVALUATOR CONCEPT (Docker Layer Caching):
#   We copy dependency files BEFORE source code so Docker caches this step.
#   If packages didn't change, Docker skips 'npm ci' in future builds, saving time!
COPY package.json package-lock.json ./

# RUN executes a shell command inside the container during image build time.
# Simple explanation: This cleanly installs only the production packages listed in package-lock.json.
# - 'npm ci': Clean Install ensures exact package versions from lockfile (faster and more reliable than npm install).
# - '--omit=dev': Skips development packages (like nodemon, testing tools) to keep dependencies lean and secure.
RUN npm ci --omit=dev


# ==============================================================================
# STAGE 2: Production Runtime Environment ("production")
# ==============================================================================
# Simple explanation: This is the final image that actually runs in production.
# It starts completely fresh so no unnecessary files from Stage 1 are carried over.
# ------------------------------------------------------------------------------

# FROM starts a fresh, clean Alpine Linux image for our runtime container.
# Simple explanation: This pulls a fresh Node.js 20 Alpine image with zero build clutter.
# - 'AS production': Names this final target stage "production".
FROM node:20-alpine AS production

# LABEL adds key-value metadata tags to the image for identification and tracking.
# Simple explanation: These labels attach project information, author details, and version numbers to the image.
# Evaluators can view these labels by running: docker inspect <image_name>
LABEL maintainer="MetroGo DevOps Team <devops@metrogo.local>"
LABEL project="MetroGo - Metro Booking & Network Management System"
LABEL version="1.0.0"
LABEL description="MetroGo Backend REST API built with Node.js, Express, Twilio OTP, and MongoDB"
LABEL academic.degree="B.Tech Computer Science and Engineering"
LABEL academic.course="Final Year Project - Advanced Cloud Infrastructure & DevOps"
LABEL academic.institution="Lovely Professional University"

# RUN executes commands to create an unprivileged user and group for application security.
# Simple explanation: This creates a new non-root system group and user named 'metrogo' with ID 1001.
# - 'addgroup -g 1001 -S metrogo': Creates a system group (-S) with specific Group ID 1001.
# - 'adduser -S metrogo -u 1001 -G metrogo': Creates a system user (-S) named 'metrogo' with User ID 1001 in group 'metrogo'.
# - EVALUATOR CONCEPT (Container Security / Principle of Least Privilege):
#   By default, Docker containers run as 'root' (admin). If an attacker hacks the app,
#   root permissions could allow them to compromise the host system.
#   Running as an unprivileged user ('metrogo') blocks unauthorized system access.
RUN addgroup -g 1001 -S metrogo && \
    adduser -S metrogo -u 1001 -G metrogo

# WORKDIR sets the working folder inside the production container.
# Simple explanation: This creates and enters the '/app' folder inside our production container.
WORKDIR /app

# COPY copies the installed dependencies directly from Stage 1 into Stage 2.
# Simple explanation: This copies the node_modules folder from the 'builder' stage into this container.
# - '--from=builder': Grabs the folder from Stage 1 instead of our local machine.
# - '--chown=metrogo:metrogo': Sets ownership of the copied files to our non-root user 'metrogo'.
COPY --from=builder --chown=metrogo:metrogo /app/node_modules ./node_modules

# COPY transfers package.json to the production container.
# Simple explanation: This copies package.json into '/app' and assigns file ownership to user 'metrogo'.
# - Node.js requires package.json at runtime for package metadata and module resolution.
COPY --chown=metrogo:metrogo package.json ./

# COPY transfers the backend application source code into the container.
# Simple explanation: This copies the 'src' folder (routes, controllers, models, middleware) to '/app/src'.
# - Unwanted files (.git, .env, tests, docs) are excluded automatically via .dockerignore.
# - '--chown=metrogo:metrogo': Ensures all source files are owned by our non-root user 'metrogo'.
COPY --chown=metrogo:metrogo src/ ./src/

# ENV sets persistent environment variables inside the container.
# Simple explanation: This tells Node.js and Express to run in production mode.
# - In production mode, Express caches templates, boosts performance, and hides sensitive stack traces from users.
ENV NODE_ENV=production

# ENV sets the default network port variable for the application.
# Simple explanation: This sets the environment variable PORT to 3000, which our Express server listens on.
ENV PORT=3000

# EXPOSE informs Docker and engineers which port the container listens on at runtime.
# Simple explanation: This documents that our application listens on network port 3000 inside the container.
# - EVALUATOR CONCEPT: EXPOSE is informational documentation. To make the port accessible
#   outside the container, we map it using '-p 3000:3000' in Docker CLI or 'ports:' in docker-compose.yml.
EXPOSE 3000

# USER switches the execution context to our unprivileged user.
# Simple explanation: This switches the active user from 'root' to 'metrogo'.
# - From this line forward, everything runs under the restricted user 'metrogo' (UID 1001) for security.
USER metrogo

# HEALTHCHECK tells Docker how to verify that the backend application is healthy and working.
# Simple explanation: This tests if our Express server is answering HTTP requests on the '/health' endpoint.
# - '--interval=30s': Runs this health test every 30 seconds.
# - '--timeout=10s': Fails the test if the server takes longer than 10 seconds to respond.
# - '--start-period=5s': Gives the app 5 seconds of startup grace period before counting failed attempts.
# - '--retries=3': Marks the container as 'unhealthy' if the test fails 3 consecutive times.
# - 'CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1':
#   * 'wget': Lightweight HTTP request utility included in Alpine Linux.
#   * '--no-verbose': Hides unnecessary download progress output.
#   * '--tries=1': Attempts the request only once per check.
#   * '--spider': Checks that the URL exists without downloading the response content.
#   * 'http://localhost:3000/health': Our Express health check endpoint returning HTTP 200 { status: 'ok' }.
#   * '|| exit 1': Exits with code 1 (failure) if the HTTP request cannot connect.
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# CMD defines the default command to execute when the container starts up.
# Simple explanation: This runs 'node src/app.js' to launch the MetroGo backend server.
# - EVALUATOR CONCEPT (Exec Form vs Shell Form):
#   * We use the JSON array "exec form" ["node", "src/app.js"] instead of shell form ("node src/app.js").
#   * Exec form runs the Node process directly as PID 1 (Process ID 1) without spawning a subshell.
#   * This allows Node to directly catch OS signals (SIGTERM, SIGINT) from Docker for clean, graceful shutdowns.
CMD ["node", "src/app.js"]
