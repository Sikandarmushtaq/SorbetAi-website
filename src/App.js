import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import Navbar from './components/Navbar';
import Home from './Pages/home/Home';
import Chatbot from './components/Chatbot/Chatbot';
import Contact from './Pages/contact/Contact';
import SignIn from './Pages/verifyemail/signin/SignIn';
import SignUp from './Pages/verifyemail/signin/SignUp';
import VerifyEmail from './Pages/verifyemail/signin/VerifyEmail';
import Dashboard from './Pages/Dashboard';

// Keeps homepage hash navigation working across public routes.
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

// Shows the marketing navigation and chatbot only on public website pages.
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
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/blogs" element={<PublicLayout><PlaceholderPage title="Blogs" /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><PlaceholderPage title="About Us" /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />

        {/* Authentication and dashboard use standalone layouts. */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/dashboard/*" element={<Dashboard />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
