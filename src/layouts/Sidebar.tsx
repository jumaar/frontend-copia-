import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import { useAuth } from '../contexts/AuthContext';

// A simple icon placeholder component
const NavIcon = () => (
  <span className="nav-icon">{/* In a real app, use an icon library */}</span>
);

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  onToggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onToggleSidebar }) => {
  const { user, isLoading } = useAuth();

  const renderAdminMenu = () => (
    <>
      <li>
        <span className="nav-category">Administración</span>
      </li>
      <li>
        <NavLink to="/admin/dashboard" className="nav-item">
          <NavIcon />
          <span>Dashboard Admin</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/admin/users" className="nav-item">
          <NavIcon />
          <span>Gestión de Usuarios</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/admin/frigorificos" className="nav-item">
          <NavIcon />
          <span>Gestión de Frigoríficos</span>
        </NavLink>
      </li>
       <li>
        <NavLink to="/admin/logistica" className="nav-item">
          <NavIcon />
          <span>Gestión de Logística</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/admin/tiendas" className="nav-item">
          <NavIcon />
          <span>Gestión de Tiendas</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/admin/productos" className="nav-item">
          <NavIcon />
          <span>Gestión de Productos</span>
        </NavLink>
      </li>
       <li>
        <NavLink to="/admin/neveras" className="nav-item">
          <NavIcon />
          <span>Gestión de Neveras</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/admin/accounts" className="nav-item">
          <NavIcon />
          <span>Cuentas Globales</span>
        </NavLink>
      </li>
    </>
  );

  const renderFrigorificoMenu = () => (
    <>
      <li>
        <span className="nav-category">Frigorífico</span>
      </li>
      <li>
        <NavLink to="/frigorifico" className="nav-item" end>
          <NavIcon />
          <span>Dashboard Frigorífico</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/frigorifico/logistica" className="nav-item">
          <NavIcon />
          <span>Gestión de Logística</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/frigorifico/productos" className="nav-item">
          <NavIcon />
          <span>Gestión de Productos</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/frigorifico/cuentas" className="nav-item">
          <NavIcon />
          <span>Cuentas Globales</span>
        </NavLink>
      </li>
    </>
  );

  const renderLogisticaMenu = () => (
    <>
      <li>
        <span className="nav-category">Logística</span>
      </li>
      <li>
        <NavLink to="/logistica" className="nav-item" end>
          <NavIcon />
          <span>Dashboard Logística</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/logistica/gestion" className="nav-item">
          <NavIcon />
          <span>Gestión de Logística</span>
        </NavLink>
      </li>
    </>
  );

  const renderTiendaMenu = () => (
    <>
      <li>
        <span className="nav-category">Tienda</span>
      </li>
      <li>
        <NavLink to="/tienda" className="nav-item" end>
          <NavIcon />
          <span>Inventario de Tienda</span>
        </NavLink>
      </li>
    </>
  );

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
           {isLoading ? (
             <li><span className="nav-item">Cargando...</span></li>
           ) : user ? (
             <>
               {(user.role === 'admin' || user.role === 'superadmin') && renderAdminMenu()}
               {user.role === 'frigorifico' && renderFrigorificoMenu()}
               {user.role === 'logistica' && renderLogisticaMenu()}
               {user.role === 'tienda' && renderTiendaMenu()}
             </>
           ) : (
             <li><span className="nav-item">No autenticado</span></li>
           )}
         </ul>
       </nav>
     </aside>
   );
};

export default Sidebar;