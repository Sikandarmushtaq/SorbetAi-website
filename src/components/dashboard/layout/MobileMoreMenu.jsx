import { ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { navigationGroups, utilityItems } from './navigation';

const routeFor = (id) => `/dashboard/${id}`;

export default function MobileMoreMenu({ onNavigate }) {
  return (
    <nav className="db-mobile-more-menu" aria-label="All dashboard sections">
      {navigationGroups.map((group) => (
        <section className="db-mobile-more-group" key={group.title}>
          <p>{group.title}</p>
          <div className="db-mobile-more-list">
            {group.items.map(({ id, label, icon: Icon }) => (
              <NavLink key={id} to={routeFor(id)} onClick={onNavigate} className={({ isActive }) => `db-mobile-more-link ${isActive ? 'active' : ''}`}>
                <Icon size={17} />
                <span>{label}</span>
                <ChevronRight size={16} />
              </NavLink>
            ))}
          </div>
        </section>
      ))}
      <section className="db-mobile-more-group">
        <p>Account</p>
        <div className="db-mobile-more-list">
          {utilityItems.map(({ id, label, icon: Icon }) => (
            <NavLink key={id} to={routeFor(id)} onClick={onNavigate} className={({ isActive }) => `db-mobile-more-link ${isActive ? 'active' : ''}`}>
              <Icon size={17} />
              <span>{label}</span>
              <ChevronRight size={16} />
            </NavLink>
          ))}
        </div>
      </section>
    </nav>
  );
}
