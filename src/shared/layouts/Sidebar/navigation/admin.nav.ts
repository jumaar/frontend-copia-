import type { NavItem } from '../Sidebar';

export const adminNavItems: NavItem[] = [
  { to: '/admin/dashboard',          label: 'Dashboard' },
  { to: '/admin/users',              label: 'Gestión de Usuarios' },
  { to: '/admin/logistica',          label: 'Gestión Logística' },
  { to: '/admin/productos',          label: 'Gestión de Productos' },
  { to: '/admin/neveras',            label: 'Inventario Neveras' },
  { to: '/admin/cuentas-tiendas',    label: 'Cuentas Neveras' },
  { to: '/admin/finanzas-tienda',   label: 'Finanzas Tiendas' },
  { to: '/trazabilidad',             label: 'Trazabilidad' },
  { to: '/admin/finanzas',           label: 'Finanzas' },
  { to: '/admin/finanzas-logistica', label: 'Finanzas Logísticas' },
  { to: '/admin/finanzas-frigorificos', label: 'Finanzas Frigoríficos' },
];
