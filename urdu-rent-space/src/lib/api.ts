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
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
  deleteAccount: (password: string) =>
    api.delete('/auth/delete-account', { data: { password } }),
  // 2FA
  get2FAStatus: () => api.get('/auth/2fa/status'),
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FA: (token: string) => api.post('/auth/2fa/verify', { token }),
  disable2FA: (data: { password: string; token?: string }) => api.post('/auth/2fa/disable', data),
  regenerateBackupCodes: (password: string) => api.post('/auth/2fa/backup-codes', { password }),
};

// User API
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: FormData | object) => {
    // If data is FormData, don't set Content-Type header (let browser set it with boundary)
    if (data instanceof FormData) {
      return api.patch('/users/profile', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.patch('/users/profile', data);
  },
  getVerificationStatus: () => api.get('/users/verification'),
  uploadIDDocument: (data: FormData) =>
    api.post('/users/verification/id', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  verifyBiometric: (data: FormData) =>
    api.post('/users/verification/biometric', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
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
  create: (data: FormData) => api.post('/listings', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (listingId: string, data: FormData) => api.put(`/listings/${listingId}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (listingId: string) => api.delete(`/listings/${listingId}`),
  getById: (listingId: string) => api.get(`/listings/${listingId}`),
  getMyListings: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/listings/user/my-listings', { params }),
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
    sort?: string;
    page?: number;
    limit?: number;
  }) => api.get('/listings', { params }),
  getSimilar: (listingId: string) => api.get(`/listings/${listingId}/similar`),
  getAvailability: (listingId: string, params: { startDate: string; endDate: string }) =>
    api.get(`/listings/${listingId}/availability`, { params }),
  updateAvailability: (listingId: string, data: { dates: string[]; available: boolean }) =>
    api.patch(`/listings/${listingId}/availability`, data),
  uploadMedia: (listingId: string, data: FormData) =>
    api.post(`/listings/${listingId}/media`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
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
    message?: string;
  }) => api.post('/bookings', data),
  getById: (bookingId: string) => api.get(`/bookings/${bookingId}`),
  getMyBookings: (params?: { page?: number; limit?: number; status?: string; type?: 'renter' | 'owner' }) =>
    api.get('/bookings', { params }),
  approve: (bookingId: string) => api.put(`/bookings/${bookingId}/status`, { status: 'approved' }),
  reject: (bookingId: string, data: { reason?: string }) =>
    api.put(`/bookings/${bookingId}/status`, { status: 'rejected', ...data }),
  cancel: (bookingId: string, data: { reason?: string }) =>
    api.put(`/bookings/${bookingId}/status`, { status: 'cancelled', ...data }),
  complete: (bookingId: string) => api.put(`/bookings/${bookingId}/status`, { status: 'completed' }),
};

// Payments API
export const paymentApi = {
  createIntent: (data: { bookingId?: string; amount: number; currency?: string }) =>
    api.post('/payments/create-intent', data),
  confirm: (data: { paymentIntentId: string }) =>
    api.post('/payments/confirm', data),
  getStatus: (paymentIntentId: string) =>
    api.get(`/payments/status/${paymentIntentId}`),
  initiate: (data: {
    bookingId: string;
    method: 'jazzcash' | 'easypaisa' | 'card' | 'bank';
    returnUrl?: string;
  }) => api.post('/payments/initiate', data),
  verify: (paymentId: string) => api.get(`/payments/${paymentId}/verify`),
  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/payments/history', { params }),
  getMethods: () => api.get('/payments/methods'),
  addMethod: (data: { type: string; details: Record<string, string> }) =>
    api.post('/payments/methods', data),
  deleteMethod: (methodId: string) => api.delete(`/payments/methods/${methodId}`),
  setDefaultMethod: (methodId: string) => api.put(`/payments/methods/${methodId}/default`),
};

// Subscription API
export const subscriptionApi = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrentPlan: () => api.get('/subscriptions/current'),
  subscribe: (data: { planId: string; paymentMethod: string }) =>
    api.post('/subscriptions/subscribe', data),
  cancel: () => api.post('/subscriptions/cancel'),
};

// Messages API
export const messageApi = {
  getConversations: (params?: { page?: number; limit?: number }) =>
    api.get('/messages', { params }),
  getMessages: (conversationId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/messages/${conversationId}/messages`, { params }),
  createConversation: (data: { participantId: string; listingId?: string; content?: string }) =>
    api.post('/messages', data),
  sendMessage: (conversationId: string, data: { content: string }) =>
    api.post(`/messages/${conversationId}/messages`, data),
  markAsRead: (conversationId: string) =>
    api.post(`/messages/${conversationId}/read`),
};

// Admin API (Super Admin only)
export const adminApi = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  
  // User Management
  getUsers: (params?: { page?: number; limit?: number; search?: string; status?: string; role?: string }) =>
    api.get('/admin/users', { params }),
  getUser: (userId: string) => api.get(`/admin/users/${userId}`),
  updateUserStatus: (userId: string, data: { status: string; reason?: string }) =>
    api.put(`/admin/users/${userId}/status`, data),
  verifyUser: (userId: string, type: string) =>
    api.put(`/admin/users/${userId}/verify`, { type }),
  updateUserRole: (userId: string, isAdmin: boolean) =>
    api.put(`/admin/users/${userId}/role`, { isAdmin }),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),
  
  // Listing Management
  getListings: (params?: { page?: number; limit?: number; status?: string; category?: string }) =>
    api.get('/admin/listings', { params }),
  updateListingStatus: (listingId: string, data: { status: string; reason?: string }) =>
    api.put(`/admin/listings/${listingId}/status`, data),
  verifyListing: (listingId: string, verified: boolean) =>
    api.put(`/admin/listings/${listingId}/verify`, { verified }),
  featureListing: (listingId: string, featured: boolean) =>
    api.put(`/admin/listings/${listingId}/feature`, { featured }),
  deleteListing: (listingId: string) => api.delete(`/admin/listings/${listingId}`),
  
  // Verification Management
  getVerifications: (params?: { page?: number; limit?: number; type?: string; status?: string }) =>
    api.get('/admin/verifications', { params }),
  approveVerification: (userId: string, type: string) =>
    api.put(`/admin/verifications/${userId}/approve`, { type }),
  rejectVerification: (userId: string, type: string, reason: string) =>
    api.put(`/admin/verifications/${userId}/reject`, { type, reason }),
  
  // Booking Management
  getBookings: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/admin/bookings', { params }),
  
  // Analytics
  getRevenueAnalytics: (period?: number) =>
    api.get('/admin/analytics/revenue', { params: { period } }),
  getUserAnalytics: (period?: number) =>
    api.get('/admin/analytics/users', { params: { period } }),
  getListingAnalytics: () => api.get('/admin/analytics/listings'),
  
  // Category Management
  getCategories: () => api.get('/admin/settings/categories'),
  createCategory: (data: any) => api.post('/admin/settings/categories', data),
  updateCategory: (categoryId: string, data: any) =>
    api.put(`/admin/settings/categories/${categoryId}`, data),
  deleteCategory: (categoryId: string) =>
    api.delete(`/admin/settings/categories/${categoryId}`),
};

export default api;
