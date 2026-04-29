# Twilio SMS/Voice Authentication Setup Guide

This guide will help you set up Twilio-based phone authentication for the Metro Booking application.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Twilio account (free trial available)

## Step 1: Twilio Account Setup

Get your Twilio credentials from the [Twilio Console](https://console.twilio.com/):
- **Account SID**: Found on your dashboard
- **Auth Token**: Found on your dashboard (click to reveal)
- **Phone Number**: Purchase or use trial number

### Important Notes for Trial Accounts:
- Twilio trial accounts can only send SMS/calls to **verified phone numbers**
- To add verified numbers:
  1. Go to [Twilio Console](https://console.twilio.com/)
  2. Navigate to **Phone Numbers** → **Verified Caller IDs**
  3. Click **Add a new number** and verify via SMS or call
  4. Use only verified numbers for testing

## Step 2: Backend Server Installation

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

This will install:
- `express` - Web framework
- `twilio` - Twilio SDK
- `jsonwebtoken` - JWT authentication
- `dotenv` - Environment variables
- `cors` - Cross-origin resource sharing
- `nodemon` - Development auto-reload

## Step 3: Environment Configuration

The `.env` file should be created in `server/.env` with your Twilio credentials:

```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
OTP_EXPIRY_SECONDS=300
JWT_SECRET=metro_booking_jwt_secret_key_change_in_production_2026
PORT=3000
NODE_ENV=development
```

**⚠️ Security Warning**: Change the `JWT_SECRET` before deploying to production!

## Step 4: Frontend Configuration

Update the frontend `.env` file in the root directory:

```bash
# Create .env file in root directory
echo "VITE_API_URL=http://localhost:3000" > .env
```

Or manually create `.env` with:

```env
VITE_API_URL=http://localhost:3000
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_ANALYTICS=false
VITE_MAP_CENTER_X=500
VITE_MAP_CENTER_Y=400
```

## Step 5: Start the Application

### Terminal 1 - Backend Server:
```bash
cd server
npm run dev
```

You should see:
```
🚀 Metro Booking Auth Server running on port 3000
📱 Twilio Phone: +19855455704
🔐 JWT Secret: ✓ Set
🌍 Environment: development
```

### Terminal 2 - Frontend Application:
```bash
# From root directory
npm run dev
```

The frontend will start on `http://localhost:5173`

## Step 6: Testing the Authentication Flow

1. **Open the application**: Navigate to `http://localhost:5173`
2. **Click "Book Now"** or go to Login page
3. **Enter your details**:
   - Name: Your name
   - Phone: **Must be a verified number** (e.g., `+919876543210`)
   - Method: Choose SMS or Voice Call
4. **Click "Send OTP"**
5. **Check your phone** for the OTP (6-digit code)
6. **Enter the OTP** and click "Verify & Login"
7. **Success!** You'll be redirected to the booking confirmation or home page

## Step 7: Testing with cURL

### Send OTP:
```bash
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "name": "Test User", "method": "sms"}'
```

### Verify OTP:
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "123456"}'
```

### Access Protected Route:
```bash
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Architecture Overview

### Backend Flow:
1. **POST /auth/send-otp**
   - Validates phone number (E.164 format)
   - Generates cryptographically secure 6-digit OTP
   - Stores hashed OTP in memory with expiry
   - Sends OTP via Twilio SMS or Voice
   - Returns success message

2. **POST /auth/verify-otp**
   - Validates OTP against stored hash
   - Checks expiry and attempt limits (5 max)
   - Issues JWT token on success
   - Returns token and user data

3. **JWT Authentication**
   - Token expires in 7 days
   - Contains: phone, name, verified status
   - Used for protected routes

### Frontend Flow:
1. User enters name and phone number
2. Selects SMS or Voice delivery method
3. Frontend calls `/auth/send-otp`
4. User receives OTP on phone
5. User enters OTP
6. Frontend calls `/auth/verify-otp`
7. JWT token stored in localStorage
8. User authenticated for 7 days

## Security Features

✅ **Cryptographic OTP Generation**: Uses `crypto.randomInt()` for secure random numbers
✅ **OTP Hashing**: OTPs stored as SHA-256 hashes, never plaintext
✅ **Timing-Safe Comparison**: Prevents timing attacks
✅ **Rate Limiting**: 3 OTP requests/minute, 10 verify attempts/minute
✅ **Expiry**: OTPs expire after 5 minutes
✅ **Attempt Limiting**: Max 5 verification attempts per OTP
✅ **Replay Prevention**: OTP deleted immediately after successful verification
✅ **JWT Tokens**: Secure session management with 7-day expiry

## Troubleshooting

### Issue: "Failed to send OTP"
- **Solution**: Check if phone number is verified in Twilio console (trial accounts only)
- Verify Twilio credentials are correct
- Check server logs for detailed error messages

### Issue: "Invalid phone number format"
- **Solution**: Use E.164 format: `+[country code][number]`
- Examples: `+919876543210` (India), `+12025551234` (US)

### Issue: "OTP expired"
- **Solution**: Request a new OTP (expires after 5 minutes)

### Issue: "Too many requests"
- **Solution**: Wait 1 minute before trying again (rate limit protection)

### Issue: CORS errors
- **Solution**: Ensure backend is running on port 3000
- Check CORS configuration in `server/src/app.js`

### Issue: JWT token invalid
- **Solution**: Token may have expired (7 days)
- Log out and log in again

## Production Deployment Checklist

Before deploying to production:

- [ ] **Replace in-memory storage with Redis**
  - Install Redis: `npm install ioredis`
  - Update `otpService.js` to use Redis with TTL
  - Update `rateLimiter.js` to use Redis

- [ ] **Use express-rate-limit with Redis**
  ```bash
  npm install express-rate-limit rate-limit-redis
  ```

- [ ] **Change JWT_SECRET** to a strong random value
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

- [ ] **Configure CORS** for production domain
  ```javascript
  origin: ['https://your-domain.com']
  ```

- [ ] **Enable HTTPS** (required for production)

- [ ] **Add logging** (Winston, Morgan)
  ```bash
  npm install winston morgan
  ```

- [ ] **Set up monitoring** (Sentry, DataDog, etc.)

- [ ] **Upgrade Twilio account** (remove trial restrictions)

- [ ] **Implement user database** (PostgreSQL, MongoDB)
  - Store user profiles
  - Track login history
  - Manage admin roles

- [ ] **Add refresh token rotation**

- [ ] **Implement account lockout** after failed attempts

- [ ] **Set up environment-specific configs**

- [ ] **Add health check endpoint monitoring**

- [ ] **Configure reverse proxy** (Nginx, Cloudflare)

- [ ] **Set up automated backups**

## API Documentation

### Authentication Endpoints

#### POST /auth/send-otp
Send OTP to phone number.

**Request Body:**
```json
{
  "phone": "+919876543210",
  "name": "John Doe",
  "method": "sms"
}
```

**Response (200):**
```json
{
  "message": "OTP sent successfully via sms.",
  "expiresIn": 300
}
```

**Error (400):**
```json
{
  "error": "A valid phone number in E.164 format is required."
}
```

#### POST /auth/verify-otp
Verify OTP and receive JWT token.

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456",
  "name": "John Doe"
}
```

**Response (200):**
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

**Error (401):**
```json
{
  "error": "Invalid OTP. 4 attempts remaining."
}
```

#### POST /auth/refresh-token
Refresh JWT token.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "message": "Token refreshed successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Support

For issues or questions:
1. Check server logs: `server/` directory
2. Check browser console for frontend errors
3. Verify Twilio console for SMS/call logs
4. Review this documentation

## License

MIT
