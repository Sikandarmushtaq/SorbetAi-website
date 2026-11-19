import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, needsOnboarding, sessionError, refreshUser } = useAuth();
  const location = useLocation();

  if (isLoading || sessionError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f3ede1] text-[#10372a]">
        {isLoading ? (
          <p role="status">Checking your session…</p>
        ) : (
          <div role="alert">
            <p>We couldn’t check your session. Check your connection and try again.</p>
            <button type="button" onClick={() => refreshUser()}>Try again</button>
          </div>
        )}
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  return children;
}
