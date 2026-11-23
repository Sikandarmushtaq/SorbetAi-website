import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { useEffect } from "react";

// ============================================
// SHARED PUBLIC COMPONENTS
// ============================================

import Navbar from "./components/Navbar";
import Home from "./Pages/home/Home";
import Chatbot from "./components/Chatbot/Chatbot";
import Contact from "./Pages/contact/Contact";

// ============================================
// PUBLIC PRODUCT PAGES
// ============================================

// Completed WhatsApp AI Agent page
import WhatsAppAIAgentPage from "./Pages/whatsapp/WhatsAppAIAgentPage";

// ============================================
// AUTHENTICATION PAGES
// ============================================

import SignIn from "./Pages/verifyemail/signin/SignIn";
import SignUp from "./Pages/verifyemail/signin/SignUp";
import VerifyEmail from "./Pages/verifyemail/signin/VerifyEmail";
import Onboarding from "./Pages/verifyemail/signin/Onboarding";
import ResetPassword from "./Pages/verifyemail/signin/ResetPassword";

// ============================================
// USER DASHBOARD
// ============================================

import Dashboard from "./Pages/Dashboard";

// ============================================
// AUTH ROUTE GUARDS
// ============================================

import GuestRoute from "./components/auth/GuestRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
// import InstagramMessengerHero from "./Pages/instagram/components/InstagramMessengerHero";
import InstagramMessengerPage from "./Pages/instagram/InstagramMessengerPage";
// import { WebsiteChatBenefits } from "./Pages/websitechat/components/WebsiteChatSections";
import WebsiteChatPage from "./Pages/websitechat/WebsiteChatPage";
import OneInboxPage from "./Pages/oneInbox/OneInboxPage";
// import AiCapabilities from "./components/landing/AiCapabilities";
import AIAssistantPage from "./Pages/aiassistant/AIAssistantPage";
import AIBrainPage from "./Pages/aibrain/AIBrainPage";

// ============================================
// PUBLIC PAGE ROUTES
//
// These pages do not require authentication.
//
// WhatsApp AI Agent is already implemented,
// so it is registered separately below.
//
// Remaining pages display placeholders until
// their actual components are created.
// ============================================

const publicPages = [
  // ==========================================
  // PRODUCT - CHANNELS
  // ==========================================



  // ==========================================
  // PRODUCT - AI & TOOLS
  // ==========================================

 

  {
    path: "/human-handoff",
    title: "Human Handoff",
  },
  {
    path: "/android-app",
    title: "Android App",
  },

  // ==========================================
  // SOLUTIONS
  // ==========================================

  {
    path: "/ai-customer-support",
    title: "AI Customer Support",
  },
  {
    path: "/orders-in-chat",
    title: "Orders in Chat",
  },
  {
    path: "/appointment-booking",
    title: "Appointment Booking",
  },
  {
    path: "/lead-capture",
    title: "Lead Capture",
  },
  {
    path: "/whatsapp-campaigns",
    title: "WhatsApp Campaigns",
  },

  // ==========================================
  // INDUSTRIES
  // ==========================================

  {
    path: "/ai-chat-for-online-shops",
    title: "Online Shops and Retail",
  },
  {
    path: "/ai-chat-for-restaurants",
    title: "Restaurants and Cafes",
  },
  {
    path: "/ai-chat-for-salons",
    title: "Salons and Beauty",
  },
  {
    path: "/ai-chat-for-auto-services",
    title: "Car Wash and Auto Services",
  },

  // ==========================================
  // PRICING
  // ==========================================

  {
    path: "/pricing",
    title: "Pricing",
  },

  // ==========================================
  // RESOURCES
  // ==========================================

  {
    path: "/how-it-works",
    title: "How It Works",
  },
  {
    path: "/faqs",
    title: "Frequently Asked Questions",
  },
  {
    path: "/blogs",
    title: "Blogs",
  },
  {
    path: "/about",
    title: "About Us",
  },
];

// ============================================
// SCROLL MANAGEMENT
// ============================================

function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (hash) {
        const element = document.getElementById(
          decodeURIComponent(hash.slice(1)),
        );

        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      } else {
        window.scrollTo({
          top: 0,
          behavior: "auto",
        });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
}

// ============================================
// PUBLIC LAYOUT
//
// Navbar and Chatbot appear only on public
// marketing pages.
//
// Dashboard and auth pages use their
// existing separate layouts.
// ============================================

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />

      {children}

      <Chatbot />
    </>
  );
}

