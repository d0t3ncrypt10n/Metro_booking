# ==============================================================================
# AWS Secrets Manager & KMS — MetroGo Secrets Configuration
# ==============================================================================
# This configuration creates Customer Managed KMS encryption keys and AWS Secrets
# Manager secrets for sensitive credentials: Twilio API, JWT secret, and MongoDB URI.
# Every line is documented so that a 4th-year student can explain each parameter.
# ==============================================================================

# ─── KMS Customer Managed Key ────────────────────────────────────────────────
# Creates an AWS Key Management Service (KMS) Customer Managed Key (CMK)
# used to encrypt application secrets stored in AWS Secrets Manager at rest.
resource "aws_kms_key" "secrets" {
  # Human-readable description explaining the purpose of this KMS key
  description             = "Customer Managed Key for encrypting MetroGo application secrets"
  # Waiting period in days before AWS permanently deletes this KMS key if requested
  deletion_window_in_days = 7
  # Automatically rotates the KMS cryptographic key material once every year
  enable_key_rotation     = true
  # Resource tags to identify project ownership and manage infrastructure assets
  tags = {
    # Name tag assigned to easily identify this KMS key in the AWS Console
    Name = "${var.project_name}-secrets-kms-key"
  }
}

# ─── KMS Key Alias ────────────────────────────────────────────────────────────
# Creates a human-friendly display name (alias) for the KMS encryption key.
resource "aws_kms_alias" "secrets_alias" {
  # Friendly alias name with required alias/ prefix
  name          = "alias/${var.project_name}-secrets-key"
  # Target KMS key ID that this friendly alias points to
  target_key_id = aws_kms_key.secrets.key_id
}

# ─── Twilio Credentials Secret ────────────────────────────────────────────────
# Creates an AWS Secrets Manager secret container for Twilio SMS/OTP credentials.
resource "aws_secretsmanager_secret" "twilio" {
  # Unique name for the Twilio secret in AWS Secrets Manager
  name                    = "${var.project_name}-twilio-credentials"
  # Clear description explaining that this stores Twilio SMS API keys
  description             = "Twilio credentials for MetroGo SMS and OTP verification"
  # Customer managed KMS key ARN used to encrypt this secret
  kms_key_id              = aws_kms_key.secrets.arn
  # Number of days AWS retains deleted secret before permanent removal (0 = immediate)
  recovery_window_in_days = 0
  # Resource tags for project tracking and governance
  tags = {
    # Name tag to identify this secret in the AWS Console
    Name = "${var.project_name}-twilio-credentials"
  }
}

# ─── Twilio Secret Version (Initial Values) ──────────────────────────────────
# Stores the initial JSON key-value pairs inside the Twilio secret container.
resource "aws_secretsmanager_secret_version" "twilio_version" {
  # ID of the parent Secrets Manager secret resource
  secret_id     = aws_secretsmanager_secret.twilio.id
  # Encodes the secret key-value map as a valid JSON string
  secret_string = jsonencode({
    # Twilio Account SID identifier for API authentication
    TWILIO_ACCOUNT_SID  = "placeholder_twilio_account_sid"
    # Twilio Auth Token acts as the secret password for Twilio API requests
    TWILIO_AUTH_TOKEN   = "placeholder_twilio_auth_token"
    # Twilio virtual phone number used as the SMS sender for booking confirmations
    TWILIO_PHONE_NUMBER = "+1234567890"
  })
}

# ─── JWT Secret Key ───────────────────────────────────────────────────────────
# Creates an AWS Secrets Manager secret container for the JWT authentication key.
resource "aws_secretsmanager_secret" "jwt" {
  # Unique name for the JWT secret in AWS Secrets Manager
  name                    = "${var.project_name}-jwt-secret"
  # Clear description explaining that this key is used to sign auth tokens
  description             = "Secret key used for signing and verifying JSON Web Tokens (JWT)"
  # Customer managed KMS key ARN used to encrypt this secret
  kms_key_id              = aws_kms_key.secrets.arn
  # Number of days AWS retains deleted secret before permanent removal (0 = immediate)
  recovery_window_in_days = 0
  # Resource tags for project tracking and governance
  tags = {
    # Name tag to identify this secret in the AWS Console
    Name = "${var.project_name}-jwt-secret"
  }
}

# ─── JWT Secret Version (Initial Value) ───────────────────────────────────────
# Stores the initial JSON payload containing the JWT signing secret key.
resource "aws_secretsmanager_secret_version" "jwt_version" {
  # ID of the parent Secrets Manager secret resource
  secret_id     = aws_secretsmanager_secret.jwt.id
  # Encodes the secret key-value map as a valid JSON string
  secret_string = jsonencode({
    # Cryptographic secret string used by backend Express server to sign user JWTs
    JWT_SECRET = "placeholder_super_secret_jwt_key_metrogo_production"
  })
}

# ─── MongoDB Connection URI Secret ───────────────────────────────────────────
# Creates an AWS Secrets Manager secret container for the MongoDB connection URI.
resource "aws_secretsmanager_secret" "mongodb" {
  # Unique name for the MongoDB URI secret in AWS Secrets Manager
  name                    = "${var.project_name}-mongodb-uri"
  # Clear description explaining that this stores the database connection string
  description             = "MongoDB connection URI connection string for MetroGo database"
  # Customer managed KMS key ARN used to encrypt this secret
  kms_key_id              = aws_kms_key.secrets.arn
  # Number of days AWS retains deleted secret before permanent removal (0 = immediate)
  recovery_window_in_days = 0
  # Resource tags for project tracking and governance
  tags = {
    # Name tag to identify this secret in the AWS Console
    Name = "${var.project_name}-mongodb-uri"
  }
}

# ─── MongoDB Secret Version (Initial Value) ───────────────────────────────────
# Stores the initial JSON payload containing the MongoDB connection URI string.
resource "aws_secretsmanager_secret_version" "mongodb_version" {
  # ID of the parent Secrets Manager secret resource
  secret_id     = aws_secretsmanager_secret.mongodb.id
  # Encodes the secret key-value map as a valid JSON string
  secret_string = jsonencode({
    # Connection string URI pointing to the internal MongoDB service inside the cluster
    MONGODB_URI = "mongodb://mongodb-service.metrogo.svc.cluster.local:27017/metrogo"
  })
}
