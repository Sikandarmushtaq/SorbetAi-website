
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  adminApi,
  isPlatformAdmin,
} from "../../services/admin/adminApi";

const previewEnabled =
  process.env.NODE_ENV === "development" &&
  process.env.REACT_APP_ADMIN_UI_PREVIEW === "true";

export default function AdminProtectedRoute({ children }) {
  const {
    user,
    isAuthenticated,
    isLoading,
    sessionError,
    refreshUser,
  } = useAuth();

  const location = useLocation();

  const [check, setCheck] = useState({
    pending: true,
    allowed: false,
    error: "",
  });

  const identityPathConfigured =
    adminApi.isConfigured("identity");

  useEffect(() => {
    // UI-only preview needs no admin API request.
    if (previewEnabled) return undefined;

    if (!isAuthenticated || isLoading || sessionError) {
      return undefined;
    }

    if (!identityPathConfigured) {
      setCheck({
        pending: false,
        allowed: false,
        error:
          "Platform-admin verification endpoint not configured.",
      });

      return undefined;
    }

    let active = true;

    setCheck({
      pending: true,
      allowed: false,
      error: "",
    });

    adminApi
      .getIdentity()
      .then((identity) => {
        if (active) {
          setCheck({
            pending: false,
            allowed: isPlatformAdmin(identity),
            error: "",
          });
        }
      })
      .catch((error) => {
        if (active) {
          setCheck({
            pending: false,
            allowed: false,
            error:
              error?.message || "Admin verification failed.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [
    user?.id,
    isAuthenticated,
    isLoading,
    sessionError,
    identityPathConfigured,
  ]);

  // LOCAL DEVELOPMENT PREVIEW ONLY
  // Allows viewing Admin UI without login.
  // Does not grant backend admin permissions.
  if (previewEnabled) {
    return children;
  }

  // NORMAL AUTHENTICATION - UNCHANGED
  if (isLoading) {
    return (
      <AdminGateMessage
        title="Checking session"
        message="Validating your login..."
      />
    );
  }

  if (sessionError) {
    return (
      <AdminGateMessage
        title="Session unavailable"
        message="Could not validate your session."
        onRetry={refreshUser}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{ from: location }}
      />
    );
  }

  if (check.pending) {
    return (
      <AdminGateMessage
        title="Checking admin access"
        message="Verifying your platform permissions..."
      />
    );
  }

  if (!check.allowed) {
    return (
      <AdminGateMessage
        title="Admin access unavailable"
        message={
          check.error ||
          "This account is not authorized as a Bellbee platform admin."
        }
      />
    );
  }

  return children;
}

function AdminGateMessage({ title, message, onRetry }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "#f3ede1",
        color: "#10372a",
        fontFamily: "Bricolage Grotesque, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: 470,
          width: "100%",
          padding: 30,
          background: "#fffaf0",
          borderRadius: 20,
          border: "1px solid #cdd5cc",
        }}
      >
        <small
          style={{
            color: "#a35e43",
            fontWeight: 800,
            letterSpacing: "1px",
          }}
        >
          BELLBEE PLATFORM ADMIN
        </small>

        <h1 style={{ margin: "12px 0", fontSize: 26 }}>
          {title}
        </h1>

        <p style={{ fontSize: 14, lineHeight: 1.75 }}>
          {message}
        </p>

        <p style={{ color: "#657a6b", fontSize: 12 }}>
          Platform-admin permissions must be verified
          by the backend in production.
        </p>

        {onRetry && (
          <button
            type="button"
            onClick={() => onRetry()}
          >
            Retry
          </button>
        )}

        <Link
          to="/dashboard"
          style={{
            color: "#10372a",
            fontWeight: 700,
            marginLeft: 12,
          }}
        >
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
