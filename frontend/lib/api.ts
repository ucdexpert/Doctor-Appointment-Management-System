import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
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
  
  create: (data: Record<string, unknown>) =>
    api.post('/schedules', data),
  
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/schedules/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/schedules/${id}`),
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
