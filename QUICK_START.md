# Quick Start Guide - Twilio Authentication

Get up and running with Twilio SMS/Voice authentication in 5 minutes!

## Prerequisites
- Node.js 16+ installed
- Your Twilio credentials (already configured)

## Step 1: Install Dependencies

### Backend
```bash
cd server
npm install
```

### Frontend
```bash
cd ..
npm install
```

## Step 2: Configure Twilio Credentials

Create `server/.env` with your Twilio credentials:
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
OTP_EXPIRY_SECONDS=300
JWT_SECRET=your_super_secret_jwt_key
PORT=3000
NODE_ENV=development
```

Get your credentials from: https://console.twilio.com/

Check that `.env` (root) contains:
```env
VITE_API_URL=http://localhost:3000
```

## Step 3: Start the Servers

### Option A: Automated (Recommended)

**Windows:**
```bash
start-dev.bat
```

**Linux/Mac:**
```bash
./start-dev.sh
```

### Option B: Manual

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Step 4: Test Authentication

1. Open browser: `http://localhost:5173`
2. Click "Book Now" or navigate to `/login`
3. Enter:
   - Name: Your name
   - Phone: `+919876543210` (use your verified Twilio number)
   - Method: SMS or Voice
4. Click "Send OTP"
5. Check your phone for the code
6. Enter the 6-digit OTP
7. Click "Verify & Login"
8. ✅ You're logged in!

## Important Notes

### Twilio Trial Account
- Can only send to **verified phone numbers**
- Verify your number at: https://console.twilio.com/
- Go to: Phone Numbers → Verified Caller IDs

### Phone Number Format
- Must use E.164 format: `+[country code][number]`
- Examples:
  - India: `+919876543210`
  - US: `+12025551234`
  - UK: `+447700900123`

### Development Mode
- OTP is logged to server console
- Check terminal for: `🔐 OTP for +919876543210: 123456`

## Troubleshooting

### "Failed to send OTP"
→ Verify your phone number in Twilio Console

### CORS Error
→ Ensure backend is running on port 3000

### "Invalid phone number"
→ Use E.164 format with country code

### Rate Limit Error
→ Wait 60 seconds before retrying

## Next Steps

- 📖 Read [TWILIO_SETUP.md](./TWILIO_SETUP.md) for detailed setup
- 🧪 Follow [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing
- 📋 Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for architecture details

## Need Help?

Check the documentation:
- [TWILIO_SETUP.md](./TWILIO_SETUP.md) - Complete setup guide
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing scenarios
- [README.md](./README.md) - Project overview
- [server/README.md](./server/README.md) - API documentation

## Success Indicators

✅ Backend shows: `🚀 Metro Booking Auth Server running on port 3000`
✅ Frontend shows: `Local: http://localhost:5173`
✅ You can access the login page
✅ OTP is sent to your phone
✅ You can log in successfully

---

**Ready to go!** 🚀
