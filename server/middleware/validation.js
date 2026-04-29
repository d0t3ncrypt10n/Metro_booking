/**
 * Validate phone number format
 */
export function validatePhoneNumber(req, res, next) {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Check if it's a valid length (10 digits for India, or 12 with country code)
  if (cleaned.length !== 10 && cleaned.length !== 12) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format. Please enter a 10-digit number.'
    });
  }

  next();
}

/**
 * Validate OTP code format
 */
export function validateOtpCode(req, res, next) {
  const { phone, code, name } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'OTP code is required'
    });
  }

  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Name is required'
    });
  }

  // OTP should be 6 digits
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({
      success: false,
      message: 'OTP must be 6 digits'
    });
  }

  next();
}
