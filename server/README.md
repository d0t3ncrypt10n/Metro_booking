# Metro Booking Authentication Server

Backend authentication service using Twilio SMS/VoIP for OTP-based phone verification.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
OTP_EXPIRY_SECONDS=300
JWT_SECRET=your_super_secret_jwt_key
PORT=3000
NODE_ENV=development
```

3. Start the server:
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

## API Endpoints

### POST /auth/send-otp
Send OTP via SMS or Voice call.

**Request:**
```json
{
  "phone": "+919876543210",
  "name": "John Doe",
  "method": "sms"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully via sms.",
  "expiresIn": 300
}
```

### POST /auth/verify-otp
Verify OTP and receive JWT token.

**Request:**
```json
{
  "phone": "+919876543210",
  "otp": "123456",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "Phone verified successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "phone": "+919876543210",
    "name": "John Doe",
    "loginTime": "2026-04-30T10:30:00.000Z"
  }
}
```

### POST /auth/refresh-token
Refresh an existing JWT token.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/profile (Protected)
Example protected route requiring JWT authentication.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

## Testing

```bash
# Send OTP
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "name": "Test User", "method": "sms"}'

# Verify OTP
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "123456"}'

# Access protected route
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer <your_jwt_token>"
```

## Production Checklist

- [ ] Replace in-memory OTP store with Redis
- [ ] Use express-rate-limit with Redis for distributed rate limiting
- [ ] Set strong JWT_SECRET
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS
- [ ] Add request logging (Morgan, Winston)
- [ ] Set up monitoring and alerts
- [ ] Verify Twilio phone numbers (trial accounts only send to verified numbers)
- [ ] Implement user database for persistent user data
- [ ] Add refresh token rotation
- [ ] Implement account lockout after failed attempts
