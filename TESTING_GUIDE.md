# Testing Guide - Twilio Authentication

This guide will help you test the Twilio SMS/Voice authentication system.

## Quick Start

### Option 1: Using Startup Scripts

**Windows:**
```bash
start-dev.bat
```

**Linux/Mac:**
```bash
./start-dev.sh
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

## Test Scenarios

### 1. SMS Authentication Flow

1. **Navigate to Login Page**
   - Open `http://localhost:5173`
   - Click "Book Now" or navigate to `/login`

2. **Enter User Details**
   - Name: `Test User`
   - Phone: `+919876543210` (use your verified Twilio number)
   - Method: Select **SMS**

3. **Send OTP**
   - Click "Send OTP"
   - Check your phone for SMS
   - Note: In development, OTP is also logged to server console

4. **Verify OTP**
   - Enter the 6-digit code
   - Click "Verify & Login"
   - You should be redirected to home or booking confirmation

5. **Verify Session**
   - Refresh the page
   - You should remain logged in
   - Check localStorage for `metroUser` and `metroAuthToken`

### 2. Voice Authentication Flow

1. **Navigate to Login Page**
   - Open `http://localhost:5173/login`

2. **Enter User Details**
   - Name: `Test User`
   - Phone: `+919876543210`
   - Method: Select **Voice Call**

3. **Send OTP**
   - Click "Send OTP"
   - Answer the incoming call
   - Listen to the 6-digit code (spoken digit by digit)

4. **Verify OTP**
   - Enter the code you heard
   - Click "Verify & Login"

### 3. Error Handling Tests

#### Invalid Phone Number
```bash
# Test with invalid format
Phone: 123456789 (missing country code)
Expected: Error message about E.164 format
```

#### Expired OTP
```bash
# Wait 5+ minutes after receiving OTP
Expected: "OTP has expired. Request a new one."
```

#### Wrong OTP
```bash
# Enter incorrect code
Expected: "Invalid OTP. X attempts remaining."
```

#### Rate Limiting
```bash
# Send 4+ OTP requests within 1 minute
Expected: "Too many requests. Please wait before trying again."
```

#### Max Attempts
```bash
# Enter wrong OTP 5 times
Expected: "Too many attempts. Request a new OTP."
```

### 4. API Testing with cURL

#### Send SMS OTP
```bash
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "name": "Test User",
    "method": "sms"
  }'
```

**Expected Response:**
```json
{
  "message": "OTP sent successfully via sms.",
  "expiresIn": 300
}
```

#### Send Voice OTP
```bash
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "name": "Test User",
    "method": "voice"
  }'
```

#### Verify OTP
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "otp": "123456",
    "name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "message": "Phone verified successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "phone": "+919876543210",
    "name": "Test User",
    "loginTime": "2026-04-30T10:30:00.000Z"
  }
}
```

#### Access Protected Route
```bash
# Replace YOUR_TOKEN with the token from verify-otp response
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Access granted.",
  "user": {
    "phone": "+919876543210",
    "name": "Test User",
    "verified": true
  }
}
```

### 5. Frontend Integration Tests

#### Check Token Storage
```javascript
// Open browser console
localStorage.getItem('metroAuthToken')
localStorage.getItem('metroUser')
```

#### Check Token Expiry
```javascript
// Decode JWT token (use jwt.io or browser console)
const token = localStorage.getItem('metroAuthToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires:', new Date(payload.exp * 1000));
```

#### Test Logout
```javascript
// Should clear localStorage and redirect to login
// Click logout button or run:
localStorage.clear();
window.location.reload();
```

### 6. Admin Access Test

1. **Login as Admin**
   - Name: `Jayant`
   - Phone: `+919472747641`
   - Complete OTP verification

2. **Access Admin Dashboard**
   - Navigate to `/admin`
   - Should see network management interface

3. **Test Non-Admin Access**
   - Login with different credentials
   - Try to access `/admin`
   - Should see "Access Denied" message

## Monitoring & Debugging

### Backend Logs
Check server console for:
- OTP generation logs (development mode)
- Twilio API responses
- Error messages
- Rate limiting triggers

### Frontend Console
Check browser console for:
- API request/response logs
- Authentication state changes
- Error messages

### Twilio Console
Check [Twilio Console](https://console.twilio.com/) for:
- SMS delivery status
- Voice call logs
- Error codes
- Usage statistics

## Common Issues & Solutions

### Issue: "Failed to send OTP"
**Cause**: Phone number not verified (trial account)
**Solution**: 
1. Go to Twilio Console
2. Navigate to Phone Numbers → Verified Caller IDs
3. Add and verify your test number

### Issue: "Invalid phone number format"
**Cause**: Missing country code
**Solution**: Use E.164 format: `+[country][number]`
- India: `+919876543210`
- US: `+12025551234`

### Issue: CORS error
**Cause**: Backend not running or wrong URL
**Solution**:
1. Ensure backend is running on port 3000
2. Check `.env` has `VITE_API_URL=http://localhost:3000`
3. Restart frontend after changing .env

### Issue: "Too many requests"
**Cause**: Rate limit exceeded
**Solution**: Wait 60 seconds before retrying

### Issue: OTP not received
**Cause**: Multiple possibilities
**Solution**:
1. Check phone number is verified in Twilio
2. Check Twilio account balance
3. Check server logs for Twilio errors
4. Verify Twilio credentials in `.env`

## Performance Testing

### Load Testing with Artillery
```bash
npm install -g artillery

# Create test-load.yml
artillery quick --count 10 --num 5 http://localhost:3000/health

# Test OTP endpoint (be careful with rate limits)
artillery quick --count 3 --num 1 -p test-otp.json http://localhost:3000/auth/send-otp
```

### Response Time Benchmarks
- Send OTP: < 2 seconds (Twilio API call)
- Verify OTP: < 100ms (local verification)
- Protected routes: < 50ms (JWT verification)

## Security Testing

### Test Rate Limiting
```bash
# Send multiple requests rapidly
for i in {1..5}; do
  curl -X POST http://localhost:3000/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phone": "+919876543210", "name": "Test"}' &
done
```

### Test OTP Expiry
```bash
# Send OTP, wait 6 minutes, then verify
# Should fail with expiry message
```

### Test JWT Expiry
```bash
# Modify JWT_SECRET in .env
# Old tokens should become invalid
```

## Automated Testing

### Backend Unit Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
npm run test
```

### E2E Tests (if configured)
```bash
npm run test:e2e
```

## Test Checklist

- [ ] SMS OTP delivery works
- [ ] Voice OTP delivery works
- [ ] OTP verification succeeds with correct code
- [ ] OTP verification fails with wrong code
- [ ] OTP expires after 5 minutes
- [ ] Rate limiting prevents abuse
- [ ] JWT token is stored correctly
- [ ] Protected routes require authentication
- [ ] Logout clears session
- [ ] Admin access is restricted
- [ ] Phone number validation works
- [ ] Error messages are user-friendly
- [ ] Session persists across page refreshes
- [ ] Token refresh works (if implemented)

## Next Steps

After successful testing:
1. Review [TWILIO_SETUP.md](./TWILIO_SETUP.md) for production deployment
2. Implement Redis for production storage
3. Add monitoring and alerting
4. Set up CI/CD pipeline
5. Configure production environment variables
6. Upgrade Twilio account (remove trial restrictions)

## Support

If you encounter issues:
1. Check server logs: `server/` console output
2. Check browser console for frontend errors
3. Review Twilio console for delivery logs
4. Consult [TWILIO_SETUP.md](./TWILIO_SETUP.md) troubleshooting section
