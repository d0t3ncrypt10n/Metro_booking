import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
let client;
let useVerifyService = false;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
  useVerifyService = !!verifySid;
  console.log('✅ Twilio client initialized');
  console.log(`📞 Using ${useVerifyService ? 'Verify Service' : 'Programmable SMS'}`);
} else {
  console.warn('⚠️  Twilio credentials not configured. OTP will be simulated.');
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phone) {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present (assuming India +91)
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  return '+' + cleaned;
}

/**
 * Send OTP using Twilio Verify Service (recommended)
 */
async function sendOtpWithVerifyService(phone, channel) {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({
        to: formattedPhone,
        channel: channel // 'sms' or 'call'
      });

    return {
      success: true,
      verificationSid: verification.sid,
      status: verification.status
    };
  } catch (error) {
    console.error('Twilio Verify Service error:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Send OTP using Programmable SMS/Voice (fallback)
 */
async function sendOtpWithProgrammableSMS(phone, channel) {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP temporarily (in production, use Redis or database)
    global.otpStore = global.otpStore || {};
    global.otpStore[formattedPhone] = {
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    };

    if (channel === 'sms') {
      // Send SMS
      const message = await client.messages.create({
        body: `Your Metro Booking verification code is: ${otp}. Valid for 10 minutes.`,
        from: twilioPhoneNumber,
        to: formattedPhone
      });

      return {
        success: true,
        messageSid: message.sid,
        status: message.status
      };
    } else if (channel === 'call') {
      // Make voice call
      const call = await client.calls.create({
        twiml: `<Response><Say>Your Metro Booking verification code is: ${otp.split('').join(', ')}. I repeat: ${otp.split('').join(', ')}</Say></Response>`,
        to: formattedPhone,
        from: twilioPhoneNumber
      });

      return {
        success: true,
        callSid: call.sid,
        status: call.status
      };
    }
  } catch (error) {
    console.error('Twilio Programmable SMS/Voice error:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Simulate OTP for development (when Twilio is not configured)
 */
function simulateOtp(phone) {
  const otp = '123456'; // Fixed OTP for testing
  console.log(`📱 [DEV MODE] OTP for ${phone}: ${otp}`);
  
  const formattedPhone = formatPhoneNumber(phone);
  global.otpStore = global.otpStore || {};
  global.otpStore[formattedPhone] = {
    code: otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0
  };

  return {
    success: true,
    message: 'OTP sent (simulated)',
    devMode: true
  };
}

/**
 * Send OTP via Twilio
 */
export async function sendOtpViaTwilio(phone, channel = 'sms') {
  // If Twilio is not configured, simulate OTP
  if (!client) {
    return simulateOtp(phone);
  }

  // Use Verify Service if available, otherwise use Programmable SMS
  if (useVerifyService) {
    return sendOtpWithVerifyService(phone, channel);
  } else {
    return sendOtpWithProgrammableSMS(phone, channel);
  }
}

/**
 * Verify OTP using Twilio Verify Service
 */
async function verifyOtpWithVerifyService(phone, code) {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({
        to: formattedPhone,
        code: code
      });

    return {
      success: verificationCheck.status === 'approved',
      status: verificationCheck.status
    };
  } catch (error) {
    console.error('Twilio Verify Check error:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Verify OTP using stored OTP (for Programmable SMS)
 */
function verifyStoredOtp(phone, code) {
  const formattedPhone = formatPhoneNumber(phone);
  const stored = global.otpStore?.[formattedPhone];

  if (!stored) {
    return {
      success: false,
      message: 'No OTP found. Please request a new one.'
    };
  }

  if (Date.now() > stored.expiresAt) {
    delete global.otpStore[formattedPhone];
    return {
      success: false,
      message: 'OTP has expired. Please request a new one.'
    };
  }

  if (stored.attempts >= 3) {
    delete global.otpStore[formattedPhone];
    return {
      success: false,
      message: 'Too many failed attempts. Please request a new OTP.'
    };
  }

  if (stored.code !== code) {
    stored.attempts++;
    return {
      success: false,
      message: `Invalid OTP. ${3 - stored.attempts} attempts remaining.`
    };
  }

  // Success - clean up
  delete global.otpStore[formattedPhone];
  return {
    success: true,
    message: 'OTP verified successfully'
  };
}

/**
 * Verify OTP via Twilio
 */
export async function verifyOtpViaTwilio(phone, code) {
  // If using Verify Service
  if (client && useVerifyService) {
    return verifyOtpWithVerifyService(phone, code);
  }
  
  // Otherwise verify against stored OTP
  return verifyStoredOtp(phone, code);
}
