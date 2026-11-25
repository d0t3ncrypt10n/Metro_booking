const express = require('express');
const jwt = require('jsonwebtoken');
const { generateOTP, storeOTP, verifyOTP } = require('./services/otpService');
const { sendOTPSMS } = require('./services/smsService');
const rateLimiter = require('./middleware/rateLimiter');

const router = express.Router();

function isValidPhone(phone) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

router.post('/send-otp', rateLimiter(3, 60 * 1000), async (req, res) => {
  const { phone, name, method = 'sms' } = req.body;

  if (!phone || !isValidPhone(phone)) {
    return res.status(400).json({ error: 'Valid phone number required (e.g. +919876543210)' });
  }

  try {
    const otp = generateOTP();
    storeOTP(phone, otp, name);

    if (method === 'voice') {
      await sendOTPSMS(phone, otp);
    } else {
      await sendOTPSMS(phone, otp);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for ${phone}: ${otp}`);
    }

    return res.status(200).json({
      message: `OTP sent via ${method}`,
      expiresIn: process.env.OTP_EXPIRY_SECONDS || 300,
    });
  } catch (err) {
    console.error('send-otp error:', err.message);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/verify-otp', rateLimiter(10, 60 * 1000), (req, res) => {
  const { phone, otp, name } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP required' });
  }

  const result = verifyOTP(phone, otp);

  if (!result.success) {
    return res.status(401).json({ error: result.reason });
  }

  const userName = result.name || name || 'User';
  const token = jwt.sign(
    { phone, name: userName, verified: true },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(200).json({
    message: 'Phone verified',
    token,
    user: { phone, name: userName, loginTime: new Date().toISOString() },
  });
});

module.exports = router;