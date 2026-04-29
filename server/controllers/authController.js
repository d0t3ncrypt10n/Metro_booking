import { sendOtpViaTwilio, verifyOtpViaTwilio } from '../services/twilioService.js';
import { createUser, getUserByPhone, updateUser } from '../services/userService.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Send OTP to phone number
 */
export async function sendOtpController(req, res, next) {
  try {
    const { phone, channel = 'sms' } = req.body;

    // Validate channel
    if (!['sms', 'call'].includes(channel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid channel. Must be "sms" or "call"'
      });
    }

    // Send OTP via Twilio
    const result = await sendOtpViaTwilio(phone, channel);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to send OTP'
      });
    }

    res.json({
      success: true,
      message: `OTP sent via ${channel} to ${phone}`,
      verificationSid: result.verificationSid
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    next(error);
  }
}

/**
 * Verify OTP and authenticate user
 */
export async function verifyOtpController(req, res, next) {
  try {
    const { phone, code, name } = req.body;

    // Verify OTP with Twilio
    const verification = await verifyOtpViaTwilio(phone, code);

    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: verification.message || 'Invalid or expired OTP'
      });
    }

    // Check if user exists
    let user = await getUserByPhone(phone);

    if (!user) {
      // Create new user (signup)
      user = await createUser({
        name,
        phone,
        phoneVerified: true
      });
    } else {
      // Update existing user
      user = await updateUser(user.id, {
        name: name || user.name,
        phoneVerified: true,
        loginTime: new Date().toISOString()
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        loginTime: user.loginTime,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    next(error);
  }
}
