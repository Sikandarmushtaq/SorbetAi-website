
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  accessTokenExpiry,
  clearStoredSession,
  getCurrentUser,
  getStoredToken,
  isSessionStorageKey,
  logoutSession,
  storeSessionTokens,
} from "../services/apiClient";

const AuthContext = createContext(null);

const googleProfileKey = "bellbee_google_profile";

const signedOut = {
  user: null,
  isLoading: false,
  error: null,
  accessToken: "",
};

function getGoogleProfile(userId) {
  try {
    const profile = JSON.parse(
      window.localStorage.getItem(googleProfileKey)
    );

    return profile?.userId === userId
      ? profile
      : null;
  } catch {
    return null;
  }
}

// Check token expiration locally when the JWT
// contains a readable exp claim.
// Opaque tokens are verified by the backend.
function isExpiredJwt(token) {
  if (!token) return true;

  const expiry = accessTokenExpiry(token);

  return (
    expiry !== null &&
    expiry <= Date.now()
  );
}

// Permanent authentication errors should
// end the login session.
//
// Network errors and server errors should
// allow retry without automatically logging out.
function isPermanentlyRejectedSession(error) {
  const status = error?.status;

  const endpoint = String(
    error?.endpoint || ""
  );

  if (status === 401 || status === 403) {
    return true;
  }

  // Some backends use HTTP 400 when a refresh
  // token has expired or is invalid.
  if (
    status === 400 &&
    /\/api\/v1\/auth\/refresh(?:\?|$)/.test(
      endpoint
    )
  ) {
    return true;
  }

  return false;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState({
    ...signedOut,
    isLoading: true,
  });

  const pendingValidation = useRef(null);
  const validationVersion = useRef(0);

  const refreshUser = useCallback(
    (restart = false) => {
      if (
        !restart &&
        pendingValidation.current
      ) {
        return pendingValidation.current;
      }

      const version =
        ++validationVersion.current;

      const accessToken =
        getStoredToken("access");

      const refreshToken =
        getStoredToken("refresh");

      // No tokens: user remains signed out.
      if (!accessToken && !refreshToken) {
        pendingValidation.current = null;
        setSession(signedOut);

        return Promise.resolve(null);
      }

      // Both credentials are missing/expired.
      // Clear them immediately and prevent
      // access to the protected dashboard.
      //
      // A valid access token remains usable
      // even if refresh has already expired.
      if (
        isExpiredJwt(accessToken) &&
        isExpiredJwt(refreshToken)
      ) {
        clearStoredSession();

        pendingValidation.current = null;
        setSession(signedOut);

        return Promise.resolve(null);
      }

      setSession({
        ...signedOut,
        isLoading: true,
      });

      const validation = (async () => {
        try {
          // Existing Axios API:
          // GET /api/v1/auth/me
          //
          // apiClient.js automatically refreshes
          // an expired access token when possible.
          const currentUser =
            await getCurrentUser();

          if (
            version !==
            validationVersion.current
          ) {
            return null;
          }

          // Authentication was not confirmed.
          if (
            !currentUser ||
            !getStoredToken("access")
          ) {
            setSession(signedOut);
            return null;
          }

          const googleProfile =
            getGoogleProfile(currentUser.id);

          const isOnboarded =
            currentUser.is_onboarded ??
            (
              currentUser.phone &&
              currentUser.workspaces?.length
                ? true
                : googleProfile?.isOnboarded
            );

          const user = {
            ...currentUser,

            avatar_url:
              currentUser.avatar_url ||
              googleProfile?.avatarUrl,

            is_onboarded: isOnboarded,
          };

          window.localStorage.setItem(
            "bellbee_user",
            JSON.stringify(user)
          );

          setSession({
            user,
            isLoading: false,
            error: null,

            accessToken:
              getStoredToken("access"),
          });

          return user;
        } catch (error) {
          if (
            version !==
            validationVersion.current
          ) {
            return null;
          }

          // Token invalid/revoked/expired:
          // clear session so route guards
          // redirect to /signin.
          if (
            isPermanentlyRejectedSession(error)
          ) {
            clearStoredSession();
            setSession(signedOut);

            return null;
          }

          // Temporary network or backend error:
          // do not delete tokens.
          setSession({
            ...signedOut,
            error,
          });

          return null;
        } finally {
          if (
            version ===
            validationVersion.current
          ) {
            pendingValidation.current = null;
          }
        }
      })();

      pendingValidation.current =
        validation;

      return validation;
    },
    []
  );

  // Synchronize login, logout and rotated tokens.
  useEffect(() => {
    const handleSessionUpdate = (event) => {
      if (event.detail?.rotated) {
        setSession((current) => ({
          ...current,

          accessToken:
            getStoredToken("access"),
        }));
      } else {
        refreshUser(true);
      }
    };

    let storageTimer;

    const handleStorage = (event) => {
      if (
        event.storageArea !==
          window.localStorage ||
        !isSessionStorageKey(event.key)
      ) {
        return;
      }

      clearTimeout(storageTimer);

      storageTimer = setTimeout(
        () => refreshUser(true),
        0
      );
    };

    window.addEventListener(
      "bellbee:session-updated",
      handleSessionUpdate
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    // Check existing session when the app loads.
    refreshUser(true);

    return () => {
      validationVersion.current += 1;
      pendingValidation.current = null;

      clearTimeout(storageTimer);

      window.removeEventListener(
        "bellbee:session-updated",
        handleSessionUpdate
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [refreshUser]);

  // Re-check the session when access expires.
  // The existing API client will try refresh.
  useEffect(() => {
    const expiry = accessTokenExpiry(
      session.accessToken
    );

    if (
      !session.user ||
      expiry === null
    ) {
      return undefined;
    }

    const delay = Math.min(
      Math.max(0, expiry - Date.now()),
      2_147_483_647
    );

    const timer = setTimeout(
      refreshUser,
      delay
    );

    return () => {
      clearTimeout(timer);
    };
  }, [
    session.user,
    session.accessToken,
    refreshUser,
  ]);

  // Preserve the existing login and Google
  // authentication session-saving logic.
  const saveSession = useCallback(
    (tokens, googleProfile) => {
      if (
        googleProfile?.userId &&
        tokens?.access_token &&
        tokens?.refresh_token
      ) {
        const previousProfile =
          getGoogleProfile(
            googleProfile.userId
          );

        window.localStorage.setItem(
          googleProfileKey,

          JSON.stringify({
            ...previousProfile,
            ...googleProfile,
          })
        );
      }

      storeSessionTokens(tokens);

      return refreshUser();
    },
    [refreshUser]
  );

  const {
    user,
    isLoading,
    error,
  } = session;

  const needsOnboarding =
    user?.is_onboarded === false ||
    (
      user?.is_onboarded == null &&
      user?.phone === null &&
      user?.workspaces?.length === 0
    );

  return (
    <AuthContext.Provider
      value={{
        user,

        isLoading,

        sessionError: error,

        isAuthenticated: Boolean(user),

        needsOnboarding,

        refreshUser,

        saveSession,

        signOut: logoutSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}