// ============================================
// TEMPORARY PUBLIC PLACEHOLDER
//
// Replace with actual page components
// as new pages are completed.
// ============================================

function PlaceholderPage({ title }) {
  return (
    <main className="min-h-[70vh] bg-sorbet-cream px-5 py-20">
      <div className="mx-auto flex min-h-[55vh] max-w-5xl flex-col items-center justify-center text-center">
        <span className="mb-5 rounded-full bg-sorbet-lavender px-5 py-2 text-xs font-extrabold uppercase tracking-widest text-sorbet-green">
          Bellbee Ai
        </span>

        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-sorbet-green sm:text-5xl lg:text-6xl">
          {title}
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-sorbet-green/70">
          Discover how Bellbee Ai can help your business. More information about
          this feature is coming soon.
        </p>
      </div>
    </main>
  );
}

// ============================================
// MAIN APPLICATION
// ============================================

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToHash />

        <Routes>
          {/* ==================================
              PUBLIC HOME PAGE
              ================================== */}

          <Route
            path="/"
            element={
              <PublicLayout>
                <Home />
              </PublicLayout>
            }
          />

          {/* ==================================
              PUBLIC CONTACT PAGE
              ================================== */}

          <Route
            path="/contact"
            element={
              <PublicLayout>
                <Contact />
              </PublicLayout>
            }
          />

          {/* ==================================
              PRODUCT - WHATSAPP AI AGENT
              ACTUAL PAGE COMPONENT
              PUBLIC ROUTE
              ================================== */}

          <Route
            path="/whatsapp-ai-agent"
            element={
              <PublicLayout>
                <WhatsAppAIAgentPage />
              </PublicLayout>
            }
          />
            <Route
            path="/instagram-ai-automation"
            element={
              <PublicLayout>
                <InstagramMessengerPage/>
              </PublicLayout>

              
            }
          />
             <Route
            path="/messenger-ai-automation"
            element={
              <PublicLayout>
                 <Navigate
      to="/instagram-ai-automation#im-messenger"
      replace
    />
              </PublicLayout>

              
            }
          />
           <Route
            path="/website-chat"
            element={
              <PublicLayout>
               <WebsiteChatPage/>
              </PublicLayout>

              
            }
          />
      <Route
  path="/omnichannel-messaging"
  element={
    <PublicLayout>
      <OneInboxPage />
    </PublicLayout>
  }///
/>
      <Route
  path="/ai-assistant"
  element={
    <PublicLayout>
      <AIAssistantPage/>
    </PublicLayout>
  }///ai-assistant    /ai-brain
/>
      <Route
  path="/ai-brain"
  element={
    <PublicLayout>
    <AIBrainPage/>
    </PublicLayout>
  }///ai-assistant   
/>

          {/* ==================================
              OTHER PRODUCT / SOLUTIONS /
              INDUSTRIES / PRICING / RESOURCES

              ALL PUBLIC ROUTES
              ================================== */}

          {publicPages.map((page) => (
            <Route
              key={page.path}
              path={page.path}
              element={
                <PublicLayout>
                  <PlaceholderPage title={page.title} />
                </PublicLayout>
              }
            />
          ))}

          {/* ==================================
              GUEST-ONLY AUTHENTICATION
              ================================== */}

          <Route
            path="/signin"
            element={
              <GuestRoute>
                <SignIn />
              </GuestRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <GuestRoute>
                <SignUp />
              </GuestRoute>
            }
          />

          {/* ==================================
              EMAIL VERIFICATION
              ================================== */}

          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* ==================================
              RESET PASSWORD
              ================================== */}

          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ==================================
              PROTECTED ONBOARDING
              ================================== */}

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* ==================================
              PROTECTED USER DASHBOARD

              All dashboard pages:
              Chats
              Leads
              Customers
              Orders
              Products
              Services
              AI Brain
              Appointments
              Analytics
              Channels
              Billing
              Support
              Automation Settings

              Remain inside Dashboard routing.
              ================================== */}

          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ==================================
              LEGACY DASHBOARD REDIRECTS
              ================================== */}

          <Route
            path="/whatsapp"
            element={<Navigate to="/dashboard/whatsapp" replace />}
          />

          <Route
            path="/billing/plans"
            element={<Navigate to="/dashboard/billing/plans" replace />}
          />

          <Route
            path="/billing/reports"
            element={<Navigate to="/dashboard/billing/reports" replace />}
          />

          <Route
            path="/billing/payment-collection"
            element={
              <Navigate to="/dashboard/billing/payment-collection" replace />
            }
          />

          {/* ==================================
              UNKNOWN ROUTES
              ================================== */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
