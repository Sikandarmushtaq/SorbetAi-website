
import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  dashboardDestination,
} from "../../services/auth.api";

import {
  useAuth,
} from "../../context/AuthContext";

export default function GuestRoute({
  children,
}) {
  const {
    isAuthenticated,
    user,
    isLoading,
    needsOnboarding,
    sessionError,
    refreshUser,
  } = useAuth();

  const { state } = useLocation();

  // Session verification is still running.
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f3ede1] text-[#10372a]">
        <p
          className="text-sm font-semibold"
          role="status"
        >
          Checking your session...
        </p>
      </main>
    );
  }

  // An unexpected network/server failure is
  // not proof that tokens have expired.
  //
  // Keep the session tokens and let the user
  // retry verification.
  if (sessionError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f3ede1] px-4 text-[#10372a]">
        <div
          className="w-full max-w-md rounded-3xl border border-[#10372a]/10 bg-[#fffaf0] p-8 text-center shadow-xl"
          role="alert"
        >
          <h1 className="text-2xl font-bold">
            Connection interrupted
          </h1>

          <p className="mt-3 text-sm">
            We couldn't verify your session
            right now. Check your connection
            and try again.
          </p>

          <button
            type="button"
            onClick={() =>
              refreshUser(true)
            }
            className="mt-6 rounded-full bg-[#ff7a59] px-6 py-3 text-sm font-bold text-[#10372a] transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  // Backend-verified session exists.
  // Don't show the Sign In form again.
  if (isAuthenticated) {
    const target =
      dashboardDestination(state, user);

    return (
      <Navigate
        to={
          needsOnboarding
            ? "/onboarding"
            : target
        }
        replace
        state={state}
      />
    );
  }

  // Both credentials missing/invalid/expired:
  // show Sign In (or Sign Up) as requested.
  return children;
}