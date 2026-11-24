
import { useEffect } from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

// ============================================
// SHARED PUBLIC COMPONENTS
// ============================================

import Navbar from "./components/Navbar";
import Home from "./Pages/home/Home";
import Chatbot from "./components/Chatbot/Chatbot";
import Contact from "./Pages/contact/Contact";

// ============================================
// PRODUCT - CHANNELS
// ============================================

import WhatsAppAIAgentPage from "./Pages/whatsapp/WhatsAppAIAgentPage";

import InstagramMessengerPage from "./Pages/instagram/InstagramMessengerPage";

import WebsiteChatPage from "./Pages/websitechat/WebsiteChatPage";

import OneInboxPage from "./Pages/oneInbox/OneInboxPage";

// ============================================
// PRODUCT - AI & TOOLS
// ============================================

import AIAssistantPage from "./Pages/aiassistant/AIAssistantPage";

import AIBrainPage from "./Pages/aibrain/AIBrainPage";

import HumanHandoffPage from "./Pages/humanhandoff/HumanHandoffPage";

// ============================================
// SOLUTIONS
// ============================================

import AssistantpageAi from "./Pages/aicustomersupport/AICustomerSupportPage";

import OrdersInChatPage from "./Pages/ordersinchat/OrdersInChatPage";

import AppointmentBookingPage from "./Pages/appointmentbooking/AppointmentBookingPage";

import LeadCapturePage from "./Pages/leadcapture/LeadCapturePage";

import WhatsAppCampaignsPage from "./Pages/whatsappcampaigns/WhatsAppCampaignsPage";

// ============================================
// INDUSTRY PAGES
// ============================================

import OnlineShopsPage from "./Pages/onlineshops/OnlineShopsPage";

import RestaurantsPage from "./Pages/restaurants/RestaurantsPage";

import SalonsPage from "./Pages/salons/SalonsPage";

import AutoServicesPage from "./Pages/autoservices/AutoServicesPage";

// ============================================
// PRICING
// ============================================

import PricingPage from "./Pages/pricing/PricingPage";

// ============================================
// BLOGS
// ============================================

import BlogPage from "./Pages/blog/BlogPage";

import BlogPostPage from "./Pages/blog/BlogPostPage";

// ============================================
// HOW IT WORKS
// ============================================

import HowItWorksPage from "./Pages/howitworks/HowItWorksPage";

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
// AUTH ROUTE GUARDS & CONTEXT
// ============================================

import GuestRoute from "./components/auth/GuestRoute";

import ProtectedRoute from "./components/auth/ProtectedRoute";

import { AuthProvider } from "./context/AuthContext";

// ============================================
// SCROLL MANAGEMENT
// ============================================

function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    let frame;

    frame = requestAnimationFrame(() => {
      if (hash) {
        let sectionId;

        try {
          sectionId = decodeURIComponent(hash.slice(1));
        } catch {
          sectionId = hash.slice(1);
        }

        const element = document.getElementById(sectionId);

        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });

          return;
        }
      }

      window.scrollTo({
        top: 0,
        behavior: "auto",
      });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [pathname, hash]);

  return null;
}

