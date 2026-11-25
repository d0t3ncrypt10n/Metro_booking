const crypto = require('crypto');

const otpStore = new Map();
const OTP_EXPIRY_MS = (parseInt(process.env.OTP_EXPIRY_SECONDS) || 300) * 1000;
const MAX_ATTEMPTS = 5;

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function storeOTP(phone, otp, name = null) {
  otpStore.set(phone, {
    hash: hashOTP(otp),
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
    name: name,
  });
}

function verifyOTP(phone, inputOtp) {
  const record = otpStore.get(phone);

  if (!record) {
    return { success: false, reason: 'OTP not found. Request a new one.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return { success: false, reason: 'OTP has expired. Request a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(phone);
    return { success: false, reason: 'Too many attempts. Request a new OTP.' };
  }

  record.attempts++;

  const inputHash = hashOTP(inputOtp);
  const isValid = record.hash === inputHash;

  if (!isValid) {
    return {
      success: false,
      reason: `Invalid OTP. ${MAX_ATTEMPTS - record.attempts} attempts remaining.`,
    };
  }

  const userName = record.name;
  otpStore.delete(phone);
  return { success: true, name: userName };
}

module.exports = { generateOTP, storeOTP, verifyOTP };