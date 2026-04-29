import express from 'express';
import { sendOtpController, verifyOtpController } from '../controllers/authController.js';
import { validatePhoneNumber, validateOtpCode } from '../middleware/validation.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Send OTP via SMS or Voice
router.post('/send-otp', rateLimiter, validatePhoneNumber, sendOtpController);

// Verify OTP and authenticate
router.post('/verify-otp', rateLimiter, validateOtpCode, verifyOtpController);

export default router;
