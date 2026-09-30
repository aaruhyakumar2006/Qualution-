import { apiClient } from './client';

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterPayload {
  email: string;
  full_name: string;
  password: string;
  role?: 'student' | 'teacher' | 'admin';
}

export interface LoginPayload {
  email: string;
  password: string;
  role?: 'student' | 'teacher' | 'admin';
}

export async function registerUser(payload: RegisterPayload): Promise<UserResponse> {
  return apiClient<UserResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      full_name: payload.full_name,
      password: payload.password,
      role: payload.role || 'student',
    }),
  });
}

export async function loginUser(payload: LoginPayload): Promise<AuthTokenResponse> {
  return apiClient<AuthTokenResponse>('/auth/login/json', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser(token: string): Promise<UserResponse> {
  return apiClient<UserResponse>('/users/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
