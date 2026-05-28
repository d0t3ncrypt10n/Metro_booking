# ============================================
# MetroGo Backend — Multi-Stage Docker Build
# ============================================

# Stage 1: Install dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --omit=dev

# ============================================
# Stage 2: Production runtime
# ============================================
FROM node:20-alpine AS production

# Add labels for container identification
LABEL maintainer="MetroGo Team"
LABEL description="MetroGo Backend API — Node.js/Express.js with Twilio OTP"
LABEL version="1.0.0"

# Create non-root user for security
RUN addgroup -g 1001 -S metrogo && \
    adduser -S metrogo -u 1001

WORKDIR /app

# Copy production dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source code
COPY src/ ./src/
COPY package.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the API port
EXPOSE 3000

# Switch to non-root user
USER metrogo

# Health check — verify the API is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/app.js"]
