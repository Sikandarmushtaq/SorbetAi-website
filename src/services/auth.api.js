import { apiRequest } from './apiClient';
import { AUTH_PATHS } from './apiConfig';

function post(path, body) {
  return apiRequest(path, { method: 'POST', body });
}

export const authApi = {
  signIn: (email, password) => post(AUTH_PATHS.login, { email, password }),
  signUp: (details) => post(AUTH_PATHS.signup, details),
  signInWithGoogle: (token) => post(AUTH_PATHS.google, { token }),
  completeOnboarding: (details) => post(AUTH_PATHS.googleOnboard, details),
  verifyEmail: (token) => post(AUTH_PATHS.verifyEmail, { token }),
  resendVerification: (email) => post(AUTH_PATHS.resendVerification, { email }),
  forgotPassword: (email) => post(AUTH_PATHS.forgotPassword, { email }),
  updateProfile: (body) => apiRequest(AUTH_PATHS.me, { method: 'PATCH', body }),
  changePassword: (currentPassword, newPassword) => post(AUTH_PATHS.changePassword, {
    current_password: currentPassword,
    new_password: newPassword,
  }),
  resetPassword: (token, newPassword) => post(AUTH_PATHS.resetPassword, { token, new_password: newPassword }),
};

export function authErrorMessage(error) {
  if (Array.isArray(error.errors) && error.errors.length) {
    return error.errors.map((field) => field.message).filter(Boolean).join(' ');
  }
  return error.message;
}

export function isPlatformSuperadmin(user) {
  return user?.is_superadmin === true || user?.role === 'superadmin';
}

// Only the authenticated backend role determines which dashboard opens.
export function dashboardDestination(state, user = null, goto = '') {
  if (isPlatformSuperadmin(user) || (goto === 'admin' && isPlatformSuperadmin(user))) {
    const from = state?.from;
    return /^\/admin(?:\/|$)/.test(from?.pathname || '') ? from : '/admin';
  }
  const target = state?.from;
  return /^\/dashboard(?:\/|$)/.test(target?.pathname || '') ? target : '/dashboard';
}