import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isPlatformSuperadmin } from "../../services/auth.api";

// The platform superadmin uses the same /auth/login and /auth/me as business users.
// Business workspace 'admin' is NOT the platform 'superadmin' role.
// The API server must independently enforce permissions on every admin endpoint.
export default function AdminProtectedRoute({ children }) {
  const { user, isAuthenticated, isLoading, sessionError, refreshUser } = useAuth();
  const location = useLocation();

  if (isLoading) return <AdminGateMessage title="Checking session" message="Verifying your login…" />;
  if (sessionError) {
    return <AdminGateMessage title="Connection interrupted" message="We couldn't verify your session." onRetry={() => refreshUser(true)} />;
  }
  if (!isAuthenticated || !user?.id || user.is_verified !== true) return <Navigate to="/signin" replace state={{ from: location }} />;
  if (!isPlatformSuperadmin(user)) return <Navigate to="/dashboard" replace />;

  return children;
}

function AdminGateMessage({ title, message, onRetry }) {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, background: "#f3ede1", color: "#10372a", fontFamily: "Bricolage Grotesque, sans-serif" }}>
      <section style={{ maxWidth: 470, width: "100%", padding: 30, background: "#fffaf0", borderRadius: 20, border: "1px solid #cdd5cc" }}>
        <small style={{ fontWeight: 800, letterSpacing: 1 }}>BELLBEE PLATFORM ADMIN</small>
        <h1 style={{ margin: "12px 0", fontSize: 26 }}>{title}</h1>
        <p style={{ fontSize: 14 }}>{message}</p>
        {onRetry && <button type="button" onClick={onRetry}>Try again</button>}
      </section>
    </main>
  );
}