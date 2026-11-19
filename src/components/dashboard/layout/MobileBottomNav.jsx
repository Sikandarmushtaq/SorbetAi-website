import './MobileBottomNav.css';
import { Brain, Home, MessageSquare, MoreHorizontal, ShoppingCart } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const items = [
  { label: 'Home', to: '/dashboard', icon: Home, end: true },
  { label: 'Chat', to: '/dashboard/chats', icon: MessageSquare },
  { label: 'AI Brain', to: '/dashboard/brain', icon: Brain },
  { label: 'Orders', to: '/dashboard/orders', icon: ShoppingCart },
];

export default function MobileBottomNav({ moreOpen, onMoreClick }) {
  const location = useLocation();
  const isMoreActive = moreOpen || !items.some((item) => item.to === location.pathname);

  return (
    <nav className="db-mobile-bottom-nav" aria-label="Mobile dashboard navigation">
      {items.map(({ label, to, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `db-mobile-bottom-item ${isActive ? 'active' : ''}`}>
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
      <button type="button" className={`db-mobile-bottom-item ${isMoreActive ? 'active' : ''}`} onClick={onMoreClick} aria-expanded={moreOpen}>
        <MoreHorizontal size={19} />
        <span>More</span>
      </button>
    </nav>
  );
}
