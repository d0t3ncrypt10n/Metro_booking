import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../store/bookingStore';
import { useAuth } from '../hooks/useAuth';
import { sendOTP, verifyOTP } from '../services/authService';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import Icon from '../components/atoms/Icon';
import Card from '../components/atoms/Card';

export default function Login() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpMethod, setOtpMethod] = useState<'sms' | 'voice'>('sms');
  const [otpExpiresIn, setOtpExpiresIn] = useState<number>(300);
  const navigate = useNavigate();
  const { source, destination, route } = useBookingStore();
  const { login } = useAuth();

  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem('metroUser');
    if (user) {
      // If there's booking data, go to confirmation, otherwise go home
      if (source && destination && route) {
        navigate('/confirmation');
      } else {
        navigate('/');
      }
    }
  }, [navigate, source, destination, route]);

  // Format phone number to E.164 format
  const formatPhoneE164 = (phoneNumber: string): string => {
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '');
    
    // If starts with country code, use as is
    if (digits.startsWith('91') && digits.length === 12) {
      return `+${digits}`;
    }
    
    // If 10 digits, assume India (+91)
    if (digits.length === 10) {
      return `+91${digits}`;
    }
    
    // If starts with 1 and has 11 digits, assume US/Canada
    if (digits.startsWith('1') && digits.length === 11) {
      return `+${digits}`;
    }
    
    // Default: add + if not present
    return digits.startsWith('+') ? digits : `+${digits}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!phone.trim() || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneE164(phone);
      const response = await sendOTP({
        phone: formattedPhone,
        name: name.trim(),
        method: otpMethod,
      });

      setOtpExpiresIn(response.expiresIn);
      setStep('otp');
      setError('');
      
      // Show success message
      console.log(`✅ OTP sent via ${otpMethod} to ${formattedPhone}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
      console.error('Send OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneE164(phone);
      const response = await verifyOTP({
        phone: formattedPhone,
        otp: otp.trim(),
        name: name.trim(),
      });

      // Store user data and token using the login function from useAuth
      login(response.user, response.token);
      
      console.log('✅ Login successful:', response.user);
      
      // If there's booking data, go to confirmation, otherwise go home
      if (source && destination && route) {
        navigate('/confirmation');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP. Please try again.');
      console.error('Verify OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp('');
    setError('');
    setLoading(true);

    try {
      const formattedPhone = formatPhoneE164(phone);
      const response = await sendOTP({
        phone: formattedPhone,
        name: name.trim(),
        method: otpMethod,
      });

      setOtpExpiresIn(response.expiresIn);
      console.log(`✅ OTP resent via ${otpMethod} to ${formattedPhone}`);
      
      // Show success feedback
      alert(`OTP has been resent via ${otpMethod.toUpperCase()}`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
      console.error('Resend OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background-light to-blue-50 dark:from-slate-900 dark:via-background-dark dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 text-primary mb-4">
            <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z" fill="currentColor"/>
              <path clipRule="evenodd" d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764Z" fill="currentColor" fillRule="evenodd"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">Welcome to MetroGo</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {step === 'phone' ? 'Sign in to plan your journey' : 'Enter the OTP sent to your phone'}
          </p>
        </div>

        <Card className="p-8">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon name="person" />
                  </span>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-12"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon name="phone" />
                  </span>
                  <Input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-12"
                    disabled={loading}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Enter with country code (e.g., +91 for India)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Delivery Method
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOtpMethod('sms')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      otpMethod === 'sms'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                    }`}
                    disabled={loading}
                  >
                    <Icon name="message" className="text-xl mb-1" />
                    <div className="text-sm font-medium">SMS</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpMethod('voice')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      otpMethod === 'voice'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                    }`}
                    disabled={loading}
                  >
                    <Icon name="phone_in_talk" className="text-xl mb-1" />
                    <div className="text-sm font-medium">Voice Call</div>
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                  <Icon name="error" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Icon name="send" />
                    Send OTP
                  </>
                )}
              </Button>

              <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                By continuing, you agree to MetroGo's Terms of Service and Privacy Policy
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/10 dark:bg-primary/20 mb-4">
                  <Icon name="lock" className="text-3xl text-primary" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  OTP sent to <span className="font-semibold text-slate-900 dark:text-slate-50">{phone}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Enter OTP
                </label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-bold"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                  <Icon name="error" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Icon name="check_circle" />
                    Verify & Login
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1"
                  disabled={loading}
                >
                  <Icon name="arrow_back" className="text-sm" />
                  Change Number
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-primary hover:text-primary-dark transition-colors font-medium"
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </Card>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>🔐 Secured with Twilio SMS/Voice Authentication</p>
          <p className="mt-1">OTP expires in {Math.floor(otpExpiresIn / 60)} minutes</p>
        </div>
      </div>
    </div>
  );
}
