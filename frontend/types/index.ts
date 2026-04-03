// API types and interfaces

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  role: 'patient' | 'doctor' | 'admin';
  is_active: boolean;
  is_banned: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Doctor {
  id: number;
  user_id: number;
  specialization: string;
  qualification: string | null;
  experience_years: number;
  consultation_fee: string;
  bio: string | null;
  city: string | null;
  is_approved: boolean;
  rejection_reason: string | null;
  avg_rating: string;
  total_reviews: number;
  created_at: string;
  user?: User;
}

export interface Schedule {
  id: number;
  doctor_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_available: boolean;
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  time_slot: string;
  reason: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  cancel_reason: string | null;
  notes: string | null;
  created_at: string;
  patient?: User;
  doctor?: Doctor;
}

export interface Review {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  patient?: User;
}

export interface ChatSession {
  id: number;
  user_id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  file_url?: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor' | 'admin';
  phone?: string;
  photo_url?: string;
}
