// Public frontend configuration only. Never store private credentials here.
export function requiredApiPath(value, name) {
  const path = String(value || '').trim().replace(/\/+$/, '');
  if (!/^\/(?!\/)/.test(path) || /[\\?#\s]/.test(path)) {
    throw new Error(`Missing or invalid API path: ${name}`);
  }
  return path;
}

const configuredBase = String(process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || '').trim();
const parsedBase = new URL(configuredBase);
if (!['http:', 'https:'].includes(parsedBase.protocol) || parsedBase.username || parsedBase.password || parsedBase.search || parsedBase.hash) {
  throw new Error('Invalid REACT_APP_API_BASE_URL');
}
export const API_ORIGIN = parsedBase.origin;
export const API_BASE_URL = configuredBase.replace(/\/+$/, '');

export const AUTH_PATHS = Object.freeze({
  login: requiredApiPath(process.env.REACT_APP_API_AUTH_LOGIN_PATH, 'REACT_APP_API_AUTH_LOGIN_PATH'),
  signup: requiredApiPath(process.env.REACT_APP_API_AUTH_SIGNUP_PATH, 'REACT_APP_API_AUTH_SIGNUP_PATH'),
  google: requiredApiPath(process.env.REACT_APP_API_AUTH_GOOGLE_PATH, 'REACT_APP_API_AUTH_GOOGLE_PATH'),
  googleOnboard: requiredApiPath(process.env.REACT_APP_API_AUTH_GOOGLE_ONBOARD_PATH, 'REACT_APP_API_AUTH_GOOGLE_ONBOARD_PATH'),
  verifyEmail: requiredApiPath(process.env.REACT_APP_API_AUTH_VERIFY_EMAIL_PATH, 'REACT_APP_API_AUTH_VERIFY_EMAIL_PATH'),
  resendVerification: requiredApiPath(process.env.REACT_APP_API_AUTH_RESEND_VERIFICATION_PATH, 'REACT_APP_API_AUTH_RESEND_VERIFICATION_PATH'),
  forgotPassword: requiredApiPath(process.env.REACT_APP_API_AUTH_FORGOT_PASSWORD_PATH, 'REACT_APP_API_AUTH_FORGOT_PASSWORD_PATH'),
  resetPassword: requiredApiPath(process.env.REACT_APP_API_AUTH_RESET_PASSWORD_PATH, 'REACT_APP_API_AUTH_RESET_PASSWORD_PATH'),
  changePassword: requiredApiPath(process.env.REACT_APP_API_AUTH_CHANGE_PASSWORD_PATH, 'REACT_APP_API_AUTH_CHANGE_PASSWORD_PATH'),
  me: requiredApiPath(process.env.REACT_APP_API_AUTH_ME_PATH, 'REACT_APP_API_AUTH_ME_PATH'),
  refresh: requiredApiPath(process.env.REACT_APP_API_AUTH_REFRESH_PATH, 'REACT_APP_API_AUTH_REFRESH_PATH'),
  logout: requiredApiPath(process.env.REACT_APP_API_AUTH_LOGOUT_PATH, 'REACT_APP_API_AUTH_LOGOUT_PATH'),
});

export const CURRENT_WORKSPACE_PATH = requiredApiPath(process.env.REACT_APP_API_CURRENT_WORKSPACE_PATH, 'REACT_APP_API_CURRENT_WORKSPACE_PATH');

export const PUBLIC_AUTH_PATHS = new Set([
  AUTH_PATHS.login, AUTH_PATHS.signup, AUTH_PATHS.google,
  AUTH_PATHS.verifyEmail, AUTH_PATHS.resendVerification, AUTH_PATHS.refresh,
  AUTH_PATHS.forgotPassword, AUTH_PATHS.resetPassword,
]);
