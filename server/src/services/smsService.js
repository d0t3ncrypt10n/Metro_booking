const twilioClient = require('../config/twilio');

async function sendOTPSMS(phone, otp) {
  try {
    const message = await twilioClient.messages.create({
      body: `Your Metro Booking verification code is ${otp}. It expires in 5 minutes. Do not share this code.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    console.log(`SMS sent successfully to ${phone}. SID: ${message.sid}`);
    return message.sid;
  } catch (error) {
    console.error('Twilio SMS error:', error.message);
    throw new Error('Failed to send SMS. Please check the phone number and try again.');
  }
}

async function sendOTPVoice(phone, otp) {
  try {
    const call = await twilioClient.calls.create({
      twiml: `<Response><Say voice="alice">Your Metro Booking verification code is ${otp.split('').join(', ')}. I repeat, ${otp.split('').join(', ')}.</Say></Response>`,
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    console.log(`Voice call initiated to ${phone}. SID: ${call.sid}`);
    return call.sid;
  } catch (error) {
    console.error('Twilio Voice error:', error.message);
    throw new Error('Failed to initiate voice call. Please try SMS instead.');
  }
}

module.exports = { sendOTPSMS, sendOTPVoice };
