import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, userApi } from '@/lib/api';

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  // Which dashboard a 'both' user is currently viewing — irrelevant for
  // single-role users, whose mode is implied by `role`.
  activeMode?: 'owner' | 'borrower';
  ownerProfile?: { onboardingCompletedAt?: string };
  buyerProfile?: { onboardingCompletedAt?: string };
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profileImage?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  adminRole?: 'none' | 'support' | 'finance' | 'superadmin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<{ requiresVerification: boolean; email: string }>;
  logout: () => Promise<void>;
  verifyOTP: (userId: string, otp: string, type: 'email' | 'phone') => Promise<void>;
  resendOTP: (userId: string, type: 'email' | 'phone') => Promise<void>;
  updateUser: (user: User) => void;
  checkAuth: () => Promise<void>;
  // Adds a role capability (owner and/or borrower) to the account —
  // additive, never removes a capability the user already has.
  addRole: (role: 'owner' | 'borrower') => Promise<{ addedCapability: boolean; role: string }>;
  // Switches which dashboard a 'both' user is currently viewing.
  setActiveMode: (mode: 'owner' | 'borrower') => Promise<void>;
}

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The API error middleware responds with { success: false, error: { message, details? } },
// not a top-level `message` — `details` is field-keyed (e.g. { email: ['...'] }) so forms
// can map server-side validation errors back to the specific field.
export class ApiError extends Error {
  details?: Record<string, string[]>;
  constructor(message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
  }
}

const extractErrorMessage = (data: any, fallback: string) => data?.error?.message || data?.message || fallback;
const extractErrorDetails = (data: any): Record<string, string[]> | undefined => data?.error?.details;

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Render's free tier sleeps after inactivity and can take up to ~60s to wake on
// the next request, so requests need a generous timeout instead of hanging forever.
const FETCH_TIMEOUT_MS = 60000;

const fetchWithTimeout = async (url: string, options: RequestInit = {}) => {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error('The server is taking too long to respond. It may be waking up from sleep — please try again in a moment.');
    }
    throw error;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/me`, {
        credentials: 'include', // Send cookies with request
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important: receive and store cookies
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(extractErrorMessage(data, 'Login failed'), extractErrorDetails(data));
    }

    // User data is returned, cookies are set automatically by browser
    setUser(data.data.user);
  };

  const register = async (registerData: RegisterData) => {
    const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(registerData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(extractErrorMessage(data, 'Registration failed'), extractErrorDetails(data));
    }

    return {
      requiresVerification: true,
      email: registerData.email
    };
  };

  const verifyOTP = async (userId: string, otp: string, type: 'email' | 'phone') => {
    const response = await fetchWithTimeout(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, otp, type })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(extractErrorMessage(data, 'Verification failed'), extractErrorDetails(data));
    }

    // Cookies are set automatically, update user state
    if (data.data?.user) {
      setUser(data.data.user);
    }
  };

  const resendOTP = async (userId: string, type: 'email' | 'phone') => {
    const response = await fetchWithTimeout(`${API_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, type })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(extractErrorMessage(data, 'Failed to resend OTP'), extractErrorDetails(data));
    }
  };

  const logout = async () => {
    try {
      await fetchWithTimeout(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const addRole = async (role: 'owner' | 'borrower') => {
    const response = await authApi.selectRole({ role });
    const { role: nextRole, activeMode, addedCapability } = response.data.data;
    setUser((prev) => (prev ? { ...prev, role: nextRole, activeMode } : prev));
    return { addedCapability, role: nextRole };
  };

  const setActiveMode = async (mode: 'owner' | 'borrower') => {
    await userApi.updateProfile({ activeMode: mode });
    setUser((prev) => (prev ? { ...prev, activeMode: mode } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        verifyOTP,
        resendOTP,
        updateUser,
        checkAuth,
        addRole,
        setActiveMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
