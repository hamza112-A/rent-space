import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 - try to refresh token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token (cookies are sent automatically)
        await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        
        // Retry the original request
        return api(originalRequest);
      } catch {
        // Refresh failed, redirect to login
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Auth API
export const authApi = {
  register: (data: { email: string; phone: string; password: string; fullName: string; role: string }) =>
    api.post('/auth/register', data),
  login: (data: { email?: string; phone?: string; password: string }) =>
    api.post('/auth/login', data),
  verifyOTP: (data: { userId: string; otp: string; type: 'email' | 'phone' }) =>
    api.post('/auth/verify-otp', data),
  resendOTP: (data: { userId: string; type: 'email' | 'phone' }) =>
    api.post('/auth/resend-otp', data),
  selectRole: (data: { userId: string; role: 'owner' | 'borrower' | 'both' }) =>
    api.post('/auth/select-role', data),
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
};

// User API
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: FormData | object) =>
    api.patch('/users/profile', data),
  getVerificationStatus: () => api.get('/users/verification'),
  uploadIDDocument: (data: FormData) =>
    api.post('/users/verification/id', data),
  verifyBiometric: (data: FormData) =>
    api.post('/users/verification/biometric', data),
  getUserStats: () => api.get('/users/stats'),
  getPublicProfile: (userId: string) => api.get(`/users/${userId}`),
  getReviews: (userId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/users/${userId}/reviews`, { params }),
  addReview: (userId: string, data: { rating: number; comment: string; bookingId: string }) =>
    api.post(`/users/${userId}/reviews`, data),
};

// Categories API
export const categoryApi = {
  getAll: () => api.get('/categories'),
  getById: (categoryId: string) => api.get(`/categories/${categoryId}`),
  getSubcategories: (categoryId: string) => api.get(`/categories/${categoryId}/subcategories`),
  getDynamicFields: (subcategoryId: string) => api.get(`/categories/fields/${subcategoryId}`),
};

// Listings API
export const listingApi = {
  create: (data: FormData) => api.post('/listings', data),
  update: (listingId: string, data: FormData) => api.patch(`/listings/${listingId}`, data),
  delete: (listingId: string) => api.delete(`/listings/${listingId}`),
  getById: (listingId: string) => api.get(`/listings/${listingId}`),
  getMyListings: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/listings/my', { params }),
  search: (params: {
    query?: string;
    category?: string;
    subcategory?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    minPrice?: number;
    maxPrice?: number;
    priceType?: 'hourly' | 'daily' | 'weekly' | 'monthly';
    startDate?: string;
    endDate?: string;
    verified?: boolean;
    instantBook?: boolean;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => api.get('/listings/search', { params }),
  getSimilar: (listingId: string) => api.get(`/listings/${listingId}/similar`),
  getAvailability: (listingId: string, params: { startDate: string; endDate: string }) =>
    api.get(`/listings/${listingId}/availability`, { params }),
  updateAvailability: (listingId: string, data: { dates: string[]; available: boolean }) =>
    api.patch(`/listings/${listingId}/availability`, data),
  uploadMedia: (listingId: string, data: FormData) =>
    api.post(`/listings/${listingId}/media`, data),
  deleteMedia: (listingId: string, mediaId: string) =>
    api.delete(`/listings/${listingId}/media/${mediaId}`),
  toggleFavorite: (listingId: string) => api.post(`/listings/${listingId}/favorite`),
  getFavorites: (params?: { page?: number; limit?: number }) =>
    api.get('/listings/favorites', { params }),
  report: (listingId: string, data: { reason: string; description: string }) =>
    api.post(`/listings/${listingId}/report`, data),
};

// Bookings API
export const bookingApi = {
  create: (data: {
    listingId: string;
    startDate: string;
    endDate: string;
    priceType: string;
    message?: string;
  }) => api.post('/bookings', data),
  getById: (bookingId: string) => api.get(`/bookings/${bookingId}`),
  getMyBookings: (params?: { page?: number; limit?: number; status?: string; role?: 'renter' | 'owner' }) =>
    api.get('/bookings', { params }),
  approve: (bookingId: string) => api.post(`/bookings/${bookingId}/approve`),
  reject: (bookingId: string, data: { reason?: string }) =>
    api.post(`/bookings/${bookingId}/reject`, data),
  cancel: (bookingId: string, data: { reason?: string }) =>
    api.post(`/bookings/${bookingId}/cancel`, data),
  complete: (bookingId: string) => api.post(`/bookings/${bookingId}/complete`),
};

// Payments API
export const paymentApi = {
  initiate: (data: {
    bookingId: string;
    method: 'jazzcash' | 'easypaisa' | 'card' | 'bank';
    returnUrl?: string;
  }) => api.post('/payments/initiate', data),
  verify: (paymentId: string) => api.get(`/payments/${paymentId}/verify`),
  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/payments/history', { params }),
};

// Subscription API
export const subscriptionApi = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrentPlan: () => api.get('/subscriptions/current'),
  subscribe: (data: { planId: string; paymentMethod: string }) =>
    api.post('/subscriptions/subscribe', data),
  cancel: () => api.post('/subscriptions/cancel'),
};

// Messages API (for future use)
export const messageApi = {
  getConversations: (params?: { page?: number; limit?: number }) =>
    api.get('/messages/conversations', { params }),
  getMessages: (conversationId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/messages/conversations/${conversationId}`, { params }),
  sendMessage: (data: { recipientId: string; content: string; listingId?: string }) =>
    api.post('/messages', data),
  markAsRead: (conversationId: string) =>
    api.post(`/messages/conversations/${conversationId}/read`),
};

export default api;
