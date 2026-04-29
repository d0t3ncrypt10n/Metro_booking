const express = require('express');
const jwt = require('jsonwebtoken');
const { generateOTP, storeOTP, verifyOTP } = require('../services/otpService');
const { sendOTPSMS, sendOTPVoice } = require('../services/smsService');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

// Validate E.164 phone format — e.g. +919876543210
function isValidPhone(phone) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

// POST /auth/send-otp
router.post(
  '/send-otp',
  rateLimiter(3, 60 * 1000), // 3 requests per minute per IP
  async (req, res) => {
    const { phone, name, method = 'sms' } = req.body;

    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({
        error: 'A valid phone number in E.164 format is required. Example: +919876543210',
      });
    }

    // Name is optional but recommended for signup
    if (name && typeof name !== 'string') {
      return res.status(400).json({
        error: 'Name must be a string.',
      });
    }

    try {
      const otp = generateOTP();
      storeOTP(phone, otp, name);

      // Send via SMS or Voice
      if (method === 'voice') {
        await sendOTPVoice(phone, otp);
      } else {
        await sendOTPSMS(phone, otp);
      }

      // In development, log OTP to console
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 OTP for ${phone}: ${otp}`);
      }

      return res.status(200).json({
        message: `OTP sent successfully via ${method}.`,
        expiresIn: process.env.OTP_EXPIRY_SECONDS || 300,
      });
    } catch (err) {
      console.error('send-otp error:', err.message);
      return res.status(500).json({ 
        error: err.message || 'Failed to send OTP. Please try again.' 
      });
    }
  }
);

// POST /auth/verify-otp
router.post(
  '/verify-otp',
  rateLimiter(10, 60 * 1000), // 10 attempts per minute per IP
  (req, res) => {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required.' });
    }

    const result = verifyOTP(phone, otp);

    if (!result.success) {
      return res.status(401).json({ error: result.reason });
    }

    // Use name from OTP store if available, otherwise from request
    const userName = result.name || name || 'User';

    // Issue JWT on successful verification
    const token = jwt.sign(
      { phone, name: userName, verified: true },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Phone verified successfully.',
      token,
      user: {
        phone,
        name: userName,
        loginTime: new Date().toISOString(),
      },
    });
  }
);

// POST /auth/refresh-token
router.post('/refresh-token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Issue new token
    const newToken = jwt.sign(
      { phone: decoded.phone, name: decoded.name, verified: true },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Token refreshed successfully.',
      token: newToken,
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

module.exports = router;
