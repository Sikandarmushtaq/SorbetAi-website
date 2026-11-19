import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import Navbar from './components/Navbar';
import Home from './Pages/home/Home';
import Chatbot from './components/Chatbot/Chatbot';
import Contact from './Pages/contact/Contact';
import SignIn from './Pages/verifyemail/signin/SignIn';
import SignUp from './Pages/verifyemail/signin/SignUp';
import VerifyEmail from './Pages/verifyemail/signin/VerifyEmail';
import Onboarding from './Pages/verifyemail/signin/Onboarding';
import ResetPassword from './Pages/verifyemail/signin/ResetPassword';
import Dashboard from './Pages/Dashboard';
import GuestRoute from './components/auth/GuestRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) return undefined;
    const frame = requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
}

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Chatbot />
    </>
  );
}

function PlaceholderPage({ title }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5">
      <h1 className="text-5xl font-extrabold text-sorbet-green">{title}</h1>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToHash />
        <Routes>
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/blogs" element={<PublicLayout><PlaceholderPage title="Blogs" /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><PlaceholderPage title="About Us" /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
          <Route path="/signin" element={<GuestRoute><SignIn /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><SignUp /></GuestRoute>} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/whatsapp" element={<Navigate to="/dashboard/whatsapp" replace />} />
          <Route path="/billing/plans" element={<Navigate to="/dashboard/billing/plans" replace />} />
          <Route path="/billing/reports" element={<Navigate to="/dashboard/billing/reports" replace />} />
          <Route path="/billing/payment-collection" element={<Navigate to="/dashboard/billing/payment-collection" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
