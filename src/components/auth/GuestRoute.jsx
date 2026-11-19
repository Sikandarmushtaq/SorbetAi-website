import { Navigate, useLocation } from 'react-router-dom';
import { dashboardDestination } from '../../services/auth.api';
import { useAuth } from '../../context/AuthContext';

export default function GuestRoute({ children }) {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth();
  const { state } = useLocation();

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f3ede1] text-[#10372a]">
        <p className="text-sm font-semibold">Checking your session...</p>
      </main>
    );
  }

  if (isAuthenticated) {
    const target = dashboardDestination(state);
    return <Navigate to={needsOnboarding ? '/onboarding' : target} replace state={state} />;
  }
  return children;
}
