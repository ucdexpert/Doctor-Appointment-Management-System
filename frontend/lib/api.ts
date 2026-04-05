import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if refresh is in progress to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (error: Error) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Add token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors with automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if we have a refresh token
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      
      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken, user } = response.data;

        // Save new tokens
        localStorage.setItem('token', access_token);
        localStorage.setItem('refreshToken', newRefreshToken);
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }

        // Update authorization header
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Process queued requests
        processQueue(null, access_token);

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect
        processQueue(error as Error, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data: { name: string; email: string; password: string; role: string; phone?: string }) =>
    api.post('/auth/register', data),

  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),

  getMe: () => api.get('/auth/me'),

  changePassword: (data: { old_password: string; new_password: string }) =>
    api.put('/auth/change-password', data),

  updateProfile: (data: { name?: string; phone?: string; photo_url?: string | null }) =>
    api.put('/auth/profile', data),

  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),

  resetPassword: (data: { token: string; new_password: string }) =>
    api.post('/auth/reset-password', data),
};

// Doctor APIs
export const doctorsAPI = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/doctors', { params }),

  getById: (id: number) =>
    api.get(`/doctors/${id}`),

  createProfile: (data: Record<string, unknown>) =>
    api.post('/doctors/profile', data),

  updateProfile: (data: Record<string, unknown>) =>
    api.put('/doctors/profile', data),

  getMyDashboard: () =>
    api.get('/doctors/my/dashboard'),

  getSlots: (doctorId: number, date: string) =>
    api.get(`/doctors/${doctorId}/slots`, { params: { date } }),

  getQuickBookRecommendations: () =>
    api.get('/doctors/recommendations/quick-book'),
};

// Appointment APIs
export const appointmentsAPI = {
  getStats: () =>
    api.get('/appointments/stats'),

  create: (data: { doctor_id: number; appointment_date: string; time_slot: string; reason?: string }) =>
    api.post('/appointments', data),

  getMyAppointments: (params?: Record<string, string>) =>
    api.get('/appointments/my', { params }),

  getDoctorAppointments: (params?: Record<string, string>) =>
    api.get('/appointments/doctor', { params }),

  confirm: (id: number) =>
    api.put(`/appointments/${id}/confirm`),

  cancel: (id: number, data: { reason: string }) =>
    api.put(`/appointments/${id}/cancel`, data),

  complete: (id: number) =>
    api.put(`/appointments/${id}/complete`),

  addNotes: (id: number, data: { notes: string }) =>
    api.put(`/appointments/${id}/notes`, data),
};

// Schedule APIs
export const schedulesAPI = {
  getMySchedule: () =>
    api.get('/schedules/my'),

  create: (data: { day_of_week: string; start_time: string; end_time: string; slot_duration: number; is_available?: boolean }) =>
    api.post('/schedules', data),

  update: (id: number, data: { day_of_week?: string; start_time?: string; end_time?: string; slot_duration?: number; is_available?: boolean }) =>
    api.put(`/schedules/${id}`, data),

  delete: (id: number) =>
    api.delete(`/schedules/${id}`),
};

// Doctor profile APIs
export const doctorProfileAPI = {
  create: (data: { specialization: string; qualification: string; experience_years: number; consultation_fee: number; bio?: string; city: string }) =>
    api.post('/doctors/profile', data),

  update: (data: { specialization?: string; qualification?: string; experience_years?: number; consultation_fee?: number; bio?: string; city?: string }) =>
    api.put('/doctors/profile', data),

  getMyDashboard: () =>
    api.get('/doctors/my/dashboard'),
};

// Review APIs
export const reviewsAPI = {
  create: (data: { doctor_id: number; appointment_id: number; rating: number; comment?: string }) =>
    api.post('/reviews', data),
  
  getByDoctor: (doctorId: number) =>
    api.get(`/reviews/doctor/${doctorId}`),
};

// Chat APIs
export const chatAPI = {
  createSession: (data?: { title?: string }) =>
    api.post('/chat/session', data || {}),

  sendMessage: (sessionId: number, message: string, file_context?: string, file_url?: string) =>
    api.post('/chat/message', { session_id: sessionId, message, file_context, file_url }),

  getSessions: () =>
    api.get('/chat/sessions'),

  getSessionById: (id: number) =>
    api.get(`/chat/sessions/${id}`),

  deleteSession: (id: number) =>
    api.delete(`/chat/sessions/${id}`),
};

// Admin APIs
export const adminAPI = {
  getPendingDoctors: () =>
    api.get('/admin/doctors/pending'),

  approveDoctor: (id: number) =>
    api.put(`/admin/doctors/${id}/approve`),

  rejectDoctor: (id: number, data: { reason: string }) =>
    api.put(`/admin/doctors/${id}/reject`, data),

  getAllUsers: (params?: Record<string, string>) =>
    api.get('/admin/users', { params }),

  banUser: (id: number, data: { reason: string }) =>
    api.put(`/admin/users/${id}/ban`, data),

  unbanUser: (id: number) =>
    api.put(`/admin/users/${id}/unban`),

  getStats: () =>
    api.get('/admin/stats'),
};

// Upload APIs
export const uploadAPI = {
  profilePhoto: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/upload/profile-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  uploadMedicalReport: (formData: FormData) => {
    return api.post('/chat/upload/medical-report', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Favorites APIs
export const favoritesAPI = {
  add: (doctorId: number) =>
    api.post(`/favorites/${doctorId}`),

  remove: (doctorId: number) =>
    api.delete(`/favorites/${doctorId}`),

  getMyFavorites: () =>
    api.get('/favorites/my'),

  checkIfFavorited: (doctorId: number) =>
    api.get(`/favorites/check/${doctorId}`),
};

// Search History APIs
export const searchHistoryAPI = {
  save: (data: { search_query: string; filters?: string }) =>
    api.post('/search-history', data),

  getMySearches: (limit: number = 10) =>
    api.get('/search-history/my', { params: { limit } }),

  delete: (searchId: number) =>
    api.delete(`/search-history/${searchId}`),

  clearAll: () =>
    api.delete('/search-history/my/clear'),
};

// Notifications APIs
export const notificationsAPI = {
  getMyNotifications: (limit: number = 50) =>
    api.get('/notifications/my', { params: { limit } }),

  getUnreadCount: () =>
    api.get('/notifications/my/unread-count'),

  markAsRead: (notificationId: number) =>
    api.put(`/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    api.put('/notifications/my/read-all'),

  delete: (notificationId: number) =>
    api.delete(`/notifications/${notificationId}`),
};

// Contact API
export const contactAPI = {
  submit: (data: { name: string; email: string; subject: string; message: string }) =>
    api.post('/contact/send', data),
};
