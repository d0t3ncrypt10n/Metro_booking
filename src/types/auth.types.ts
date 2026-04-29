export interface User {
  id: string;
  name: string;
  phone: string;
  phoneVerified: boolean;
  loginTime: string;
  role?: 'user' | 'admin';
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface OtpVerification {
  phone: string;
  code: string;
  verificationSid?: string;
  attempts: number;
  expiresAt: number;
}