// ============================================
// PUBLIC WEBSITE LAYOUT
//
// Navbar + Chatbot on public pages only.
//
// Authentication and dashboard continue using
// their own existing layouts.
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
// TEMPORARY ABOUT PAGE
//
// This preserves your existing About route.
// Replace it once the About page is ready.
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
          Discover how Bellbee Ai can help your business.
          More information about this page is coming soon.
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

          {/* ====================================
              PUBLIC HOME
          ==================================== */}

          <Route
            path="/"
            element={
              <PublicLayout>
                <Home />
              </PublicLayout>
            }
          />

          {/* ====================================
              PUBLIC CONTACT
          ==================================== */}

          <Route
            path="/contact"
            element={
              <PublicLayout>
                <Contact />
              </PublicLayout>
            }
          />

          {/* ====================================
              PRODUCT - CHANNELS
          ==================================== */}

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
                <InstagramMessengerPage />
              </PublicLayout>
            }
          />

          {/* Messenger uses the existing
              Instagram/Messenger page section */}

          <Route
            path="/messenger-ai-automation"
            element={
              <Navigate
                to="/instagram-ai-automation#im-messenger"
                replace
              />
            }
          />

          <Route
            path="/website-chat"
            element={
              <PublicLayout>
                <WebsiteChatPage />
              </PublicLayout>
            }
          />

          <Route
            path="/omnichannel-messaging"
            element={
              <PublicLayout>
                <OneInboxPage />
              </PublicLayout>
            }
          />

          {/* ====================================
              PRODUCT - AI & TOOLS
          ==================================== */}

          <Route
            path="/ai-assistant"
            element={
              <PublicLayout>
                <AIAssistantPage />
              </PublicLayout>
            }
          />

          <Route
            path="/ai-brain"
            element={
              <PublicLayout>
                <AIBrainPage />
              </PublicLayout>
            }
          />

          <Route
            path="/human-handoff"
            element={
              <PublicLayout>
                <HumanHandoffPage />
              </PublicLayout>
            }
          />

          {/* ====================================
              SOLUTIONS
          ==================================== */}

          <Route
            path="/ai-customer-support"
            element={
              <PublicLayout>
                <AssistantpageAi />
              </PublicLayout>
            }
          />

          <Route
            path="/orders-in-chat"
            element={
              <PublicLayout>
                <OrdersInChatPage />
              </PublicLayout>
            }
          />

          <Route
            path="/appointment-booking"
            element={
              <PublicLayout>
                <AppointmentBookingPage />
              </PublicLayout>
            }
          />

          <Route
            path="/lead-capture"
            element={
              <PublicLayout>
                <LeadCapturePage />
              </PublicLayout>
            }
          />

          <Route
            path="/whatsapp-campaigns"
            element={
              <PublicLayout>
                <WhatsAppCampaignsPage />
              </PublicLayout>
            }
          />

          {/* ====================================
              INDUSTRIES
          ==================================== */}

          <Route
            path="/ai-chat-for-online-shops"
            element={
              <PublicLayout>
                <OnlineShopsPage />
              </PublicLayout>
            }
          />

          <Route
            path="/ai-chat-for-restaurants"
            element={
              <PublicLayout>
                <RestaurantsPage />
              </PublicLayout>
            }
          />

          <Route
            path="/ai-chat-for-salons"
            element={
              <PublicLayout>
                <SalonsPage />
              </PublicLayout>
            }
          />

          <Route
            path="/ai-chat-for-auto-services"
            element={
              <PublicLayout>
                <AutoServicesPage />
              </PublicLayout>
            }
          />

          {/* ====================================
              PRICING
          ==================================== */}

          <Route
            path="/pricing"
            element={
              <PublicLayout>
                <PricingPage />
              </PublicLayout>
            }
          />

          {/* ====================================
              BLOG ROUTES

              /blogs from your existing Navbar
              redirects to the actual /blog page.

              Individual article URLs stay:
              /blog/:slug
          ==================================== */}

          <Route
            path="/blog"
            element={
              <PublicLayout>
                <BlogPage />
              </PublicLayout>
            }
          />

          <Route
            path="/blog/:slug"
            element={
              <PublicLayout>
                <BlogPostPage />
              </PublicLayout>
            }
          />

          <Route
            path="/blogs"
            element={
              <Navigate to="/blog" replace />
            }
          />

          {/* ====================================
              HOW IT WORKS

              Existing landing HowItWorks component
              is reused inside HowItWorksPage.
          ==================================== */}

          <Route
            path="/how-it-works"
            element={
              <PublicLayout>
                <HowItWorksPage />
              </PublicLayout>
            }
          />

          {/* ====================================
              FAQS

              Home already contains:
              <section id="faqs">

              The old /faqs link redirects
              to that section.
          ==================================== */}

          <Route
            path="/faqs"
            element={
              <Navigate to="/#faqs" replace />
            }
          />

          {/* ====================================
              ABOUT
          ==================================== */}

          <Route
            path="/about"
            element={
              <PublicLayout>
                <PlaceholderPage title="About Us" />
              </PublicLayout>
            }
          />

          {/* ====================================
              GUEST-ONLY AUTHENTICATION

              Existing GuestRoute protection
              remains unchanged.
          ==================================== */}

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

          {/* ====================================
              EMAIL VERIFICATION
          ==================================== */}

          <Route
            path="/verify-email"
            element={<VerifyEmail />}
          />

          {/* ====================================
              PASSWORD RESET
          ==================================== */}

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          {/* ====================================
              PROTECTED ONBOARDING

              Authentication required.
          ==================================== */}

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* ====================================
              PROTECTED USER DASHBOARD

              All existing dashboard subroutes
              continue to work under /dashboard/*.

              Do not change authentication.
          ==================================== */}

          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ====================================
              LEGACY DASHBOARD REDIRECTS

              Continue routing through the
              protected Dashboard page.
          ==================================== */}

          <Route
            path="/whatsapp"
            element={
              <Navigate
                to="/dashboard/whatsapp"
                replace
              />
            }
          />

          <Route
            path="/billing/plans"
            element={
              <Navigate
                to="/dashboard/billing/plans"
                replace
              />
            }
          />

          <Route
            path="/billing/reports"
            element={
              <Navigate
                to="/dashboard/billing/reports"
                replace
              />
            }
          />

          <Route
            path="/billing/payment-collection"
            element={
              <Navigate
                to="/dashboard/billing/payment-collection"
                replace
              />
            }
          />

          {/* ====================================
              UNKNOWN ROUTES

              Keep this at the end.
          ==================================== */}

          <Route
            path="*"
            element={
              <Navigate to="/" replace />
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
