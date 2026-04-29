# Vercel Deployment Guide

This guide will help you deploy both the frontend and backend of the Metro Booking Service to Vercel.

## Architecture

The application consists of two parts:
1. **Frontend** (React + Vite) - Main application
2. **Backend** (Express + Twilio) - Authentication API

Both will be deployed as separate Vercel projects.

---

## Part 1: Deploy Backend (Authentication Server)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy Backend
```bash
cd server
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account/team
- **Link to existing project?** → No
- **Project name?** → `metro-booking-api` (or your preferred name)
- **Directory?** → `./` (current directory)
- **Override settings?** → No

### Step 4: Configure Environment Variables

After deployment, add environment variables in Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Select your `metro-booking-api` project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
OTP_EXPIRY_SECONDS=300
JWT_SECRET=your_super_secret_jwt_key_production
PORT=3000
NODE_ENV=production
```

**Important**: Use strong, production-ready values!

### Step 5: Redeploy with Environment Variables
```bash
vercel --prod
```

### Step 6: Note Your Backend URL
After deployment, you'll get a URL like:
```
https://metro-booking-api.vercel.app
```

**Save this URL** - you'll need it for the frontend configuration.

---

## Part 2: Deploy Frontend

### Step 1: Update Frontend Environment Variables

Create/update `.env.production`:
```bash
VITE_API_URL=https://your-backend-url.vercel.app
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_ANALYTICS=false
VITE_MAP_CENTER_X=500
VITE_MAP_CENTER_Y=400
```

Replace `your-backend-url.vercel.app` with your actual backend URL from Part 1.

### Step 2: Update CORS in Backend

Update `server/src/app.js` to allow your frontend domain:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-url.vercel.app'] 
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
```

### Step 3: Deploy Frontend
```bash
# From root directory
cd ..
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account/team
- **Link to existing project?** → Yes (if you have existing project) or No
- **Project name?** → `metro-booking-service` (or your preferred name)
- **Directory?** → `./` (current directory)
- **Override settings?** → No

### Step 4: Configure Frontend Environment Variables

1. Go to Vercel Dashboard
2. Select your `metro-booking-service` project
3. Go to **Settings** → **Environment Variables**
4. Add:

```
VITE_API_URL=https://your-backend-url.vercel.app
```

### Step 5: Deploy to Production
```bash
vercel --prod
```

---

## Part 3: Update Backend CORS

Now that you have your frontend URL, update the backend CORS configuration:

### Step 1: Update Backend Environment Variable

In Vercel Dashboard for your backend project:
1. Go to **Settings** → **Environment Variables**
2. Add:
```
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### Step 2: Update Backend Code

Update `server/src/app.js`:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

### Step 3: Redeploy Backend
```bash
cd server
vercel --prod
```

---

## Verification

### Test Backend API
```bash
# Health check
curl https://your-backend-url.vercel.app/health

# Send OTP (replace with verified phone number)
curl -X POST https://your-backend-url.vercel.app/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "name": "Test User", "method": "sms"}'
```

### Test Frontend
1. Open your frontend URL: `https://your-frontend-url.vercel.app`
2. Navigate to login page
3. Enter phone number and name
4. Request OTP
5. Verify OTP
6. Check if login works

---

## Troubleshooting

### Issue: CORS Errors
**Solution**:
1. Verify `FRONTEND_URL` is set correctly in backend environment variables
2. Check CORS configuration in `server/src/app.js`
3. Redeploy backend after changes

### Issue: Environment Variables Not Working
**Solution**:
1. Verify all environment variables are set in Vercel Dashboard
2. Redeploy with `vercel --prod` after adding variables
3. Check logs: `vercel logs <deployment-url>`

### Issue: Backend Not Responding
**Solution**:
1. Check Vercel logs: `vercel logs <deployment-url>`
2. Verify `vercel.json` configuration in server directory
3. Ensure all dependencies are in `package.json`

### Issue: Twilio Not Sending SMS
**Solution**:
1. Verify Twilio credentials in environment variables
2. Check Twilio Console for errors
3. Ensure phone numbers are verified (trial accounts)
4. Check Twilio account balance

### Issue: Build Fails
**Solution**:
1. Check build logs in Vercel Dashboard
2. Verify all dependencies are listed in `package.json`
3. Test build locally: `npm run build`
4. Check Node.js version compatibility

---

## Production Checklist

Before going live:

### Backend
- [ ] All environment variables set in Vercel
- [ ] Strong JWT_SECRET configured
- [ ] CORS configured for production frontend URL
- [ ] Twilio credentials verified
- [ ] Rate limiting configured
- [ ] Error logging enabled

### Frontend
- [ ] VITE_API_URL points to production backend
- [ ] Build succeeds without errors
- [ ] All routes work correctly
- [ ] Admin access tested
- [ ] Dark mode works
- [ ] Mobile responsive

### Security
- [ ] No credentials in code
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Environment variables secured
- [ ] Rate limiting active
- [ ] JWT tokens secure

### Testing
- [ ] SMS OTP delivery works
- [ ] Voice OTP delivery works
- [ ] Login/logout works
- [ ] Admin access works
- [ ] Protected routes work
- [ ] Session persistence works

---

## Useful Commands

### Deploy to Preview
```bash
vercel
```

### Deploy to Production
```bash
vercel --prod
```

### View Logs
```bash
vercel logs <deployment-url>
```

### List Deployments
```bash
vercel ls
```

### Remove Deployment
```bash
vercel rm <deployment-name>
```

### View Environment Variables
```bash
vercel env ls
```

### Add Environment Variable
```bash
vercel env add <NAME>
```

---

## Custom Domain (Optional)

### Add Custom Domain

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter your domain name
6. Follow DNS configuration instructions

### Update Environment Variables

After adding custom domain, update:
- Backend: `FRONTEND_URL` to your custom domain
- Frontend: `VITE_API_URL` to backend custom domain

---

## Monitoring

### Vercel Analytics
Enable in Vercel Dashboard:
1. Go to **Analytics** tab
2. Enable Web Analytics
3. View real-time metrics

### Error Tracking
Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- DataDog for monitoring

---

## Cost Considerations

### Vercel Free Tier Includes:
- Unlimited deployments
- 100 GB bandwidth/month
- Automatic HTTPS
- Preview deployments
- Analytics

### Vercel Pro ($20/month):
- 1 TB bandwidth
- Advanced analytics
- Team collaboration
- Priority support

### Twilio Costs:
- SMS: ~$0.0075 per message
- Voice: ~$0.013 per minute
- Phone number: ~$1/month

---

## Support

### Vercel Documentation
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

### Project Documentation
- Quick Start: QUICK_START.md
- Twilio Setup: TWILIO_SETUP.md
- Testing: TESTING_GUIDE.md

### GitHub Repository
- Issues: https://github.com/d0t3ncrypt10n/Metro_booking/issues

---

## Summary

Your Metro Booking Service is now deployed on Vercel with:
- ✅ Frontend: React + Vite application
- ✅ Backend: Express + Twilio authentication API
- ✅ Secure environment variables
- ✅ CORS configured
- ✅ HTTPS enabled
- ✅ Production-ready

**Deployment Date**: April 30, 2026
**Status**: Ready for Production
