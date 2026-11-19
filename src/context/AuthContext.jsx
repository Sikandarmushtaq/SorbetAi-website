import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  accessTokenExpiry,
  clearStoredSession,
  getCurrentUser,
  getStoredToken,
  isSessionStorageKey,
  logoutSession,
  storeSessionTokens,
} from '../services/apiClient';

const AuthContext = createContext(null);
const googleProfileKey = 'bellbee_google_profile';

function getGoogleProfile(userId) {
  try {
    const profile = JSON.parse(window.localStorage.getItem(googleProfileKey));
    return profile?.userId === userId ? profile : null;
  } catch {
    return null;
  }
}

const signedOut = { user: null, isLoading: false, error: null, accessToken: '' };

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ ...signedOut, isLoading: true });
  const pendingValidation = useRef(null);
  const validationVersion = useRef(0);

  const refreshUser = useCallback((restart = false) => {
    if (!restart && pendingValidation.current) return pendingValidation.current;

    const version = ++validationVersion.current;
    if (!getStoredToken('access') && !getStoredToken('refresh')) {
      pendingValidation.current = null;
      setSession(signedOut);
      return Promise.resolve(null);
    }

    setSession({ ...signedOut, isLoading: true });
    const validation = (async () => {
      try {
        const currentUser = await getCurrentUser();
        if (version !== validationVersion.current) return null;
        if (!currentUser || !getStoredToken('access')) {
          setSession(signedOut);
          return null;
        }
        const googleProfile = getGoogleProfile(currentUser.id);
        const isOnboarded = currentUser.is_onboarded ?? (currentUser.phone && currentUser.workspaces?.length
          ? true : googleProfile?.isOnboarded);
        const user = {
          ...currentUser,
          avatar_url: currentUser.avatar_url || googleProfile?.avatarUrl,
          is_onboarded: isOnboarded,
        };
        window.localStorage.setItem('bellbee_user', JSON.stringify(user));
        setSession({ user, isLoading: false, error: null, accessToken: getStoredToken('access') });
        return user;
      } catch (error) {
        if (version !== validationVersion.current) return null;
        if (error.status === 401 || error.status === 403) {
          clearStoredSession();
          return null;
        }
        setSession({ ...signedOut, error });
        return null;
      } finally {
        if (version === validationVersion.current) pendingValidation.current = null;
      }
    })();

    pendingValidation.current = validation;
    return validation;
  }, []);

  useEffect(() => {
    const handleSessionUpdate = (event) => {
      if (event.detail?.rotated) {
        setSession((current) => ({ ...current, accessToken: getStoredToken('access') }));
      } else {
        refreshUser(true);
      }
    };
    let storageTimer;
    const handleStorage = (event) => {
      if (event.storageArea !== window.localStorage || !isSessionStorageKey(event.key)) return;
      clearTimeout(storageTimer);
      storageTimer = setTimeout(() => refreshUser(true), 0);
    };
    window.addEventListener('bellbee:session-updated', handleSessionUpdate);
    window.addEventListener('storage', handleStorage);
    refreshUser(true);
    return () => {
      validationVersion.current += 1;
      pendingValidation.current = null;
      clearTimeout(storageTimer);
      window.removeEventListener('bellbee:session-updated', handleSessionUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshUser]);

  useEffect(() => {
    const expiry = accessTokenExpiry(session.accessToken);
    if (!session.user || expiry === null) return undefined;
    const timer = setTimeout(refreshUser, Math.min(Math.max(0, expiry - Date.now()), 2_147_483_647));
    return () => clearTimeout(timer);
  }, [session.user, session.accessToken, refreshUser]);

  const saveSession = useCallback((tokens, googleProfile) => {
    if (googleProfile?.userId && tokens?.access_token && tokens?.refresh_token) {
      const previousProfile = getGoogleProfile(googleProfile.userId);
      window.localStorage.setItem(googleProfileKey, JSON.stringify({ ...previousProfile, ...googleProfile }));
    }
    storeSessionTokens(tokens);
    return refreshUser();
  }, [refreshUser]);

  const { user, isLoading, error } = session;
  const needsOnboarding = user?.is_onboarded === false
    || (user?.is_onboarded == null && user?.phone === null && user?.workspaces?.length === 0);

  return (
    <AuthContext.Provider value={{
      user, isLoading, sessionError: error, isAuthenticated: Boolean(user),
      needsOnboarding, refreshUser, saveSession, signOut: logoutSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
