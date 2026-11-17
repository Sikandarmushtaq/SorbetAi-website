import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import Navbar from './components/Navbar';
import Home from './Pages/home/Home';

// Scroll to homepage sections when navigating through navbar links
function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const frame = requestAnimationFrame(() => {
      const element = document.getElementById(hash.slice(1));

      element?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
}

// Temporary page until individual pages are developed
function PlaceholderPage({ title }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5">
      <h1 className="text-5xl font-extrabold text-sorbet-green">
        {title}
      </h1>
    </main>
  );
}

function AppLayout() {
  return (
    <>
      <Navbar />
      <ScrollToHash />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/blogs"
          element={<PlaceholderPage title="Blogs" />}
        />

        <Route
          path="/about"
          element={<PlaceholderPage title="About Us" />}
        />

        <Route
          path="/contact"
          element={<PlaceholderPage title="Contact" />}
        />

        <Route
          path="/signin"
          element={<PlaceholderPage title="Sign In" />}
        />

        <Route
          path="/signup"
          element={<PlaceholderPage title="Start Using Free" />}
        />

        <Route
          path="*"
          element={<PlaceholderPage title="Page Not Found" />}
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}