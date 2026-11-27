
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  UserRoundPlus,
  CreditCard,
  Bot,
  Radio,
  LifeBuoy,
  BarChart3,
  Activity,
  ScrollText,
  ShoppingBag,
  CalendarDays,
  Megaphone,
  Gift,
  FileText,
  Mail,
} from "lucide-react";

export const adminNavGroups = [
  {
    title: "Platform",
    items: [
      {
        id: "businesses",
        label: "Businesses",
        icon: Building2,
      },
      {
        id: "users",
        label: "Users Management",
        icon: Users,
      },
      {
        id: "billing",
        label: "Plans & Billing",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Website",
    items: [
      {
        id: "website-leads",
        label: "Website Leads",
        icon: UserRoundPlus,
      },
      {
        id: "contact-messages",
        label: "Contact Messages",
        icon: Mail,
      },
      {
        id: "website-conversations",
        label: "Website Chats",
        icon: MessageSquare,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        id: "ai-monitoring",
        label: "AI Monitoring",
        icon: Bot,
      },
      {
        id: "channels",
        label: "Channel Health",
        icon: Radio,
      },
      {
        id: "orders",
        label: "Order Overview",
        icon: ShoppingBag,
      },
      {
        id: "appointments",
        label: "Appointments",
        icon: CalendarDays,
      },
      {
        id: "campaigns",
        label: "Campaigns",
        icon: Megaphone,
      },
      {
        id: "templates",
        label: "Templates",
        icon: FileText,
      },
      {
        id: "support",
        label: "Support Tickets",
        icon: LifeBuoy,
      },
    ],
  },
  {
    title: "Insights & Security",
    items: [
      {
        id: "analytics",
        label: "Platform Analytics",
        icon: BarChart3,
      },
      {
        id: "referrals",
        label: "Referrals",
        icon: Gift,
      },
      {
        id: "system",
        label: "System Health",
        icon: Activity,
      },
      {
        id: "audit",
        label: "Audit Logs",
        icon: ScrollText,
      },
    ],
  },
];

export const adminNavItems = [
  {
    id: "",
    label: "Dashboard",
    icon: LayoutDashboard,
  },

  ...adminNavGroups.flatMap(
    (group) => group.items
  ),
];
