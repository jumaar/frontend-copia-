import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

// A simple icon placeholder component
const NavIcon = ({ }: { name: string }) => (
  <span className="nav-icon">{/* In a real app, use an icon library */}</span>
);

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  onToggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onToggleSidebar }) => {
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
            <span className="nav-category">Administración</span>
          </li>
          <li>
            <NavLink to="/admin/dashboard" className="nav-item">
              <NavIcon name="admin-dashboard" />
              <span>Dashboard Admin</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/users" className="nav-item">
              <NavIcon name="users" />
              <span>Gestión de Usuarios</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/frigorificos" className="nav-item">
              <NavIcon name="fridge-alt" />
              <span>Gestión de Frigoríficos</span>
            </NavLink>
          </li>
           <li>
            <NavLink to="/admin/logistica" className="nav-item">
              <NavIcon name="truck" />
              <span>Gestión de Logística</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/tiendas" className="nav-item">
              <NavIcon name="store" />
              <span>Gestión de Tiendas</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/productos" className="nav-item">
              <NavIcon name="box" />
              <span>Gestión de Productos</span>
            </NavLink>
          </li>
           <li>
            <NavLink to="/admin/neveras" className="nav-item">
              <NavIcon name="fridge" />
              <span>Gestión de Neveras</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/accounts" className="nav-item">
              <NavIcon name="accounts" />
              <span>Cuentas Globales</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;