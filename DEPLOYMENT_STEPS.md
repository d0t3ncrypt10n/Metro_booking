# Quick Deployment Steps

Follow these steps to deploy your Metro Booking Service to Vercel.

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Vercel CLI installed: `npm install -g vercel`
- Twilio account with credentials

---

## Step 1: Deploy Backend First

```bash
# Navigate to server directory
cd server

# Login to Vercel (if not already logged in)
vercel login

# Deploy backend
vercel

# Follow prompts:
# - Project name: metro-booking-api
# - Deploy: Yes

# After deployment, note the URL (e.g., https://metro-booking-api-xxx.vercel.app)
```

### Add Backend Environment Variables

Go to Vercel Dashboard → Your Backend Project → Settings → Environment Variables

Add these variables:
```
TWILIO_ACCOUNT_SID=your_actual_twilio_sid
TWILIO_AUTH_TOKEN=your_actual_twilio_token
TWILIO_PHONE_NUMBER=your_actual_twilio_number
OTP_EXPIRY_SECONDS=300
JWT_SECRET=your_strong_random_secret_key
NODE_ENV=production
```

Then redeploy:
```bash
vercel --prod
```

**Save your backend URL!** You'll need it for the frontend.

---

## Step 2: Deploy Frontend

```bash
# Go back to root directory
cd ..

# Update .env.production with your backend URL
# Edit .env.production and replace:
# VITE_API_URL=https://your-actual-backend-url.vercel.app

# Deploy frontend
vercel

# Follow prompts:
# - Link to existing project: Yes (if you have one) or No
# - Project name: metro-booking-service
# - Deploy: Yes
```

### Add Frontend Environment Variables

Go to Vercel Dashboard → Your Frontend Project → Settings → Environment Variables

Add:
```
VITE_API_URL=https://your-backend-url.vercel.app
```

Then redeploy:
```bash
vercel --prod
```

**Save your frontend URL!**

---

## Step 3: Update Backend CORS

Now that you have your frontend URL, update backend to allow it:

### Add Frontend URL to Backend Environment Variables

Go to Vercel Dashboard → Backend Project → Settings → Environment Variables

Add:
```
FRONTEND_URL=https://your-frontend-url.vercel.app
```

Redeploy backend:
```bash
cd server
vercel --prod
```

---

## Step 4: Test Your Deployment

### Test Backend
```bash
# Health check
curl https://your-backend-url.vercel.app/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Test Frontend
1. Open: `https://your-frontend-url.vercel.app`
2. Navigate to login page
3. Enter phone number (must be verified in Twilio for trial accounts)
4. Request OTP
5. Enter OTP and login
6. Test admin access with Jayant's credentials

---

## Step 5: Verify Twilio Phone Numbers

For Twilio trial accounts:
1. Go to https://console.twilio.com/
2. Navigate to Phone Numbers → Verified Caller IDs
3. Add and verify test phone numbers
4. Use only verified numbers for testing

---

## Quick Reference

### Your Deployment URLs
```
Backend:  https://metro-booking-api-xxx.vercel.app
Frontend: https://metro-booking-service-xxx.vercel.app
```

### Environment Variables Summary

**Backend (server/.env on Vercel):**
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER
- OTP_EXPIRY_SECONDS=300
- JWT_SECRET
- NODE_ENV=production
- FRONTEND_URL (your frontend URL)

**Frontend (.env.production on Vercel):**
- VITE_API_URL (your backend URL)

---

## Troubleshooting

### CORS Errors
- Verify FRONTEND_URL is set in backend environment variables
- Redeploy backend after adding FRONTEND_URL

### OTP Not Sending
- Check Twilio credentials in backend environment variables
- Verify phone numbers in Twilio Console (trial accounts)
- Check Twilio Console logs for errors

### Build Errors
- Check Vercel deployment logs
- Verify all dependencies in package.json
- Test build locally: `npm run build`

---

## Need Help?

See detailed guide: [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

---

**That's it!** Your Metro Booking Service is now live on Vercel! 🚀
