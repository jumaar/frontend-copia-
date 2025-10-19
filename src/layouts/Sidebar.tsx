import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

// A simple icon placeholder component
const NavIcon = ({ name }: { name: string }) => (
  <span className="nav-icon">{/* In a real app, use an icon library */}</span>
);

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo">MineCloud</h1>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/dashboard" className="nav-item" end>
              <NavIcon name="dashboard" />
              <span>Dashboard</span>
            </NavLink>
          </li>
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
            <NavLink to="/admin/create-user-token" className="nav-item">
              <NavIcon name="token" />
              <span>Crear Token</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/users" className="nav-item">
              <NavIcon name="users" />
              <span>Gestión de Usuarios</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/tiendas" className="nav-item">
              <NavIcon name="store" />
              <span>Gestión de Tiendas</span>
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