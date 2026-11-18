import { useState } from 'react';
import { Bell } from 'lucide-react';
import { EmptyState, PageHeader, Panel, Tabs } from '../../../components/dashboard/common/DashboardUI';

const categories = ['All', 'Orders', 'Appointments', 'AI', 'Billing', 'WhatsApp', 'System'];

// Displays notification filters and an empty state until event notifications are available.
export default function NotificationsPage() {
  const [category, setCategory] = useState('All');
  const [unreadOnly, setUnreadOnly] = useState(false);
  return <><PageHeader eyebrow="ACTIVITY" title="Notifications" description="Stay updated on orders, bookings, customer messages and your account." actions={<button type="button" className={`dp-secondary-button ${unreadOnly ? 'is-selected' : ''}`} onClick={() => setUnreadOnly((current) => !current)}>{unreadOnly ? 'Showing unread' : 'Unread only'}</button>} /><Panel><Tabs items={categories} active={category} onChange={setCategory} /><EmptyState icon={Bell} title="No notifications" description="Nothing here yet. Notifications will appear as you use Bellbee." /></Panel></>;
}
