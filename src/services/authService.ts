const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface SendOTPRequest {
  phone: string;
  name?: string;
  method?: 'sms' | 'voice';
}

export interface SendOTPResponse {
  message: string;
  expiresIn: number;
}

export interface VerifyOTPRequest {
  phone: string;
  otp: string;
  name?: string;
}

export interface VerifyOTPResponse {
  message: string;
  token: string;
  user: {
    phone: string;
    name: string;
    loginTime: string;
  };
}

export interface AuthError {
  error: string;
}

/**
 * Send OTP to phone number via SMS or Voice
 */
export async function sendOTP(data: SendOTPRequest): Promise<SendOTPResponse> {
  const response = await fetch(`${API_URL}/auth/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to send OTP');
  }

  return result;
}

/**
 * Verify OTP and receive JWT token
 */
export async function verifyOTP(data: VerifyOTPRequest): Promise<VerifyOTPResponse> {
  const response = await fetch(`${API_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to verify OTP');
  }

  return result;
}

/**
 * Refresh JWT token
 */
export async function refreshToken(token: string): Promise<{ token: string }> {
  const response = await fetch(`${API_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to refresh token');
  }

  return result;
}

/**
 * Get user profile (protected route example)
 */
export async function getUserProfile(token: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to get profile');
  }

  return result;
}
