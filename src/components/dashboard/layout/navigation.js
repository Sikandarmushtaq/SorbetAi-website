import {
  Home, MessageSquare, UserRound, Users, FileText, Megaphone,
  ShoppingBag, Package, Briefcase, Brain, CalendarDays,
  BarChart3, Radio, LifeBuoy, CreditCard, Gift, Settings, Lightbulb,
  UserCircle, Bell,
} from 'lucide-react';

export const navigationGroups = [
  {
    title: 'Communicate',
    items: [
      { id: 'chats', label: 'Chats', icon: MessageSquare },
      { id: 'leads', label: 'Leads', icon: UserRound },
      { id: 'customers', label: 'Customers', icon: Users },
      { id: 'templates', label: 'Message Templates', icon: FileText },
      { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    ],
  },
  {
    title: 'Manage',
    items: [
      { id: 'orders', label: 'Orders', icon: ShoppingBag },
      { id: 'products', label: 'Products', icon: Package },
      { id: 'services', label: 'Services', icon: Briefcase },
      { id: 'brain', label: 'AI Brain', icon: Brain },
      { id: 'appointments', label: 'Appointments', icon: CalendarDays },
    ],
  },
  {
    title: 'Insights',
    items: [{ id: 'analytics', label: 'Analytics', icon: BarChart3 }],
  },
  {
    title: 'System',
    items: [
      { id: 'channels', label: 'Channels', icon: Radio },
      { id: 'support', label: 'Support', icon: LifeBuoy },
      { id: 'billing', label: 'Billing & Subscription', icon: CreditCard },
      { id: 'referrals', label: 'Referrals', icon: Gift },
      { id: 'automation', label: 'Automation Settings', icon: Settings },
    ],
  },
];

export const utilityItems = [
  { id: 'suggestions', label: 'Suggestion Box', icon: Lightbulb },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: UserCircle },
];

export const allDashboardItems = [
  { id: '', label: 'Dashboard', icon: Home },
  ...navigationGroups.flatMap((group) => group.items),
  ...utilityItems,
];
