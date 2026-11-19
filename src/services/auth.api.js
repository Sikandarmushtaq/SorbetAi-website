import { apiRequest } from './apiClient';

function post(path, body) {
  return apiRequest(`/api/v1/auth/${path}`, { method: 'POST', body });
}

export const authApi = {
  signIn: (email, password) => post('login', { email, password }),
  signUp: (details) => post('signup', details),
  signInWithGoogle: (token) => post('google', { token }),
  completeOnboarding: (details) => post('google/onboard', details),
  verifyEmail: (token) => post('verify-email', { token }),
  resendVerification: (email) => post('resend-verification', { email }),
  forgotPassword: (email) => post('password/forgot', { email }),
  updateProfile: (body) => apiRequest('/api/v1/auth/me', { method: 'PATCH', body }),
  changePassword: (currentPassword, newPassword) => post('password/change', {
    current_password: currentPassword,
    new_password: newPassword,
  }),
  resetPassword: (token, newPassword) => post('password/reset', { token, new_password: newPassword }),
};

export function authErrorMessage(error) {
  if (Array.isArray(error.errors) && error.errors.length) {
    return error.errors.map((field) => field.message).filter(Boolean).join(' ');
  }
  return error.message;
}

export function dashboardDestination(state) {
  const target = state?.from;
  return /^\/dashboard(?:\/|$)/.test(target?.pathname) ? target : '/dashboard';
}
