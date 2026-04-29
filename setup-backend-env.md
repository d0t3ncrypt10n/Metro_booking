# Backend Environment Variables Setup

Your backend is deployed at:
**https://server-omega-livid-e3sqobxnpo.vercel.app**

## Add Environment Variables

Run these commands to add environment variables to your backend:

```bash
cd server

# Add Twilio Account SID
vercel env add TWILIO_ACCOUNT_SID production
# When prompted, enter your actual Twilio Account SID

# Add Twilio Auth Token
vercel env add TWILIO_AUTH_TOKEN production
# When prompted, enter your actual Twilio Auth Token

# Add Twilio Phone Number
vercel env add TWILIO_PHONE_NUMBER production
# When prompted, enter: +19855455704 (or your actual number)

# Add OTP Expiry
vercel env add OTP_EXPIRY_SECONDS production
# When prompted, enter: 300

# Add JWT Secret
vercel env add JWT_SECRET production
# When prompted, enter a strong random secret (generate one below)

# Add Node Environment
vercel env add NODE_ENV production
# When prompted, enter: production
```

## Generate Strong JWT Secret

Run this command to generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it as your JWT_SECRET.

## After Adding Environment Variables

Redeploy the backend:
```bash
vercel --prod
```

## Or Use Vercel Dashboard

Alternatively, add environment variables via Vercel Dashboard:
1. Go to: https://vercel.com/dashboard
2. Select your "server" project
3. Go to Settings → Environment Variables
4. Add each variable for "Production" environment

Variables to add:
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER
- OTP_EXPIRY_SECONDS = 300
- JWT_SECRET (use generated secret)
- NODE_ENV = production

Then redeploy from dashboard or run `vercel --prod` in server directory.
