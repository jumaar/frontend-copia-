import React from 'react';
import { NavLink } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import './Sidebar.css';

export interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  category?: string;
}

const NavIcon = () => (
  <span className="nav-icon" />
);

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  onToggleSidebar: () => void;
  category: string;
  navItems: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onToggleSidebar,
  category,
  navItems,
}) => {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h1 className="logo">VORAK</h1>
        <button onClick={onToggleSidebar} className="sidebar-toggle-button">
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
        </button>
      </div>
      <nav className="sidebar-nav" onClick={onClose}>
        <ul>
          <li>
            <span className="nav-category">{category}</span>
          </li>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className="nav-item" end={item.end}>
                <NavIcon />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <ThemeToggle />
      </div>
    </aside>
  );
};

export type { SidebarProps };
export default Sidebar;
