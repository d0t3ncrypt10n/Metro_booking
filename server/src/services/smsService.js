const twilioClient = require('./config/twilio');

async function sendOTPSMS(phone, otp) {
  try {
    const message = await twilioClient.messages.create({
      body: `Your Metro Booking verification code is ${otp}. It expires in 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    console.log(`SMS sent to ${phone}. SID: ${message.sid}`);
    return message.sid;
  } catch (error) {
    console.error('Twilio SMS error:', error.message);
    throw new Error('Failed to send SMS. Please try again.');
  }
}

module.exports = { sendOTPSMS };