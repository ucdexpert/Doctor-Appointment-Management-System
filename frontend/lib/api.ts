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
    config.headers['Authorization'] = `Bearer ${token}`;
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
};

// Doctor APIs
export const doctorsAPI = {
  getAll: (params?: Record<string, string>) =>
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

  sendMessage: (sessionId: number, message: string) =>
    api.post('/chat/message', { session_id: sessionId, message }),

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
};
