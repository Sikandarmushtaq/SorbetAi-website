import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import DashboardLayout from '../components/dashboard/layout/DashboardLayout';
import DashboardHome from '../Pages/dashboard/pages/DashboardHome';
import ChatsPage from '../Pages/dashboard/pages/ChatsPage';
import LeadsPage from '../Pages/dashboard/pages/LeadsPage';
import CustomersPage from '../Pages/dashboard/pages/CustomersPage';
import TemplatesPage from '../Pages/dashboard/pages/TemplatesPage';
import CampaignsPage from '../Pages/dashboard/pages/CampaignsPage';
import OrdersPage from '../Pages/dashboard/pages/OrdersPage';
import ProductsPage from '../Pages/dashboard/pages/ProductsPage';
import ServicesPage from '../Pages/dashboard/pages/ServicesPage';
import BrainPage from '../Pages/dashboard/pages/BrainPage';
import AppointmentsPage from '../Pages/dashboard/pages/AppointmentsPage';
import AnalyticsPage from '../Pages/dashboard/pages/AnalyticsPage';
import ChannelsPage from '../Pages/dashboard/pages/ChannelsPage';
import SupportPage from '../Pages/dashboard/pages/SupportPage';
import BillingPage from '../Pages/dashboard/pages/BillingPage';
import AddonsPage from '../Pages/dashboard/pages/AddonsPage';
import ReferralsPage from '../Pages/dashboard/pages/ReferralsPage';
import AutomationPage from '../Pages/dashboard/pages/AutomationPage';
import SuggestionsPage from '../Pages/dashboard/pages/SuggestionsPage';
import ProfilePage from '../Pages/dashboard/pages/ProfilePage';
import NotificationsPage from '../Pages/dashboard/pages/NotificationsPage';
import BillingReportsPage from '../Pages/dashboard/pages/BillingReportsPage';
import ChoosePlanPage from '../Pages/dashboard/pages/ChoosePlanPage';
import PaymentCollectionPage from '../Pages/dashboard/pages/PaymentCollectionPage';
import WhatsAppConnectionPage from '../Pages/dashboard/pages/WhatsAppConnectionPage';
import WebsiteChatPage from '../Pages/dashboard/pages/WebsiteChatPage';
import FacebookInstagramPage from '../Pages/dashboard/pages/FacebookInstagramPage';

export default function DashboardRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardHome />} />
        <Route path="chats" element={<ChatsPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="brain" element={<BrainPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="channels" element={<ChannelsPage />} />
        <Route path="whatsapp" element={<WhatsAppConnectionPage />} />
        <Route path="website-chat" element={<WebsiteChatPage />} />
        <Route path="facebook-instagram" element={<FacebookInstagramPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="billing/reports" element={<BillingReportsPage />} />
        <Route path="billing/plans" element={<ChoosePlanPage />} />
        <Route path="billing/payment-collection" element={<PaymentCollectionPage />} />
        <Route path="payment-collection" element={<PaymentCollectionPage />} />
        <Route path="billing/addons" element={<AddonsPage />} />
        <Route path="referrals" element={<ReferralsPage />} />
        <Route path="automation" element={<AutomationPage />} />
        <Route path="suggestions" element={<SuggestionsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
